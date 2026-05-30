"use client";

import { useState, useTransition } from "react";
import { registerPlatformPayment } from "@/app/actions/cuentas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PaymentForm({ channelId, channelName }: { channelId: string; channelName: string }) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Monto inválido");
    setError("");

    startTransition(async () => {
      const res = await registerPlatformPayment({
        channelId,
        receivedAmount: num,
        receivedAt: date,
      });
      if (!res.success) {
        setError(res.error);
      } else {
        setSuccess("Pago registrado");
        setAmount("");
        setTimeout(() => setSuccess(""), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-sm">Registrar pago de {channelName}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Monto recibido</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="h-10"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fecha de pago</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10"
            required
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
