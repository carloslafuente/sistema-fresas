import { prisma } from "@/lib/prisma";
import { SalesTable } from "@/components/admin/ventas/SalesTable";
import { todayStart, todayEnd } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VentasAdminPage() {
  const start = todayStart();
  const end = todayEnd();

  const sales = await prisma.sale.findMany({
    include: { product: true, size: true, channel: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const plain = sales.map((s) => ({
    id: s.id,
    productName: s.product.name,
    sizeName: s.size.name,
    channelName: s.channel.name,
    paymentMethod: s.paymentMethod,
    amount: Number(s.amount),
    status: s.status as "ACTIVE" | "VOIDED",
    createdAt: s.createdAt.toISOString(),
    isToday: s.createdAt >= start && s.createdAt <= end,
  }));

  const todayActive = plain.filter((s) => s.isToday && s.status === "ACTIVE");
  const todayTotal = todayActive.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ventas</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/api/export/ventas">Exportar CSV</Link>
          </Button>
        </div>
      </div>

      <div className="bg-secondary rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Hoy ({todayActive.length} ventas)</p>
        <p className="text-2xl font-bold">${todayTotal.toFixed(2)}</p>
      </div>

      <SalesTable sales={plain} />
    </div>
  );
}
