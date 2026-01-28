import React, { useState, useEffect, useCallback } from 'react';
import { Role } from '../../types';
import { api } from '../../services/api';
import { ShieldCheck, Plus, Edit, Trash2, Lock } from 'lucide-react';
import RoleEditModal from '../../components/platform/RoleEditModal';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';

const RoleManagementPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const { user } = useAuth();

    const fetchRoles = useCallback(() => {
        setLoading(true);
        api.getRoles()
            .then(setRoles)
            .catch(err => console.error("Failed to fetch roles", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleCreate = () => {
        setRoleToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (role: Role) => {
        setRoleToEdit(role);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!roleToDelete || !user) return;
        try {
            await api.deleteRole(roleToDelete.id, user);
            fetchRoles();
        } catch(e: any) {
            alert(`Error al eliminar rol: ${e.message}`);
        } finally {
            setRoleToDelete(null);
        }
    };

    if (loading) {
        return <div>Cargando roles...</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Roles y Permisos</h1>
                        <p className="text-gray-600 mt-1">Defina roles personalizados para un control de acceso granular.</p>
                    </div>
                    <button onClick={handleCreate} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary flex items-center shadow-sm">
                        <Plus size={16} className="mr-2"/> Crear Nuevo Rol
                    </button>
                </div>

                 <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Rol</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permisos</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 flex items-center">
                                                {role.name}
                                                {role.isDefault && <Lock size={12} className="ml-2 text-gray-400" title="Rol por defecto"/>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-sm">{role.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.permissions.length} asignados</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleEdit(role)} className="text-brand-primary hover:text-brand-secondary p-1 rounded-full hover:bg-blue-100 transition-colors" disabled={role.isDefault}>
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => setRoleToDelete(role)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors" disabled={role.isDefault}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <RoleEditModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchRoles}
                    role={roleToEdit}
                />
            )}
             {roleToDelete && (
                <ConfirmationModal
                    isOpen={!!roleToDelete}
                    onClose={() => setRoleToDelete(null)}
                    onConfirm={handleDelete}
                    title={`Eliminar Rol: ${roleToDelete.name}`}
                    message={`¿Está seguro de que desea eliminar este rol? Esta acción no se puede deshacer y fallará si el rol está actualmente asignado a algún usuario.`}
                    confirmText="Eliminar Rol"
                    confirmColor="red"
                />
            )}
        </>
    )
};

export default RoleManagementPage;
