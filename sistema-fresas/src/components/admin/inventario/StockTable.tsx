"use client";

import { useState, useTransition } from "react";
import { addStock } from "@/app/actions/inventario";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  alertThreshold: number;
}

export function StockTable({ ingredients }: { ingredients: Ingredient[] }) {
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});

  function handleAdd(ing: Ingredient) {
    const q = parseFloat(qty[ing.id] ?? "");
    if (!q || q <= 0) return setError({ ...error, [ing.id]: "Cantidad inválida" });
    setError({ ...error, [ing.id]: "" });
    startTransition(async () => {
      const res = await addStock({
        ingredientId: ing.id,
        quantity: q,
        reason: reason[ing.id] || "Compra",
      });
      if (!res.success) setError({ ...error, [ing.id]: res.error });
      else { setQty({ ...qty, [ing.id]: "" }); setReason({ ...reason, [ing.id]: "" }); }
    });
  }

  return (
    <div className="space-y-2">
      {ingredients.map((ing) => {
        const isLow = ing.stock <= ing.alertThreshold;
        return (
          <div
            key={ing.id}
            className={cn(
              "rounded-xl border p-4 space-y-3",
              isLow ? "border-amber-400 bg-amber-50" : "border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{ing.name}</span>
                {isLow && <Badge variant="outline" className="ml-2 text-amber-700 border-amber-400">Stock bajo</Badge>}
              </div>
              <span className="text-lg font-bold">
                {ing.stock} <span className="text-sm text-muted-foreground">{ing.unit}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Cantidad (${ing.unit})`}
                value={qty[ing.id] ?? ""}
                onChange={(e) => setQty({ ...qty, [ing.id]: e.target.value })}
                className="h-10 text-sm"
                min="0"
              />
              <Input
                placeholder="Motivo"
                value={reason[ing.id] ?? ""}
                onChange={(e) => setReason({ ...reason, [ing.id]: e.target.value })}
                className="h-10 text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleAdd(ing)}
                disabled={pending}
                className="h-10 px-3 whitespace-nowrap"
              >
                + Ingresar
              </Button>
            </div>
            {error[ing.id] && <p className="text-xs text-destructive">{error[ing.id]}</p>}
          </div>
        );
      })}
    </div>
  );
}
