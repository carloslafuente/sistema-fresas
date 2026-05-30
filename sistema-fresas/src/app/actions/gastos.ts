"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

export async function createExpense(input: {
  description: string;
  amount: number;
  categoryId: string;
  date: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };
  if (!input.description.trim()) return { success: false, error: "La descripción es requerida" };

  await prisma.expense.create({
    data: {
      description: input.description.trim(),
      amount: input.amount,
      categoryId: input.categoryId,
      date: new Date(input.date),
    },
  });

  return { success: true };
}

export async function createExpenseCategory(name: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "El nombre es requerido" };

  const existing = await prisma.expenseCategory.findUnique({ where: { name: trimmed } });
  if (existing) return { success: false, error: "La categoría ya existe" };

  await prisma.expenseCategory.create({ data: { name: trimmed } });
  return { success: true };
}
