"use client";

import { useState, useTransition } from "react";
import { updateExpense, deleteExpense } from "@/app/actions/gastos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/ui/date-picker";
import { formatCurrency, formatDateUTC } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  categoryName: string;
}

export function ExpenseItem({ expense, categories }: { expense: Expense; categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const [desc, setDesc] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [date, setDate] = useState(expense.date.split("T")[0]);

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Monto inválido");
    if (!desc.trim()) return setError("Descripción requerida");
    setError("");

    startTransition(async () => {
      const res = await updateExpense(expense.id, { description: desc, amount: num, categoryId, date });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteExpense(expense.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="border rounded-lg p-3 flex justify-between items-start gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground">
          {expense.categoryName} · {formatDateUTC(expense.date)}
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="font-bold text-sm">{formatCurrency(expense.amount)}</p>
        {confirmDelete ? (
          <div className="flex gap-1 justify-end">
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
          <div className="flex gap-1 justify-end">
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
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-10" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monto</Label>
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
                <Label className="text-xs">Fecha</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 border rounded-md px-3 text-sm bg-background"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
