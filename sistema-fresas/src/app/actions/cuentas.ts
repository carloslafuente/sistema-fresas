"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

type ActionResult = { success: true } | { success: false; error: string };

// FIFO match (oldest sale first) of pending ARs against a payment amount.
async function matchPendingARs(tx: Prisma.TransactionClient, channelId: string, amount: number) {
  const pendingARs = await tx.accountReceivable.findMany({
    where: {
      channelId,
      status: "PENDING",
      sale: { status: "ACTIVE" },
    },
    include: { sale: true },
    orderBy: { sale: { createdAt: "asc" } },
  });

  let remaining = amount;
  const toClose: string[] = [];

  for (const ar of pendingARs) {
    if (remaining <= 0) break;
    const net = Number(ar.netAmount);
    if (remaining >= net) {
      toClose.push(ar.id);
      remaining -= net;
    } else {
      break;
    }
  }

  return {
    toClose,
    appliedAmount: amount - remaining,
    excessAmount: remaining > 0.001 ? remaining : 0,
  };
}

export async function registerPlatformPayment(input: {
  channelId: string;
  receivedAmount: number;
  receivedAt: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.receivedAmount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };

  await prisma.$transaction(async (tx) => {
    const { toClose, appliedAmount, excessAmount } = await matchPendingARs(
      tx,
      input.channelId,
      input.receivedAmount
    );

    const payment = await tx.platformPayment.create({
      data: {
        channelId: input.channelId,
        receivedAmount: input.receivedAmount,
        receivedAt: new Date(input.receivedAt),
        appliedAmount,
        excessAmount,
      },
    });

    if (toClose.length > 0) {
      await tx.accountReceivable.updateMany({
        where: { id: { in: toClose } },
        data: { status: "PAID", paymentId: payment.id },
      });
    }
  });

  revalidatePath("/admin/cuentas-por-cobrar");
  return { success: true };
}

export async function updatePlatformPayment(
  id: string,
  input: { receivedAmount: number; receivedAt: string }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.receivedAmount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };

  const payment = await prisma.platformPayment.findUnique({ where: { id } });
  if (!payment) return { success: false, error: "Pago no encontrado" };

  await prisma.$transaction(async (tx) => {
    // Release this payment's currently matched ARs back to the pending pool
    // before re-running FIFO matching with the updated amount.
    await tx.accountReceivable.updateMany({
      where: { paymentId: id },
      data: { status: "PENDING", paymentId: null },
    });

    const { toClose, appliedAmount, excessAmount } = await matchPendingARs(
      tx,
      payment.channelId,
      input.receivedAmount
    );

    await tx.platformPayment.update({
      where: { id },
      data: {
        receivedAmount: input.receivedAmount,
        receivedAt: new Date(input.receivedAt),
        appliedAmount,
        excessAmount,
      },
    });

    if (toClose.length > 0) {
      await tx.accountReceivable.updateMany({
        where: { id: { in: toClose } },
        data: { status: "PAID", paymentId: id },
      });
    }
  });

  revalidatePath("/admin/cuentas-por-cobrar");
  return { success: true };
}

export async function deletePlatformPayment(id: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  const payment = await prisma.platformPayment.findUnique({ where: { id } });
  if (!payment) return { success: false, error: "Pago no encontrado" };

  await prisma.$transaction(async (tx) => {
    await tx.accountReceivable.updateMany({
      where: { paymentId: id },
      data: { status: "PENDING", paymentId: null },
    });
    await tx.platformPayment.delete({ where: { id } });
  });

  revalidatePath("/admin/cuentas-por-cobrar");
  return { success: true };
}
