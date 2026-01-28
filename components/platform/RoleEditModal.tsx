import React, { useState, useEffect } from 'react';
import { Role, Permission } from '../../types';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

const permissionGroups: Record<string, { label: string, permissions: Permission[] }> = {
    PLATFORM: {
        label: 'Plataforma',
        permissions: ['platform:access', 'platform:manage_tenants', 'platform:manage_plans', 'platform:manage_roles', 'platform:view_audit_log']
    },
    TENANT_ADMIN: {
        label: 'Administración de Tenant',
        permissions: ['tenant:admin', 'tenant:view_master_list', 'tenant:manage_users']
    },
    DOCUMENTS: {
        label: 'Documentos',
        permissions: ['document:create', 'document:update', 'document:publish', 'document:submit', 'document:download', 'document:view_all', 'document:view_published']
    },
    KPIS: {
        label: 'KPIs',
        permissions: ['kpi:manage', 'kpi:read']
    },
    FORMS: {
        label: 'Formularios',
        permissions: ['form:create']
    }
};

const RoleEditModal: React.FC<RoleEditModalProps> = ({ isOpen, onClose, onSuccess, role }) => {
    const { user } = useAuth();
    const isEditMode = !!role;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (role) {
            setName(role.name);
            setDescription(role.description);
            setSelectedPermissions(new Set(role.permissions));
        } else {
            setName('');
            setDescription('');
            setSelectedPermissions(new Set());
        }
    }, [role, isOpen]);

    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(permission);
            } else {
                newSet.delete(permission);
            }
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setFormError("No autenticado.");
            return;
        }
        if (!name) {
            setFormError("El nombre del rol es obligatorio.");
            return;
        }
        setFormError('');
        setIsSubmitting(true);
        
        // FIX: Use spread operator for better type inference from Set to Array.
        const roleData = { name, description, permissions: [...selectedPermissions] };

        try {
            if (isEditMode && role) {
                await api.updateRole(role.id, roleData, user);
            } else {
                await api.createRole(roleData, user);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            setFormError(error.message || "Error al guardar el rol.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl transform transition-all">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">{isEditMode ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                                <input type="text" id="role-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="role-desc" className="block text-sm font-medium text-gray-700">Descripción</label>
                                <input id="role-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full input-style" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-medium text-gray-800 mb-2">Permisos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 border rounded-md bg-gray-50">
                                {Object.values(permissionGroups).map(group => (
                                    <div key={group.label}>
                                        <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">{group.label}</h4>
                                        <div className="space-y-2">
                                            {group.permissions.map(permission => (
                                                <div key={permission} className="flex items-center">
                                                    <input
                                                        id={permission}
                                                        type="checkbox"
                                                        checked={selectedPermissions.has(permission)}
                                                        onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-secondary"
                                                    />
                                                    <label htmlFor={permission} className="ml-2 block text-sm text-gray-600">{permission.split(':')[1].replace(/_/g, ' ')}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary disabled:bg-gray-400 flex items-center">
                            {isSubmitting && <Loader2 className="animate-spin mr-2" size={16}/>}
                            {isSubmitting ? 'Guardando...' : 'Guardar Rol'}
                        </button>
                    </div>
                </form>
                <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
            </div>
        </div>
    );
};

export default RoleEditModal;
