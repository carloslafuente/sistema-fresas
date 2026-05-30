---

description: "Task list template for feature implementation"
---

# Tasks: Sistema Fresas — Gestión de Negocio de Fresas

**Input**: Design documents from `specs/001-sistema-fresas-core/`

**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/server-actions.md ✅, research.md ✅

**Tests**: No test tasks included (not requested in spec). Manual 3-tap validation required per quickstart.md for every checkout-path change (Constitution Principle III).

**Organization**: Tasks grouped by user story for independent implementation and delivery.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1–US5)
- Paths use Next.js App Router structure from plan.md

---

## Phase 1: Setup

**Purpose**: Project scaffolding and Docker environment. No user story dependencies.

- [x] T001 Initialize Next.js 14 project with TypeScript and App Router in project root (package.json, tsconfig.json, next.config.ts)
- [x] T002 Configure Tailwind CSS in tailwind.config.ts and initialize shadcn/ui CLI with default New York theme in components/ui/
- [x] T003 [P] Create Dockerfile with multi-stage build (deps → builder → runner) for Next.js production
- [x] T004 [P] Create docker-compose.yml with `web` (Next.js, port 3000) and `db` (postgres:15-alpine) services with volume for DB persistence
- [x] T005 [P] Create .env.example with DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL and add .env to .gitignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth, middleware, and shared layout. MUST be complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Define complete Prisma schema in prisma/schema.prisma — all 12 entities from data-model.md: User, Product, Size, Channel, Price, Ingredient, Recipe, RecipeItem, Sale, SaleIngredientLog, AccountReceivable, PlatformPayment, Expense, ExpenseCategory, StockAdjustment
- [x] T007 Create initial Prisma migration (run `prisma migrate dev --name init`) and commit generated SQL in prisma/migrations/
- [x] T008 Create seed file in prisma/seed.ts: 2 products, 3 sizes, 3 channels (with commission %), 10 ingredients (with units), 6 recipes with placeholder RecipeItems, 4 expense categories, 1 admin user (admin/admin123), 1 cajera user (cajera/cajera123)
- [x] T009 [P] Create Prisma client singleton in src/lib/prisma.ts (global instance to prevent connection exhaustion in Next.js dev)
- [x] T010 [P] Configure NextAuth.js v4 with CredentialsProvider and JWT sessions in src/lib/auth.ts — bcryptjs password verification, session includes userId and role
- [x] T011 [P] Create utility functions in src/lib/utils.ts: cn() (Tailwind class merge), formatCurrency() (MXN), formatDate() (DD/MM/YYYY)
- [x] T012 Create root layout in src/app/layout.tsx with SessionProvider wrapping and global Tailwind styles
- [x] T013 Create NextAuth API route in src/app/api/auth/[...nextauth]/route.ts
- [x] T014 Create route protection middleware in src/middleware.ts — CAJERA redirected to /venta, ADMIN allowed /admin/*, unauthenticated redirected to /login
- [x] T015 Create login page with username/password form in src/app/(auth)/login/page.tsx using shadcn/ui Card and Input components
- [x] T016 Create admin layout with navigation sidebar in src/app/admin/layout.tsx — links to /admin/dashboard, /admin/ventas, /admin/inventario, /admin/gastos, /admin/cuentas-por-cobrar, /admin/configuracion

**Checkpoint**: Run `npm run dev`, navigate to /login, log in as admin → should reach /admin/dashboard (blank page OK). Log in as cajera → should reach /venta (blank page OK).

---

## Phase 3: User Story 1 — Registro de Venta Rápido (Priority: P1) 🎯 MVP

**Goal**: Cajera can register a sale in 3 taps and the screen resets instantly.

**Independent Test**: Register 5 consecutive sales with different product/size/channel combinations. Verify each appears in the admin's sales history. Verify stock decreased after each sale.

### Implementation for User Story 1

- [x] T017 [P] [US1] Create ProductSelector component in src/components/venta/ProductSelector.tsx — two large buttons (min-h-[64px]), highlights selected, keyboard accessible
- [x] T018 [P] [US1] Create SizeSelector component in src/components/venta/SizeSelector.tsx — three buttons (Chico/Mediano/Grande), disabled until product selected
- [x] T019 [P] [US1] Create ChannelSelector component in src/components/venta/ChannelSelector.tsx — three buttons (Local/Yango/PedidosYa), disabled until size selected
- [x] T020 [P] [US1] Create PaymentMethodToggle component in src/components/venta/PaymentMethodToggle.tsx — visible only when Local selected; Efectivo preselected by default; QR as alternative (maintains 3-tap flow for common case)
- [x] T021 [US1] Implement createSale Server Action in src/app/actions/ventas.ts — Prisma `$transaction(isolationLevel: Serializable)`: verify Price exists, verify recipe complete, check stock ≥ required per ingredient, create Sale, create SaleIngredientLog per ingredient, decrement Ingredient.stock, create AccountReceivable if channel.isDelivery
- [x] T022 [US1] Create SaleForm orchestrator in src/components/venta/SaleForm.tsx — assembles T017-T020, fetches Price on channel+product+size selection, shows price preview, Confirm button calls T021, resets all state on success (client-side, no page reload)
- [x] T023 [US1] Create sale page in src/app/venta/page.tsx — fetches products/sizes/channels/prices as Server Component, renders SaleForm; accessible to CAJERA and ADMIN roles

**Checkpoint**: Cajera flow is fully functional. Stock decreases after each confirmed sale. Delivery sales create a pending AccountReceivable. Screen resets in < 2 seconds.

---

## Phase 4: User Story 2 — Control de Inventario con Recetas (Priority: P2)

**Goal**: Admin can view current stock with alerts, register purchases, manually adjust quantities, and edit recipes.

**Independent Test**: Register a purchase of 1000g of fresas. Confirm a sale of "Fresas con Crema Chico". Verify fresas decreased by the recipe amount. Edit the recipe and verify next sale uses new quantity.

### Implementation for User Story 2

- [x] T024 [P] [US2] Implement addStock Server Action in src/app/actions/inventario.ts — increments Ingredient.stock, creates StockAdjustment record with positive quantity
- [x] T025 [P] [US2] Implement adjustStock Server Action in src/app/actions/inventario.ts — sets Ingredient.stock to absolute value, creates StockAdjustment with computed delta (can be negative)
- [x] T026 [P] [US2] Implement updateRecipeItem Server Action in src/app/actions/inventario.ts — upserts RecipeItem.quantity for given recipeId+ingredientId
- [x] T027 [US2] Create StockTable component in src/components/admin/inventario/StockTable.tsx — lists all ingredients with current stock, unit, alert threshold; row highlighted in amber when stock ≤ threshold; inline form for addStock; inline form for adjustStock
- [x] T028 [US2] Create RecipeEditor component in src/components/admin/inventario/RecipeEditor.tsx — tabbed by Product+Size combination (6 tabs); editable quantity per ingredient per recipe; calls T026 on save
- [x] T029 [US2] Create inventario admin page in src/app/admin/inventario/page.tsx — Server Component fetching all ingredients and recipes; renders StockTable and RecipeEditor

**Checkpoint**: Admin can see stock with color-coded alerts. Buying stock increases quantities. Manual adjustments persist. Recipe changes affect the next sale.

---

## Phase 5: User Story 3 — Cuentas por Cobrar de Plataformas Delivery (Priority: P3)

**Goal**: Admin can see pending balance per delivery platform, view individual pending sales, register weekly payments with FIFO closure, and void same-day sales with full inventory reversal.

**Independent Test**: Make 10 Yango sales. Register a partial payment covering 6 of them. Verify 6 are marked PAID (oldest first) and 4 remain PENDING. Void a same-day sale and verify inventory was restored.

### Implementation for User Story 3

- [x] T030 [US3] Implement voidSale Server Action in src/app/actions/ventas.ts — validates sale exists and is ACTIVE and from today (DATE check); if AR is PAID, requires forceVoid:true; within `$transaction`: sets Sale.status=VOIDED, restores Ingredient.stock from SaleIngredientLog snapshot, records voidedAt and voidedBy
- [x] T031 [P] [US3] Create SalesTable component in src/components/admin/ventas/SalesTable.tsx — paginated list of all ACTIVE sales; void button visible only for today's sales; status badge; confirmation dialog before voiding
- [x] T032 [US3] Create ventas admin page in src/app/admin/ventas/page.tsx — Server Component with date filter; renders SalesTable; links to CSV export
- [x] T033 [US3] Implement registerPlatformPayment Server Action in src/app/actions/cuentas.ts — creates PlatformPayment record; queries PENDING ARs for the channel ordered by Sale.createdAt ASC; iterates FIFO closing ARs until receivedAmount is exhausted; updates appliedAmount and excessAmount on PlatformPayment
- [x] T034 [P] [US3] Create PlatformBalance component in src/components/admin/cuentas/PlatformBalance.tsx — shows total pending net amount for one channel; lists individual pending ARs (date, gross, commission%, net); shows payment history
- [x] T035 [P] [US3] Create PaymentForm component in src/components/admin/cuentas/PaymentForm.tsx — inputs: receivedAmount (number), receivedAt (date); calls T033; displays closure summary after submission (N ventas closed, excess if any)
- [x] T036 [US3] Create cuentas-por-cobrar admin page in src/app/admin/cuentas-por-cobrar/page.tsx — Server Component with Yango and PedidosYa tabs; each tab renders PlatformBalance and PaymentForm for that channel

**Checkpoint**: Admin sees separate balances for Yango and PedidosYa. Registering a payment closes the correct sales FIFO. Voiding restores inventory. Voided sales disappear from pending balance.

---

## Phase 6: User Story 4 — Registro de Gastos (Priority: P4)

**Goal**: Admin can record business expenses with date, description, amount, and configurable category.

**Independent Test**: Create a new category "papelería". Record an expense in that category. Verify it appears in the list and is included in the dashboard's estimated profit for that day.

### Implementation for User Story 4

- [x] T037 [P] [US4] Implement createExpense and createExpenseCategory Server Actions in src/app/actions/gastos.ts — createExpense validates amount > 0 and categoryId exists; createExpenseCategory validates unique name
- [x] T038 [US4] Create ExpenseForm component in src/components/admin/gastos/ExpenseForm.tsx — fields: description, amount, category (select with option to create new inline), date (defaults to today); calls createExpense; optimistic UI reset on submit
- [x] T039 [US4] Create gastos admin page in src/app/admin/gastos/page.tsx — Server Component fetching expenses with date filter and categories; renders expense list (date, description, category, amount) with running total; renders ExpenseForm; links to CSV export

**Checkpoint**: Admin can record expenses and create custom categories. Expenses appear in the list immediately. The dashboard (US5) will use this data for profit calculation.

---

## Phase 7: User Story 5 — Dashboard Operativo (Priority: P5)

**Goal**: Admin sees a single screen with live inventory status, today's sales breakdown, and financial summary.

**Independent Test**: With sales, expenses, and stock data loaded from previous stories, open the dashboard and verify all blocks display correct totals consistent with the detail views in each module.

### Implementation for User Story 5

- [x] T040 [P] [US5] Create InventoryBlock component in src/components/admin/dashboard/InventoryBlock.tsx — grid of all ingredients: name, stock, unit; amber highlight when stock ≤ threshold; capacity projection (how many units can be sold given current stock, calculated from the recipe with fewest remaining portions)
- [x] T041 [P] [US5] Create SalesBlock component in src/components/admin/dashboard/SalesBlock.tsx — today's total count and amount; breakdown by channel (Local / Yango / PedidosYa); 7-day rolling average (count and amount)
- [x] T042 [P] [US5] Create FinancialBlock component in src/components/admin/dashboard/FinancialBlock.tsx — today's local revenue (ACTIVE sales, Local channel only); total pending AR (Yango + PedidosYa, PENDING ARs with ACTIVE sales); today's estimated profit (local revenue − today's expenses)
- [x] T043 [US5] Create dashboard admin page in src/app/admin/dashboard/page.tsx — Server Component with parallel data fetching (Promise.all) for inventory, sales, and financial data; renders InventoryBlock, SalesBlock, FinancialBlock; add redirect from /admin to /admin/dashboard

**Checkpoint**: All dashboard blocks load with accurate data. Confirming a new sale refreshes the sales block. Adding an expense updates the financial block. Stock alerts appear when thresholds are exceeded.

---

## Phase 8: Módulo de Configuración

**Purpose**: Admin UI for editing prices, commissions, thresholds, recipes, and managing users. Depends on all user story phases being complete.

- [x] T044 Implement updatePrice, updateChannelCommission, updateIngredientThreshold, and resetUserPassword Server Actions in src/app/actions/configuracion.ts — updatePrice upserts Price record; resetUserPassword hashes new password with bcryptjs and updates User.hashedPassword
- [x] T045 [P] Create PriceTable editor in src/components/admin/configuracion/PriceTable.tsx — 6-row × 3-column grid (product+size vs channel); each cell is an editable currency input; saves on blur via updatePrice
- [x] T046 [P] Create CommissionEditor in src/components/admin/configuracion/CommissionEditor.tsx — one numeric percentage input per delivery channel (Yango, PedidosYa); saves via updateChannelCommission
- [x] T047 [P] Create ThresholdEditor in src/components/admin/configuracion/ThresholdEditor.tsx — list of all ingredients with editable alert threshold; saves via updateIngredientThreshold
- [x] T048 [P] Create UserManager in src/components/admin/configuracion/UserManager.tsx — list of users with role badge; password reset form per user (new password input); calls resetUserPassword
- [x] T049 Create configuracion admin page in src/app/admin/configuracion/page.tsx — Server Component loading all config data; tabbed layout: Precios / Comisiones / Umbrales de Stock / Recetas (reuses RecipeEditor from T028) / Usuarios

---

## Phase 9: Exportación CSV

**Purpose**: Allow admin to download data as CSV files for external reporting.

- [x] T050 [P] Implement GET /api/export/ventas/route.ts — query param: from, to (ISO dates); returns active Sales as CSV: fecha, hora, producto, tamaño, canal, método_pago, monto; sets Content-Disposition: attachment; filename="ventas-{from}-{to}.csv"
- [x] T051 [P] Implement GET /api/export/gastos/route.ts — query param: from, to; returns Expenses as CSV: fecha, descripcion, categoria, monto
- [x] T052 [P] Implement GET /api/export/cuentas/route.ts — query param: from, to, channelId (optional); returns ARs as CSV: fecha_venta, canal, monto_bruto, comision_pct, monto_neto, estado, fecha_pago
- [x] T053 Add date range picker and export button to ventas admin page (src/app/admin/ventas/page.tsx), gastos admin page (src/app/admin/gastos/page.tsx), and cuentas-por-cobrar admin page (src/app/admin/cuentas-por-cobrar/page.tsx)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Mobile verification, UX finishes, and final validation.

- [x] T054 [P] Add redirect from / to /venta (for CAJERA) or /admin/dashboard (for ADMIN) based on session role in src/app/page.tsx; unauthenticated users redirect to /login
- [x] T055 [P] Audit all interactive elements in src/components/venta/ for minimum 44×44px touch targets (min-h-[44px] min-w-[44px] Tailwind classes); verify 390px viewport renders without horizontal scroll
- [x] T056 [P] Add loading states (shadcn/ui Skeleton) to dashboard blocks (InventoryBlock, SalesBlock, FinancialBlock) for Suspense boundaries in src/app/admin/dashboard/page.tsx
- [x] T057 [P] Add error boundaries and user-friendly error messages to createSale and voidSale Server Actions (insufficient stock, missing price, same-day-only violation)
- [x] T058 Run 3-tap checkout validation per quickstart.md: Local+Efectivo = 3 taps, Local+QR = 4 taps (documented exception in Complexity Tracking), Yango = 3 taps, PedidosYa = 3 taps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no story dependencies
- **US2 (Phase 4)**: Depends on Foundational — no story dependencies (can parallel with US1)
- **US3 (Phase 5)**: Depends on Foundational + US1 (voidSale extends ventas.ts from US1)
- **US4 (Phase 6)**: Depends on Foundational — no story dependencies
- **US5 (Phase 7)**: Depends on US1 + US2 + US3 + US4 (aggregates all data)
- **Configuración (Phase 8)**: Depends on Foundational; RecipeEditor reuses T028 from US2
- **Exportación (Phase 9)**: Depends on US1 (ventas), US3 (cuentas), US4 (gastos)
- **Polish (Phase 10)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no story dependencies
- **US2 (P2)**: Can start immediately after Phase 2 — no story dependencies
- **US3 (P3)**: Depends on US1 (T030 voidSale updates ventas.ts started in US1)
- **US4 (P4)**: Can start immediately after Phase 2 — no story dependencies
- **US5 (P5)**: Depends on US1 + US2 + US3 + US4 for meaningful data

### Within Each User Story

- Parallel [P] tasks run first (models/components have no cross-file dependency)
- Sequential tasks follow: actions → form component → page component
- Checkpoint validation before advancing to the next story

### Parallel Opportunities

```bash
# Phase 1 — can all run in parallel except T002 (depends on T001):
T001 → T002 (sequential)
T003, T004, T005 (parallel with each other, can start alongside T001)

# Phase 2 — after T006+T007+T008 complete:
T009, T010, T011 parallel → T012 → T013 → T014 → T015 → T016

# Phase 3 US1 — after Phase 2:
T017, T018, T019, T020 parallel → T021 → T022 → T023

# Phase 4 US2 — can run in parallel with US1 after Phase 2:
T024, T025, T026 parallel → T027 → T028 → T029

# Phase 5 US3 — after US1 complete (T030 extends ventas.ts from T021):
T031, T034, T035 parallel → T030 → T032 → T033 → T036

# Phase 6 US4 — can run in parallel with US3 after Phase 2:
T037 → T038 → T039

# Phase 7 US5 — after US1+US2+US3+US4 complete:
T040, T041, T042 parallel → T043
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (T017–T023)
4. **STOP and VALIDATE**: Test 3-tap flow per quickstart.md; confirm stock deduction; confirm AR creation for delivery channels
5. Demo to business owner

### Incremental Delivery

1. Setup + Foundational → system runs, login works
2. **+US1** → Cajera can register sales → Deploy/Demo (MVP)
3. **+US2** → Inventory management works → Deploy/Demo
4. **+US3** → Accounts receivable + sale voiding → Deploy/Demo
5. **+US4** → Expense recording → Deploy/Demo
6. **+US5** → Operational dashboard → Deploy/Demo
7. **+Config + Export + Polish** → Production-ready

### Parallel Team Strategy (if applicable)

After Phase 2 is complete:
- Developer A: US1 (venta flow)
- Developer B: US2 (inventory)
- Developer C: US4 (expenses — smallest, good for ramp-up)
- US3 starts after Developer A finishes US1
- US5 starts after all stories complete

---

## Notes

- [P] tasks = different files, no cross-dependencies
- [US1]–[US5] labels map tasks to user stories from spec.md
- No test tasks generated (not requested). Manual 3-tap validation is MANDATORY per constitution Principle III.
- All admin pages are Server Components — Prisma queries run server-side, no API layer needed for reads
- All mutations use Server Actions from src/app/actions/ — no separate REST API for mutations
- Seed file (T008) provides default prices (all 18 combinations), default recipes (all 6 combinations with placeholder quantities), default channels with 0% commission — admin must configure real values before going live
- Constitution violation (Local+QR = 4 taps) documented in plan.md Complexity Tracking; T058 validates the accepted design
