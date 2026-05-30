import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformBalance } from "@/components/admin/cuentas/PlatformBalance";
import { PaymentForm } from "@/components/admin/cuentas/PaymentForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CuentasPorCobrarPage() {
  const deliveryChannels = await prisma.channel.findMany({
    where: { isDelivery: true },
    orderBy: { name: "asc" },
  });

  const channelData = await Promise.all(
    deliveryChannels.map(async (channel) => {
      const pendingARs = await prisma.accountReceivable.findMany({
        where: { channelId: channel.id, status: "PENDING", sale: { status: "ACTIVE" } },
        include: { sale: true },
        orderBy: { sale: { createdAt: "asc" } },
      });

      const payments = await prisma.platformPayment.findMany({
        where: { channelId: channel.id },
        orderBy: { receivedAt: "desc" },
        take: 10,
      });

      const pendingTotal = pendingARs.reduce((s, ar) => s + Number(ar.netAmount), 0);

      return {
        channel,
        pendingTotal,
        pendingARs: pendingARs.map((ar) => ({
          id: ar.id,
          saleDate: ar.sale.createdAt.toISOString(),
          grossAmount: Number(ar.grossAmount),
          commissionPct: Number(ar.commissionPct),
          netAmount: Number(ar.netAmount),
          status: ar.status as "PENDING" | "PAID",
        })),
        payments: payments.map((p) => ({
          id: p.id,
          receivedAt: p.receivedAt.toISOString(),
          receivedAmount: Number(p.receivedAmount),
          appliedAmount: Number(p.appliedAmount),
          excessAmount: Number(p.excessAmount),
        })),
      };
    })
  );

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cuentas por Cobrar</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/api/export/cuentas">Exportar CSV</Link>
        </Button>
      </div>

      <Tabs defaultValue={deliveryChannels[0]?.id}>
        <TabsList>
          {deliveryChannels.map((ch) => (
            <TabsTrigger key={ch.id} value={ch.id}>
              {ch.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {channelData.map(({ channel, pendingTotal, pendingARs, payments }) => (
          <TabsContent key={channel.id} value={channel.id} className="space-y-4">
            <PlatformBalance
              channelName={channel.name}
              pendingTotal={pendingTotal}
              pendingARs={pendingARs}
              payments={payments}
            />
            <PaymentForm channelId={channel.id} channelName={channel.name} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
