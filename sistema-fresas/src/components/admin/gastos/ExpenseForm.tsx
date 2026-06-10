"use client";

import { useState, useTransition } from "react";
import { createExpense, createExpenseCategory } from "@/app/actions/gastos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Category { id: string; name: string; }

export function ExpenseForm({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newCat, setNewCat] = useState("");

  function addCategory() {
    if (!newCat.trim()) return;
    startTransition(async () => {
      const res = await createExpenseCategory(newCat);
      if (!res.success) { setError(res.error); return; }
      setNewCat("");
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("Monto inválido");
    if (!categoryId) return setError("Selecciona una categoría");
    setError("");

    startTransition(async () => {
      const res = await createExpense({ description: desc, amount: num, categoryId, date });
      if (!res.success) { setError(res.error); return; }
      setDesc("");
      setAmount("");
      setSuccess("Gasto registrado");
      setTimeout(() => setSuccess(""), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-sm">Nuevo gasto</h3>
      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ej. Compra de fresas"
          className="h-10"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Monto</Label>
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
          <Label className="text-xs">Fecha</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10"
            required
          />
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
      <div className="flex gap-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nueva categoría..."
          className="h-9 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCategory} disabled={pending}>
          Agregar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <span className="flex items-center gap-2"><Spinner /> Guardando...</span> : "Registrar gasto"}
      </Button>
    </form>
  );
}
