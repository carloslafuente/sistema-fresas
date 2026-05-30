import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Users
  const adminHash = await bcrypt.hash("admin123", 10);
  const cameraHash = await bcrypt.hash("cajera123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { name: "Administrador", username: "admin", hashedPassword: adminHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { username: "cajera" },
    update: {},
    create: { name: "Cajera", username: "cajera", hashedPassword: cameraHash, role: "CAJERA" },
  });

  // Products
  const [crema, nutella] = await Promise.all([
    prisma.product.upsert({ where: { name: "Fresas con Crema" }, update: {}, create: { name: "Fresas con Crema" } }),
    prisma.product.upsert({ where: { name: "Fresas con Nutella" }, update: {}, create: { name: "Fresas con Nutella" } }),
  ]);

  // Sizes
  const [chico, mediano, grande] = await Promise.all([
    prisma.size.upsert({ where: { name: "Chico" }, update: {}, create: { name: "Chico", order: 1 } }),
    prisma.size.upsert({ where: { name: "Mediano" }, update: {}, create: { name: "Mediano", order: 2 } }),
    prisma.size.upsert({ where: { name: "Grande" }, update: {}, create: { name: "Grande", order: 3 } }),
  ]);

  // Channels
  const [local, yango, pedidosya] = await Promise.all([
    prisma.channel.upsert({ where: { name: "Local" }, update: {}, create: { name: "Local", commissionPct: 0, isDelivery: false } }),
    prisma.channel.upsert({ where: { name: "Yango" }, update: {}, create: { name: "Yango", commissionPct: 20, isDelivery: true } }),
    prisma.channel.upsert({ where: { name: "PedidosYa" }, update: {}, create: { name: "PedidosYa", commissionPct: 18, isDelivery: true } }),
  ]);

  // Default prices (placeholder — admin should update)
  const priceData = [
    { productId: crema.id, sizeId: chico.id, channelId: local.id, amount: 45 },
    { productId: crema.id, sizeId: mediano.id, channelId: local.id, amount: 60 },
    { productId: crema.id, sizeId: grande.id, channelId: local.id, amount: 75 },
    { productId: crema.id, sizeId: chico.id, channelId: yango.id, amount: 50 },
    { productId: crema.id, sizeId: mediano.id, channelId: yango.id, amount: 65 },
    { productId: crema.id, sizeId: grande.id, channelId: yango.id, amount: 80 },
    { productId: crema.id, sizeId: chico.id, channelId: pedidosya.id, amount: 50 },
    { productId: crema.id, sizeId: mediano.id, channelId: pedidosya.id, amount: 65 },
    { productId: crema.id, sizeId: grande.id, channelId: pedidosya.id, amount: 80 },
    { productId: nutella.id, sizeId: chico.id, channelId: local.id, amount: 55 },
    { productId: nutella.id, sizeId: mediano.id, channelId: local.id, amount: 70 },
    { productId: nutella.id, sizeId: grande.id, channelId: local.id, amount: 85 },
    { productId: nutella.id, sizeId: chico.id, channelId: yango.id, amount: 60 },
    { productId: nutella.id, sizeId: mediano.id, channelId: yango.id, amount: 75 },
    { productId: nutella.id, sizeId: grande.id, channelId: yango.id, amount: 90 },
    { productId: nutella.id, sizeId: chico.id, channelId: pedidosya.id, amount: 60 },
    { productId: nutella.id, sizeId: mediano.id, channelId: pedidosya.id, amount: 75 },
    { productId: nutella.id, sizeId: grande.id, channelId: pedidosya.id, amount: 90 },
  ];

  for (const p of priceData) {
    await prisma.price.upsert({
      where: { productId_sizeId_channelId: { productId: p.productId, sizeId: p.sizeId, channelId: p.channelId } },
      update: { amount: p.amount },
      create: p,
    });
  }

  // Ingredients
  const ingredientData = [
    { name: "Fresas", unit: "gramos", alertThreshold: 500 },
    { name: "Crema", unit: "ml", alertThreshold: 300 },
    { name: "Nutella", unit: "gramos", alertThreshold: 200 },
    { name: "Vasos Chicos", unit: "unidades", alertThreshold: 20 },
    { name: "Vasos Medianos", unit: "unidades", alertThreshold: 20 },
    { name: "Vasos Grandes", unit: "unidades", alertThreshold: 20 },
    { name: "Tapas Chicas", unit: "unidades", alertThreshold: 20 },
    { name: "Tapas Medianas", unit: "unidades", alertThreshold: 20 },
    { name: "Tapas Grandes", unit: "unidades", alertThreshold: 20 },
    { name: "Cucharas", unit: "unidades", alertThreshold: 30 },
  ];

  const ingredients: Record<string, { id: string }> = {};
  for (const ing of ingredientData) {
    const result = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: { ...ing, stock: 0 },
    });
    ingredients[ing.name] = result;
  }

  // Recipes
  const recipeMatrix = [
    { product: crema, size: chico },
    { product: crema, size: mediano },
    { product: crema, size: grande },
    { product: nutella, size: chico },
    { product: nutella, size: mediano },
    { product: nutella, size: grande },
  ];

  const recipeIngredients: Record<string, Record<string, number>> = {
    "Fresas con Crema-Chico": { Fresas: 150, Crema: 60, "Vasos Chicos": 1, "Tapas Chicas": 1, Cucharas: 1 },
    "Fresas con Crema-Mediano": { Fresas: 200, Crema: 80, "Vasos Medianos": 1, "Tapas Medianas": 1, Cucharas: 1 },
    "Fresas con Crema-Grande": { Fresas: 280, Crema: 120, "Vasos Grandes": 1, "Tapas Grandes": 1, Cucharas: 1 },
    "Fresas con Nutella-Chico": { Fresas: 150, Nutella: 40, "Vasos Chicos": 1, "Tapas Chicas": 1, Cucharas: 1 },
    "Fresas con Nutella-Mediano": { Fresas: 200, Nutella: 60, "Vasos Medianos": 1, "Tapas Medianas": 1, Cucharas: 1 },
    "Fresas con Nutella-Grande": { Fresas: 280, Nutella: 90, "Vasos Grandes": 1, "Tapas Grandes": 1, Cucharas: 1 },
  };

  for (const { product, size } of recipeMatrix) {
    const recipe = await prisma.recipe.upsert({
      where: { productId_sizeId: { productId: product.id, sizeId: size.id } },
      update: {},
      create: { productId: product.id, sizeId: size.id },
    });

    const key = `${product.name}-${size.name}`;
    const items = recipeIngredients[key] ?? {};
    for (const [ingName, qty] of Object.entries(items)) {
      const ing = ingredients[ingName];
      if (!ing) continue;
      await prisma.recipeItem.upsert({
        where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId: ing.id } },
        update: { quantity: qty },
        create: { recipeId: recipe.id, ingredientId: ing.id, quantity: qty },
      });
    }
  }

  // Expense categories
  for (const name of ["Insumos", "Alquiler", "Servicios", "Otros"]) {
    await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
