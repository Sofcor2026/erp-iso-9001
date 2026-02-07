-- =====================================================
-- SCHEMA SQL COMPLETO PARA ERP ISO 9000 EN SUPABASE
-- =====================================================
-- Este schema refleja toda la estructura de tipos definida en types.ts
-- y soporta el modelo multi-tenant del sistema

-- Extension para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS DE PLATAFORMA (Multi-tenant)
-- =====================================================

-- Tabla de Planes de suscripción
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    user_limit INTEGER NOT NULL,
    storage_limit INTEGER NOT NULL, -- en GB
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tenants (Organizaciones)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    subdominio VARCHAR(100) NOT NULL UNIQUE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Activo', 'Suspendido', 'Prueba')),
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    user_count INTEGER DEFAULT 0,
    storage_used DECIMAL(10, 2) DEFAULT 0, -- en GB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] NOT NULL DEFAULT '{}', -- Array de permisos
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Usuarios (conectada con Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE DOCUMENTOS Y PROCESOS
-- =====================================================

-- Tabla de Documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    proceso VARCHAR(50) NOT NULL CHECK (proceso IN ('Estratégico', 'Misional', 'Apoyo', 'Control-Calidad')),
    subproceso VARCHAR(100),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Manual', 'Procedimiento', 'Formato', 'Política', 'Acta')),
    version INTEGER NOT NULL DEFAULT 1,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Borrador', 'En Revisión', 'Aprobado', 'Vigente', 'Obsoleto')),
    responsable_id UUID REFERENCES users(id) ON DELETE SET NULL,
    fecha_emision DATE NOT NULL,
    fecha_revision DATE NOT NULL,
    archivo_url TEXT,
    form_id UUID, -- Referencia al formulario vinculado (Orden de Compra, etc.)
    form_type VARCHAR(50), -- 'Cotizacion', 'OrdenCompra', 'Dotacion'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, codigo)
);

-- Índices para mejorar performance
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_estado ON documents(estado);
CREATE INDEX idx_documents_proceso ON documents(proceso);
CREATE INDEX idx_documents_responsable ON documents(responsable_id);

-- Tabla de Historial de Documentos
CREATE TABLE document_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    autor VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    cambios TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_history_document ON document_history(document_id);

-- =====================================================
-- TABLAS DE KPIs
-- =====================================================

CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    meta DECIMAL(10, 2) NOT NULL,
    periodicidad VARCHAR(50) NOT NULL CHECK (periodicidad IN ('Diario', 'Semanal', 'Mensual', 'Anual')),
    proceso VARCHAR(50) NOT NULL CHECK (proceso IN ('Estratégico', 'Misional', 'Apoyo', 'Control-Calidad')),
    subproceso VARCHAR(100),
    responsable_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kpis_tenant ON kpis(tenant_id);
CREATE INDEX idx_kpis_responsable ON kpis(responsable_id);

-- Tabla de vinculación entre Documentos y KPIs (relación muchos a muchos)
CREATE TABLE document_kpi_links (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (document_id, kpi_id)
);

-- =====================================================
-- TABLAS DE CONTACTOS Y FORMULARIOS
-- =====================================================

-- Tabla de Contactos (Clientes y Proveedores)
CREATE TABLE contactos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CLIENTE', 'PROVEEDOR')),
    rut_nit VARCHAR(50) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, rut_nit)
);

CREATE INDEX idx_contactos_tenant ON contactos(tenant_id);
CREATE INDEX idx_contactos_tipo ON contactos(tipo);

-- Tabla de Órdenes de Compra
CREATE TABLE ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    proveedor_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    impuestos DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    condiciones TEXT,
    centro_costo VARCHAR(100),
    documento_id_link UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, numero)
);

CREATE INDEX idx_ordenes_tenant ON ordenes_compra(tenant_id);
CREATE INDEX idx_ordenes_proveedor ON ordenes_compra(proveedor_id);

-- Tabla de Items de Orden de Compra
CREATE TABLE orden_compra_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orden_items_orden ON orden_compra_items(orden_compra_id);

-- =====================================================
-- TABLAS DE PLANTILLAS Y AUDITORÍA (PLATAFORMA)
-- =====================================================

-- Tabla de Templates/Plantillas
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('COTIZACION', 'ORDEN_COMPRA', 'DOTACION')),
    version INTEGER NOT NULL DEFAULT 1,
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Logs de Auditoría (solo para SuperAdmin)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);

-- Tabla de Configuración de Plataforma
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DATOS INICIALES (SEED DATA)
-- =====================================================

