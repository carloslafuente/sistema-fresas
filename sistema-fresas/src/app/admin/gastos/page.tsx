import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/admin/gastos/ExpenseForm";
import { ExpenseItem } from "@/components/admin/gastos/ExpenseItem";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { formatCurrency, todayLocalDateString, dateOnlyRangeStart, dateOnlyRangeEnd } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const hasFilter = Boolean(searchParams.from || searchParams.to);
  const today = todayLocalDateString();
  const start = dateOnlyRangeStart(searchParams.from ?? today);
  const end = dateOnlyRangeEnd(searchParams.to ?? today);

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: hasFilter ? { date: { gte: start, lte: end } } : undefined,
      include: { category: true },
      orderBy: { date: "desc" },
      take: hasFilter ? 500 : 50,
    }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const todayStartD = dateOnlyRangeStart(today);
  const todayEndD = dateOnlyRangeEnd(today);
  const todayExpenses = expenses.filter((e) => e.date >= todayStartD && e.date <= todayEndD);
  const todayTotal = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const allTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const exportParams = new URLSearchParams();
  if (searchParams.from) exportParams.set("from", searchParams.from);
  if (searchParams.to) exportParams.set("to", searchParams.to);
  const exportQs = exportParams.toString();
  const exportHref = `/api/export/gastos${exportQs ? `?${exportQs}` : ""}`;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Gastos</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={exportHref}>Exportar CSV</Link>
        </Button>
      </div>

      <DateRangeFilter />

      {hasFilter ? (
        <div className="bg-secondary rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Total del periodo ({expenses.length} gastos)</p>
          <p className="text-2xl font-bold">{formatCurrency(allTotal)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Hoy</p>
            <p className="text-xl font-bold">{formatCurrency(todayTotal)}</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Últimos 50</p>
            <p className="text-xl font-bold">{formatCurrency(allTotal)}</p>
          </div>
        </div>
      )}

      <ExpenseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />

      <div className="space-y-2">
        {expenses.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Sin gastos</p>
        )}
        {expenses.map((e) => (
          <ExpenseItem
            key={e.id}
            expense={{
              id: e.id,
              description: e.description,
              amount: Number(e.amount),
              date: e.date.toISOString(),
              categoryId: e.categoryId,
              categoryName: e.category.name,
            }}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        ))}
      </div>
    </div>
  );
}
