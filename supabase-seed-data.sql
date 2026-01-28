-- =====================================================
-- DATOS DE DEMOSTRACIÓN COMPLETOS
-- =====================================================
-- Ejecuta este script DESPUÉS de:
-- 1. Ejecutar supabase-schema.sql
-- 2. Crear usuarios en Supabase Auth
-- 3. Insertar usuarios en la tabla users
--
-- Este script crea datos realistas para testing
-- =====================================================

-- =====================================================
-- PASO 1: Obtener UUIDs de usuarios creados
-- =====================================================
-- Primero, ejecuta esto para ver los UUIDs:
-- SELECT id, email FROM auth.users;
-- 
-- Luego reemplaza estos placeholders:
-- <UUID_SUPERADMIN>
-- <UUID_ADMIN>
-- <UUID_EDITOR>
-- <UUID_LECTOR>

-- =====================================================
-- DOCUMENTOS DE EJEMPLO
-- =====================================================

-- Documentos VIGENTES (Proceso Estratégico)
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision, archivo_url)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'MAN-EST-001',
    'Manual de Gestión de Calidad ISO 9001:2015',
    'Estratégico',
    'Manual',
    3,
    'Vigente',
    id,
    '2022-01-15',
    '2025-01-15',
    'https://example.com/docs/man-est-001.pdf'
FROM users WHERE email = 'admin@acme-demo.local';

INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision, archivo_url)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'POL-EST-001',
    'Política de Calidad',
    'Estratégico',
    'Política',
    2,
    'Vigente',
    id,
    '2023-03-20',
    '2025-03-20',
    'https://example.com/docs/pol-est-001.pdf'
FROM users WHERE email = 'admin@acme-demo.local';

