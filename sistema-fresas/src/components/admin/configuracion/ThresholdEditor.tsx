"use client";

import { useState, useTransition } from "react";
import { updateIngredientThreshold } from "@/app/actions/configuracion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Ingredient { id: string; name: string; unit: string; alertThreshold: number; }

export function ThresholdEditor({ ingredients }: { ingredients: Ingredient[] }) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(ingredients.map((i) => [i.id, String(i.alertThreshold)]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function handleSave(id: string) {
    const val = parseFloat(values[id] ?? "");
    if (isNaN(val) || val < 0) return;
    startTransition(async () => {
      await updateIngredientThreshold(id, val);
      setSaved((s) => ({ ...s, [id]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 1500);
    });
  }

  return (
    <div className="space-y-2 py-2">
      {ingredients.map((ing) => (
        <div key={ing.id} className="flex items-center gap-2">
          <span className="text-sm w-36 shrink-0">{ing.name}</span>
          <Input
            type="number"
            value={values[ing.id] ?? ""}
            onChange={(e) => setValues({ ...values, [ing.id]: e.target.value })}
            className="h-9 w-24 text-sm"
            min="0"
          />
          <span className="text-xs text-muted-foreground w-12">{ing.unit}</span>
          <Button
            size="sm"
            onClick={() => handleSave(ing.id)}
            disabled={pending}
            className={`h-8 px-3 text-xs ${saved[ing.id] ? "bg-green-600" : ""}`}
          >
            {saved[ing.id] ? "✓" : "OK"}
          </Button>
        </div>
      ))}
    </div>
  );
}
