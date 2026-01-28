import {
    User, Role, Document, KPI, DocumentStatus, ProcessType, DocumentType,
    Contacto, OrdenCompra, Tenant, Plan, Template, TemplateType, AuditLog,
    DocumentoHistorial, Permission
} from '../types';
import { supabase } from '../src/lib/supabase';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const simulateDelay = <T,>(data: T): Promise<T> =>
    new Promise(resolve => setTimeout(() => resolve(data), 300));

// =====================================================
// AUTHENTICATION & AUDIT
// =====================================================

export const api = {
    // Login ahora se maneja completamente en AuthContext con Supabase Auth
    login: async (email: string, password: string): Promise<User | undefined> => {
        throw new Error('Use AuthContext.login() instead');
    },

    logAuditEvent: async (action: string, resource: string, actor: User): Promise<void> => {
        try {
            await supabase.from('audit_logs').insert({
                actor: actor.email,
                action,
                resource,
                metadata: { user_id: actor.id, tenant_id: actor.tenantId }
            });
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    },

    // =====================================================
    // DOCUMENTS
    // =====================================================

    getDocuments: async (permissions: Permission[]): Promise<Document[]> => {
        try {
            let query = supabase
                .from('documents')
                .select(`
          *,
          responsable:users!responsable_id (
            nombre
          )
        `);

            // Filtrar por estado según permisos
            if (!permissions.includes('document:view_all')) {
                query = query.eq('estado', DocumentStatus.VIGENTE);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Transformar datos de Supabase al formato de la app
            const documents: Document[] = data.map(doc => ({
                id: doc.id,
                codigo: doc.codigo,
                nombre: doc.nombre,
                proceso: doc.proceso as ProcessType,
                subproceso: doc.subproceso,
                tipo: doc.tipo as DocumentType,
                version: doc.version,
                estado: doc.estado as DocumentStatus,
                responsableId: doc.responsable_id,
                responsableNombre: (Array.isArray(doc.responsable) ? doc.responsable[0] : doc.responsable)?.nombre || 'Unknown',
                fechaEmision: doc.fecha_emision,
                fechaRevision: doc.fecha_revision,
                archivoUrl: doc.archivo_url || '#',
                vinculos: doc.form_id ? {
                    formId: doc.form_id,
                    formType: doc.form_type as 'Cotizacion' | 'OrdenCompra' | 'Dotacion'
                } : undefined,
            }));

            // Cargar historial para cada documento
            for (const doc of documents) {
                const { data: historyData } = await supabase
                    .from('document_history')
                    .select('*')
                    .eq('document_id', doc.id)
                    .order('fecha', { ascending: false });

                if (historyData) {
                    doc.historial = historyData.map(h => ({
                        id: h.id,
                        fecha: h.fecha,
                        autor: h.autor,
                        version: h.version,
                        cambios: h.cambios
                    }));
                }
            }

            return documents;
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    },

    updateDocumentStatus: async (docId: string, status: DocumentStatus, actor: User): Promise<Document> => {
        try {
            // Actualizar estado
            const { data, error } = await supabase
                .from('documents')
                .update({ estado: status, updated_at: new Date().toISOString() })
                .eq('id', docId)
                .select(`
          *,
          responsable:users!responsable_id (nombre)
        `)
                .single();

            if (error) throw error;

            // Agregar entrada al historial
            await supabase.from('document_history').insert({
                document_id: docId,
                autor: actor.nombre,
                version: data.version,
                cambios: `Estado cambiado a "${status}".`
            });

            // Log audit event
            if (actor.role.name === 'ADMIN' && status === DocumentStatus.VIGENTE) {
                await api.logAuditEvent('PUBLISH_DOCUMENT', `doc:${docId} (${data.codigo})`, actor);
            }

            return {
                id: data.id,
                codigo: data.codigo,
                nombre: data.nombre,
                proceso: data.proceso as ProcessType,
                subproceso: data.subproceso,
                tipo: data.tipo as DocumentType,
                version: data.version,
                estado: data.estado as DocumentStatus,
                responsableId: data.responsable_id,
                responsableNombre: data.responsable?.nombre || 'Unknown',
                fechaEmision: data.fecha_emision,
                fechaRevision: data.fecha_revision,
                archivoUrl: data.archivo_url || '#',
            };
        } catch (error) {
            console.error('Error updating document status:', error);
            throw new Error('No se pudo actualizar el estado del documento');
        }
    },

    addDocument: async (
        newDocData: Omit<Document, 'id' | 'version' | 'estado' | 'fechaEmision' | 'fechaRevision' | 'archivoUrl' | 'responsableNombre'>,
        creator: User
    ): Promise<Document> => {
        try {
            if (!creator.tenantId) {
                throw new Error('User must belong to a tenant');
            }

            // Buscar datos del responsable
            const { data: responsable, error: respError } = await supabase
                .from('users')
                .select('nombre')
                .eq('id', newDocData.responsableId)
                .single();

            if (respError) throw respError;

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('documents')
                .insert({
                    tenant_id: creator.tenantId,
                    codigo: newDocData.codigo,
                    nombre: newDocData.nombre,
                    proceso: newDocData.proceso,
                    subproceso: newDocData.subproceso,
                    tipo: newDocData.tipo,
                    version: 1,
                    estado: DocumentStatus.BORRADOR,
                    responsable_id: newDocData.responsableId,
                    fecha_emision: today,
                    fecha_revision: today,
                    archivo_url: '#',
                })
                .select()
                .single();

            if (error) throw error;

            // Crear entrada en historial
            await supabase.from('document_history').insert({
                document_id: data.id,
                autor: responsable.nombre,
                version: 1,
                cambios: 'Documento Creado.'
            });

            // Log audit event
            await api.logAuditEvent('UPLOAD_DOCUMENT', `doc:${data.id} (${data.codigo})`, creator);

            return {
                id: data.id,
                codigo: data.codigo,
                nombre: data.nombre,
                proceso: data.proceso as ProcessType,
                subproceso: data.subproceso,
                tipo: data.tipo as DocumentType,
                version: data.version,
                estado: data.estado as DocumentStatus,
                responsableId: data.responsable_id,
                responsableNombre: responsable.nombre,
                fechaEmision: data.fecha_emision,
                fechaRevision: data.fecha_revision,
                archivoUrl: data.archivo_url || '#',
            };
        } catch (error) {
            console.error('Error adding document:', error);
            throw new Error('No se pudo crear el documento');
        }
    },

    updateDocument: async (
        docId: string,
        updateData: Partial<Omit<Document, 'id'>>,
        actor: User
    ): Promise<Document> => {
        try {
            const updates: any = {};

            if (updateData.codigo) updates.codigo = updateData.codigo;
            if (updateData.nombre) updates.nombre = updateData.nombre;
            if (updateData.proceso) updates.proceso = updateData.proceso;
            if (updateData.subproceso) updates.subproceso = updateData.subproceso;
            if (updateData.tipo) updates.tipo = updateData.tipo;
            if (updateData.responsableId) updates.responsable_id = updateData.responsableId;
            if (!updateData.fechaRevision) {
                updates.fecha_revision = new Date().toISOString().split('T')[0];
            }

            const { data, error } = await supabase
                .from('documents')
                .update(updates)
                .eq('id', docId)
                .select(`
          *,
          responsable:users!responsable_id (nombre)
        `)
                .single();

            if (error) throw error;

            // Agregar al historial
            await supabase.from('document_history').insert({
                document_id: docId,
                autor: actor.nombre,
                version: data.version,
                cambios: 'Propiedades del documento actualizadas.'
            });

            return {
                id: data.id,
                codigo: data.codigo,
                nombre: data.nombre,
                proceso: data.proceso as ProcessType,
                subproceso: data.subproceso,
                tipo: data.tipo as DocumentType,
                version: data.version,
                estado: data.estado as DocumentStatus,
                responsableId: data.responsable_id,
                responsableNombre: data.responsable?.nombre || 'Unknown',
                fechaEmision: data.fecha_emision,
                fechaRevision: data.fecha_revision,
                archivoUrl: data.archivo_url || '#',
            };
        } catch (error) {
            console.error('Error updating document:', error);
            throw new Error('No se pudo actualizar el documento');
        }
    },

    // =====================================================
    // KPIs
    // =====================================================

    getKPIs: async (): Promise<KPI[]> => {
        try {
            const { data, error } = await supabase
                .from('kpis')
                .select(`
          *,
          responsable:users!responsable_id (nombre)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(kpi => ({
                id: kpi.id,
                nombre: kpi.nombre,
                unidad: kpi.unidad,
                meta: parseFloat(kpi.meta),
                periodicidad: kpi.periodicidad as 'Diario' | 'Semanal' | 'Mensual' | 'Anual',
                proceso: kpi.proceso as ProcessType,
                subproceso: kpi.subproceso,
                responsableId: kpi.responsable_id,
                responsableNombre: (Array.isArray(kpi.responsable) ? kpi.responsable[0] : kpi.responsable)?.nombre || 'Unknown',
            }));
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            return [];
        }
    },

    // =====================================================
    // USERS
    // =====================================================

    getUsers: async (): Promise<User[]> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          role:roles (
            id,
            name,
            description,
            permissions,
            is_default
          )
        `);

            if (error) throw error;

            return data.map(u => ({
                id: u.id,
                email: u.email,
                nombre: u.nombre,
                role: {
                    id: u.role.id,
                    name: u.role.name,
                    description: u.role.description,
                    permissions: u.role.permissions as Permission[],
                    isDefault: u.role.is_default,
                },
                tenantId: u.tenant_id,
                activo: u.activo,
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },

    // =====================================================
    // CONTACTOS Y PROVEEDORES
    // =====================================================

    getProveedores: async (): Promise<Contacto[]> => {
        try {
            const { data, error } = await supabase
                .from('contactos')
                .select('*')
                .eq('tipo', 'PROVEEDOR');

            if (error) throw error;

            return data.map(c => ({
                id: c.id,
                tipo: c.tipo as 'CLIENTE' | 'PROVEEDOR',
                rut_nit: c.rut_nit,
                razonSocial: c.razon_social,
                email: c.email,
            }));
        } catch (error) {
            console.error('Error fetching proveedores:', error);
            return [];
        }
    },

    // =====================================================
    // ÓRDENES DE COMPRA
    // =====================================================

    createOrdenCompra: async (
        ordenData: Omit<OrdenCompra, 'id' | 'numero' | 'documentoId_link'>,
        creator: User
    ): Promise<OrdenCompra> => {
        try {
            if (!creator.tenantId) throw new Error('User must belong to a tenant');

            const today = new Date().toISOString().split('T')[0];

            // Obtener el siguiente número de OC
            const { count } = await supabase
                .from('ordenes_compra')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', creator.tenantId);

            const newNumero = `OC-${String((count || 0) + 1).padStart(4, '0')}`;

            // Obtener proveedor
            const { data: proveedor } = await supabase
                .from('contactos')
                .select('razon_social')
                .eq('id', ordenData.proveedorId)
                .single();

            // Crear documento vinculado
            const newDocument = await api.addDocument({
                nombre: `Orden de Compra ${newNumero} - ${proveedor?.razon_social || ''}`,
                codigo: `FOR-APO-${newNumero}`,
                tipo: DocumentType.FORMATO,
                proceso: ProcessType.APOYO,
                subproceso: 'Compras',
                responsableId: creator.id,
            }, creator);

            // Crear orden de compra
            const { data: ordenCompra, error: ordenError } = await supabase
                .from('ordenes_compra')
                .insert({
                    tenant_id: creator.tenantId,
                    numero: newNumero,
                    proveedor_id: ordenData.proveedorId,
                    fecha: ordenData.fecha,
                    subtotal: ordenData.subtotal,
                    impuestos: ordenData.impuestos,
                    total: ordenData.total,
                    condiciones: ordenData.condiciones,
                    centro_costo: ordenData.centroCosto,
                    documento_id_link: newDocument.id,
                })
                .select()
                .single();

            if (ordenError) throw ordenError;

            // Crear items
            const itemsToInsert = ordenData.items.map(item => ({
                orden_compra_id: ordenCompra.id,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
            }));

            await supabase.from('orden_compra_items').insert(itemsToInsert);

            // Actualizar documento con vínculo
            await supabase
                .from('documents')
                .update({
                    form_id: ordenCompra.id,
                    form_type: 'OrdenCompra'
                })
                .eq('id', newDocument.id);

            return {
                id: ordenCompra.id,
                numero: ordenCompra.numero,
                proveedorId: ordenCompra.proveedor_id,
                fecha: ordenCompra.fecha,
                items: ordenData.items,
                subtotal: parseFloat(ordenCompra.subtotal),
                impuestos: parseFloat(ordenCompra.impuestos),
                total: parseFloat(ordenCompra.total),
                condiciones: ordenCompra.condiciones,
                centroCosto: ordenCompra.centro_costo,
                documentoId_link: ordenCompra.documento_id_link,
            };
        } catch (error) {
            console.error('Error creating orden de compra:', error);
            throw new Error('No se pudo crear la orden de compra');
        }
    },

    // =====================================================
    // TENANTS (PLATFORM ADMIN)
    // =====================================================

    getTenants: async (): Promise<Tenant[]> => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `)
                .order('fecha_creacion', { ascending: false });

            if (error) throw error;

            return data.map(t => ({
                id: t.id,
                nombre: t.nombre,
                subdominio: t.subdominio,
                planId: t.plan_id,
                planNombre: (Array.isArray(t.plan) ? t.plan[0] : t.plan)?.nombre || 'Unknown',
                estado: t.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: t.fecha_creacion,
                userCount: t.user_count,
                storageUsed: parseFloat(t.storage_used),
                userLimit: (Array.isArray(t.plan) ? t.plan[0] : t.plan)?.user_limit || 0,
                storageLimit: (Array.isArray(t.plan) ? t.plan[0] : t.plan)?.storage_limit || 0,
            }));
        } catch (error) {
            console.error('Error fetching tenants:', error);
            return [];
        }
    },

    isSubdomainTaken: async (subdomain: string): Promise<boolean> => {
        try {
            const { count, error } = await supabase
                .from('tenants')
                .select('*', { count: 'exact', head: true })
                .eq('subdominio', subdomain);

            if (error) throw error;
            return (count || 0) > 0;
        } catch (error) {
            console.error('Error checking subdomain:', error);
            return false;
        }
    },

    createTenant: async (
        tenantData: Omit<Tenant, 'id' | 'fechaCreacion' | 'userCount' | 'storageUsed' | 'estado' | 'userLimit' | 'storageLimit' | 'planNombre'>,
        adminData: Omit<User, 'id' | 'role' | 'tenantId' | 'activo'>,
        actor: User
    ): Promise<Tenant> => {
        try {
            // Crear tenant
            const { data: newTenant, error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    nombre: tenantData.nombre,
                    subdominio: tenantData.subdominio,
                    plan_id: tenantData.planId,
                    estado: 'Activo',
                    user_count: 0,
                    storage_used: 0,
                })
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `)
                .single();

            if (tenantError) throw tenantError;

            // Crear usuario admin en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: adminData.email,
                email_confirm: true,
                user_metadata: {
                    nombre: adminData.nombre
                }
            });

            if (authError) throw authError;

            // Obtener rol de ADMIN
            const { data: adminRole } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'ADMIN')
                .single();

            if (!adminRole) throw new Error('Admin role not found');

            // Crear usuario en tabla users
            await supabase.from('users').insert({
                id: authData.user.id,
                email: adminData.email,
                nombre: adminData.nombre,
                role_id: adminRole.id,
                tenant_id: newTenant.id,
                activo: true,
            });

            // Log audit event
            await api.logAuditEvent('TENANT_CREATE', `tenant:${newTenant.id} (${newTenant.nombre})`, actor);

            return {
                id: newTenant.id,
                nombre: newTenant.nombre,
                subdominio: newTenant.subdominio,
                planId: newTenant.plan_id,
                planNombre: (Array.isArray(newTenant.plan) ? newTenant.plan[0] : newTenant.plan)?.nombre || 'Unknown',
                estado: newTenant.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: newTenant.fecha_creacion,
                userCount: newTenant.user_count,
                storageUsed: parseFloat(newTenant.storage_used),
                userLimit: newTenant.plan?.user_limit || 0,
                storageLimit: newTenant.plan?.storage_limit || 0,
            };
        } catch (error) {
            console.error('Error creating tenant:', error);
            throw new Error('No se pudo crear el tenant');
        }
    },

    updateTenant: async (
        tenantId: string,
        data: Partial<Pick<Tenant, 'nombre' | 'userLimit' | 'storageLimit'> & { planId: string }>
    ): Promise<Tenant> => {
        try {
            const updates: any = {};
            if (data.nombre) updates.nombre = data.nombre;
            if (data.planId) updates.plan_id = data.planId;

            const { data: updatedTenant, error } = await supabase
                .from('tenants')
                .update(updates)
                .eq('id', tenantId)
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `)
                .single();

            if (error) throw error;

            return {
                id: updatedTenant.id,
                nombre: updatedTenant.nombre,
                subdominio: updatedTenant.subdominio,
                planId: updatedTenant.plan_id,
                planNombre: updatedTenant.plan?.nombre || 'Unknown',
                estado: updatedTenant.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: updatedTenant.fecha_creacion,
                userCount: updatedTenant.user_count,
                storageUsed: parseFloat(updatedTenant.storage_used),
                userLimit: updatedTenant.plan?.user_limit || 0,
                storageLimit: updatedTenant.plan?.storage_limit || 0,
            };
        } catch (error) {
            console.error('Error updating tenant:', error);
            throw new Error('No se pudo actualizar el tenant');
        }
    },

    updateTenantStatus: async (tenantId: string, estado: Tenant['estado']): Promise<Tenant> => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .update({ estado })
                .eq('id', tenantId)
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `)
                .single();

            if (error) throw error;

            return {
                id: data.id,
                nombre: data.nombre,
                subdominio: data.subdominio,
                planId: data.plan_id,
                planNombre: data.plan?.nombre || 'Unknown',
                estado: data.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: data.fecha_creacion,
                userCount: data.user_count,
                storageUsed: parseFloat(data.storage_used),
                userLimit: data.plan?.user_limit || 0,
                storageLimit: data.plan?.storage_limit || 0,
            };
        } catch (error) {
            console.error('Error updating tenant status:', error);
            throw new Error('No se pudo actualizar el estado del tenant');
        }
    },

    deleteTenant: async (tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('tenants')
                .delete()
                .eq('id', tenantId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting tenant:', error);
            throw new Error('No se pudo eliminar el tenant');
        }
    },

    getTenantAdmin: async (tenantId: string): Promise<User | undefined> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          role:roles (
            id,
            name,
            description,
            permissions,
            is_default
          )
        `)
                .eq('tenant_id', tenantId)
                .eq('role.name', 'ADMIN')
                .single();

            if (error || !data) return undefined;

            return {
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                role: {
                    id: data.role.id,
                    name: data.role.name,
                    description: data.role.description,
                    permissions: data.role.permissions as Permission[],
                    isDefault: data.role.is_default,
                },
                tenantId: data.tenant_id,
                activo: data.activo,
            };
        } catch (error) {
            console.error('Error fetching tenant admin:', error);
            return undefined;
        }
    },

    // =====================================================
    // PLATFORM SETTINGS
    // =====================================================

    getPlatformSettings: async (): Promise<any> => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*');

            if (error) throw error;

            // Transformar array de settings a objeto
            const settings: any = {};
            data?.forEach(setting => {
                settings[setting.setting_key] = setting.setting_value;
            });

            // Ocultar passwords
            if (settings.smtp?.pass) settings.smtp.pass = '********';
            if (settings.stripe?.secretKey) settings.stripe.secretKey = '********';

            return settings;
        } catch (error) {
            console.error('Error fetching platform settings:', error);
            return {};
        }
    },

    updateSmtpSettings: async (smtpData: any): Promise<void> => {
        try {
            await supabase
                .from('platform_settings')
                .upsert({
                    setting_key: 'smtp',
                    setting_value: smtpData
                });
        } catch (error) {
            console.error('Error updating SMTP settings:', error);
            throw new Error('No se pudo actualizar la configuración SMTP');
        }
    },

    updateStripeSettings: async (stripeData: any): Promise<void> => {
        try {
            await supabase
                .from('platform_settings')
                .upsert({
                    setting_key: 'stripe',
                    setting_value: stripeData
                });
        } catch (error) {
            console.error('Error updating Stripe settings:', error);
            throw new Error('No se pudo actualizar la configuración de Stripe');
        }
    },

    // =====================================================
    // ROLES
    // =====================================================

    getRoles: async (): Promise<Role[]> => {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*');

            if (error) throw error;

            return data.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                permissions: r.permissions as Permission[],
                isDefault: r.is_default,
            }));
        } catch (error) {
            console.error('Error fetching roles:', error);
            return [];
        }
    },

    getAllPermissions: async (): Promise<Permission[]> => {
        // Retornar todas las opciones posibles de permisos
        return [
            'platform:access', 'platform:manage_tenants', 'platform:manage_plans', 'platform:manage_roles', 'platform:view_audit_log',
            'tenant:admin', 'tenant:view_master_list', 'tenant:manage_users',
            'document:create', 'document:update', 'document:publish', 'document:submit', 'document:download', 'document:view_all', 'document:view_published',
            'kpi:manage', 'kpi:read',
            'form:create'
        ];
    },

    createRole: async (roleData: Omit<Role, 'id' | 'isDefault'>, actor: User): Promise<Role> => {
        try {
            const { data, error } = await supabase
                .from('roles')
                .insert({
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions,
                    is_default: false,
                })
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('ROLE_CREATE', `role:${data.id} (${data.name})`, actor);

            return {
                id: data.id,
                name: data.name,
                description: data.description,
                permissions: data.permissions as Permission[],
                isDefault: data.is_default,
            };
        } catch (error) {
            console.error('Error creating role:', error);
            throw new Error('No se pudo crear el rol');
        }
    },

    updateRole: async (roleId: string, roleData: Omit<Role, 'id' | 'isDefault'>, actor: User): Promise<Role> => {
        try {
            const { data, error } = await supabase
                .from('roles')
                .update({
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions,
                })
                .eq('id', roleId)
                .eq('is_default', false) // Solo se pueden editar roles personalizados
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('ROLE_UPDATE', `role:${roleId} (${data.name})`, actor);

            return {
                id: data.id,
                name: data.name,
                description: data.description,
                permissions: data.permissions as Permission[],
                isDefault: data.is_default,
            };
        } catch (error) {
            console.error('Error updating role:', error);
            throw new Error('No se puede editar un rol por defecto');
        }
    },

    deleteRole: async (roleId: string, actor: User): Promise<void> => {
        try {
            // Verificar que no esté en uso
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', roleId);

            if ((count || 0) > 0) {
                throw new Error('No se puede eliminar el rol, está asignado a usuarios');
            }

            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', roleId)
                .eq('is_default', false); // Solo se pueden eliminar roles personalizados

            if (error) throw error;

            await api.logAuditEvent('ROLE_DELETE', `role:${roleId}`, actor);
        } catch (error) {
            console.error('Error deleting role:', error);
            throw error;
        }
    },

    // =====================================================
    // PLANS
    // =====================================================

    getPlans: async (): Promise<Plan[]> => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*');

            if (error) throw error;

            return data.map(p => ({
                id: p.id,
                nombre: p.nombre,
                precio: parseFloat(p.precio),
                userLimit: p.user_limit,
                storageLimit: p.storage_limit,
                descripcion: p.descripcion,
            }));
        } catch (error) {
            console.error('Error fetching plans:', error);
            return [];
        }
    },

    createPlan: async (planData: Omit<Plan, 'id'>, actor: User): Promise<Plan> => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .insert({
                    nombre: planData.nombre,
                    precio: planData.precio,
                    user_limit: planData.userLimit,
                    storage_limit: planData.storageLimit,
                    descripcion: planData.descripcion,
                })
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('PLAN_CREATE', `plan:${data.id} (${data.nombre})`, actor);

            return {
                id: data.id,
                nombre: data.nombre,
                precio: parseFloat(data.precio),
                userLimit: data.user_limit,
                storageLimit: data.storage_limit,
                descripcion: data.descripcion,
            };
        } catch (error) {
            console.error('Error creating plan:', error);
            throw new Error('No se pudo crear el plan');
        }
    },

    updatePlan: async (planId: string, planData: Omit<Plan, 'id'>, actor: User): Promise<Plan> => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .update({
                    nombre: planData.nombre,
                    precio: planData.precio,
                    user_limit: planData.userLimit,
                    storage_limit: planData.storageLimit,
                    descripcion: planData.descripcion,
                })
                .eq('id', planId)
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('PLAN_UPDATE', `plan:${planId} (${data.nombre})`, actor);

            return {
                id: data.id,
                nombre: data.nombre,
                precio: parseFloat(data.precio),
                userLimit: data.user_limit,
                storageLimit: data.storage_limit,
                descripcion: data.descripcion,
            };
        } catch (error) {
            console.error('Error updating plan:', error);
            throw new Error('No se pudo actualizar el plan');
        }
    },

    // =====================================================
    // TEMPLATES
    // =====================================================

    getTemplates: async (): Promise<Template[]> => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('last_updated', { ascending: false });

            if (error) throw error;

            return data.map(t => ({
                id: t.id,
                nombre: t.nombre,
                tipo: t.tipo as TemplateType,
                version: t.version,
                lastUpdated: t.last_updated,
                fileUrl: t.file_url || '#',
            }));
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    },

    uploadTemplate: async (
        templateData: Omit<Template, 'id' | 'fileUrl' | 'lastUpdated' | 'version'>,
        actor: User
    ): Promise<Template> => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .insert({
                    nombre: templateData.nombre,
                    tipo: templateData.tipo,
                    version: 1,
                    last_updated: new Date().toISOString().split('T')[0],
                    file_url: '#', // Placeholder, se actualizará con Storage
                })
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('TEMPLATE_CREATE', `template:${data.id} (${data.nombre})`, actor);

            return {
                id: data.id,
                nombre: data.nombre,
                tipo: data.tipo as TemplateType,
                version: data.version,
                lastUpdated: data.last_updated,
                fileUrl: data.file_url || '#',
            };
        } catch (error) {
            console.error('Error uploading template:', error);
            throw new Error('No se pudo crear la plantilla');
        }
    },

    updateTemplate: async (
        templateId: string,
        templateData: Partial<Omit<Template, 'id' | 'fileUrl' | 'lastUpdated' | 'version'>> & { newFile?: boolean },
        actor: User
    ): Promise<Template> => {
        try {
            const updates: any = {
                last_updated: new Date().toISOString().split('T')[0],
            };

            if (templateData.nombre) updates.nombre = templateData.nombre;
            if (templateData.tipo) updates.tipo = templateData.tipo;
            if (templateData.newFile) {
                // Incrementar versión si hay nuevo archivo
                const { data: current } = await supabase
                    .from('templates')
                    .select('version')
                    .eq('id', templateId)
                    .single();

                if (current) {
                    updates.version = current.version + 1;
                }
            }

            const { data, error } = await supabase
                .from('templates')
                .update(updates)
                .eq('id', templateId)
                .select()
                .single();

            if (error) throw error;

            await api.logAuditEvent('TEMPLATE_UPDATE', `template:${templateId} (${data.nombre})`, actor);

            return {
                id: data.id,
                nombre: data.nombre,
                tipo: data.tipo as TemplateType,
                version: data.version,
                lastUpdated: data.last_updated,
                fileUrl: data.file_url || '#',
            };
        } catch (error) {
            console.error('Error updating template:', error);
            throw new Error('No se pudo actualizar la plantilla');
        }
    },

    // =====================================================
    // AUDIT LOGS
    // =====================================================

    getAuditLogs: async (): Promise<AuditLog[]> => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(100);

            if (error) throw error;

            return data.map(log => ({
                id: log.id,
                actor: log.actor,
                action: log.action,
                resource: log.resource,
                timestamp: log.timestamp,
            }));
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }
    },

    // =====================================================
    // PLATFORM STATS
    // =====================================================

    getPlatformStats: async (): Promise<{ mrr: number; activeTenants: number; totalUsers: number }> => {
        try {
            // Obtener tenants activos
            const { data: tenants, error: tenantsError } = await supabase
                .from('tenants')
                .select('plan_id, estado');

            if (tenantsError) throw tenantsError;

            const activeTenants = tenants?.filter(t => t.estado === 'Activo') || [];

            // Calcular MRR
            const { data: plans, error: plansError } = await supabase
                .from('plans')
                .select('id, precio');

            if (plansError) throw plansError;

            const planPriceMap = new Map(plans?.map(p => [p.id, parseFloat(p.precio)]) || []);
            const mrr = activeTenants.reduce((total, tenant) => {
                return total + (planPriceMap.get(tenant.plan_id) || 0);
            }, 0);

            // Contar usuarios totales (excluyendo SuperAdmins)
            const { count: totalUsers, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)
                .neq('role.name', 'SUPERADMIN');

            if (usersError) throw usersError;

            return {
                mrr,
                activeTenants: activeTenants.length,
                totalUsers: totalUsers || 0,
            };
        } catch (error) {
            console.error('Error fetching platform stats:', error);
            return { mrr: 0, activeTenants: 0, totalUsers: 0 };
        }
    },
};
