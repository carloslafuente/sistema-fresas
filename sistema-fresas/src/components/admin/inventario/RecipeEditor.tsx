"use client";

import { useState, useTransition } from "react";
import { updateRecipeItem } from "@/app/actions/inventario";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Ingredient { id: string; name: string; unit: string; }
interface RecipeItem { ingredientId: string; quantity: number; }
interface Recipe {
  id: string;
  productName: string;
  sizeName: string;
  sizeOrder: number;
  items: RecipeItem[];
}

export function RecipeEditor({ recipes, ingredients }: { recipes: Recipe[]; ingredients: Ingredient[] }) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const r of recipes) {
      init[r.id] = {};
      for (const item of r.items) {
        init[r.id][item.ingredientId] = String(item.quantity);
      }
    }
    return init;
  });
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function saveRecipe(recipe: Recipe) {
    startTransition(async () => {
      for (const [ingredientId, qty] of Object.entries(values[recipe.id] ?? {})) {
        const q = parseFloat(qty);
        if (!q || q <= 0) continue;
        await updateRecipeItem({ recipeId: recipe.id, ingredientId, quantity: q });
      }
      setSaved({ ...saved, [recipe.id]: true });
      setTimeout(() => setSaved((s) => ({ ...s, [recipe.id]: false })), 2000);
    });
  }

  const products = Array.from(new Set(recipes.map((r) => r.productName)));

  return (
    <Tabs defaultValue={products[0]}>
      <TabsList className="mb-4 flex-wrap h-auto">
        {products.map((p) => (
          <TabsTrigger key={p} value={p} className="text-xs">
            {p}
          </TabsTrigger>
        ))}
      </TabsList>
      {products.map((productName) => {
        const productRecipes = recipes
          .filter((r) => r.productName === productName)
          .sort((a, b) => a.sizeOrder - b.sizeOrder);
        return (
          <TabsContent key={productName} value={productName} className="space-y-4">
            {productRecipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{recipe.sizeName}</h4>
                  {saved[recipe.id] && (
                    <span className="text-xs text-green-600">✓ Guardado</span>
                  )}
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center gap-2">
                      <span className="text-sm w-32 shrink-0">{ing.name}</span>
                      <Input
                        type="number"
                        value={values[recipe.id]?.[ing.id] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [recipe.id]: { ...v[recipe.id], [ing.id]: e.target.value },
                          }))
                        }
                        placeholder="0"
                        className="h-9 w-24 text-sm"
                        min="0"
                      />
                      <span className="text-xs text-muted-foreground">{ing.unit}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => saveRecipe(recipe)}
                  disabled={pending}
                  className="w-full"
                >
                  Guardar receta
                </Button>
              </div>
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