-- Documentos VIGENTES (Proceso Misional)
INSERT INTO documents (tenant_id, codigo, nombre, proceso, subproceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'PROC-MIS-001',
    'Procedimiento de Gestión de Ventas',
    'Misional',
    'Comercial',
    'Procedimiento',
    2,
    'Vigente',
    id,
    '2023-05-10',
    '2025-05-10'
FROM users WHERE email = 'editor@acme-demo.local';

INSERT INTO documents (tenant_id, codigo, nombre, proceso, subproceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'FOR-MIS-001',
    'Formato de Cotización',
    'Misional',
    'Comercial',
    'Formato',
    4,
    'Vigente',
    id,
    '2022-08-15',
    '2024-11-20'
FROM users WHERE email = 'editor@acme-demo.local';

-- Documentos EN REVISIÓN
INSERT INTO documents (tenant_id, codigo, nombre, proceso, subproceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'PROC-APO-001',
    'Procedimiento de Gestión de Recursos Humanos',
    'Apoyo',
    'Gestión Humana',
    'Procedimiento',
    1,
    'En Revisión',
    id,
    '2024-10-01',
    '2024-10-15'
FROM users WHERE email = 'editor@acme-demo.local';

-- Documentos BORRADOR
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'FOR-APO-002',
    'Formato de Evaluación de Desempeño',
    'Apoyo',
    'Formato',
    1,
    'Borrador',
    id,
    CURRENT_DATE,
    CURRENT_DATE
FROM users WHERE email = 'editor@acme-demo.local';

-- Documentos APROBADOS
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'ACTA-CON-001',
    'Acta de Revisión por la Dirección - Q1 2024',
    'Control-Calidad',
    'Acta',
    1,
    'Aprobado',
    id,
    '2024-03-30',
    '2024-03-30'
FROM users WHERE email = 'admin@acme-demo.local';

-- Documentos OBSOLETOS
INSERT INTO documents (tenant_id, codigo, nombre, proceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
SELECT 
    '99999999-9999-9999-9999-999999999999',
    'POL-APO-001',
    'Política de RRHH (VERSIÓN ANTIGUA)',
    'Apoyo',
    'Política',
    1,
    'Obsoleto',
    id,
    '2020-06-01',
    '2023-06-01'
FROM users WHERE email = 'admin@acme-demo.local';

-- =====================================================
-- HISTORIAL DE DOCUMENTOS
-- =====================================================

-- Historial para MAN-EST-001
INSERT INTO document_history (document_id, autor, version, cambios)
SELECT 
    d.id,
    'Admin Acme',
    3,
    'Actualización a ISO 9001:2015. Se añadieron secciones de contexto organizacional y gestión de riesgos.'
FROM documents d WHERE d.codigo = 'MAN-EST-001';

INSERT INTO document_history (document_id, autor, version, cambios)
SELECT 
    d.id,
    'Admin Acme',
    2,
    'Revisión anual. Actualización de objetivos de calidad.'
FROM documents d WHERE d.codigo = 'MAN-EST-001';

INSERT INTO document_history (document_id, autor, version, cambios)
SELECT 
    d.id,
    'Admin Acme',
    1,
    'Documento inicial creado.'
FROM documents d WHERE d.codigo = 'MAN-EST-001';

-- Historial para PROC-MIS-001
INSERT INTO document_history (document_id, autor, version, cambios)
SELECT 
    d.id,
    'Editor Acme',
    2,
    'Actualización del proceso de cierre de ventas. Se incorporó validación de crédito.'
FROM documents d WHERE d.codigo = 'PROC-MIS-001';

INSERT INTO document_history (document_id, autor, version, cambios)
SELECT 
    d.id,
    'Editor Acme',
    1,
    'Procedimiento inicial de ventas.'
FROM documents d WHERE d.codigo = 'PROC-MIS-001';

-- =====================================================
-- KPIs POR PROCESO
-- =====================================================

-- KPIs Estratégicos
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

INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Cumplimiento de Objetivos Estratégicos',
    '%',
    90,
    'Anual',
    'Estratégico',
    id
FROM users WHERE email = 'admin@acme-demo.local';

-- KPIs Misionales
INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, subproceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Tasa de Cierre de Ventas',
    '%',
    25,
    'Mensual',
    'Misional',
    'Comercial',
    id
FROM users WHERE email = 'editor@acme-demo.local';

INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, subproceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Tiempo Promedio de Entrega',
    'días',
    15,
    'Mensual',
    'Misional',
    'Producción',
    id
FROM users WHERE email = 'editor@acme-demo.local';

-- KPIs de Apoyo
INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, subproceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Rotación de Personal',
    '%',
    5,
    'Anual',
    'Apoyo',
    'Gestión Humana',
    id
FROM users WHERE email = 'admin@acme-demo.local';

INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, subproceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Tiempo de Respuesta a Solicitudes de Compra',
    'días',
    3,
    'Mensual',
    'Apoyo',
    'Compras',
    id
FROM users WHERE email = 'editor@acme-demo.local';

-- KPIs de Control
INSERT INTO kpis (tenant_id, nombre, unidad, meta, periodicidad, proceso, responsable_id)
SELECT
    '99999999-9999-9999-9999-999999999999',
    'Cumplimiento de Auditorías Internas',
    '%',
    100,
    'Anual',
    'Control-Calidad',
    id
FROM users WHERE email = 'admin@acme-demo.local';

-- =====================================================
-- VINCULACIÓN DOCUMENTOS - KPIs
-- =====================================================

-- Vincular Manual de Calidad con KPI de Satisfacción
INSERT INTO document_kpi_links (document_id, kpi_id)
SELECT d.id, k.id
FROM documents d, kpis k
WHERE d.codigo = 'MAN-EST-001'
AND k.nombre = 'Satisfacción del Cliente';

-- Vincular Procedimiento de Ventas con KPI de Cierre
INSERT INTO document_kpi_links (document_id, kpi_id)
SELECT d.id, k.id
FROM documents d, kpis k
WHERE d.codigo = 'PROC-MIS-001'
AND k.nombre = 'Tasa de Cierre de Ventas';

-- =====================================================
-- CONTACTOS (PROVEEDORES Y CLIENTES)
-- =====================================================

-- Proveedores
INSERT INTO contactos (tenant_id, tipo, rut_nit, razon_social, email) VALUES
    ('99999999-9999-9999-9999-999999999999', 'PROVEEDOR', '800.123.456-1', 'Suministros Industriales S.A.S.', 'ventas@suministros.com'),
    ('99999999-9999-9999-9999-999999999999', 'PROVEEDOR', '900.789.012-3', 'Tecnología y Sistemas Ltda.', 'contacto@tecnologia.co'),
    ('99999999-9999-9999-9999-999999999999', 'PROVEEDOR', '860.234.567-9', 'Papelería El Escritorio', 'pedidos@papeleria.co'),
    ('99999999-9999-9999-9999-999999999999', 'PROVEEDOR', '901.456.789-0', 'Servicios Logísticos Express', 'operaciones@logistica.com');

-- Clientes
INSERT INTO contactos (tenant_id, tipo, rut_nit, razon_social, email) VALUES
    ('99999999-9999-9999-9999-999999999999', 'CLIENTE', '123.456.789-0', 'Constructora El Futuro', 'compras@elfuturo.com'),
    ('99999999-9999-9999-9999-999999999999', 'CLIENTE', '234.567.890-1', 'Industrias Metal S.A.', 'adquisiciones@metal.co'),
    ('99999999-9999-9999-9999-999999999999', 'CLIENTE', '345.678.901-2', 'Comercializadora ABC Ltda.', 'pedidos@abc.com');

-- =====================================================
-- ÓRDENES DE COMPRA DE EJEMPLO
-- =====================================================

-- Orden de Compra 1
DO $$
DECLARE
    v_proveedor_id UUID;
    v_orden_id UUID;
    v_doc_id UUID;
    v_responsable_id UUID;
BEGIN
    -- Obtener IDs necesarios
    SELECT id INTO v_proveedor_id FROM contactos WHERE rut_nit = '800.123.456-1';
    SELECT id INTO v_responsable_id FROM users WHERE email = 'admin@acme-demo.local';
    
    -- Crear documento vinculado
    INSERT INTO documents (tenant_id, codigo, nombre, proceso, subproceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
    VALUES (
        '99999999-9999-9999-9999-999999999999',
        'FOR-APO-OC-0001',
        'Orden de Compra OC-0001 - Suministros Industriales S.A.S.',
        'Apoyo',
        'Compras',
        'Formato',
        1,
        'Vigente',
        v_responsable_id,
        '2024-10-15',
        '2024-10-15'
    )
    RETURNING id INTO v_doc_id;
    
    -- Crear orden de compra
    INSERT INTO ordenes_compra (tenant_id, numero, proveedor_id, fecha, subtotal, impuestos, total, condiciones, centro_costo, documento_id_link)
    VALUES (
        '99999999-9999-9999-9999-999999999999',
        'OC-0001',
        v_proveedor_id,
        '2024-10-15',
        2500000,
        475000,
        2975000,
        'Pago a 30 días. Entrega en bodega principal.',
        'ADM-001',
        v_doc_id
    )
    RETURNING id INTO v_orden_id;
    
    -- Crear items
    INSERT INTO orden_compra_items (orden_compra_id, descripcion, cantidad, precio_unitario) VALUES
        (v_orden_id, 'Tornillos grado 8 M10x40mm', 1000, 500),
        (v_orden_id, 'Tuercas hexagonales M10', 1000, 300),
        (v_orden_id, 'Arandelas planas M10', 2000, 100),
        (v_orden_id, 'Lubricante industrial 5L', 10, 45000);
    
    -- Actualizar documento con vínculo
    UPDATE documents 
    SET form_id = v_orden_id, form_type = 'OrdenCompra'
    WHERE id = v_doc_id;
END $$;

-- Orden de Compra 2
DO $$
DECLARE
    v_proveedor_id UUID;
    v_orden_id UUID;
    v_doc_id UUID;
    v_responsable_id UUID;
BEGIN
    SELECT id INTO v_proveedor_id FROM contactos WHERE rut_nit = '860.234.567-9';
    SELECT id INTO v_responsable_id FROM users WHERE email = 'editor@acme-demo.local';
    
    INSERT INTO documents (tenant_id, codigo, nombre, proceso, subproceso, tipo, version, estado, responsable_id, fecha_emision, fecha_revision)
    VALUES (
        '99999999-9999-9999-9999-999999999999',
        'FOR-APO-OC-0002',
        'Orden de Compra OC-0002 - Papelería El Escritorio',
        'Apoyo',
        'Compras',
        'Formato',
        1,
        'Vigente',
        v_responsable_id,
        '2024-10-20',
        '2024-10-20'
    )
    RETURNING id INTO v_doc_id;
    
    INSERT INTO ordenes_compra (tenant_id, numero, proveedor_id, fecha, subtotal, impuestos, total, condiciones, centro_costo, documento_id_link)
    VALUES (
        '99999999-9999-9999-9999-999999999999',
        'OC-0002',
        v_proveedor_id,
        '2024-10-20',
        450000,
        85500,
        535500,
        'Pago de contado. Envío incluido.',
        'ADM-002',
        v_doc_id
    )
    RETURNING id INTO v_orden_id;
    
    INSERT INTO orden_compra_items (orden_compra_id, descripcion, cantidad, precio_unitario) VALUES
        (v_orden_id, 'Resmas de papel carta 75g', 20, 15000),
        (v_orden_id, 'Bolígrafos azules caja x50', 5, 25000),
        (v_orden_id, 'Carpetas oficio caja x100', 3, 35000),
        (v_orden_id, 'Grapadora industrial', 2, 45000);
    
    UPDATE documents 
    SET form_id = v_orden_id, form_type = 'OrdenCompra'
    WHERE id = v_doc_id;
END $$;

-- =====================================================
-- TENANT ADICIONAL (GLOBEX)
-- =====================================================

-- Insertar segundo tenant
INSERT INTO tenants (id, nombre, subdominio, plan_id, estado, fecha_creacion, user_count, storage_used) VALUES
    ('88888888-8888-8888-8888-888888888888', 'Globex Corporation', 'globex', '33333333-3333-3333-3333-333333333333', 'Activo', '2023-08-15', 1, 5.2);

-- NOTA: Para crear el admin de Globex, necesitarías:
-- 1. Crear usuario en Supabase Auth
-- 2. Insertar en tabla users con tenant_id del nuevo tenant

-- =====================================================
-- AUDIT LOGS DE EJEMPLO
-- =====================================================

INSERT INTO audit_logs (actor, action, resource, metadata) VALUES
    ('superadmin@platform.local', 'TENANT_CREATE', 'tenant:99999999-9999-9999-9999-999999999999', '{"tenant_name": "Acme Corp"}'::jsonb),
    ('admin@acme-demo.local', 'UPLOAD_DOCUMENT', 'doc:MAN-EST-001', '{"document_name": "Manual de Calidad"}'::jsonb),
    ('admin@acme-demo.local', 'PUBLISH_DOCUMENT', 'doc:MAN-EST-001', '{"status": "Vigente"}'::jsonb),
    ('superadmin@platform.local', 'PLAN_CREATE', 'plan:plan-enterprise', '{"plan_name": "Enterprise"}'::jsonb);

-- =====================================================
-- CONFIGURACIÓN DE PLATAFORMA
-- =====================================================

-- Configuración SMTP
INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('smtp', '{"host": "smtp.gmail.com", "port": "587", "user": "noreply@acme.com", "pass": "encrypted_password"}'::jsonb);

-- Configuración Stripe
INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('stripe', '{"publicKey": "pk_test_12345", "secretKey": "sk_test_encrypted"}'::jsonb);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ejecuta estas queries para verificar que todo se creó correctamente:

-- SELECT 'Documentos creados' as verificacion, COUNT(*) as total FROM documents;
-- SELECT 'KPIs creados' as verificacion, COUNT(*) as total FROM kpis;
-- SELECT 'Contactos creados' as verificacion, COUNT(*) as total FROM contactos;
-- SELECT 'Órdenes de compra' as verificacion, COUNT(*) as total FROM ordenes_compra;
-- SELECT 'Items de OC' as verificacion, COUNT(*) as total FROM orden_compra_items;
-- SELECT 'Historial docs' as verificacion, COUNT(*) as total FROM document_history;
-- SELECT 'Vínculos doc-kpi' as verificacion, COUNT(*) as total FROM document_kpi_links;
-- SELECT 'Audit logs' as verificacion, COUNT(*) as total FROM audit_logs;

-- Ver resumen por estado de documentos:
-- SELECT estado, COUNT(*) FROM documents GROUP BY estado;

-- Ver documentos por proceso:
-- SELECT proceso, COUNT(*) FROM documents GROUP BY proceso;

-- =====================================================
-- ¡LISTO!
-- =====================================================
-- Ahora tienes una base de datos completa con datos realistas
-- para testear todas las funcionalidades de tu ERP ISO 9000
