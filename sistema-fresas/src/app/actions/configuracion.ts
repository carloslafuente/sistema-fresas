"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type ActionResult = { success: true } | { success: false; error: string };

export async function updatePrice(input: {
  productId: string;
  sizeId: string;
  channelId: string;
  amount: number;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.amount <= 0) return { success: false, error: "El precio debe ser mayor a 0" };

  await prisma.price.upsert({
    where: {
      productId_sizeId_channelId: {
        productId: input.productId,
        sizeId: input.sizeId,
        channelId: input.channelId,
      },
    },
    update: { amount: input.amount },
    create: input,
  });

  return { success: true };
}

export async function updateChannelCommission(
  channelId: string,
  commissionPct: number
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (commissionPct < 0 || commissionPct > 100) {
    return { success: false, error: "La comisión debe estar entre 0 y 100" };
  }

  await prisma.channel.update({ where: { id: channelId }, data: { commissionPct } });
  return { success: true };
}

export async function updateIngredientThreshold(
  ingredientId: string,
  alertThreshold: number
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (alertThreshold < 0) return { success: false, error: "El umbral no puede ser negativo" };

  await prisma.ingredient.update({ where: { id: ingredientId }, data: { alertThreshold } });
  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (newPassword.length < 6) return { success: false, error: "Contraseña mínimo 6 caracteres" };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { hashedPassword: hashed } });
  return { success: true };
}
