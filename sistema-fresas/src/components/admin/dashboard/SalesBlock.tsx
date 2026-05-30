import { formatCurrency } from "@/lib/utils";

interface ChannelStat { name: string; count: number; amount: number; }

interface Props {
  todayCount: number;
  todayAmount: number;
  byChannel: ChannelStat[];
  avgDailyAmount: number;
  avgDailyCount: number;
}

export function SalesBlock({ todayCount, todayAmount, byChannel, avgDailyAmount, avgDailyCount }: Props) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h2 className="font-semibold">Ventas</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Hoy</p>
          <p className="text-xl font-bold">{formatCurrency(todayAmount)}</p>
          <p className="text-xs text-muted-foreground">{todayCount} ventas</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Prom. 7 días</p>
          <p className="text-xl font-bold">{formatCurrency(avgDailyAmount)}</p>
          <p className="text-xs text-muted-foreground">{avgDailyCount} ventas/día</p>
        </div>
      </div>

      <div className="space-y-1">
        {byChannel.map((ch) => (
          <div key={ch.name} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{ch.name}</span>
            <span>
              {formatCurrency(ch.amount)}{" "}
              <span className="text-muted-foreground text-xs">({ch.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
