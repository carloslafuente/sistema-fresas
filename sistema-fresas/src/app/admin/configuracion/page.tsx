import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceTable } from "@/components/admin/configuracion/PriceTable";
import { CommissionEditor } from "@/components/admin/configuracion/CommissionEditor";
import { ThresholdEditor } from "@/components/admin/configuracion/ThresholdEditor";
import { UserManager } from "@/components/admin/configuracion/UserManager";
import { RecipeEditor } from "@/components/admin/inventario/RecipeEditor";

export default async function ConfiguracionPage() {
  const [products, sizes, channels, prices, ingredients, recipes, users] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { order: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
    prisma.price.findMany(),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.recipe.findMany({
      include: { product: true, size: true, items: { include: { ingredient: true } } },
      orderBy: [{ product: { name: "asc" } }, { size: { order: "asc" } }],
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">Configuración</h1>
      <Tabs defaultValue="precios">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="precios" className="text-xs">Precios</TabsTrigger>
          <TabsTrigger value="comisiones" className="text-xs">Comisiones</TabsTrigger>
          <TabsTrigger value="umbrales" className="text-xs">Alertas Stock</TabsTrigger>
          <TabsTrigger value="recetas" className="text-xs">Recetas</TabsTrigger>
          <TabsTrigger value="usuarios" className="text-xs">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="precios">
          <PriceTable
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            sizes={sizes.map((s) => ({ id: s.id, name: s.name, order: s.order }))}
            channels={channels.map((c) => ({ id: c.id, name: c.name }))}
            prices={prices.map((p) => ({
              productId: p.productId,
              sizeId: p.sizeId,
              channelId: p.channelId,
              amount: Number(p.amount),
            }))}
          />
        </TabsContent>

        <TabsContent value="comisiones">
          <CommissionEditor
            channels={channels
              .filter((c) => c.isDelivery)
              .map((c) => ({ id: c.id, name: c.name, commissionPct: Number(c.commissionPct) }))}
          />
        </TabsContent>

        <TabsContent value="umbrales">
          <ThresholdEditor
            ingredients={ingredients.map((i) => ({
              id: i.id,
              name: i.name,
              unit: i.unit,
              alertThreshold: Number(i.alertThreshold),
            }))}
          />
        </TabsContent>

        <TabsContent value="recetas">
          <RecipeEditor
            recipes={recipes.map((r) => ({
              id: r.id,
              productName: r.product.name,
              sizeName: r.size.name,
              sizeOrder: r.size.order,
              items: r.items.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: Number(item.quantity),
              })),
            }))}
            ingredients={ingredients.map((i) => ({
              id: i.id,
              name: i.name,
              unit: i.unit,
            }))}
          />
        </TabsContent>

        <TabsContent value="usuarios">
          <UserManager
            users={users.map((u) => ({ id: u.id, name: u.name, username: u.username, role: u.role }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
