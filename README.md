# Agendox

Plataforma SaaS multi-tenant de agendamiento de citas. Cada negocio obtiene su propio portal público personalizable, panel de administración y sistema de reservas.

## Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui + Lucide icons
- **Backend**: Supabase (Auth, Database, Storage)
- **Email**: Resend
- **Lenguaje**: TypeScript

## Estructura del proyecto

```
src/
├── app/
│   ├── [businessSlug]/    # Portal público del negocio
│   │   ├── page.tsx       # Landing page
│   │   ├── book/          # Wizard de reservas
│   │   ├── confirmation/  # Confirmación de cita
│   │   └── my-appointment/# Consulta/cancelación
│   ├── admin/             # Panel de administración
│   │   ├── dashboard/     # Dashboard con calendario
│   │   ├── appointments/  # Gestión de citas
│   │   ├── staff/         # Profesionales
│   │   ├── services/      # Servicios
│   │   ├── employees/     # Cuentas de empleados
│   │   ├── clients/       # Clientes
│   │   ├── reports/       # Reportes y analytics
│   │   ├── subscription/  # Plan y facturación
│   │   └── settings/      # Configuración
│   ├── dev/               # Panel de superadmin
│   │   ├── businesses/    # CRUD de negocios
│   │   ├── subscriptions/ # Gestión de suscripciones
│   │   └── reports/       # Reportes globales
│   └── api/               # API Routes
├── components/
│   ├── ui/                # Componentes shadcn/ui + MiniCalendar + AppointmentCalendar
│   ├── admin/             # Sidebar admin
│   └── dev/               # Sidebar dev + BusinessBuilder
├── lib/
│   ├── supabase/          # Clientes Supabase (client/server)
│   ├── hooks/             # useAuth
│   ├── context/           # BusinessProvider
│   ├── email/             # Resend templates y envío
│   └── types/             # TypeScript interfaces
└── supabase/
    └── migrations/        # SQL migrations (001-006)
```

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase y Resend.

### 3. Configurar base de datos

Ejecutar las migraciones en orden en el SQL Editor de Supabase:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_storage.sql`
3. `supabase/migrations/003_staff_services.sql`
4. `supabase/migrations/004_employee_staff_link.sql`
5. `supabase/migrations/005_subscriptions.sql`
6. `supabase/migrations/006_notifications.sql`

### 4. Crear usuario superadmin

En Supabase Dashboard → Authentication → Users, crear un usuario y luego en SQL Editor:

```sql
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "superadmin"}' WHERE email = 'tu@email.com';
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (server-side) | ✅ |
| `RESEND_API_KEY` | API Key de Resend | Opcional |
| `RESEND_FROM_EMAIL` | Email remitente (ej: `Agendox <noreply@tudominio.com>`) | Opcional |
| `CRON_SECRET` | Secret para proteger el endpoint del cron de recordatorios | Opcional |

## Deploy en Vercel

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar las variables de entorno en Settings → Environment Variables
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Deploy

El archivo `vercel.json` incluye un cron job que ejecuta `/api/cron/reminders` cada 15 minutos para enviar recordatorios por email 1 hora antes de cada cita.

## Roles

- **superadmin**: Acceso completo al panel `/dev`, gestión de todos los negocios, impersonación de admin
- **owner**: Propietario del negocio, acceso completo al panel `/admin`
- **employee**: Empleado vinculado a un profesional, ve solo sus citas

## Licencia

Privado — Todos los derechos reservados.
