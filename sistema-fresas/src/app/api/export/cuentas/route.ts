import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateRangeStart, dateRangeEnd, toAppDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ? dateRangeStart(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? dateRangeEnd(searchParams.get("to")!) : new Date();
  const channelId = searchParams.get("channelId");

  const ars = await prisma.accountReceivable.findMany({
    where: {
      ...(channelId ? { channelId } : {}),
      sale: { createdAt: { gte: from, lte: to } },
    },
    include: { sale: true, channel: true, payment: true },
    orderBy: { sale: { createdAt: "desc" } },
  });

  const rows = [
    ["fecha_venta", "canal", "monto_bruto", "comision_pct", "monto_neto", "estado", "fecha_pago"].join(","),
    ...ars.map((ar) =>
      [
        toAppDateString(ar.sale.createdAt),
        ar.channel.name,
        Number(ar.grossAmount).toFixed(2),
        Number(ar.commissionPct).toFixed(2),
        Number(ar.netAmount).toFixed(2),
        ar.status,
        ar.payment ? ar.payment.receivedAt.toISOString().split("T")[0] : "",
      ].join(",")
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuentas.csv"`,
    },
  });
}
