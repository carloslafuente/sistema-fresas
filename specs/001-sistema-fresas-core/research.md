# Research: Sistema Fresas — Gestión de Negocio de Fresas

**Feature**: `001-sistema-fresas-core`
**Date**: 2026-05-30

---

## Decision 1: Next.js 14 App Router como monolito web

**Decision**: Usar Next.js 14 App Router como única capa de servidor y cliente.

**Rationale**: App Router permite co-ubicar Server Components (lecturas de datos desde Prisma
sin API layer), Server Actions (mutaciones tipadas sin endpoints REST), y rutas de API (exports
CSV). Todo en un único proceso Node.js que encaja perfectamente con el requisito de monolito
autohospedado. No se necesita un backend separado.

**Alternatives considered**:
- Express + React SPA: requiere dos procesos, CORS, serialización JSON explícita → más complejidad.
- Next.js Pages Router: funciona, pero App Router tiene mejor soporte para Server Actions y
  streaming en Next.js 14.

---

## Decision 2: NextAuth.js v4 con CredentialsProvider

**Decision**: NextAuth.js v4 estable con `CredentialsProvider` y sesiones JWT.

**Rationale**: v4 está en producción y bien documentado. v5 (Auth.js) es beta inestable.
`CredentialsProvider` con bcrypt es suficiente para username+password sin flujo OAuth.
JWT sessions evitan la necesidad de tabla de sesiones en DB (menor complejidad).
El reset de contraseña se hace directamente desde la UI del admin (sin email), lo que
hace innecesario cualquier proveedor de mailer.

**Alternatives considered**:
- Auth.js v5: más moderno pero inestable; riesgo de breaking changes durante desarrollo.
- Lucia Auth: menos ecosistema, requiere más configuración manual.
- Custom auth con JWT propio: innecesario cuando NextAuth resuelve el problema completo.

---

## Decision 3: Prisma + PostgreSQL para persistencia

**Decision**: Prisma ORM sobre PostgreSQL 15 en Docker.

**Rationale**: Prisma genera tipos TypeScript a partir del schema, eliminando una clase
entera de bugs en tiempo de compilación. Las transacciones de Prisma (`$transaction` con
`isolationLevel: Serializable`) resuelven el requisito de escrituras concurrentes de
inventario (Q5 de clarificación). PostgreSQL es robusto para el volumen esperado (~100
ventas/día, crecimiento estimado a 5 años).

**Patterns clave**:
- Sale confirmation: `prisma.$transaction([createSale, ...deductIngredients])` con
  `isolationLevel: Serializable` para prevenir stock negativo bajo concurrencia.
- FIFO payment closure: query ordenada por `createdAt ASC` con acumulación en loop.

**Alternatives considered**:
- SQLite: más simple, pero Prisma + SQLite no soporta `isolationLevel: Serializable`
  para transacciones concurrentes → riesgo de stock negativo.
- Drizzle ORM: tipo-seguro también, pero ecosistema más pequeño y menos migraciones
  battle-tested que Prisma.

---

## Decision 4: Tailwind CSS + shadcn/ui para interfaz

**Decision**: Tailwind CSS con shadcn/ui para todos los componentes de UI.

**Rationale**: Tailwind es mobile-first por defecto (`sm:`, `md:` breakpoints aplican
*hacia arriba*, no hacia abajo). shadcn/ui provee componentes accesibles (Radix UI),
con clases Tailwind, sin CSS-in-JS runtime. Los botones grandes para la pantalla de
cajera se implementan con `h-16 text-xl` o similar — sin dependencia de librería
adicional. shadcn/ui está copiado al repo (no es un package externo), lo que alinea
con el principio de simplicidad.

**Touch target strategy**: Todos los botones interactivos en la pantalla de cajera
DEBEN tener `min-h-[44px] min-w-[44px]` per constitution Principle II. Los botones
de selección de producto/tamaño/canal usarán altura mínima de 64px para comodidad
táctil en uso con una mano.

**Alternatives considered**:
- MUI (Material UI): CSS-in-JS runtime, bundle más pesado, no Tailwind-native.
- Mantine: similar a MUI, innecesario dado que shadcn/ui cubre los componentes requeridos.

---

## Decision 5: Exportación CSV — Route Handler con streaming

**Decision**: Next.js Route Handler (`/api/export/[module]/route.ts`) que devuelve
`text/csv` generado en servidor desde Prisma.

**Rationale**: No requiere librería externa. El CSV se construye con template strings o
array join en el servidor y se devuelve como `Response` con el header `Content-Disposition:
attachment`. Para el volumen esperado (<10k filas) no se necesita streaming chunk-by-chunk.
Un solo `SELECT` + serialización a string es suficiente y más simple.

**Alternatives considered**:
- `papaparse` / `json2csv`: librerías externas innecesarias para CSV plano sin
  casos de borde exóticos (sin quotes en campos, datos numéricos y fechas).

---

## Decision 6: Docker Compose — estructura de servicios

**Decision**: Docker Compose con dos servicios: `web` (Next.js) y `db` (PostgreSQL 15).

```yaml
# estructura conceptual
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment: [DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL]
    depends_on: [db]
  db:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
```

**Rationale**: Dos servicios es el mínimo viable para un monolito Next.js + base de datos.
`next start` en producción (no `next dev`). El volumen de PostgreSQL persiste datos entre
reinicios del contenedor. Variables de entorno inyectadas en tiempo de ejecución.

**VPS deployment**: Un `docker compose up -d` es suficiente para arrancar el sistema completo.
No se requiere orquestador (Kubernetes, Swarm) para el volumen esperado.

---

## Decision 7: Resolución de violación de constitución — Principle III

**Problema**: La pantalla de cajera tiene 4 pasos para canal Local (producto → tamaño →
canal → método de pago → confirmar), excediendo el límite de 3 taps.

**Resolución**: "Efectivo" es el método de pago pre-seleccionado por defecto. Al elegir
"Local", el botón de confirmación ya está activo con Efectivo seleccionado implícitamente.
El usuario solo necesita un tap adicional *si quiere cambiar a QR*. El flujo más común
(Local + Efectivo) cumple exactamente 3 taps + 1 confirm. Ver Complexity Tracking en plan.md.
