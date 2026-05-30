# Quickstart: Sistema Fresas

**Feature**: `001-sistema-fresas-core`
**Date**: 2026-05-30

---

## Requisitos

- Docker + Docker Compose (v2+)
- Node.js 20+ (para desarrollo local sin Docker)
- Git

---

## Desarrollo local

```bash
# 1. Clonar el repo y entrar al directorio
git clone <repo-url>
cd sistema-fresas

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Levantar PostgreSQL local
docker compose up db -d

# 4. Instalar dependencias
npm install

# 5. Ejecutar migraciones y seed
npx prisma migrate dev
npx prisma db seed

# 6. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

**Credenciales de seed**:
- Admin: `admin` / `admin123` (cambiar inmediatamente en producción)
- Cajera de prueba: `cajera` / `cajera123`

---

## Variables de entorno requeridas

```bash
# .env.example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_fresas"
NEXTAUTH_SECRET="cambiar-por-secreto-seguro-en-produccion"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Producción en VPS (Docker Compose)

```bash
# 1. En el VPS, clonar el repo
git clone <repo-url>
cd sistema-fresas

# 2. Configurar variables de entorno
cp .env.example .env.production
# Editar .env.production con valores de producción

# 3. Build y arranque
docker compose --env-file .env.production up -d --build

# 4. Ejecutar migraciones (primera vez o tras actualización)
docker compose exec web npx prisma migrate deploy

# 5. Ejecutar seed (solo la primera vez)
docker compose exec web npx prisma db seed
```

**Verificación**:
- `docker compose ps` — ambos servicios `web` y `db` en estado `running`
- `curl http://localhost:3000` — debe responder con la página de login

---

## Actualización en producción

```bash
git pull origin main
docker compose up -d --build
docker compose exec web npx prisma migrate deploy
```

---

## Estructura de archivos clave

```
sistema-fresas/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── prisma/
│   ├── schema.prisma          # Definición del modelo de datos
│   ├── migrations/            # Historial de migraciones
│   └── seed.ts                # Datos iniciales (productos, insumos, recetas base)
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Pantalla de login
│   │   ├── venta/             # Pantalla de cajera
│   │   ├── admin/             # Módulos de administrador
│   │   ├── api/export/        # Endpoints de exportación CSV
│   │   └── actions/           # Server Actions (mutaciones)
│   ├── components/
│   │   ├── venta/             # Selectores de la pantalla de cajera
│   │   ├── admin/             # Componentes del panel admin
│   │   └── ui/                # Componentes shadcn/ui
│   └── lib/
│       ├── prisma.ts          # Cliente Prisma singleton
│       └── auth.ts            # Configuración NextAuth
└── specs/                     # Documentación del feature (este directorio)
```

---

## Validación del flujo de cajera (3-tap test)

Después de cada cambio en la pantalla de venta, verificar manualmente:

1. Abrir `/venta` en un viewport de 390px de ancho (DevTools → iPhone SE).
2. Tap en producto → tap en tamaño → tap en canal → botón Confirmar habilitado.
3. Confirmar → pantalla limpia en < 2 segundos.
4. Para canal Local: el método "Efectivo" está preseleccionado; confirmar sin tap extra.
5. Verificar que el stock disminuyó correctamente en `/admin/inventario`.

---

## Comandos útiles

```bash
# Ver logs del contenedor web
docker compose logs web -f

# Conectar a la base de datos
docker compose exec db psql -U postgres sistema_fresas

# Reset completo de datos (desarrollo)
npx prisma migrate reset

# Generar cliente Prisma tras cambio en schema
npx prisma generate
```
