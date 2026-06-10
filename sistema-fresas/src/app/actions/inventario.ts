"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

export async function addStock(input: {
  ingredientId: string;
  quantity: number;
  reason: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.quantity <= 0) return { success: false, error: "La cantidad debe ser mayor a 0" };

  await prisma.$transaction([
    prisma.ingredient.update({
      where: { id: input.ingredientId },
      data: { stock: { increment: input.quantity } },
    }),
    prisma.stockAdjustment.create({
      data: {
        ingredientId: input.ingredientId,
        quantity: input.quantity,
        reason: input.reason,
        createdBy: session.user.id,
      },
    }),
  ]);

  revalidatePath("/admin/inventario");
  return { success: true };
}

export async function adjustStock(input: {
  ingredientId: string;
  newStock: number;
  reason: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.newStock < 0) return { success: false, error: "El stock no puede ser negativo" };

  const current = await prisma.ingredient.findUnique({ where: { id: input.ingredientId } });
  if (!current) return { success: false, error: "Insumo no encontrado" };

  const delta = input.newStock - Number(current.stock);

  await prisma.$transaction([
    prisma.ingredient.update({
      where: { id: input.ingredientId },
      data: { stock: input.newStock },
    }),
    prisma.stockAdjustment.create({
      data: {
        ingredientId: input.ingredientId,
        quantity: delta,
        reason: input.reason,
        createdBy: session.user.id,
      },
    }),
  ]);

  revalidatePath("/admin/inventario");
  return { success: true };
}

export async function updateRecipeItem(input: {
  recipeId: string;
  ingredientId: string;
  quantity: number;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.quantity <= 0) return { success: false, error: "La cantidad debe ser mayor a 0" };

  await prisma.recipeItem.upsert({
    where: {
      recipeId_ingredientId: {
        recipeId: input.recipeId,
        ingredientId: input.ingredientId,
      },
    },
    update: { quantity: input.quantity },
    create: {
      recipeId: input.recipeId,
      ingredientId: input.ingredientId,
      quantity: input.quantity,
    },
  });

  revalidatePath("/admin/inventario");
  return { success: true };
}
