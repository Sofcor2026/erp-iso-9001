# 🚀 Guía Completa de Migración a Supabase - ERP ISO 9000

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Fase 1: Configuración de Supabase](#fase-1-configuración-de-supabase)
3. [Fase 2: Migración de Base de Datos](#fase-2-migración-de-base-de-datos)
4. [Fase 3: Integración del Cliente Supabase](#fase-3-integración-del-cliente-supabase)
5. [Fase 4: Migración de Autenticación](#fase-4-migración-de-autenticación)
6. [Fase 5: Migración del API Layer](#fase-5-migración-del-api-layer)
7. [Fase 6: Configuración de Variables de Entorno](#fase-6-configuración-de-variables-de-entorno)
8. [Fase 7: Despliegue en Producción](#fase-7-despliegue-en-producción)
9. [Testing y Validación](#testing-y-validación)

---

## Visión General

### Estado Actual
- **Frontend**: Vite + React + TypeScript (✅ Listo)
- **Backend**: Mock data en memoria en `services/api.ts`
- **Autenticación**: LocalStorage (sin seguridad real)
- **Base de Datos**: No existe, todo es mock

### Estado Final
- **Frontend**: Vite + React + TypeScript (sin cambios)
- **Backend**: Supabase (PostgreSQL + API REST/Real-time)
- **Autenticación**: Supabase Auth (OAuth, JWT)
- **Base de Datos**: PostgreSQL en Supabase con RLS
- **Hosting**: Vercel/Netlify conectado a Supabase

---

## Fase 1: Configuración de Supabase

### 1.1 Crear Cuenta en Supabase

```bash
# Ir a https://supabase.com
# Click en "Start your project"
# Registrarte con GitHub o email
```

### 1.2 Crear un Nuevo Proyecto

1. En el dashboard de Supabase, click en **"New Project"**
2. Configuración del proyecto:
   - **Name**: `erp-iso-9000` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña fuerte y **guárdala**
   - **Region**: Selecciona la más cercana a tus usuarios (ej: `South America (São Paulo)`)
   - **Pricing Plan**: Empieza con **Free** para desarrollo

3. Click en **"Create new project"** (tarda ~2 minutos)

### 1.3 Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️) → **API**
2. Anota estos valores:

```env
# Project URL
https://tuproyecto.supabase.co

# anon/public key (para el cliente)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (SOLO para operaciones de servidor, NUNCA en el frontend)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Fase 2: Migración de Base de Datos

### 2.1 Ejecutar el Schema SQL

1. Ve a **SQL Editor** en el dashboard de Supabase
2. Click en **"New query"**
3. Copia TODO el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor
5. Click en **"Run"** (▶️)

**Resultado esperado**: Verás un mensaje de éxito y se habrán creado ~15 tablas.

### 2.2 Verificar Tablas Creadas

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver todas estas tablas:
   - `plans`
   - `tenants`
   - `roles`
   - `users`
   - `documents`
   - `document_history`
   - `kpis`
   - `document_kpi_links`
   - `contactos`
   - `ordenes_compra`
   - `orden_compra_items`
   - `templates`
   - `audit_logs`
   - `platform_settings`

### 2.3 Crear Usuarios de Prueba en Supabase Auth

Ahora necesitas crear usuarios en Supabase Auth que coincidan con tu sistema:

1. Ve a **Authentication** → **Users**
2. Click en **"Add user"** → **"Create new user"**
3. Crea estos usuarios (usa passwords simples para testing):

| Email | Password | Rol |
|-------|----------|-----|
| `superadmin@platform.local` | `admin123` | SUPERADMIN |
| `admin@acme-demo.local` | `admin123` | ADMIN |
| `editor@acme-demo.local` | `editor123` | EDITOR |
| `lector@acme-demo.local` | `lector123` | LECTOR |

4. **IMPORTANTE**: Después de crear cada usuario en Auth, necesitas insertarlo en la tabla `users`:

```sql
-- Ejecuta esto en SQL Editor para cada usuario
-- Primero, obtén el UUID del usuario de auth.users:
SELECT id, email FROM auth.users WHERE email = 'admin@acme-demo.local';

-- Luego inserta en tu tabla users (reemplaza los UUIDs):
INSERT INTO users (id, email, nombre, role_id, tenant_id, activo) VALUES
    ('uuid-del-auth-user', 'admin@acme-demo.local', 'Admin Acme', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', true);
```

**Script completo de seed de usuarios** (reemplaza los UUIDs con los reales):

```sql
-- Después de crear los usuarios en Supabase Auth, ejecuta esto:
-- (Los UUIDs deben coincidir con los IDs generados por auth.users)

INSERT INTO users (id, email, nombre, role_id, tenant_id, activo) VALUES
    ('<UUID-SUPERADMIN>', 'superadmin@platform.local', 'Super Admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, true),
    ('<UUID-ADMIN>', 'admin@acme-demo.local', 'Admin Acme', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', true),
    ('<UUID-EDITOR>', 'editor@acme-demo.local', 'Editor Acme', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', true),
    ('<UUID-LECTOR>', 'lector@acme-demo.local', 'Lector Acme', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '99999999-9999-9999-9999-999999999999', true);
```

### 2.4 Insertar Datos de Demostración (Opcional)

Si quieres tener documentos y KPIs de ejemplo:

```sql
-- Documentos de ejemplo (ajusta los UUIDs de responsable_id)
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision) VALUES
    ('99999999-9999-9999-9999-999999999999', 'MAN-EST-001', 'Manual de Calidad', 'Estratégico', 'Manual', 2, 'Vigente', '<UUID-ADMIN>', '2023-01-15', '2024-01-10'),
    ('99999999-9999-9999-9999-999999999999', 'PROC-EST-002', 'Procedimiento de Planificación', 'Estratégico', 'Procedimiento', 1, 'En Revisión', '<UUID-EDITOR>', '2023-03-20', '2024-03-25');

-- KPIs de ejemplo
INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, responsable_id) VALUES
    ('99999999-9999-9999-9999-999999999999', 'Satisfacción del Cliente', '%', 95, 'Anual', 'Estratégico', '<UUID-ADMIN>'),
    ('99999999-9999-9999-9999-999999999999', 'Tasa de Cierre de Ventas', '%', 25, 'Mensual', 'Misional', '<UUID-EDITOR>');
```

---

## Fase 3: Integración del Cliente Supabase

### 3.1 Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

### 3.2 Crear Cliente de Supabase

Crea el archivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.3 Configurar Variables de Entorno

Actualiza tu archivo `.env.local`:

```env
# API de Gemini (existente)
GEMINI_API_KEY=tu-api-key-de-gemini

# Supabase (NUEVAS)
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: Los archivos `.env.local` están en `.gitignore`, así que nunca se subirán a Git.

---

## Fase 4: Migración de Autenticación

### 4.1 Actualizar AuthContext

Reemplaza el contenido de `src/contexts/AuthContext.tsx` con una versión que use Supabase Auth:

**Principales cambios:**
- `login()` ahora usa `supabase.auth.signInWithPassword()`
- `logout()` usa `supabase.auth.signOut()`
- Se escucha `onAuthStateChange` para detectar cambios de sesión
- Se obtienen los datos completos del usuario (rol, permisos, tenant) desde la tabla `users`

Ver archivo `AuthContext.supabase.tsx` (lo crearé a continuación).

### 4.2 Eliminar Quick Login

En `LoginPage.tsx`, elimina los botones de "Inicio rápido" ya que ahora requieren passwords reales.

---

## Fase 5: Migración del API Layer

### 5.1 Crear Nuevo services/supabase-api.ts

Este archivo reemplazará el mock de `api.ts`. Implementará TODAS las funciones usando Supabase:

**Principales cambios:**
- `getDocuments()` → `supabase.from('documents').select('*, responsable:users!responsable_id(nombre)')`
- `updateDocumentStatus()` → `supabase.from('documents').update({ estado })`
- `addDocument()` → `supabase.from('documents').insert()`
- `getKPIs()` → `supabase.from('kpis').select('*, responsable:users!responsable_id(nombre)')`
- etc.

Ver archivo `supabase-api.ts` (lo crearé a continuación).

### 5.2 Actualizar Importaciones

En todos los archivos que importan `api`:
```typescript
// Antes:
import { api } from '../services/api';

// Después:
import { api } from '../services/supabase-api';
```

O simplemente renombra el archivo:
```bash
# Respaldar el mock
mv services/api.ts services/api.mock.ts

# Renombrar el nuevo
mv services/supabase-api.ts services/api.ts
```

---

## Fase 6: Configuración de Variables de Entorno

### 6.1 Desarrollo Local

Ya configurado en `.env.local` (Fase 3.3).

### 6.2 Producción (Vercel)

Cuando despliegues en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** → **Environment Variables**
3. Agrega:
   - `VITE_SUPABASE_URL`: `https://tuproyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOi...`
   - `GEMINI_API_KEY`: `tu-gemini-key` (si la usas en el frontend)

**⚠️ SEGURIDAD**: NUNCA pongas el `service_role` key en el frontend. Solo usa el `anon` key.

### 6.3 Proteger Secrets con Edge Functions (Opcional)

Si necesitas llamar la API de Gemini de forma segura (sin exponer la key en el cliente):

1. Crea una Supabase Edge Function:
```bash
npx supabase functions new gemini-proxy
```

2. Implementa el proxy:
```typescript
// supabase/functions/gemini-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const body = await req.json();
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1/...', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${geminiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return new Response(await response.text(), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

3. Deploy:
```bash
npx supabase functions deploy gemini-proxy --no-verify-jwt
```

4. Llama desde el frontend:
```typescript
const response = await supabase.functions.invoke('gemini-proxy', {
  body: { prompt: '...' }
});
```

---

## Fase 7: Despliegue en Producción

### Opción A: Vercel (Recomendado)

#### 7.1 Preparar el Proyecto

```bash
# Asegúrate de que el build funciona
npm run build

# Probar el preview
npm run preview
```

#### 7.2 Conectar con Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Sigue los prompts:
- **Set up and deploy?** Y
- **Which scope?** Tu cuenta personal
- **Link to existing project?** N
- **Project name?** `erp-iso-9000`
- **Directory?** `./`
- **Build Command?** `npm run build`
- **Output directory?** `dist`

#### 7.3 Configurar Variables de Entorno en Vercel

```bash
# O usa la UI de Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

#### 7.4 Deploy Final

```bash
vercel --prod
```

### Opción B: Netlify

#### 7.1 Conectar Repositorio

1. Push tu código a GitHub
2. Ve a [Netlify](https://netlify.com)
3. **Add new site** → **Import an existing project**
4. Conecta tu repo de GitHub

#### 7.2 Configurar Build

- **Build command**: `npm run build`
- **Publish directory**: `dist`

#### 7.3 Configurar Variables de Entorno

En **Site settings** → **Environment variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

#### 7.4 Deploy

Click en **Deploy site**.

### Opción C: Supabase Hosting (Beta)

Actualmente Supabase no tiene hosting nativo para SPAs, pero puedes usar **Supabase Storage** con un CDN:

1. Build tu app: `npm run build`
2. Sube `dist/` a Supabase Storage
3. Configura un CDN (Cloudflare, etc.)

**No recomendado** para producción aún. Usa Vercel o Netlify.

---

## Testing y Validación

### Checklist de Testing

#### ✅ Autenticación
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Logout cierra sesión correctamente
- [ ] La sesión persiste al recargar la página
- [ ] Los permisos se cargan correctamente según el rol

#### ✅ Documentos
- [ ] Lista de documentos se carga desde Supabase
- [ ] Filtrado por estado funciona
- [ ] Filtrado por proceso funciona
- [ ] Crear nuevo documento guarda en BD
- [ ] Actualizar documento refleja cambios
- [ ] Cambiar estado de documento funciona
- [ ] Historial de documento se guarda

#### ✅ KPIs
- [ ] Lista de KPIs se carga correctamente
- [ ] Filtrado por proceso funciona
- [ ] Crear KPI guarda en BD

#### ✅ Multi-tenant
- [ ] Usuarios solo ven datos de su tenant
- [ ] SuperAdmin puede ver todos los tenants
- [ ] Crear nuevo tenant funciona
- [ ] Impersonación funciona (SuperAdmin)

#### ✅ Row Level Security
- [ ] Usuario A no puede ver documentos de Tenant B
- [ ] Usuario sin permiso no puede crear documentos
- [ ] Usuario con rol Lector solo ve documentos vigentes

#### ✅ Performance
- [ ] Carga inicial < 3 segundos
- [ ] Navegación entre páginas es fluida
- [ ] Búsquedas responden rápido

### Scripts de Testing Útiles

```sql
-- Ver todos los usuarios y sus tenants
SELECT u.email, u.nombre, r.name as role, t.nombre as tenant
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN tenants t ON u.tenant_id = t.id;

-- Ver documentos por tenant
SELECT t.nombre as tenant, COUNT(*) as total_docs
FROM documents d
JOIN tenants t ON d.tenant_id = t.id
GROUP BY t.nombre;

-- Verificar permisos de un rol
SELECT name, permissions 
FROM roles 
WHERE name = 'ADMIN';
```

---

## 🎯 Resumen de Comandos

### Setup Inicial
```bash
# 1. Instalar dependencias
npm install @supabase/supabase-js

# 2. Configurar .env.local (manual)

# 3. Ejecutar schema SQL en Supabase (manual)

# 4. Crear archivos de integración
# - src/lib/supabase.ts
# - src/services/supabase-api.ts
# - src/contexts/AuthContext.tsx (actualizar)
```

### Testing Local
```bash
npm run dev
# Abrir http://localhost:3000
```

### Deploy
```bash
# Vercel
vercel --prod

# O Netlify (con GitHub conectado)
git push origin main
```

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase + React](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🐛 Troubleshooting Común

### Error: "Invalid API key"
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctos
- Reinicia el servidor dev: `npm run dev`

### Error: "Row level security policy violation"
- Verifica que el usuario esté insertado en la tabla `users`
- Verifica que el `role_id` y `tenant_id` sean correctos
- Revisa las policies en Table Editor

### Error: "Failed to fetch"
- Verifica que Supabase esté accesible (no bloqueado por firewall)
- Verifica CORS en Supabase Settings → API

### Login funciona pero no carga datos
- Verifica que el usuario exista en la tabla `users`
- Verifica que el `tenant_id` sea correcto
- Verifica las policies de RLS

---

## 🎉 ¡Listo!

Siguiendo esta guía paso a paso, habrás migrado completamente tu ERP ISO 9000 a Supabase con:
- ✅ Base de datos PostgreSQL en la nube
- ✅ Autenticación segura con JWT
- ✅ API REST automática
- ✅ Row Level Security para multi-tenant
- ✅ Deploy en producción con Vercel/Netlify

**Próximos pasos sugeridos:**
1. Implementar upload de archivos con Supabase Storage
2. Añadir real-time subscriptions para colaboración
3. Configurar backups automáticos
4. Implementar CI/CD con GitHub Actions
5. Añadir monitoreo con Sentry o similar
