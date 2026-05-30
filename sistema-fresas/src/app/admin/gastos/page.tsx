import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/admin/gastos/ExpenseForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { todayStart, todayEnd } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GastosPage() {
  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const start = todayStart();
  const end = todayEnd();
  const todayExpenses = expenses.filter((e) => e.date >= start && e.date <= end);
  const todayTotal = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const allTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Gastos</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/api/export/gastos">Exportar CSV</Link>
        </Button>
      </div>

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

      <ExpenseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />

      <div className="space-y-2">
        {expenses.map((e) => (
          <div key={e.id} className="border rounded-lg p-3 flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">{e.description}</p>
              <p className="text-xs text-muted-foreground">
                {e.category.name} · {formatDate(e.date)}
              </p>
            </div>
            <p className="font-bold text-sm">{formatCurrency(Number(e.amount))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
