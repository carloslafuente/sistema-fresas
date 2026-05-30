import { prisma } from "@/lib/prisma";
import { StockTable } from "@/components/admin/inventario/StockTable";
import { RecipeEditor } from "@/components/admin/inventario/RecipeEditor";
import { Separator } from "@/components/ui/separator";

export default async function InventarioPage() {
  const [ingredients, recipes] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.recipe.findMany({
      include: {
        product: true,
        size: true,
        items: { include: { ingredient: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { size: { order: "asc" } }],
    }),
  ]);

  const ingredientsPlain = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    stock: Number(i.stock),
    alertThreshold: Number(i.alertThreshold),
  }));

  const recipesPlain = recipes.map((r) => ({
    id: r.id,
    productName: r.product.name,
    sizeName: r.size.name,
    sizeOrder: r.size.order,
    items: r.items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity),
    })),
  }));

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-xl font-bold">Inventario</h1>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Stock actual</h2>
        <StockTable ingredients={ingredientsPlain} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recetas</h2>
        <RecipeEditor
          recipes={recipesPlain}
          ingredients={ingredientsPlain}
        />
      </section>
    </div>
  );
}
