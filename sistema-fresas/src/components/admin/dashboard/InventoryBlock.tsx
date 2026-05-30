import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Ingredient {
  name: string;
  stock: number;
  unit: string;
  alertThreshold: number;
}

interface Props {
  ingredients: Ingredient[];
  projectedSales: number;
  projectedProduct: string;
}

export function InventoryBlock({ ingredients, projectedSales, projectedProduct }: Props) {
  const lowIngredients = ingredients.filter((i) => i.stock <= i.alertThreshold);

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Inventario</h2>
        {lowIngredients.length > 0 && (
          <Badge variant="outline" className="text-amber-700 border-amber-400 text-xs">
            ⚠ {lowIngredients.length} bajo stock
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {ingredients.map((ing) => {
          const isLow = ing.stock <= ing.alertThreshold;
          return (
            <div
              key={ing.name}
              className={cn(
                "flex justify-between items-center py-1 px-2 rounded-lg text-sm",
                isLow ? "bg-amber-50 text-amber-900" : ""
              )}
            >
              <span>{ing.name}</span>
              <span className="font-medium">
                {ing.stock} {ing.unit}
              </span>
            </div>
          );
        })}
      </div>

      {projectedSales > 0 && (
        <div className="bg-secondary rounded-lg p-2 text-xs text-center text-muted-foreground">
          Con stock actual: ~{projectedSales} ventas más de {projectedProduct}
        </div>
      )}
    </div>
  );
}
