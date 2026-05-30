"use client";

import { useState, useTransition } from "react";
import { voidSale } from "@/app/actions/ventas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface Sale {
  id: string;
  productName: string;
  sizeName: string;
  channelName: string;
  paymentMethod: string | null;
  amount: number;
  status: "ACTIVE" | "VOIDED";
  createdAt: string;
  isToday: boolean;
}

export function SalesTable({ sales }: { sales: Sale[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<Record<string, string>>({});
  const [confirmVoid, setConfirmVoid] = useState<string | null>(null);

  function handleVoid(id: string, force = false) {
    startTransition(async () => {
      const res = await voidSale(id, force);
      if (!res.success) {
        if (res.error.startsWith("WARN:")) {
          setConfirmVoid(id);
        } else {
          setError({ ...error, [id]: res.error });
        }
      }
    });
  }

  return (
    <div className="space-y-2">
      {sales.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Sin ventas</p>
      )}
      {sales.map((sale) => (
        <div key={sale.id} className="border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{sale.productName} — {sale.sizeName}</p>
              <p className="text-xs text-muted-foreground">
                {sale.channelName}
                {sale.paymentMethod && ` · ${sale.paymentMethod}`}
                {" · "}{formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{formatCurrency(sale.amount)}</p>
              <Badge
                variant={sale.status === "ACTIVE" ? "default" : "secondary"}
                className="text-xs"
              >
                {sale.status === "ACTIVE" ? "Activa" : "Anulada"}
              </Badge>
            </div>
          </div>

          {sale.status === "ACTIVE" && sale.isToday && (
            <div>
              {confirmVoid === sale.id ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-amber-700 flex-1">Esta cuenta ya fue cobrada. ¿Anular de todas formas?</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    onClick={() => { setConfirmVoid(null); handleVoid(sale.id, true); }}
                    disabled={pending}
                  >
                    Sí, anular
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setConfirmVoid(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                  onClick={() => handleVoid(sale.id)}
                  disabled={pending}
                >
                  Anular
                </Button>
              )}
              {error[sale.id] && <p className="text-xs text-destructive mt-1">{error[sale.id]}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
