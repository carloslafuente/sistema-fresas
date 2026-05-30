"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayStart, todayEnd } from "@/lib/utils";

type CreateSaleInput = {
  productId: string;
  sizeId: string;
  channelId: string;
  paymentMethod?: "EFECTIVO" | "QR";
};

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createSale(input: CreateSaleInput): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "No autenticado" };

  const { productId, sizeId, channelId, paymentMethod } = input;

  // Look up price
  const price = await prisma.price.findUnique({
    where: { productId_sizeId_channelId: { productId, sizeId, channelId } },
  });
  if (!price) return { success: false, error: "Precio no configurado para esta combinación" };

  // Look up channel
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { success: false, error: "Canal no encontrado" };

  // Validate payment method for local channel
  if (!channel.isDelivery && !paymentMethod) {
    return { success: false, error: "Selecciona método de pago para ventas locales" };
  }

  // Look up recipe + items
  const recipe = await prisma.recipe.findUnique({
    where: { productId_sizeId: { productId, sizeId } },
    include: { items: { include: { ingredient: true } } },
  });
  if (!recipe || recipe.items.length === 0) {
    return { success: false, error: "Receta no configurada para este producto" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // Lock and verify stock for all ingredients
        for (const item of recipe.items) {
          const ing = await tx.ingredient.findUnique({ where: { id: item.ingredientId } });
          if (!ing) throw new Error(`Insumo ${item.ingredient.name} no encontrado`);
          if (Number(ing.stock) < Number(item.quantity)) {
            throw new Error(`Stock insuficiente: ${item.ingredient.name} (disponible: ${ing.stock} ${ing.unit})`);
          }
        }

        // Create sale
        const sale = await tx.sale.create({
          data: {
            userId: session.user.id,
            productId,
            sizeId,
            channelId,
            paymentMethod: !channel.isDelivery ? paymentMethod : undefined,
            amount: price.amount,
            status: "ACTIVE",
          },
        });

        // Create ingredient log + deduct stock
        for (const item of recipe.items) {
          await tx.saleIngredientLog.create({
            data: {
              saleId: sale.id,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            },
          });
          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Create account receivable for delivery channels
        if (channel.isDelivery) {
          const commission = Number(channel.commissionPct);
          const gross = Number(price.amount);
          const net = gross * (1 - commission / 100);
          await tx.accountReceivable.create({
            data: {
              saleId: sale.id,
              channelId,
              grossAmount: gross,
              commissionPct: commission,
              netAmount: net,
            },
          });
        }
      },
      { isolationLevel: "Serializable" }
    );

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al registrar venta";
    return { success: false, error: msg };
  }
}

export async function voidSale(
  saleId: string,
  forceVoid = false
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Sin permisos" };
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { accountReceivable: true, ingredientLogs: true },
  });

  if (!sale) return { success: false, error: "Venta no encontrada" };
  if (sale.status !== "ACTIVE") return { success: false, error: "La venta ya fue anulada" };

  const now = new Date();
  const start = todayStart();
  const end = todayEnd();
  if (sale.createdAt < start || sale.createdAt > end) {
    return { success: false, error: "Solo se pueden anular ventas del día en curso" };
  }

  // Warn if AR is already paid
  if (!forceVoid && sale.accountReceivable?.status === "PAID") {
    return {
      success: false,
      error: "WARN:Esta cuenta ya fue cobrada. Usa forceVoid=true para continuar.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: saleId },
      data: { status: "VOIDED", voidedAt: now, voidedBy: session.user.id },
    });

    for (const log of sale.ingredientLogs) {
      await tx.ingredient.update({
        where: { id: log.ingredientId },
        data: { stock: { increment: log.quantity } },
      });
    }
  });

  return { success: true };
}
