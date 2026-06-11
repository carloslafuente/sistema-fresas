"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayStart, todayEnd } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

type CartItem = {
  productId: string;
  sizeId: string;
  quantity: number; // number of units (≥ 1)
};

export async function createOrder(input: {
  items: CartItem[];
  channelId: string;
  paymentMethod?: "EFECTIVO" | "QR";
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "No autenticado" };

  const { items, channelId, paymentMethod } = input;

  const activeItems = items.filter((i) => i.quantity > 0);
  if (activeItems.length === 0) return { success: false, error: "Agrega al menos un producto" };

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { success: false, error: "Canal no encontrado" };
  if (!channel.isDelivery && !paymentMethod) {
    return { success: false, error: "Selecciona método de pago" };
  }

  // Load all prices and recipes needed for this order
  const [prices, recipes] = await Promise.all([
    prisma.price.findMany({
      where: { channelId, OR: activeItems.map((i) => ({ productId: i.productId, sizeId: i.sizeId })) },
    }),
    prisma.recipe.findMany({
      where: { OR: activeItems.map((i) => ({ productId: i.productId, sizeId: i.sizeId })) },
      include: { items: true },
    }),
  ]);

  // Validate all prices exist
  for (const item of activeItems) {
    const price = prices.find((p) => p.productId === item.productId && p.sizeId === item.sizeId);
    if (!price) return { success: false, error: "Precio no configurado para algún producto" };
  }

  // Aggregate total ingredient deductions across all items
  const ingredientDelta: Record<string, number> = {};
  for (const item of activeItems) {
    const recipe = recipes.find((r) => r.productId === item.productId && r.sizeId === item.sizeId);
    if (!recipe || recipe.items.length === 0) {
      return { success: false, error: "Receta no configurada para algún producto" };
    }
    for (const ri of recipe.items) {
      ingredientDelta[ri.ingredientId] =
        (ingredientDelta[ri.ingredientId] ?? 0) + Number(ri.quantity) * item.quantity;
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // Deduct stock for each ingredient (stock can go negative — intentional)
        for (const [ingredientId, delta] of Object.entries(ingredientDelta)) {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: { stock: { decrement: delta } },
          });
        }

        // Create one Sale record per unit per item line
        for (const item of activeItems) {
          const price = prices.find((p) => p.productId === item.productId && p.sizeId === item.sizeId)!;
          const recipe = recipes.find((r) => r.productId === item.productId && r.sizeId === item.sizeId)!;

          for (let unit = 0; unit < item.quantity; unit++) {
            const sale = await tx.sale.create({
              data: {
                userId: session.user.id,
                productId: item.productId,
                sizeId: item.sizeId,
                channelId,
                paymentMethod: !channel.isDelivery ? paymentMethod : undefined,
                amount: price.amount,
                status: "ACTIVE",
              },
            });

            // Ingredient log snapshot per unit
            for (const ri of recipe.items) {
              await tx.saleIngredientLog.create({
                data: { saleId: sale.id, ingredientId: ri.ingredientId, quantity: ri.quantity },
              });
            }

            // Account receivable for delivery channels
            if (channel.isDelivery) {
              const commission = Number(channel.commissionPct);
              const gross = Number(price.amount);
              await tx.accountReceivable.create({
                data: {
                  saleId: sale.id,
                  channelId,
                  grossAmount: gross,
                  commissionPct: commission,
                  netAmount: gross * (1 - commission / 100),
                },
              });
            }
          }
        }
      },
      { isolationLevel: "Serializable" }
    );

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al registrar orden";
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
  if (sale.createdAt < todayStart() || sale.createdAt > todayEnd()) {
    return { success: false, error: "Solo se pueden anular ventas del día en curso" };
  }

  if (!forceVoid && sale.accountReceivable?.status === "PAID") {
    return { success: false, error: "WARN:Esta cuenta ya fue cobrada. Usa forceVoid=true para continuar." };
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

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/cuentas-por-cobrar");

  return { success: true };
}
