import { prisma } from "@/lib/prisma";
import { SalesTable } from "@/components/admin/ventas/SalesTable";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { todayStart, todayEnd, dateRangeStart, dateRangeEnd } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VentasAdminPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const hasFilter = Boolean(searchParams.from || searchParams.to);
  const start = searchParams.from ? dateRangeStart(searchParams.from) : todayStart();
  const end = searchParams.to ? dateRangeEnd(searchParams.to) : todayEnd();

  const sales = await prisma.sale.findMany({
    where: hasFilter ? { createdAt: { gte: start, lte: end } } : undefined,
    include: { product: true, size: true, channel: true },
    orderBy: { createdAt: "desc" },
    take: hasFilter ? 500 : 100,
  });

  const todayRange = { start: todayStart(), end: todayEnd() };

  const plain = sales.map((s) => ({
    id: s.id,
    productName: s.product.name,
    sizeName: s.size.name,
    channelName: s.channel.name,
    paymentMethod: s.paymentMethod,
    amount: Number(s.amount),
    status: s.status as "ACTIVE" | "VOIDED",
    createdAt: s.createdAt.toISOString(),
    isToday: s.createdAt >= todayRange.start && s.createdAt <= todayRange.end,
  }));

  let summaryLabel: string;
  let summaryCount: number;
  let summaryTotal: number;

  if (hasFilter) {
    const active = plain.filter((s) => s.status === "ACTIVE");
    summaryLabel = "Total del periodo";
    summaryCount = active.length;
    summaryTotal = active.reduce((sum, s) => sum + s.amount, 0);
  } else {
    const todayActive = plain.filter((s) => s.isToday && s.status === "ACTIVE");
    summaryLabel = "Hoy";
    summaryCount = todayActive.length;
    summaryTotal = todayActive.reduce((sum, s) => sum + s.amount, 0);
  }

  const exportParams = new URLSearchParams();
  if (searchParams.from) exportParams.set("from", searchParams.from);
  if (searchParams.to) exportParams.set("to", searchParams.to);
  const exportQs = exportParams.toString();
  const exportHref = `/api/export/ventas${exportQs ? `?${exportQs}` : ""}`;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ventas</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={exportHref}>Exportar CSV</Link>
          </Button>
        </div>
      </div>

      <DateRangeFilter />

      <div className="bg-secondary rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">{summaryLabel} ({summaryCount} ventas)</p>
        <p className="text-2xl font-bold">${summaryTotal.toFixed(2)}</p>
      </div>

      <SalesTable sales={plain} />
    </div>
  );
}
