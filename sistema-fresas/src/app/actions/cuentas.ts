"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

export async function registerPlatformPayment(input: {
  channelId: string;
  receivedAmount: number;
  receivedAt: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Sin permisos" };

  if (input.receivedAmount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };

  // Get pending ARs for the channel FIFO (oldest sale first)
  const pendingARs = await prisma.accountReceivable.findMany({
    where: {
      channelId: input.channelId,
      status: "PENDING",
      sale: { status: "ACTIVE" },
    },
    include: { sale: true },
    orderBy: { sale: { createdAt: "asc" } },
  });

  let remaining = input.receivedAmount;
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

  const applied = input.receivedAmount - remaining;
  const excess = remaining > 0.001 ? remaining : 0;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.platformPayment.create({
      data: {
        channelId: input.channelId,
        receivedAmount: input.receivedAmount,
        receivedAt: new Date(input.receivedAt),
        appliedAmount: applied,
        excessAmount: excess,
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
