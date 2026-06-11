import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateRangeStart, dateRangeEnd, toAppDateString, toAppTimeString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ? dateRangeStart(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? dateRangeEnd(searchParams.get("to")!) : new Date();

  const sales = await prisma.sale.findMany({
    where: { status: "ACTIVE", createdAt: { gte: from, lte: to } },
    include: { product: true, size: true, channel: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["fecha", "hora", "producto", "tamaño", "canal", "metodo_pago", "monto"].join(","),
    ...sales.map((s) =>
      [
        toAppDateString(s.createdAt),
        toAppTimeString(s.createdAt),
        `"${s.product.name}"`,
        s.size.name,
        s.channel.name,
        s.paymentMethod ?? "",
        Number(s.amount).toFixed(2),
      ].join(",")
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas.csv"`,
    },
  });
}
