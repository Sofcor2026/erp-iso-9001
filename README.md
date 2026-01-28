<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🏢 ERP ISO 9000 Drive

> Sistema ERP multi-tenant con interfaz tipo Google Drive para gestión de documentación ISO 9000, KPIs y formularios.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e)](https://supabase.com/)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Demo Local](#-demo-local)
- [Migración a Supabase](#-migración-a-supabase)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Documentación](#-documentación)

---

## ✨ Características

### 🔐 Sistema Multi-Tenant
- **4 Roles**: SuperAdmin, Admin, Editor, Lector
- **Control de Acceso**: Permisos granulares (17 permisos diferentes)
- **Impersonación**: SuperAdmin puede actuar como cualquier tenant
- **Aislamiento**: Row Level Security (RLS) protege datos entre tenants

### 📄 Gestión Documental ISO 9000
- **5 Estados**: Borrador, En Revisión, Aprobado, Vigente, Obsoleto
- **5 Tipos**: Manual, Procedimiento, Formato, Política, Acta
- **4 Procesos**: Estratégico, Misional, Apoyo, Control-Calidad
- **Historial Completo**: Versiones y cambios auditados
- **Vinculación**: Conecta documentos con KPIs y formularios

### 📊 KPIs y Métricas
- **Por Proceso**: Estratégicos, Misionales, Apoyo, Control
- **Periodicidad**: Diario, Semanal, Mensual, Anual
- **Metas**: Definición de objetivos cuantificables
- **Responsables**: Asignación por usuario

### 📋 Formularios y Órdenes
- **Órdenes de Compra**: Gestión completa con items y totales
- **Proveedores**: Base de datos de contactos
- **Integración**: Vinculación automática con documentos

### 🏢 Administración de Platform (SuperAdmin)
- **Gestión de Tenants**: Crear, editar, suspender organizaciones
- **Planes**: Básico, Pro, Enterprise con límites configurables
- **Roles Personalizados**: Crear roles con permisos específicos
- **Plantillas**: Templates para cotizaciones, OC, etc.
- **Logs de Auditoría**: Registro completo de acciones críticas

---

## 🚀 Demo Local

### Opción 1: Con datos Mock (5 min)

```bash
# 1. Clonar/descargar el proyecto
cd 2.0

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tu GEMINI_API_KEY (opcional)

# 4. Correr en desarrollo
npm run dev
```

Abre http://localhost:3000 y usa estos usuarios:
- `admin@acme-demo.local` (Administrador)
- `editor@acme-demo.local` (Editor)
- `lector@acme-demo.local` (Lector)
- `superadmin@platform.local` (SuperAdmin)

> ⚠️ **NOTA**: En modo mock no necesitas password, los datos están en memoria.

### Opción 2: Con Supabase (30-60 min)

Para migrar a una base de datos real con autenticación:

**Guía Rápida**: Lee [`QUICKSTART.md`](QUICKSTART.md) (30-60 min)

**Guía Detallada**: Lee [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) (1-2 horas)

**Análisis Completo**: Lee [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md)

---

## 📁 Estructura del Proyecto

```
2.0/
├── src/
│   ├── components/          # Componentes React
│   │   ├── platform/        # Componentes de SuperAdmin
│   │   ├── shared/          # Componentes compartidos
│   │   └── tenant/          # Componentes de tenant
│   ├── contexts/            # Contextos React (Auth, Data)
│   ├── lib/                 # Utilidades y configuración
│   │   └── supabase.ts      # Cliente de Supabase
│   ├── pages/               # Páginas/rutas
│   │   ├── platform/        # Dashboard de SuperAdmin
│   │   └── tenant/          # Dashboard de tenant
│   ├── services/            # Capa de API
│   │   ├── api.ts           # API mock (desarrollo)
│   │   └── supabase-api.ts  # API real (producción)
│   ├── types.ts             # Definiciones de TypeScript
│   ├── App.tsx              # Componente principal
│   └── index.tsx            # Entry point
├── supabase-schema.sql      # Schema completo de PostgreSQL
├── supabase-seed-data.sql   # Datos de ejemplo
├── MIGRATION_GUIDE.md       # Guía detallada de migración
├── QUICKSTART.md            # Guía rápida (30 min)
├── PROJECT_ANALYSIS.md      # Análisis técnico completo
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2** - UI Library
- **TypeScript 5.8** - Type Safety
- **Vite 6.2** - Build Tool
- **React Router 7.9** - Routing
- **Tailwind CSS** - Styling (via CDN)
- **Lucide React** - Icons

### Backend (Supabase)
- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación JWT
- **Row Level Security** - Seguridad multi-tenant
- **Supabase Storage** - Almacenamiento de archivos
- **Real-time** - Subscripciones en tiempo real

### DevOps
- **Vercel/Netlify** - Hosting del frontend
- **GitHub Actions** - CI/CD (opcional)
- **Sentry** - Error tracking (opcional)

---

## 📚 Documentación

### Para Desarrolladores

- **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)**: Análisis técnico completo del proyecto
  - Estado actual vs deseado
  - Arquitectura antes/después
  - Decisiones de diseño
  - Preguntas frecuentes

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**: Guía paso a paso de migración a Supabase
  - Setup de Supabase (con screenshots)
  - Configuración de base de datos
  - Integración del cliente
  - Deploy a producción
  - Troubleshooting detallado

- **[QUICKSTART.md](QUICKSTART.md)**: Guía rápida (30-60 min)
  - Checklist ejecutable
  - Comandos copy-paste
  - Verificación rápida

### Scripts SQL

- **[supabase-schema.sql](supabase-schema.sql)**: Schema completo de PostgreSQL
  - 14 tablas con relaciones
  - Row Level Security policies
  - Triggers y funciones
  - Datos semilla (roles, planes, tenant demo)

- **[supabase-seed-data.sql](supabase-seed-data.sql)**: Datos de demostración
  - 8 documentos de ejemplo
  - 7 KPIs
  - 7 contactos (proveedores y clientes)
  - 2 órdenes de compra
  - Historial de documentos
  - Audit logs

---

## 🎯 Próximos Pasos

### Si es tu primera vez:

1. ✅ **Lee este README** (lo acabas de hacer)
2. 📖 **Lee [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md)** para entender el proyecto
3. 🚀 **Corre la demo local** con `npm run dev`
4. 🔄 **Decide si migrar** a Supabase o seguir con mock

### Si quieres migrar a Supabase:

1. ⚡ **Opción Rápida**: Sigue [`QUICKSTART.md`](QUICKSTART.md) (30-60 min)
2. 📚 **Opción Detallada**: Sigue [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) (1-2 horas)

### Después de migrar:

1. 📦 **Storage**: Implementar upload de PDFs con Supabase Storage
2. 🔄 **Real-time**: Añadir subscripciones para colaboración
3. 📧 **Email**: Configurar envío de notificaciones
4. 🔒 **Security**: Audit completo de policies RLS
5. 📊 **Analytics**: Integrar métricas y monitoreo
6. 🚀 **CI/CD**: Setup de deploy automático

---

## 🆘 Soporte

- 📖 **Documentación**: Lee los archivos `.md` del proyecto
- 💬 **Discord Supabase**: https://discord.supabase.com
- 🐛 **Issues**: Abre un issue en este repo
- 📧 **Email**: Contacta al desarrollador

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 🙏 Agradecimientos

- **Supabase** por la plataforma de backend
- **Vercel** por el hosting
- **Tailwind CSS** por el framework de diseño
- **Lucide** por los iconos

---

<div align="center">

**Desarrollado con ❤️ para la gestión de calidad ISO 9000**

[Ver Demo](http://localhost:3000) · [Documentación](MIGRATION_GUIDE.md) · [Reportar Bug](issues)

</div>
