import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: from, lte: to } },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const rows = [
    ["fecha", "descripcion", "categoria", "monto"].join(","),
    ...expenses.map((e) =>
      [
        e.date.toISOString().split("T")[0],
        `"${e.description}"`,
        `"${e.category.name}"`,
        Number(e.amount).toFixed(2),
      ].join(",")
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gastos.csv"`,
    },
  });
}
