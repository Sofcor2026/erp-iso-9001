import {
    User, Role, Document, KPI, DocumentStatus, ProcessType, DocumentType,
    Contacto, OrdenCompra, Tenant, Plan, Template, TemplateType, AuditLog,
    DocumentoHistorial, Permission, EquipmentAssignment, Quote, LegalRequirement,
    JobProfile, Training, TrainingAttendance, ImprovementFinding, ImprovementAction,
    RiskMatrix, SupplierEvaluation
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
                contentType: (doc.content_type as 'file' | 'spreadsheet') || 'file',
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

            // Si se publica, poner versiones anteriores como obsoletas
            if (status === DocumentStatus.VIGENTE) {
                await supabase
                    .from('documents')
                    .update({ estado: DocumentStatus.OBSOLETO })
                    .eq('tenant_id', data.tenant_id)
                    .eq('codigo', data.codigo)
                    .neq('id', docId);
            }

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
                contentType: data.content_type as 'file' | 'spreadsheet'
            };
        } catch (error) {
            console.error('Error updating document status:', error);
            throw new Error('No se pudo actualizar el estado del documento');
        }
    },

    addDocument: async (
        newDocData: Omit<Document, 'id' | 'version' | 'estado' | 'fechaEmision' | 'fechaRevision' | 'archivoUrl' | 'responsableNombre'> & { file?: File; initialData?: any[] },
        creator: User
    ): Promise<Document> => {
        try {
            if (!creator.tenantId) throw new Error('User must belong to a tenant');

            let publicUrl = '#';
            let fileSizeGB = 0;

            if (newDocData.file && newDocData.contentType !== 'spreadsheet') {
                // 1. Validar límite de almacenamiento
                fileSizeGB = newDocData.file.size / (1024 * 1024 * 1024);
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('storage_used, plan:plans(storage_limit)')
                    .eq('id', creator.tenantId)
                    .single();

                const planData = Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan;
                const currentStorage = parseFloat(tenant?.storage_used || '0');
                const limit = parseFloat(planData?.storage_limit || '0');

                if (currentStorage + fileSizeGB > limit) {
                    throw new Error('Límite de almacenamiento alcanzado. Contacte al administrador para ampliar su plan.');
                }

                // 2. Subir archivo a Storage
                const fileExt = newDocData.file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${creator.tenantId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, newDocData.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl: url } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                publicUrl = url;
            }

            // 3. Buscar datos del responsable
            const { data: responsable, error: respError } = await supabase
                .from('users')
                .select('nombre')
                .eq('id', newDocData.responsableId)
                .single();

            if (respError) throw respError;

            const today = new Date().toISOString().split('T')[0];

            // 4. Insertar en DB
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
                    archivo_url: publicUrl,
                    file_size: fileSizeGB,
                    content_type: newDocData.contentType || 'file'
                })
                .select()
                .single();

            if (error) throw error;

            // 4.5. Insertar datos iniciales si es spreadsheet
            if (newDocData.contentType === 'spreadsheet' && newDocData.initialData) {
                await supabase.from('document_data').insert({
                    document_id: data.id,
                    data: newDocData.initialData,
                    updated_at: new Date().toISOString()
                });
            }

            // 5. Actualizar contador de almacenamiento del tenant
            await supabase.rpc('increment_tenant_storage', { t_id: creator.tenantId, amount: fileSizeGB });

            // 6. Crear entrada en historial
            await supabase.from('document_history').insert({
                document_id: data.id,
                autor: responsable.nombre,
                version: 1,
                cambios: 'Documento Creado y archivo subido.'
            });

            await api.logAuditEvent('DOCUMENT_CREATE', `doc:${data.id} (${data.codigo})`, creator);

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
                archivoUrl: data.archivo_url,
                fileSize: data.file_size
            };
        } catch (error: any) {
            console.error('Error adding document:', error);
            throw new Error(error.message || 'No se pudo crear el documento');
        }
    },

    updateDocument: async (
        docId: string,
        updateData: Partial<Omit<Document, 'id'>> & { file?: File },
        actor: User
    ): Promise<Document> => {
        try {
            const updates: any = {};
            let oldFileSize = 0;
            let newFileSize = 0;

            // Obtener datos actuales para historial y gestión de archivos
            const { data: currentDoc } = await supabase
                .from('documents')
                .select('version, archivo_url, file_size, tenant_id')
                .eq('id', docId)
                .single();

            if (updateData.file) {
                // Validar límite con el nuevo archivo
                newFileSize = updateData.file.size / (1024 * 1024 * 1024);
                oldFileSize = parseFloat(currentDoc?.file_size || '0');

                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('storage_used, plan:plans(storage_limit)')
                    .eq('id', currentDoc.tenant_id)
                    .single();

                const planData = Array.isArray(tenant?.plan) ? tenant.plan[0] : tenant?.plan;
                const currentStorage = parseFloat(tenant?.storage_used || '0');
                const limit = parseFloat(planData?.storage_limit || '0');

                if (currentStorage - oldFileSize + newFileSize > limit) {
                    throw new Error('Esta actualización excedería el límite de almacenamiento de su plan.');
                }

                // Subir nuevo archivo
                const fileExt = updateData.file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${currentDoc.tenant_id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, updateData.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                updates.archivo_url = publicUrl;
                updates.file_size = newFileSize;
                updates.version = (currentDoc?.version || 1) + 1;
            }

            if (updateData.codigo) updates.codigo = updateData.codigo;
            if (updateData.nombre) updates.nombre = updateData.nombre;
            if (updateData.proceso) updates.proceso = updateData.proceso;
            if (updateData.subproceso) updates.subproceso = updateData.subproceso;
            if (updateData.tipo) updates.tipo = updateData.tipo;
            if (updateData.responsableId) updates.responsable_id = updateData.responsableId;

            updates.fecha_revision = new Date().toISOString().split('T')[0];

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

            // Actualizar almacenamiento si cambió el archivo
            if (updateData.file) {
                await supabase.rpc('decrement_tenant_storage', { t_id: currentDoc.tenant_id, amount: oldFileSize });
                await supabase.rpc('increment_tenant_storage', { t_id: currentDoc.tenant_id, amount: newFileSize });
            }

            // Agregar al historial
            await supabase.from('document_history').insert({
                document_id: docId,
                autor: actor.nombre,
                version: data.version,
                cambios: updateData.file ? 'Nueva versión de archivo subida.' : 'Propiedades del documento actualizadas.'
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
                archivoUrl: data.archivo_url,
                fileSize: data.file_size
            };
        } catch (error: any) {
            console.error('Error updating document:', error);
            throw new Error(error.message || 'No se pudo actualizar el documento');
        }
    },

    deleteDocument: async (docId: string, actor: User): Promise<void> => {
        try {
            // 1. Obtener info para borrar archivo y decrementar storage
            const { data: doc } = await supabase
                .from('documents')
                .select('archivo_url, file_size, tenant_id, codigo')
                .eq('id', docId)
                .single();

            if (!doc) throw new Error('Documento no encontrado');

            // 2. Borrar archivo del Storage si existe
            if (doc.archivo_url && doc.archivo_url !== '#') {
                const urlParts = doc.archivo_url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const filePath = `${doc.tenant_id}/${fileName}`;
                await supabase.storage.from('documents').remove([filePath]);
            }

            // 3. Borrar de la DB
            const { error } = await supabase.from('documents').delete().eq('id', docId);
            if (error) throw error;

            // 4. Decrementar almacenamiento
            const size = parseFloat(doc.file_size || '0');
            if (size > 0) {
                await supabase.rpc('decrement_tenant_storage', { t_id: doc.tenant_id, amount: size });
            }

            await api.logAuditEvent('DOCUMENT_DELETE', `doc:${docId} (${doc.codigo})`, actor);
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
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

    getUsers: async (tenantId?: string): Promise<User[]> => {
        try {
            let query = supabase
                .from('users')
                .select(`
          *,
          role:roles (
            id,
            name,
            description,
            permissions,
            is_default
          ),
          tenant:tenants (nombre)
        `);

            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data.map(u => {
                const roleData = Array.isArray(u.role) ? u.role[0] : u.role;
                const tenantData = Array.isArray(u.tenant) ? u.tenant[0] : u.tenant;
                return {
                    id: u.id,
                    email: u.email,
                    nombre: u.nombre,
                    role: {
                        id: roleData.id,
                        name: roleData.name,
                        description: roleData.description,
                        permissions: roleData.permissions as Permission[],
                        isDefault: roleData.is_default,
                    },
                    tenantId: u.tenant_id,
                    tenantNombre: tenantData?.nombre,
                    activo: u.activo,
                };
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    },

    createUser: async (
        userData: Omit<User, 'id' | 'role' | 'activo'> & { roleId: string; password?: string },
        actor: User
    ): Promise<User> => {
        try {
            // 1. Validar límites del plan si no es un SuperAdmin creando un usuario global
            if (userData.tenantId) {
                const { data: tenant, error: tError } = await supabase
                    .from('tenants')
                    .select('user_count, plan:plans(user_limit)')
                    .eq('id', userData.tenantId)
                    .single();

                if (tError) throw tError;

                const planData = Array.isArray(tenant.plan) ? tenant.plan[0] : tenant.plan;
                if (tenant.user_count >= (planData?.user_limit || 0)) {
                    throw new Error('Límite de usuarios alcanzado para este plan. Contacte al administrador para ampliar su plan.');
                }
            }

            // 2. Crear el usuario en Auth (via Edge Function)
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const { data: functionData, error: functionError } = await supabase.functions.invoke('create-admin-user', {
                body: {
                    email: userData.email,
                    nombre: userData.nombre,
                    password: userData.password
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (functionError) throw new Error(functionError.message);

            const authUser = functionData.user;

            // 2. Crear el registro en la tabla public.users
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    id: authUser.id,
                    email: userData.email,
                    nombre: userData.nombre,
                    role_id: userData.roleId,
                    tenant_id: userData.tenantId,
                    activo: true
                })
                .select(`
                    *,
                    role:roles (*)
                `)
                .single();

            if (userError) throw userError;

            // 3. Incrementar contador en tenant
            if (userData.tenantId) {
                await supabase.rpc('increment_tenant_user_count', { t_id: userData.tenantId });
            }

            await api.logAuditEvent('USER_CREATE', `user:${newUser.id} (${newUser.email}) - Tenant: ${userData.tenantId}`, actor);

            const roleData = Array.isArray(newUser.role) ? newUser.role[0] : newUser.role;
            return {
                id: newUser.id,
                email: newUser.email,
                nombre: newUser.nombre,
                role: {
                    id: roleData.id,
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions,
                    isDefault: roleData.is_default,
                },
                tenantId: newUser.tenant_id,
                activo: newUser.activo,
            };
        } catch (error: any) {
            console.error('Error creating user:', error);
            throw new Error(error.message || 'No se pudo crear el usuario');
        }
    },

    deleteUser: async (userId: string, actor: User): Promise<void> => {
        try {
            // Obtener tenant_id antes de borrar
            const { data: userToDelete } = await supabase
                .from('users')
                .select('tenant_id')
                .eq('id', userId)
                .single();

            // 1. Borrar en la tabla pública
            const { error: tableError } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (tableError) throw tableError;

            // 2. Decrementar contador en tenant
            if (userToDelete?.tenant_id) {
                await supabase.rpc('decrement_tenant_user_count', { t_id: userToDelete.tenant_id });
            }

            // Nota: El borrado en Auth requiere Admin API (Edge Function), lo dejamos para despues o lo manejamos manual
            await api.logAuditEvent('USER_DELETE', `user:${userId}`, actor);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error('No se pudo eliminar el usuario');
        }
    },

    // =====================================================
    // CONTACTOS Y PROVEEDORES
    // =====================================================

    getContactos: async (tenantId?: string): Promise<Contacto[]> => {
        try {
            let query = supabase.from('contactos').select('*');
            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }
            const { data, error } = await query;

            if (error) throw error;

            return data.map(c => ({
                id: c.id,
                tipo: c.tipo as 'CLIENTE' | 'PROVEEDOR',
                rut_nit: c.rut_nit,
                razonSocial: c.razon_social,
                razon_social: c.razon_social,
                email: c.email,
            }));
        } catch (error) {
            console.error('Error fetching contactos:', error);
            return [];
        }
    },

    addContacto: async (data: Omit<Contacto, 'id'>, actor: User): Promise<Contacto> => {
        const { data: result, error } = await supabase
            .from('contactos')
            .insert({
                tenant_id: actor.tenantId,
                tipo: data.tipo,
                rut_nit: data.rut_nit,
                razon_social: data.razonSocial,
                email: data.email
            })
            .select()
            .single();
        if (error) throw error;
        await api.logAuditEvent('CONTACT_CREATE', `contact:${result.id} (${data.razonSocial})`, actor);
        return {
            id: result.id,
            tipo: result.tipo,
            rut_nit: result.rut_nit,
            razonSocial: result.razon_social,
            email: result.email
        };
    },

    // =====================================================
    // MATRIZ LEGAL
    // =====================================================

    getLegalMatrix: async (tenantId?: string): Promise<LegalRequirement[]> => {
        try {
            let query = supabase.from('legal_matrix').select('*');
            if (tenantId) {
                query = query.eq('tenant_id', tenantId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(r => ({
                id: r.id,
                norma: r.norma,
                articulo: r.articulo,
                descripcion: r.descripcion,
                autoridad: r.autoridad,
                cumplimiento: r.cumplimiento,
                evidencia: r.evidencia,
                fechaVerificacion: r.fecha_verificacion
            }));
        } catch (error) {
            console.error('Error fetching legal matrix:', error);
            return [];
        }
    },

    addLegalRequirement: async (data: Omit<LegalRequirement, 'id'>, actor: User): Promise<LegalRequirement> => {
        const { data: result, error } = await supabase
            .from('legal_matrix')
            .insert({
                tenant_id: actor.tenantId,
                norma: data.norma,
                articulo: data.articulo,
                descripcion: data.descripcion,
                autoridad: data.autoridad,
                cumplimiento: data.cumplimiento,
                evidencia: data.evidencia,
                fecha_verificacion: data.fechaVerificacion
            })
            .select()
            .single();
        if (error) throw error;
        await api.logAuditEvent('LEGAL_CREATE', `legal:${result.id} (${data.norma})`, actor);
        return {
            id: result.id,
            norma: result.norma,
            articulo: result.articulo,
            descripcion: result.descripcion,
            autoridad: result.autoridad,
            cumplimiento: result.cumplimiento,
            evidencia: result.evidencia,
            fechaVerificacion: result.fecha_verificacion
        };
    },

    updateLegalRequirement: async (id: string, data: Partial<LegalRequirement>, actor: User): Promise<LegalRequirement> => {
        const updates: any = {};
        if (data.norma !== undefined) updates.norma = data.norma;
        if (data.articulo !== undefined) updates.articulo = data.articulo;
        if (data.descripcion !== undefined) updates.descripcion = data.descripcion;
        if (data.autoridad !== undefined) updates.autoridad = data.autoridad;
        if (data.cumplimiento !== undefined) updates.cumplimiento = data.cumplimiento;
        if (data.evidencia !== undefined) updates.evidencia = data.evidencia;
        if (data.fechaVerificacion !== undefined) updates.fecha_verificacion = data.fechaVerificacion;

        const { data: result, error } = await supabase
            .from('legal_matrix')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        await api.logAuditEvent('LEGAL_UPDATE', `legal:${id}`, actor);
        return {
            id: result.id,
            norma: result.norma,
            articulo: result.articulo,
            descripcion: result.descripcion,
            autoridad: result.autoridad,
            cumplimiento: result.cumplimiento,
            evidencia: result.evidencia,
            fechaVerificacion: result.fecha_verificacion
        };
    },

    deleteLegalRequirement: async (id: string, actor: User): Promise<void> => {
        const { error } = await supabase.from('legal_matrix').delete().eq('id', id);
        if (error) throw error;
        await api.logAuditEvent('LEGAL_DELETE', `legal:${id}`, actor);
    },

    // =====================================================
    // GESTIÓN DE COMPETENCIAS Y CAPACITACIONES
    // =====================================================

    getJobProfiles: async (tenantId?: string): Promise<JobProfile[]> => {
        try {
            let query = supabase.from('job_profiles').select('*');
            if (tenantId) query = query.eq('tenant_id', tenantId);
            const { data, error } = await query.order('nombre');
            if (error) throw error;
            return data.map(jp => ({
                id: jp.id,
                nombre: jp.nombre,
                descripcion: jp.descripcion,
                educacionReq: jp.educacion_req,
                formacionReq: jp.formacion_req,
                experienciaReq: jp.experiencia_req,
                habilidadesReq: jp.habilidades_req
            }));
        } catch (error) {
            console.error('Error fetching job profiles:', error);
            return [];
        }
    },

    addJobProfile: async (data: Omit<JobProfile, 'id'>, actor: User): Promise<JobProfile> => {
        const { data: result, error } = await supabase
            .from('job_profiles')
            .insert({
                tenant_id: actor.tenantId,
                nombre: data.nombre,
                descripcion: data.descripcion,
                educacion_req: data.educacionReq,
                formacion_req: data.formacionReq,
                experiencia_req: data.experienciaReq,
                habilidades_req: data.habilidadesReq
            })
            .select().single();
        if (error) throw error;
        await api.logAuditEvent('JOB_PROFILE_CREATE', `jp:${result.id} (${data.nombre})`, actor);
        return {
            id: result.id,
            nombre: result.nombre,
            descripcion: result.descripcion,
            educacionReq: result.educacion_req,
            formacionReq: result.formacion_req,
            experienciaReq: result.experiencia_req,
            habilidadesReq: result.habilidades_req
        };
    },

    getTrainings: async (tenantId?: string): Promise<Training[]> => {
        try {
            let query = supabase.from('trainings').select('*');
            if (tenantId) query = query.eq('tenant_id', tenantId);
            const { data, error } = await query.order('fecha_programada', { ascending: false });
            if (error) throw error;
            return data.map(t => ({
                id: t.id,
                nombre: t.nombre,
                descripcion: t.descripcion,
                fechaProgramada: t.fecha_programada,
                facilitador: t.facilitador,
                duracionHoras: parseFloat(t.duracion_horas),
                estado: t.estado
            }));
        } catch (error) {
            console.error('Error fetching trainings:', error);
            return [];
        }
    },

    addTraining: async (data: Omit<Training, 'id'>, actor: User): Promise<Training> => {
        const { data: result, error } = await supabase
            .from('trainings')
            .insert({
                tenant_id: actor.tenantId,
                nombre: data.nombre,
                descripcion: data.descripcion,
                fecha_programada: data.fechaProgramada,
                facilitador: data.facilitador,
                duracion_horas: data.duracionHoras,
                estado: data.estado
            })
            .select().single();
        if (error) throw error;
        await api.logAuditEvent('TRAINING_CREATE', `train:${result.id} (${data.nombre})`, actor);
        return {
            id: result.id,
            nombre: result.nombre,
            descripcion: result.descripcion,
            fechaProgramada: result.fecha_programada,
            facilitador: result.facilitador,
            duracionHoras: parseFloat(result.duracion_horas),
            estado: result.estado
        };
    },

    getTrainingAttendance: async (trainingId: string): Promise<TrainingAttendance[]> => {
        const { data, error } = await supabase
            .from('training_attendance')
            .select('*, user:users(nombre)')
            .eq('training_id', trainingId);
        if (error) throw error;
        return data.map(a => ({
            id: a.id,
            trainingId: a.training_id,
            userId: a.user_id,
            userNombre: a.user?.nombre,
            asistio: a.asistio,
            calificacion: a.calificacion ? parseFloat(a.calificacion) : undefined,
            comentarios: a.comentarios
        }));
    },

    updateAttendance: async (attendance: Omit<TrainingAttendance, 'id' | 'userNombre'>): Promise<void> => {
        const { error } = await supabase
            .from('training_attendance')
            .upsert({
                training_id: attendance.trainingId,
                user_id: attendance.userId,
                asistio: attendance.asistio,
                calificacion: attendance.calificacion,
                comentarios: attendance.comentarios
            }, { onConflict: 'training_id,user_id' });
        if (error) throw error;
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
        console.log('[API] Initializing getTenants call...');
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `);

            if (error) {
                console.error('[API] Error in getTenants:', error);
                throw error;
            }

            console.log('[API] getTenants raw data:', data);

            if (!data) return [];

            const mapped = data.map(t => {
                const planData = Array.isArray(t.plan) ? t.plan[0] : t.plan;
                return {
                    id: t.id,
                    nombre: t.nombre,
                    subdominio: t.subdominio,
                    planId: t.plan_id,
                    planNombre: planData?.nombre || 'Unknown',
                    estado: t.estado as 'Activo' | 'Suspendido' | 'Prueba',
                    fechaCreacion: t.fecha_creacion,
                    userCount: t.user_count,
                    storageUsed: parseFloat(t.storage_used),
                    userLimit: t.user_limit || planData?.user_limit || 0,
                    storageLimit: t.storage_limit || planData?.storage_limit || 0,
                };
            });

            console.log('[API] getTenants mapped data:', mapped);
            return mapped;
        } catch (error) {
            console.error('[API] Fatal Error fetching tenants:', error);
            return [];
        }
    },

    getTenantById: async (id: string): Promise<Tenant | null> => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    *,
                    plan:plans (nombre, user_limit, storage_limit)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const planData = Array.isArray(data.plan) ? data.plan[0] : data.plan;

            return {
                id: data.id,
                nombre: data.nombre,
                subdominio: data.subdominio,
                planId: data.plan_id,
                planNombre: planData?.nombre || 'Unknown',
                estado: data.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: data.fecha_creacion,
                userCount: data.user_count,
                storageUsed: parseFloat(data.storage_used),
                userLimit: data.user_limit || planData?.user_limit || 0,
                storageLimit: data.storage_limit || planData?.storage_limit || 0,
            };
        } catch (error) {
            console.error('Error fetching tenant by id:', error);
            return null;
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
        adminData: Omit<User, 'id' | 'role' | 'tenantId' | 'activo'> & { password?: string },
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
                    user_count: 1, // El administrador que creamos a continuación cuenta como el primero
                    storage_used: 0,
                })
                .select(`
          *,
          plan:plans (nombre, user_limit, storage_limit)
        `)
                .single();

            if (tenantError) throw tenantError;

            // Crear usuario admin de forma segura usando una Edge Function
            // Esto evita el error 403 ya que las Edge Functions tienen acceso al Service Role Key de forma segura
            const { data: functionData, error: functionError } = await supabase.functions.invoke('create-admin-user', {
                body: {
                    email: adminData.email,
                    nombre: adminData.nombre,
                    password: adminData.password
                }
            });

            if (functionError) throw new Error(functionError.message || 'Error al crear el usuario administrador');

            const authUser = functionData.user;

            // Obtener rol de ADMIN
            const { data: adminRole } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'ADMIN')
                .single();

            if (!adminRole) throw new Error('Admin role not found');

            // Crear usuario en tabla users
            await supabase.from('users').insert({
                id: authUser.id,
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
                userLimit: (Array.isArray(newTenant.plan) ? newTenant.plan[0] : newTenant.plan)?.user_limit || 0,
                storageLimit: (Array.isArray(newTenant.plan) ? newTenant.plan[0] : newTenant.plan)?.storage_limit || 0,
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
            if (data.userLimit !== undefined) updates.user_limit = data.userLimit;
            if (data.storageLimit !== undefined) updates.storage_limit = data.storageLimit;

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

            const planData = updatedTenant.plan;

            return {
                id: updatedTenant.id,
                nombre: updatedTenant.nombre,
                subdominio: updatedTenant.subdominio,
                planId: updatedTenant.plan_id,
                planNombre: planData?.nombre || 'Unknown',
                estado: updatedTenant.estado as 'Activo' | 'Suspendido' | 'Prueba',
                fechaCreacion: updatedTenant.fecha_creacion,
                userCount: updatedTenant.user_count,
                storageUsed: parseFloat(updatedTenant.storage_used),
                userLimit: updatedTenant.user_limit || planData?.user_limit || 0,
                storageLimit: updatedTenant.storage_limit || planData?.storage_limit || 0,
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
        console.log('[API] Initializing getPlans call...');
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*');

            if (error) {
                console.error('[API] Error in getPlans:', error);
                throw error;
            }

            console.log('[API] getPlans raw data:', data);

            if (!data) return [];

            const mapped = data.map(p => ({
                id: p.id,
                nombre: p.nombre,
                precio: parseFloat(p.precio),
                userLimit: p.user_limit,
                storageLimit: p.storage_limit,
                descripcion: p.descripcion,
            }));

            console.log('[API] getPlans mapped data:', mapped);
            return mapped;
        } catch (error) {
            console.error('[API] Fatal Error fetching plans:', error);
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
        templateData: Omit<Template, 'id' | 'fileUrl' | 'lastUpdated' | 'version'> & { file: File },
        actor: User
    ): Promise<Template> => {
        try {
            // 1. Subir archivo a Storage
            const fileExt = templateData.file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `global/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('templates')
                .upload(filePath, templateData.file);

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('templates')
                .getPublicUrl(filePath);

            // 2. Insertar en tabla
            const { data, error } = await supabase
                .from('templates')
                .insert({
                    nombre: templateData.nombre,
                    tipo: templateData.tipo,
                    version: 1,
                    last_updated: new Date().toISOString().split('T')[0],
                    file_url: publicUrl,
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
                fileUrl: data.file_url,
            };
        } catch (error) {
            console.error('Error uploading template:', error);
            throw new Error('No se pudo crear la plantilla');
        }
    },

    updateTemplate: async (
        templateId: string,
        templateData: Partial<Omit<Template, 'id' | 'fileUrl' | 'lastUpdated' | 'version'>> & { file?: File },
        actor: User
    ): Promise<Template> => {
        try {
            const updates: any = {
                last_updated: new Date().toISOString().split('T')[0],
            };

            if (templateData.nombre) updates.nombre = templateData.nombre;
            if (templateData.tipo) updates.tipo = templateData.tipo;

            if (templateData.file) {
                // 1. Subir nuevo archivo
                const fileExt = templateData.file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `global/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('templates')
                    .upload(filePath, templateData.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('templates')
                    .getPublicUrl(filePath);

                updates.file_url = publicUrl;

                // 2. Incrementar versión
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
                fileUrl: data.file_url,
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
                .neq('role_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

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

    // =====================================================
    // DOTACIONES
    // =====================================================
    getDotaciones: async (): Promise<EquipmentAssignment[]> => {
        try {
            const { data, error } = await supabase
                .from('dotaciones')
                .select(`
                    *,
                    employee:users!employee_id (nombre)
                `);
            if (error) throw error;
            return data.map(d => ({
                id: d.id,
                tenantId: d.tenant_id,
                employeeId: d.employee_id,
                employeeNombre: (Array.isArray(d.employee) ? d.employee[0] : d.employee)?.nombre,
                itemNombre: d.item_nombre,
                cantidad: d.cantidad,
                talla: d.talla,
                estado: d.estado,
                fechaEntrega: d.fecha_entrega,
                recibidoPor: d.recibido_por,
                notas: d.notas
            }));
        } catch (error) {
            console.error('Error fetching dotaciones:', error);
            return [];
        }
    },

    addDotacion: async (data: Omit<EquipmentAssignment, 'id' | 'tenantId'>, actor: User): Promise<EquipmentAssignment> => {
        const { data: result, error } = await supabase
            .from('dotaciones')
            .insert({
                tenant_id: actor.tenantId,
                employee_id: data.employeeId,
                item_nombre: data.itemNombre,
                cantidad: data.cantidad,
                talla: data.talla,
                estado: data.estado,
                fecha_entrega: data.fechaEntrega,
                recibido_por: data.recibidoPor,
                notas: data.notas
            })
            .select()
            .single();
        if (error) throw error;
        await api.logAuditEvent('EQUIPMENT_ASSIGN', `item:${result.id} (${data.itemNombre})`, actor);
        return result;
    },

    // =====================================================
    // COTIZACIONES
    // =====================================================
    getCotizaciones: async (): Promise<Quote[]> => {
        try {
            const { data, error } = await supabase
                .from('cotizaciones')
                .select(`
                    *,
                    cliente:contactos!cliente_id (razon_social),
                    vendedor:users!vendedor_id (nombre)
                `);
            if (error) throw error;
            return data.map(q => ({
                id: q.id,
                tenantId: q.tenant_id,
                numero: q.numero,
                clienteId: q.cliente_id,
                clienteNombre: (Array.isArray(q.cliente) ? q.cliente[0] : q.cliente)?.razon_social,
                monto: q.monto,
                estado: q.estado,
                vendedorId: q.vendedor_id,
                vendedorNombre: (Array.isArray(q.vendedor) ? q.vendedor[0] : q.vendedor)?.nombre,
                items: q.items,
                fechaEmision: q.fecha_emision,
                fechaVencimiento: q.fecha_vencimiento
            }));
        } catch (error) {
            console.error('Error fetching cotizaciones:', error);
            return [];
        }
    },

    addCotizacion: async (data: Omit<Quote, 'id' | 'numero' | 'tenantId' | 'vendedorId' | 'estado' | 'fechaEmision'>, actor: User): Promise<Quote> => {
        const { count } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true });
        const numero = `COT-${(count || 0) + 1001}`;

        const { data: result, error } = await supabase
            .from('cotizaciones')
            .insert({
                tenant_id: actor.tenantId,
                numero,
                cliente_id: data.clienteId,
                monto: data.monto,
                estado: 'Pendiente',
                vendedor_id: actor.id,
                items: data.items,
                fecha_emision: new Date().toISOString().split('T')[0],
                fecha_vencimiento: data.fechaVencimiento
            })
            .select()
            .single();
        if (error) throw error;
        await api.logAuditEvent('QUOTE_CREATE', `quote:${result.id} (${numero})`, actor);
        return result;
    },

    // =====================================================
    // DOCUMENT DATA (SPREADSHEET EDITING)
    // =====================================================
    getDocumentData: async (docId: string): Promise<any[]> => {
        const { data, error } = await supabase
            .from('document_data')
            .select('data')
            .eq('document_id', docId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.data || [];
    },

    updateDocumentData: async (docId: string, jsonData: any[], actor: User): Promise<void> => {
        const { error } = await supabase
            .from('document_data')
            .upsert({
                document_id: docId,
                data: jsonData,
                updated_at: new Date().toISOString()
            });
        if (error) throw error;
        await api.logAuditEvent('DOCUMENT_DATA_UPDATE', `doc:${docId}`, actor);
    },

    createNewVersion: async (docId: string, actor: User): Promise<Document> => {
        try {
            // 1. Obtener el documento actual
            const { data: oldDoc, error: fetchError } = await supabase
                .from('documents')
                .select('*')
                .eq('id', docId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Insertar el nuevo registro (Clonado)
            // Nota: Mantenemos el mismo código y nombre, pero reseteamos el estado a Borrador
            // e incrementamos la versión.
            const today = new Date().toISOString().split('T')[0];
            const { data: newDoc, error: insertError } = await supabase
                .from('documents')
                .insert({
                    tenant_id: oldDoc.tenant_id,
                    codigo: oldDoc.codigo,
                    nombre: oldDoc.nombre,
                    proceso: oldDoc.proceso,
                    subproceso: oldDoc.subproceso,
                    tipo: oldDoc.tipo,
                    version: oldDoc.version + 1,
                    estado: DocumentStatus.BORRADOR,
                    responsable_id: actor.id, // El que crea la versión es el nuevo responsable temporal
                    fecha_emision: today,
                    fecha_revision: today,
                    archivo_url: oldDoc.archivo_url, // Mantenemos el archivo actual como base
                    file_size: oldDoc.file_size,
                    content_type: oldDoc.content_type
                })
                .select(`
                    *,
                    responsable:users!responsable_id (nombre)
                `)
                .single();

            if (insertError) throw insertError;

            // 3. Clonar datos de spreadsheet si existen
            if (oldDoc.content_type === 'spreadsheet') {
                const oldData = await api.getDocumentData(docId);
                if (oldData.length > 0) {
                    await api.updateDocumentData(newDoc.id, oldData, actor);
                }
            }

            // 4. Registrar en historial
            await supabase.from('document_history').insert({
                document_id: newDoc.id,
                autor: actor.nombre,
                version: newDoc.version,
                cambios: `Nueva versión (${newDoc.version}) creada a partir de la versión ${oldDoc.version}.`
            });

            await api.logAuditEvent('DOCUMENT_VERSION_CREATE', `doc:${newDoc.id} (v${newDoc.version})`, actor);

            return {
                id: newDoc.id,
                codigo: newDoc.codigo,
                nombre: newDoc.nombre,
                proceso: newDoc.proceso as ProcessType,
                subproceso: newDoc.subproceso,
                tipo: newDoc.tipo as DocumentType,
                version: newDoc.version,
                estado: newDoc.estado as DocumentStatus,
                responsableId: newDoc.responsable_id,
                responsableNombre: newDoc.responsable?.nombre || actor.nombre,
                fechaEmision: newDoc.fecha_emision,
                fechaRevision: newDoc.fecha_revision,
                archivoUrl: newDoc.archivo_url,
                fileSize: newDoc.file_size,
                contentType: newDoc.content_type
            };
        } catch (error: any) {
            console.error('Error creating new document version:', error);
            throw new Error(error.message || 'No se pudo crear la nueva versión');
        }
    },

    // =====================================================
    // ISO 9001 MODULES (MEJORA, RIESGOS, PROVEEDORES)
    // =====================================================

    getImprovementFindings: async (tenantId?: string): Promise<ImprovementFinding[]> => {
        try {
            let query = supabase.from('improvement_findings').select('*');
            if (tenantId) query = query.eq('tenant_id', tenantId);
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(f => ({
                id: f.id,
                tenantId: f.tenant_id,
                fuente: f.fuente,
                descripcion: f.descripcion,
                procesoAsociado: f.proceso_asociado,
                fechaReporte: f.fecha_reporte,
                estado: f.estado as any,
                analisisCausaRaiz: f.analisis_causa_raiz,
                creada_por: f.creado_por
            }));
        } catch (error) {
            console.error('Error fetching findings:', error);
            return [];
        }
    },

    addImprovementFinding: async (data: Omit<ImprovementFinding, 'id' | 'tenantId' | 'estado' | 'fechaReporte' | 'creada_por'>, actor: User): Promise<ImprovementFinding> => {
        const { data: result, error } = await supabase
            .from('improvement_findings')
            .insert({
                tenant_id: actor.tenantId,
                fuente: data.fuente,
                descripcion: data.descripcion,
                proceso_asociado: data.procesoAsociado,
                estado: 'Abierto',
                creado_por: actor.id
            })
            .select().single();
        if (error) throw error;
        await api.logAuditEvent('IMPROVEMENT_FINDING_CREATE', `finding:${result.id}`, actor);
        return {
            ...data,
            id: result.id,
            tenantId: result.tenant_id,
            estado: 'Abierto',
            fechaReporte: result.fecha_reporte,
            creada_por: actor.id
        };
    },

    getRiskMatrix: async (tenantId?: string): Promise<RiskMatrix[]> => {
        try {
            let query = supabase.from('risk_matrix').select('*');
            if (tenantId) query = query.eq('tenant_id', tenantId);
            const { data, error } = await query.order('probabilidad', { ascending: false });
            if (error) throw error;
            return data.map(r => ({
                id: r.id,
                tenantId: r.tenant_id,
                proceso: r.proceso,
                tipo: r.tipo as any,
                descripcion: r.descripcion,
                causas: r.causas,
                consecuencias: r.consecuencias,
                probabilidad: r.probabilidad,
                impacto: r.impacto,
                nivel_riesgo: r.probabilidad * r.impacto,
                plan_mitigacion: r.plan_mitigacion,
                responsable_id: r.responsable_id
            }));
        } catch (error) {
            console.error('Error fetching risk matrix:', error);
            return [];
        }
    },

    getSupplierEvaluations: async (tenantId?: string): Promise<SupplierEvaluation[]> => {
        try {
            let query = supabase.from('supplier_evaluations').select('*, contacto:contactos(razon_social)');
            if (tenantId) query = query.eq('tenant_id', tenantId);
            const { data, error } = await query.order('fecha_evaluacion', { ascending: false });
            if (error) throw error;
            return data.map(e => ({
                id: e.id,
                tenantId: e.tenant_id,
                contacto_id: e.contacto_id,
                contactoNombre: (Array.isArray(e.contacto) ? e.contacto[0] : e.contacto)?.razon_social || 'Proveedor',
                fecha_evaluacion: e.fecha_evaluacion,
                criterioCalidad: e.criterio_calidad,
                criterioTiempo: e.criterio_tiempo,
                criterioPrecio: e.criterio_precio,
                puntajeFinal: parseFloat(e.puntaje_final),
                estado_proveedor: e.estado_proveedor as any,
                observaciones: e.observaciones,
                evaluador_id: e.evaluador_id
            }));
        } catch (error) {
            console.error('Error fetching supplier evals:', error);
            return [];
        }
    },

    addSupplierEvaluation: async (data: Omit<SupplierEvaluation, 'id' | 'tenantId' | 'evaluador_id'>, actor: User): Promise<SupplierEvaluation> => {
        const { data: result, error } = await supabase
            .from('supplier_evaluations')
            .insert({
                tenant_id: actor.tenantId,
                contacto_id: data.contacto_id,
                fecha_evaluacion: data.fecha_evaluacion,
                criterio_calidad: data.criterioCalidad,
                criterio_tiempo: data.criterioTiempo,
                criterio_precio: data.criterioPrecio,
                puntaje_final: data.puntajeFinal,
                estado_proveedor: data.estado_proveedor,
                observaciones: data.observaciones,
                evaluador_id: actor.id
            })
            .select().single();
        if (error) throw error;
        await api.logAuditEvent('SUPPLIER_EVALUATION_CREATE', `eval:${result.id}`, actor);
        return { ...data, id: result.id, tenantId: result.tenant_id, evaluador_id: actor.id };
    },

    addRiskMatrix: async (data: Omit<RiskMatrix, 'id' | 'tenantId' | 'nivel_riesgo'>, actor: User): Promise<RiskMatrix> => {
        const { data: result, error } = await supabase
            .from('risk_matrix')
            .insert({
                tenant_id: actor.tenantId,
                proceso: data.proceso,
                tipo: data.tipo,
                descripcion: data.descripcion,
                causas: data.causas,
                consecuencias: data.consecuencias,
                probabilidad: data.probabilidad,
                impacto: data.impacto,
                plan_mitigacion: data.plan_mitigacion,
                responsable_id: data.responsable_id || actor.id
            })
            .select().single();
        if (error) throw error;
        await api.logAuditEvent('RISK_MATRIX_CREATE', `risk:${result.id}`, actor);
        return { ...data, id: result.id, tenantId: result.tenant_id, nivel_riesgo: data.probabilidad * data.impacto };
    },

    updateImprovementFinding: async (id: string, updates: Partial<ImprovementFinding>, actor: User): Promise<void> => {
        const { error } = await supabase
            .from('improvement_findings')
            .update({
                fuente: updates.fuente,
                descripcion: updates.descripcion,
                proceso_asociado: updates.procesoAsociado,
                estado: updates.estado,
                analisis_causa_raiz: updates.analisisCausaRaiz
            })
            .eq('id', id);
        if (error) throw error;
        await api.logAuditEvent('IMPROVEMENT_FINDING_UPDATE', `finding:${id}`, actor);
    },

    getImprovementActions: async (findingId: string): Promise<ImprovementAction[]> => {
        const { data, error } = await supabase
            .from('improvement_actions')
            .select('*, responsable:users(nombre)')
            .eq('finding_id', findingId);
        if (error) throw error;
        return data.map(a => ({
            id: a.id,
            finding_id: a.finding_id,
            tarea: a.tarea,
            responsable_id: a.responsable_id,
            responsableNombre: a.responsable?.nombre,
            fecha_limite: a.fecha_limite,
            fecha_verificacion: a.fecha_verificacion,
            estado: a.estado
        }));
    },

    addImprovementAction: async (data: Omit<ImprovementAction, 'id' | 'responsableNombre'>, actor: User): Promise<void> => {
        const { error } = await supabase
            .from('improvement_actions')
            .insert({
                finding_id: data.finding_id,
                tarea: data.tarea,
                responsable_id: data.responsable_id,
                fecha_limite: data.fecha_limite,
                estado: 'Pendiente'
            });
        if (error) throw error;
        await api.logAuditEvent('IMPROVEMENT_ACTION_CREATE', `action:${data.finding_id}`, actor);
    },

    updateQuoteStatus: async (id: string, estado: Quote['estado'], actor: User): Promise<void> => {
        const { error } = await supabase
            .from('cotizaciones')
            .update({ estado })
            .eq('id', id);
        if (error) throw error;
        await api.logAuditEvent('QUOTE_UPDATE_STATUS', `quote:${id} to ${estado}`, actor);
    },
};
