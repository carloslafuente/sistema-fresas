import { prisma } from "@/lib/prisma";
import { todayStart, todayEnd } from "@/lib/utils";
import { InventoryBlock } from "@/components/admin/dashboard/InventoryBlock";
import { SalesBlock } from "@/components/admin/dashboard/SalesBlock";
import { FinancialBlock } from "@/components/admin/dashboard/FinancialBlock";

export default async function DashboardPage() {
  const start = todayStart();
  const end = todayEnd();
  const sevenDaysAgo = new Date(start);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [ingredients, todaySales, last7Sales, todayExpenses, pendingARs, channels] =
    await Promise.all([
      prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
      prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end }, status: "ACTIVE" },
        include: { channel: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: sevenDaysAgo, lte: end }, status: "ACTIVE" },
      }),
      prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
      }),
      prisma.accountReceivable.findMany({
        where: { status: "PENDING", sale: { status: "ACTIVE" } },
      }),
      prisma.channel.findMany(),
    ]);

  // Inventory
  const ingPlain = ingredients.map((i) => ({
    name: i.name,
    stock: Number(i.stock),
    unit: i.unit,
    alertThreshold: Number(i.alertThreshold),
  }));

  // Capacity projection — find recipe with fewest possible servings
  const recipes = await prisma.recipe.findMany({
    include: { items: { include: { ingredient: true } }, product: true, size: true },
  });

  let minServings = Infinity;
  let minProduct = "";
  for (const recipe of recipes) {
    if (recipe.items.length === 0) continue;
    const servings = Math.min(
      ...recipe.items.map((item) => {
        const ing = ingPlain.find((i) => i.name === item.ingredient.name);
        return ing ? Math.floor(Number(ing.stock) / Number(item.quantity)) : Infinity;
      })
    );
    if (servings < minServings) {
      minServings = servings;
      minProduct = `${recipe.product.name} ${recipe.size.name}`;
    }
  }

  // Sales today by channel
  const byChannel = channels.map((ch) => {
    const chSales = todaySales.filter((s) => s.channelId === ch.id);
    return {
      name: ch.name,
      count: chSales.length,
      amount: chSales.reduce((s, sale) => s + Number(sale.amount), 0),
    };
  });

  const todayCount = todaySales.length;
  const todayAmount = todaySales.reduce((s, sale) => s + Number(sale.amount), 0);

  // 7-day rolling average
  const avgDailyAmount = last7Sales.reduce((s, sale) => s + Number(sale.amount), 0) / 7;
  const avgDailyCount = last7Sales.length / 7;

  // Financial
  const localChannelId = channels.find((c) => !c.isDelivery)?.id;
  const localRevenue = todaySales
    .filter((s) => s.channelId === localChannelId)
    .reduce((s, sale) => s + Number(sale.amount), 0);

  const todayExpensesTotal = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const pendingARTotal = pendingARs.reduce((s, ar) => s + Number(ar.netAmount), 0);
  const estimatedProfit = localRevenue - todayExpensesTotal;

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <InventoryBlock
        ingredients={ingPlain}
        projectedSales={isFinite(minServings) ? minServings : 0}
        projectedProduct={minProduct}
      />
      <SalesBlock
        todayCount={todayCount}
        todayAmount={todayAmount}
        byChannel={byChannel}
        avgDailyAmount={avgDailyAmount}
        avgDailyCount={Math.round(avgDailyCount * 10) / 10}
      />
      <FinancialBlock
        localRevenue={localRevenue}
        pendingARTotal={pendingARTotal}
        todayExpenses={todayExpensesTotal}
        estimatedProfit={estimatedProfit}
      />
    </div>
  );
}
