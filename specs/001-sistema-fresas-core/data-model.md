# Data Model: Sistema Fresas

**Feature**: `001-sistema-fresas-core`
**Date**: 2026-05-30

---

## Entity Diagram (relaciones)

```
User ──────────────────── Sale
                           │
Product ─┐                 │
Size ────┼─── Sale ────── SaleIngredientLog
Channel ─┘         │
                   └───── AccountReceivable ──── PlatformPayment
                                                        │
                                                    Channel

Recipe (Product+Size) ──── RecipeItem ──── Ingredient ──── StockAdjustment

Expense ──── ExpenseCategory
```

---

## Entities

### User

| Campo         | Tipo       | Restricciones                          |
|---------------|------------|----------------------------------------|
| id            | UUID       | PK, generado automáticamente           |
| name          | String     | NOT NULL                               |
| username      | String     | NOT NULL, UNIQUE                       |
| hashedPassword| String     | NOT NULL                               |
| role          | Enum       | CAJERA \| ADMIN, NOT NULL              |
| createdAt     | DateTime   | NOT NULL, default NOW                  |

**Reglas**:
- `username` es case-insensitive en login (normalizar a minúsculas al crear).
- Solo el ADMIN puede crear o modificar usuarios.
- El reset de contraseña actualiza `hashedPassword` desde la UI del admin.

---

### Product

| Campo | Tipo   | Restricciones          |
|-------|--------|------------------------|
| id    | UUID   | PK                     |
| name  | String | NOT NULL, UNIQUE       |

**Valores iniciales (seed)**: "Fresas con Crema", "Fresas con Nutella"

---

### Size

| Campo | Tipo    | Restricciones          |
|-------|---------|------------------------|
| id    | UUID    | PK                     |
| name  | String  | NOT NULL, UNIQUE       |
| order | Integer | NOT NULL (para ordenar: Chico=1, Mediano=2, Grande=3) |

**Valores iniciales (seed)**: Chico (1), Mediano (2), Grande (3)

---

### Channel

| Campo         | Tipo    | Restricciones                              |
|---------------|---------|--------------------------------------------|
| id            | UUID    | PK                                         |
| name          | String  | NOT NULL, UNIQUE                           |
| commissionPct | Decimal | NOT NULL, 0–100, default 0                 |
| isDelivery    | Boolean | NOT NULL (true = Yango/PedidosYa; false = Local) |

**Valores iniciales (seed)**: Local (0%, isDelivery=false), Yango (isDelivery=true),
PedidosYa (isDelivery=true). Comisiones configurables por admin.

---

### Price

| Campo     | Tipo    | Restricciones                                  |
|-----------|---------|------------------------------------------------|
| id        | UUID    | PK                                             |
| productId | UUID    | FK → Product, NOT NULL                         |
| sizeId    | UUID    | FK → Size, NOT NULL                            |
| channelId | UUID    | FK → Channel, NOT NULL                         |
| amount    | Decimal | NOT NULL, > 0                                  |

**Constraint**: UNIQUE(productId, sizeId, channelId) — una sola entrada por combinación.
Hay 2 productos × 3 tamaños × 3 canales = 18 precios en total.

---

### Ingredient

| Campo          | Tipo    | Restricciones                           |
|----------------|---------|-----------------------------------------|
| id             | UUID    | PK                                      |
| name           | String  | NOT NULL, UNIQUE                        |
| unit           | String  | NOT NULL (gramos, ml, unidades)         |
| stock          | Decimal | NOT NULL, default 0, ≥ 0               |
| alertThreshold | Decimal | NOT NULL, default 0                     |

**Valores iniciales (seed)**: Fresas (g), Crema (ml), Nutella (g), Vasos Chicos (ud),
Vasos Medianos (ud), Vasos Grandes (ud), Tapas Chicas (ud), Tapas Medianas (ud),
Tapas Grandes (ud), Cucharas (ud).

**Regla**: `stock` nunca puede quedar negativo. La venta verifica stock ≥ cantidad requerida
antes de confirmar. Si falla, la transacción hace rollback completo.

---

### Recipe

