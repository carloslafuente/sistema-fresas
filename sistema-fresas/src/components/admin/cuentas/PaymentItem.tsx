"use client";

import { useState, useTransition } from "react";
import { updatePlatformPayment, deletePlatformPayment } from "@/app/actions/cuentas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { formatCurrency, formatDateUTC } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  receivedAt: string;
  receivedAmount: number;
  appliedAmount: number;
  excessAmount: number;
}

export function PaymentItem({ payment }: { payment: Payment }) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState(String(payment.receivedAmount));
  const [date, setDate] = useState(payment.receivedAt.split("T")[0]);

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Monto inválido");
    setError("");

    startTransition(async () => {
      const res = await updatePlatformPayment(payment.id, { receivedAmount: num, receivedAt: date });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePlatformPayment(payment.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="border rounded-lg p-3 text-sm space-y-1">
      <div className="flex justify-between items-start gap-2">
        <span className="text-muted-foreground">{formatDateUTC(payment.receivedAt)}</span>
        <span className="font-medium">{formatCurrency(payment.receivedAmount)}</span>
      </div>
      {payment.excessAmount > 0 && (
        <Badge variant="outline" className="text-xs">
          Excedente: {formatCurrency(payment.excessAmount)}
        </Badge>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {confirmDelete ? (
        <div className="flex gap-1 justify-end pt-1">
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs px-2"
            onClick={handleDelete}
            disabled={pending}
          >
            Sí, eliminar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={() => setConfirmDelete(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex gap-1 justify-end pt-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monto recibido</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha de pago</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <span className="flex items-center gap-2"><Spinner /> Guardando...</span> : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
