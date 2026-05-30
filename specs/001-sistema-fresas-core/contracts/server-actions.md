# Server Actions Contracts: Sistema Fresas

**Feature**: `001-sistema-fresas-core`
**Date**: 2026-05-30

Todas las mutaciones usan Next.js Server Actions ubicadas en `src/app/actions/`.
Las Server Actions retornan `{ success: true, data? } | { success: false, error: string }`.

---

## ventas.ts

### `createSale(input)`

**Descripción**: Registra una venta nueva. Ejecuta la verificación de stock, el descuento
de insumos y la creación de cuenta por cobrar en una sola transacción serializable.

**Input**:
```typescript
{
  productId: string
  sizeId: string
  channelId: string
  paymentMethod?: 'EFECTIVO' | 'QR'  // requerido si canal es Local
}
```

**Comportamiento**:
1. Verifica que exista un `Price` para la combinación (error si falta).
2. Verifica que la receta esté completa para el producto+tamaño (error si falta).
3. Dentro de `$transaction(isolationLevel: Serializable)`:
   a. Lee stock actual de cada insumo requerido (con `select for update`).
   b. Verifica stock ≥ cantidad requerida por insumo (error si insuficiente).
   c. Crea `Sale` con `status: ACTIVE`.
   d. Crea `SaleIngredientLog` por cada insumo (snapshot de cantidades).
   e. Descuenta stock en `Ingredient`.
   f. Si `Channel.isDelivery`: crea `AccountReceivable` con snapshot de monto y comisión.
4. Retorna la venta creada.

**Acceso**: Cajera + Admin.

---

### `voidSale(saleId)`

**Descripción**: Anula una venta del día en curso.

**Validaciones**:
- La venta existe y pertenece al día en curso (`DATE(createdAt) = CURRENT_DATE`).
- La venta tiene `status: ACTIVE`.
- Si hay una `AccountReceivable` asociada con `status: PAID`, alerta al admin antes
  de continuar (la acción aún puede proceder, pero requiere confirmación explícita
  via parámetro `forceVoid: true`).

**Comportamiento** (en `$transaction`):
1. Marca `Sale.status = VOIDED`, `voidedAt`, `voidedBy`.
2. Revierte stock sumando las cantidades de `SaleIngredientLog` de esa venta.
3. Si hay `AccountReceivable`: permanece en DB pero es excluida de queries de saldo
   pendiente cuando `Sale.status = VOIDED` (no se elimina para auditoría).

**Acceso**: Solo Admin.

---

## inventario.ts

### `addStock(input)`

**Descripción**: Registra una compra/entrada de insumo.

**Input**:
```typescript
{
  ingredientId: string
  quantity: number  // > 0
  reason: string    // ej: "Compra 30-May"
}
```

**Comportamiento**: Incrementa `Ingredient.stock`, crea `StockAdjustment` con quantity positiva.

**Acceso**: Solo Admin.

---

### `adjustStock(input)`

**Descripción**: Ajuste manual de stock (merma, corrección).

**Input**:
```typescript
{
  ingredientId: string
  newStock: number  // ≥ 0 (valor absoluto deseado)
  reason: string
}
```

**Comportamiento**: Calcula la diferencia, actualiza `Ingredient.stock`,
crea `StockAdjustment` con la diferencia (puede ser negativa).

**Acceso**: Solo Admin.

---

### `updateRecipeItem(input)`

**Descripción**: Edita la cantidad de un insumo en una receta.

**Input**:
```typescript
{
  recipeId: string
  ingredientId: string
  quantity: number  // > 0
}
```

**Acceso**: Solo Admin.

---

## cuentas.ts

### `registerPlatformPayment(input)`

**Descripción**: Registra un pago recibido de una plataforma y cierra ARs en FIFO.

**Input**:
```typescript
{
  channelId: string
  receivedAmount: number  // > 0
  receivedAt: string      // ISO date
}
```

**Comportamiento**:
1. Obtiene ARs `PENDING` del canal con `Sale.status = ACTIVE`, ordenados por
   `Sale.createdAt ASC` (FIFO).
2. Itera acumulando monto hasta cubrir `receivedAmount`.
3. Marca cada AR cubierto como `PAID`, asigna `paymentId`.
4. Si el pago supera el saldo pendiente: guarda `excessAmount`.
5. Crea `PlatformPayment` con `appliedAmount` y `excessAmount`.

**Acceso**: Solo Admin.

---

## gastos.ts

### `createExpense(input)`

**Input**:
```typescript
{
  description: string
  amount: number      // > 0
  categoryId: string
  date: string        // ISO date (YYYY-MM-DD)
}
```

**Acceso**: Solo Admin.

---

### `createExpenseCategory(name)`

**Acceso**: Solo Admin.

---

## configuracion.ts

### `updatePrice(input)`

**Input**:
```typescript
{
  productId: string
  sizeId: string
  channelId: string
  amount: number  // > 0
}
```

**Comportamiento**: Upsert en tabla `Price`.

**Acceso**: Solo Admin.

---

### `updateChannelCommission(channelId, commissionPct)`

**Acceso**: Solo Admin.

---

### `updateIngredientThreshold(ingredientId, alertThreshold)`

**Acceso**: Solo Admin.

---

### `resetUserPassword(userId, newPassword)`

**Comportamiento**: Hashea `newPassword` con bcrypt y actualiza `User.hashedPassword`.

**Acceso**: Solo Admin.

---

## API Routes (Export CSV)

Ubicación: `src/app/api/export/`

### `GET /api/export/ventas?from=YYYY-MM-DD&to=YYYY-MM-DD`

Retorna ventas en el rango de fechas (solo `status: ACTIVE`) como CSV.

**Columnas**: fecha, hora, producto, tamaño, canal, método_pago, monto

---

### `GET /api/export/gastos?from=YYYY-MM-DD&to=YYYY-MM-DD`

Retorna gastos en el rango de fechas como CSV.

**Columnas**: fecha, descripción, categoría, monto

---

### `GET /api/export/cuentas?from=YYYY-MM-DD&to=YYYY-MM-DD&channelId=`

Retorna cuentas por cobrar como CSV, filtradas por fecha y opcionalmente por plataforma.

**Columnas**: fecha_venta, canal, monto_bruto, comision_pct, monto_neto, estado, fecha_pago

---

## Page Routes

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/login` | Público | Pantalla de login |
| `/venta` | Cajera + Admin | Registro de venta (pantalla principal cajera) |
| `/admin` | Admin | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | Admin | Dashboard operativo |
| `/admin/ventas` | Admin | Historial de ventas + anulación |
| `/admin/inventario` | Admin | Stock + ajustes + recetas |
| `/admin/gastos` | Admin | Registro y listado de gastos |
| `/admin/cuentas-por-cobrar` | Admin | Saldo y pagos por plataforma |
| `/admin/configuracion` | Admin | Precios, comisiones, recetas, usuarios, categorías |