| Campo     | Tipo | Restricciones                                |
|-----------|------|----------------------------------------------|
| id        | UUID | PK                                           |
| productId | UUID | FK → Product, NOT NULL                       |
| sizeId    | UUID | FK → Size, NOT NULL                          |

**Constraint**: UNIQUE(productId, sizeId) — una receta por combinación.
Hay 2 × 3 = 6 recetas en total. El admin las edita pero no puede crear nuevas
(el catálogo es fijo en v1).

---

### RecipeItem

| Campo        | Tipo    | Restricciones                         |
|--------------|---------|---------------------------------------|
| id           | UUID    | PK                                    |
| recipeId     | UUID    | FK → Recipe, NOT NULL                 |
| ingredientId | UUID    | FK → Ingredient, NOT NULL             |
| quantity     | Decimal | NOT NULL, > 0                         |

**Constraint**: UNIQUE(recipeId, ingredientId).

---

### Sale

| Campo         | Tipo     | Restricciones                                     |
|---------------|----------|---------------------------------------------------|
| id            | UUID     | PK                                                |
| userId        | UUID     | FK → User (quien registró la venta), NOT NULL     |
| productId     | UUID     | FK → Product, NOT NULL                            |
| sizeId        | UUID     | FK → Size, NOT NULL                               |
| channelId     | UUID     | FK → Channel, NOT NULL                            |
| paymentMethod | Enum     | EFECTIVO \| QR \| NULL (solo si canal Local)      |
| amount        | Decimal  | NOT NULL (snapshot del precio al momento de venta)|
| status        | Enum     | ACTIVE \| VOIDED, NOT NULL, default ACTIVE        |
| voidedAt      | DateTime | NULL (se llena al anular)                         |
| voidedBy      | UUID     | FK → User, NULL (admin que anuló)                 |
| createdAt     | DateTime | NOT NULL, default NOW                             |

**Reglas**:
- `amount` se captura como snapshot del `Price` en el momento de la venta (no referencia dinámica).
  Si el admin cambia precios después, las ventas históricas mantienen su monto original.
- Solo ventas con `createdAt` del día en curso (`DATE(createdAt) = CURRENT_DATE`) pueden ser anuladas.
- Al anular: `status = VOIDED`, `voidedAt = NOW()`, `voidedBy = adminId`.
- Las ventas VOIDED no se incluyen en los cálculos del dashboard ni en los saldos de
  cuentas por cobrar.

---

### SaleIngredientLog

| Campo        | Tipo    | Restricciones                           |
|--------------|---------|-----------------------------------------|
| id           | UUID    | PK                                      |
| saleId       | UUID    | FK → Sale, NOT NULL                     |
| ingredientId | UUID    | FK → Ingredient, NOT NULL               |
| quantity     | Decimal | NOT NULL (cantidad descontada)          |

**Propósito**: Snapshot de la receta en el momento de la venta. Permite revertir
exactamente las mismas cantidades al anular, incluso si la receta fue editada
después de la venta.

---

### AccountReceivable

| Campo         | Tipo     | Restricciones                                     |
|---------------|----------|---------------------------------------------------|
| id            | UUID     | PK                                                |
| saleId        | UUID     | FK → Sale, NOT NULL, UNIQUE (1:1 con Sale)        |
| channelId     | UUID     | FK → Channel, NOT NULL                            |
| grossAmount   | Decimal  | NOT NULL (snapshot del monto bruto de la venta)   |
| commissionPct | Decimal  | NOT NULL (snapshot del % de comisión del canal)   |
| netAmount     | Decimal  | NOT NULL (grossAmount × (1 - commissionPct/100))  |
| status        | Enum     | PENDING \| PAID, NOT NULL, default PENDING        |
| paymentId     | UUID     | FK → PlatformPayment, NULL                        |

**Reglas**:
- Se crea automáticamente al confirmar una venta en canal con `isDelivery=true`.
- Al anular la venta asociada: el AR pasa a estado cancelado implícitamente (no se
  incluye en el saldo pendiente si `Sale.status = VOIDED`).
