# 🚀 Guía de Inicio Rápido - Migración a Supabase

Esta guía te ayudará a migrar tu ERP ISO 9000 a Supabase en **30-60 minutos**.

## ✅ Pre-requisitos

- [x] Node.js instalado (v20+)
- [x] Cuenta en Supabase (gratis): https://supabase.com
- [x] Proyecto ya corriendo localmente con datos mock

## 📝 Checklist de Migración

### Fase 1: Configuración Supabase (10 min)

- [ ] **1.1** Crear cuenta en Supabase
- [ ] **1.2** Crear nuevo proyecto (`erp-iso-9000`)
- [ ] **1.3** Guardar las credenciales:
  - `Project URL`: https://xxxxx.supabase.co
  - `anon/public key`: eyJhbGc...
- [ ] **1.4** Ir a SQL Editor en Supabase Dashboard

### Fase 2: Base de Datos (5 min)

- [ ] **2.1** Abrir `supabase-schema.sql` en tu editor
- [ ] **2.2** Copiar TODO el contenido
- [ ] **2.3** Pegar en SQL Editor de Supabase
- [ ] **2.4** Click en "Run" ▶️
- [ ] **2.5** Verificar que se crearon 14 tablas (ver Table Editor)

### Fase 3: Usuarios de Prueba (10 min)

- [ ] **3.1** Ir a Authentication → Users en Supabase
- [ ] **3.2** Crear estos usuarios (click "Add user"):

| Email | Password | Rol |
|-------|----------|-----|
| `superadmin@platform.local` | `admin123` | SUPERADMIN |
| `admin@acme-demo.local` | `admin123` | ADMIN |
| `editor@acme-demo.local` | `editor123` | EDITOR |
| `lector@acme-demo.local` | `lector123` | LECTOR |

- [ ] **3.3** Para cada usuario creado, ejecutar en SQL Editor:

```sql
-- 1. Obtener UUID del usuario
SELECT id, email FROM auth.users WHERE email = 'admin@acme-demo.local';

-- 2. Insertar en tabla users (reemplaza <UUID> con el ID real)
INSERT INTO users (id, email, nombre, role_id, tenant_id, activo) VALUES
    ('<UUID>', 'admin@acme-demo.local', 'Admin Acme', 
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
     '99999999-9999-9999-9999-999999999999', 
     true);
```

**Mapeo de role_id:**
- SUPERADMIN: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- ADMIN: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`
- EDITOR: `cccccccc-cccc-cccc-cccc-cccccccccccc`
- LECTOR: `dddddddd-dddd-dddd-dddd-dddddddddddd`

### Fase 4: Integración del Cliente (5 min)

- [ ] **4.1** Instalar dependencia:
```bash
npm install @supabase/supabase-js
```

- [ ] **4.2** Actualizar `.env.local`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=tu-gemini-key
```

- [ ] **4.3** Los archivos ya están creados:
  - ✅ `src/lib/supabase.ts`
  - ✅ `src/services/supabase-api.ts`
  - ✅ `src/contexts/AuthContext.supabase.tsx`

### Fase 5: Activar Integración (5 min)

- [ ] **5.1** Renombrar archivos:
```bash
# Respaldar el mock
mv src/services/api.ts src/services/api.mock.ts

# Activar Supabase API
mv src/services/supabase-api.ts src/services/api.ts

# Respaldar AuthContext viejo
mv src/contexts/AuthContext.tsx src/contexts/AuthContext.old.tsx

# Activar nuevo AuthContext
mv src/contexts/AuthContext.supabase.tsx src/contexts/AuthContext.tsx
```

O en Windows PowerShell:
```powershell
Rename-Item src/services/api.ts api.mock.ts
Rename-Item src/services/supabase-api.ts api.ts
Rename-Item src/contexts/AuthContext.tsx AuthContext.old.tsx
Rename-Item src/contexts/AuthContext.supabase.tsx AuthContext.tsx
```

### Fase 6: Testing (5 min)

- [ ] **6.1** Reiniciar el servidor:
```bash
npm run dev
```

