import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SaleForm } from "@/components/venta/SaleForm";

export default async function VentaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [products, sizes, channels, prices] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { order: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
    prisma.price.findMany(),
  ]);

  const pricesPlain = prices.map((p) => ({
    productId: p.productId,
    sizeId: p.sizeId,
    channelId: p.channelId,
    amount: Number(p.amount),
  }));

  return (
    <SaleForm
      products={products}
      sizes={sizes}
      channels={channels.map((c) => ({
        id: c.id,
        name: c.name,
        isDelivery: c.isDelivery,
      }))}
      prices={pricesPlain}
      userName={session.user.name ?? "Cajera"}
    />
  );
}