- `commissionPct` es snapshot — no cambia si el admin edita la comisión del canal después.

---

### PlatformPayment

| Campo          | Tipo     | Restricciones                           |
|----------------|----------|-----------------------------------------|
| id             | UUID     | PK                                      |
| channelId      | UUID     | FK → Channel, NOT NULL                  |
| receivedAmount | Decimal  | NOT NULL, > 0                           |
| receivedAt     | DateTime | NOT NULL (fecha en que pagó la plataforma)|
| createdAt      | DateTime | NOT NULL, default NOW                   |
| appliedAmount  | Decimal  | NOT NULL, default 0 (calculado al cierre)|
| excessAmount   | Decimal  | NOT NULL, default 0 (receivedAmount - appliedAmount si > 0) |

**FIFO closure**: Al registrar un pago, el sistema ordena los ARs pendientes del canal
por `Sale.createdAt ASC` y los marca como PAID hasta agotar `receivedAmount`.
Los ARs que no caben permanecen PENDING. El `excessAmount` se muestra al admin como
información (no se aplica automáticamente a futuros ARs).

---

### Expense

| Campo      | Tipo     | Restricciones                      |
|------------|----------|------------------------------------|
| id         | UUID     | PK                                 |
| description| String   | NOT NULL                           |
| amount     | Decimal  | NOT NULL, > 0                      |
| categoryId | UUID     | FK → ExpenseCategory, NOT NULL     |
| date       | Date     | NOT NULL (fecha del gasto, no timestamp) |
| createdAt  | DateTime | NOT NULL, default NOW              |

---

### ExpenseCategory

| Campo | Tipo   | Restricciones    |
|-------|--------|------------------|
| id    | UUID   | PK               |
| name  | String | NOT NULL, UNIQUE |

**Valores iniciales (seed)**: Insumos, Alquiler, Servicios, Otros.

---

### StockAdjustment

| Campo        | Tipo     | Restricciones                                         |
|--------------|----------|-------------------------------------------------------|
| id           | UUID     | PK                                                    |
| ingredientId | UUID     | FK → Ingredient, NOT NULL                             |
| quantity     | Decimal  | NOT NULL (positivo = entrada / compra; negativo = ajuste de merma) |
| reason       | String   | NOT NULL (ej: "Compra", "Ajuste manual", "Apertura")  |
| createdAt    | DateTime | NOT NULL, default NOW                                 |
| createdBy    | UUID     | FK → User, NOT NULL                                   |

**Propósito**: Registro de auditoría de todos los cambios manuales al stock.
No incluye los descuentos automáticos por venta (esos están en `SaleIngredientLog`).

---

## State Transitions

### Sale.status

```
[ACTIVE] ──(admin voids, same day)──→ [VOIDED]
```

### AccountReceivable.status

```
[PENDING] ──(FIFO payment applied)──→ [PAID]
Note: también pasa a "inactiva" si Sale.status = VOIDED (filtro en queries, no campo extra)
```

---

## Prisma Schema (referencia)

```prisma
// Fragmento representativo — no es el schema completo

enum Role {
  CAJERA
  ADMIN
}

enum SaleStatus {
  ACTIVE
  VOIDED
}

enum PaymentMethod {
  EFECTIVO
  QR
}

enum ARStatus {
  PENDING
  PAID
}

model Sale {
  id            String        @id @default(uuid())
  userId        String
  productId     String
  sizeId        String
  channelId     String
  paymentMethod PaymentMethod?
  amount        Decimal       @db.Decimal(10, 2)
  status        SaleStatus    @default(ACTIVE)
  voidedAt      DateTime?
  voidedBy      String?
  createdAt     DateTime      @default(now())

  user              User                 @relation("seller", fields: [userId], references: [id])
  voidedByUser      User?                @relation("voider", fields: [voidedBy], references: [id])
  product           Product              @relation(fields: [productId], references: [id])
  size              Size                 @relation(fields: [sizeId], references: [id])
  channel           Channel              @relation(fields: [channelId], references: [id])
  ingredientLogs    SaleIngredientLog[]
  accountReceivable AccountReceivable?
}
```
