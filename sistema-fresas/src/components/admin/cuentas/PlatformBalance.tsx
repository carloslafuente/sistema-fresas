"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AR {
  id: string;
  saleDate: string;
  grossAmount: number;
  commissionPct: number;
  netAmount: number;
  status: "PENDING" | "PAID";
}

interface Payment {
  id: string;
  receivedAt: string;
  receivedAmount: number;
  appliedAmount: number;
  excessAmount: number;
}

interface Props {
  channelName: string;
  pendingTotal: number;
  pendingARs: AR[];
  payments: Payment[];
}

export function PlatformBalance({ channelName, pendingTotal, pendingARs, payments }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-secondary rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Saldo pendiente {channelName}</p>
        <p className="text-2xl font-bold">{formatCurrency(pendingTotal)}</p>
        <p className="text-xs text-muted-foreground">{pendingARs.length} ventas</p>
      </div>

      {pendingARs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Pendientes de cobro</h3>
          {pendingARs.map((ar) => (
            <div key={ar.id} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{formatDate(ar.saleDate)}</span>
                <span className="font-medium">{formatCurrency(ar.netAmount)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Bruto: {formatCurrency(ar.grossAmount)} · Comisión: {ar.commissionPct}%
              </div>
            </div>
          ))}
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Pagos recibidos</h3>
          {payments.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{formatDate(p.receivedAt)}</span>
                <span className="font-medium">{formatCurrency(p.receivedAmount)}</span>
              </div>
              {p.excessAmount > 0 && (
                <Badge variant="outline" className="text-xs mt-1">
                  Excedente: {formatCurrency(p.excessAmount)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