- [ ] **6.2** Abrir http://localhost:3000

- [ ] **6.3** Probar login:
  - Email: `admin@acme-demo.local`
  - Password: `admin123`

- [ ] **6.4** Verificar que:
  - ✅ Login funciona
  - ✅ Se muestra el dashboard
  - ✅ No hay errores en consola
  - ✅ Los datos de prueba aparecen (si los insertaste)

### Fase 7: Datos de Demostración (Opcional - 10 min)

Si quieres poblar con datos de prueba:

```sql
-- Documentos de ejemplo (ajusta los UUID de responsable_id)
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision) 
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'MAN-EST-001',
    'Manual de Calidad',
    'Estratégico',
    'Manual',
    2,
    'Vigente',
    id,
    '2023-01-15',
    '2024-01-10'
FROM users WHERE email = 'admin@acme-demo.local';

-- KPIs de ejemplo
INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Satisfacción del Cliente',
    '%',
    95,
    'Anual',
    'Estratégico',
    id
FROM users WHERE email = 'admin@acme-demo.local';
```

---

## 🎯 Troubleshooting Rápido

### Error: "Invalid API key"
```bash
# 1. Verifica .env.local
cat .env.local

# 2. Reinicia el servidor
npm run dev
```

### Error: "Row level security policy violation"
```sql
-- Verifica que el usuario exista en la tabla users
SELECT u.email, r.name as role, t.nombre as tenant
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'admin@acme-demo.local';
```

### Login funciona pero no carga datos
```sql
-- Verifica policies de RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Desactiva RLS temporalmente para debugging (SOLO EN DESARROLLO)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- Recuerda reactivarlo después:
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

### La app se ve en blanco
1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Busca errores rojos
4. Copia el error y búscalo en MIGRATION_GUIDE.md

---

## 🚀 Despliegue a Producción (Opcional - 10 min)

### Opción 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variables de entorno en Vercel Dashboard:
# Settings → Environment Variables → Add
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - GEMINI_API_KEY

# 5. Deploy final
vercel --prod
```

### Opción 2: Netlify

1. Push tu código a GitHub
2. Conecta el repo en Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Deploy

---

## ✅ Checklist Final

Antes de considerar la migración completa:

### Funcionalidad
- [ ] Login/Logout funciona
- [ ] Documentos se cargan desde BD
- [ ] Crear documento guarda en BD
- [ ] Actualizar estado funciona
- [ ] KPIs se muestran correctamente
- [ ] Filtros funcionan
- [ ] Búsqueda funciona

### Seguridad
- [ ] RLS está habilitado en todas las tablas
- [ ] Usuario A no puede ver datos de Tenant B
- [ ] SuperAdmin puede ver todos los tenants
- [ ] Usuario sin permisos no puede crear documentos

### Performance
- [ ] Carga inicial < 3 segundos
- [ ] Queries complejas < 1 segundo
- [ ] Sin errores en consola

---

## 📚 Próximos Pasos

Una vez completada la migración básica:

1. **Upload de Archivos**: Implementar Supabase Storage para archivos PDF
2. **Real-time**: Añadir subscripciones para colaboración en tiempo real
3. **Email**: Configurar Supabase Auth para envío de emails
4. **Backups**: Configurar backups automáticos
5. **Monitoreo**: Integrar Sentry para error tracking
6. **CI/CD**: Setup GitHub Actions para deploy automático

---

## 🆘 Necesitas Ayuda?

1. **Documentación Supabase**: https://supabase.com/docs
2. **Discord de Supabase**: https://discord.supabase.com
3. **Stack Overflow**: Tag `supabase`
4. **Revisa**: `MIGRATION_GUIDE.md` para guía detallada

---

## 🎉 ¡Felicitaciones!

Si completaste todos los pasos, tu ERP ISO 9000 ahora está:
- ✅ Corriendo en la nube con Supabase
- ✅ Con autenticación segura (JWT)
- ✅ Con base de datos PostgreSQL escalable
- ✅ Con Row Level Security para multi-tenant
- ✅ Listo para producción

**Tiempo estimado total**: 30-60 minutos
