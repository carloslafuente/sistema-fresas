# Implementation Plan: Sistema Fresas — Gestión de Negocio de Fresas

**Branch**: `001-sistema-fresas-core` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-sistema-fresas-core/spec.md`

## Summary

Aplicación web de gestión para un negocio pequeño de venta de fresas con crema.
Dos roles (Cajera / Admin). La cajera registra ventas en 3 taps; el admin gestiona
inventario con recetas, cuentas por cobrar de plataformas delivery (FIFO), gastos
y un dashboard operativo. Stack: Next.js 14 App Router + TypeScript + Tailwind CSS +
shadcn/ui + PostgreSQL + Prisma + NextAuth.js. Desplegado como monolito en Docker
Compose sobre un VPS.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS

**Primary Dependencies**: Next.js 14 (App Router), Prisma 5, NextAuth.js 4,
Tailwind CSS 3, shadcn/ui, bcryptjs

**Storage**: PostgreSQL 15 (Docker volume)

**Testing**: Vitest + Testing Library (unit/component); prueba manual obligatoria del
3-tap checkout por cada cambio en pantalla de cajera (ver quickstart.md)

**Target Platform**: Linux VPS (x86_64), Docker Compose; uso desde smartphone/tablet
en viewport ≤ 390px

**Project Type**: web-service (monolito Next.js full-stack)

**Performance Goals**: pantalla de venta resetea en < 2s tras confirmar (SC-002);
dashboard carga en < 3s con hasta 500 ventas (SC-006)

**Constraints**: un solo proceso Node.js + un contenedor PostgreSQL; sin microservicios;
sin servicios externos (no email, no payment gateway); touch targets ≥ 44×44px

**Scale/Scope**: ~100 ventas/día, ~2 usuarios concurrentes máximos, monolito single-VPS

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia |
|-----------|--------|-----------|
| I. Simplicity First | ✅ PASS | Next.js Server Actions elimina API layer; Prisma justificado por tipos y transacciones; shadcn/ui sin CSS-in-JS runtime |
| II. Mobile-First UI | ✅ PASS | Tailwind mobile-first; shadcn/ui responsive; touch targets configurados explícitamente ≥ 44px; viewport 390px validado en quickstart |
| III. Fast Checkout (3 taps) | ⚠️ JUSTIFIED | Local+QR = 4 taps; ver Complexity Tracking. Local+Efectivo = 3 taps (caso más común). Decisión: Efectivo preseleccionado por defecto |
| IV. Self-Hosted Monolith | ✅ PASS | Docker Compose: `web` (Next.js) + `db` (PostgreSQL). Un único `docker compose up -d` despliega el sistema completo |
| V. No Over-Engineering | ✅ PASS | Server Actions para mutaciones; Server Components para lecturas; sin Repository pattern, sin CQRS, sin event sourcing |

*Re-check post Phase 1 design*: Mismo resultado. Data model y contratos no introducen
capas adicionales ni patrones injustificados.

## Project Structure

### Documentation (this feature)

```text
specs/001-sistema-fresas-core/
├── plan.md              # Este archivo
├── research.md          # Decisiones tecnológicas y rationales
├── data-model.md        # Entidades, relaciones, constraints, Prisma schema
├── quickstart.md        # Setup local y producción, validación 3-tap
├── contracts/
│   └── server-actions.md  # Server Actions + API routes + Page routes
└── tasks.md             # Generado por /speckit-tasks (próximo paso)
```

### Source Code (repository root)

```text
sistema-fresas/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── app/
    │   ├── layout.tsx                      # Root layout
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx
    │   ├── venta/
    │   │   └── page.tsx                    # Pantalla cajera (protegida CAJERA+ADMIN)
    │   ├── admin/
    │   │   ├── layout.tsx                  # Layout admin (protegido ADMIN)
    │   │   ├── dashboard/page.tsx
    │   │   ├── ventas/page.tsx
    │   │   ├── inventario/page.tsx
    │   │   ├── gastos/page.tsx
    │   │   ├── cuentas-por-cobrar/page.tsx
    │   │   └── configuracion/page.tsx
    │   ├── api/
    │   │   └── export/
    │   │       ├── ventas/route.ts
    │   │       ├── gastos/route.ts
    │   │       └── cuentas/route.ts
    │   └── actions/
    │       ├── ventas.ts
    │       ├── inventario.ts
    │       ├── cuentas.ts
    │       ├── gastos.ts
    │       └── configuracion.ts
    ├── components/
    │   ├── venta/
    │   │   ├── SaleForm.tsx               # Orquestador del flujo 3-tap
    │   │   ├── ProductSelector.tsx
    │   │   ├── SizeSelector.tsx
    │   │   ├── ChannelSelector.tsx
    │   │   ├── PaymentMethodToggle.tsx    # Solo visible si canal=Local
    │   │   └── ConfirmButton.tsx
    │   ├── admin/
    │   │   ├── dashboard/
    │   │   │   ├── InventoryBlock.tsx
    │   │   │   ├── SalesBlock.tsx
    │   │   │   └── FinancialBlock.tsx
    │   │   ├── ventas/SalesTable.tsx
    │   │   ├── inventario/
    │   │   │   ├── StockTable.tsx
    │   │   │   └── RecipeEditor.tsx
    │   │   ├── gastos/ExpenseForm.tsx
    │   │   └── cuentas/
    │   │       ├── PlatformBalance.tsx
    │   │       └── PaymentForm.tsx
    │   └── ui/                            # shadcn/ui components (copiados al repo)
    └── lib/
        ├── prisma.ts                      # PrismaClient singleton
        ├── auth.ts                        # NextAuth config (CredentialsProvider)
        └── utils.ts                       # cn(), formatCurrency(), etc.
```

**Structure Decision**: Next.js App Router con Route Groups para separar auth, cajera y
admin. Server Components para todas las páginas (data fetching directo con Prisma).
Server Actions para todas las mutaciones. API routes solo para exports CSV.
Sin carpeta `pages/` — exclusivamente App Router.

## Complexity Tracking

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|----------------------------------------|
| Principio III: Local+QR requiere 4 taps | El método de pago (Efectivo/QR) es información operativa requerida y no puede eliminarse | Eliminar QR: el negocio acepta pagos QR — no es opcional. Resolución: Efectivo preseleccionado; QR es un toggle, no un paso obligatorio. El caso más común (Efectivo) sigue siendo 3 taps. |
