import { formatCurrency } from "@/lib/utils";

interface Props {
  localRevenue: number;
  pendingARTotal: number;
  todayExpenses: number;
  estimatedProfit: number;
}

export function FinancialBlock({ localRevenue, pendingARTotal, todayExpenses, estimatedProfit }: Props) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Financiero (hoy)</h2>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Ingresos locales</span>
          <span className="font-medium">{formatCurrency(localRevenue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gastos del día</span>
          <span className="font-medium text-destructive">−{formatCurrency(todayExpenses)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-sm font-semibold">
          <span>Utilidad estimada</span>
          <span className={estimatedProfit >= 0 ? "text-green-700" : "text-destructive"}>
            {formatCurrency(estimatedProfit)}
          </span>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">Saldo pendiente delivery</p>
        <p className="text-xl font-bold">{formatCurrency(pendingARTotal)}</p>
      </div>
    </div>
  );
}