-- Insertar Planes por defecto
INSERT INTO plans (id, nombre, precio, user_limit, storage_limit, descripcion) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Básico', 49900, 5, 1, 'Ideal para equipos pequeños que empiezan.'),
    ('22222222-2222-2222-2222-222222222222', 'Pro', 149900, 20, 10, 'Funcionalidades avanzadas para empresas en crecimiento.'),
    ('33333333-3333-3333-3333-333333333333', 'Enterprise', 499900, 100, 100, 'Soluciones a medida para grandes corporaciones.');

-- Insertar Roles por defecto
INSERT INTO roles (id, name, description, permissions, is_default) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUPERADMIN', 'Acceso total a la plataforma y todos los tenants.', 
     ARRAY['platform:access', 'platform:manage_tenants', 'platform:manage_plans', 'platform:manage_roles', 'platform:view_audit_log', 'tenant:admin', 'tenant:view_master_list', 'tenant:manage_users', 'document:create', 'document:update', 'document:publish', 'document:submit', 'document:download', 'document:view_all', 'document:view_published', 'kpi:manage', 'kpi:read', 'form:create'], 
     true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ADMIN', 'Administrador del tenant, gestiona usuarios y documentos.',
     ARRAY['tenant:admin', 'tenant:view_master_list', 'tenant:manage_users', 'document:create', 'document:update', 'document:publish', 'document:submit', 'document:download', 'document:view_all', 'kpi:manage', 'kpi:read', 'form:create'],
     true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'EDITOR', 'Puede crear y gestionar sus propios documentos.',
     ARRAY['document:create', 'document:submit', 'document:download', 'document:view_all', 'kpi:read', 'form:create'],
     true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'LECTOR', 'Solo puede ver y descargar documentos publicados.',
     ARRAY['document:download', 'document:view_published', 'kpi:read'],
     true);

-- Insertar Tenant de demostración
INSERT INTO tenants (id, nombre, subdominio, plan_id, estado, fecha_creacion, user_count, storage_used) VALUES
    ('99999999-9999-9999-9999-999999999999', 'Acme Corp', 'acme-demo', '22222222-2222-2222-2222-222222222222', 'Activo', '2023-05-20', 3, 1.2);

-- Insertar Templates por defecto
INSERT INTO templates (id, nombre, tipo, version, last_updated, file_url) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Plantilla de Cotización Estándar', 'COTIZACION', 2, '2024-05-10', '#'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Orden de Compra General', 'ORDEN_COMPRA', 1, '2024-03-22', '#');

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra_items ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver datos de su tenant
CREATE POLICY "Users can view their tenant data" ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' -- SUPERADMIN
        )
    );

-- Policy: Los usuarios pueden ver su propia información
CREATE POLICY "Users can view themselves" ON users
    FOR SELECT
    USING (
        id = auth.uid()
        OR
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND ('platform:access' = ANY(r.permissions) OR 'tenant:manage_users' = ANY(r.permissions))
        )
    );

-- Policy: Documentos solo visibles para usuarios del mismo tenant
CREATE POLICY "Users can view tenant documents" ON documents
    FOR SELECT
    USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Policy: Solo usuarios con permisos pueden crear documentos
CREATE POLICY "Users with permission can create documents" ON documents
    FOR INSERT
    WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND 'document:create' = ANY(r.permissions)
        )
    );

-- Policy: Solo usuarios con permisos pueden actualizar documentos
CREATE POLICY "Users with permission can update documents" ON documents
    FOR UPDATE
    USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND ('document:update' = ANY(r.permissions) OR 'document:publish' = ANY(r.permissions))
        )
    );

-- Policy similar para KPIs
CREATE POLICY "Users can view tenant kpis" ON kpis
    FOR SELECT
    USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Policy para contactos
CREATE POLICY "Users can view tenant contacts" ON contactos
    FOR SELECT
    USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- Policy para órdenes de compra
CREATE POLICY "Users can view tenant orders" ON ordenes_compra
    FOR SELECT
    USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    );

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar automáticamente el contador de usuarios en tenant
CREATE OR REPLACE FUNCTION update_tenant_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants 
        SET user_count = user_count + 1 
        WHERE id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants 
        SET user_count = user_count - 1 
        WHERE id = OLD.tenant_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_user_count_trigger
AFTER INSERT OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION update_tenant_user_count();

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE tenants IS 'Organizaciones/clientes del sistema multi-tenant';
COMMENT ON TABLE users IS 'Usuarios del sistema, vinculados con Supabase Auth';
COMMENT ON TABLE documents IS 'Documentos ISO 9000 gestionados por proceso';
COMMENT ON TABLE kpis IS 'Indicadores clave de desempeño por proceso';
COMMENT ON TABLE ordenes_compra IS 'Órdenes de compra generadas desde formularios';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría para acciones de SuperAdmin';
