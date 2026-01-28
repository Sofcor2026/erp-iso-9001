import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Tenant, Plan } from '../../types';
import { Building, Search } from 'lucide-react';
import TenantActions from '../../components/platform/TenantActions';
import CreateTenantModal from '../../components/platform/CreateTenantModal';
import EditTenantModal from '../../components/platform/EditTenantModal';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const TenantListPage: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState<Plan['id'] | ''>('');
    const [filterStatus, setFilterStatus] = useState<Tenant['estado'] | ''>('');
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [tenantToEdit, setTenantToEdit] = useState<Tenant | null>(null);

    const [tenantToSuspend, setTenantToSuspend] = useState<Tenant | null>(null);
    const [tenantToImpersonate, setTenantToImpersonate] = useState<Tenant | null>(null);
    const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const { user, impersonate } = useAuth();
    const navigate = useNavigate();

    const fetchTenants = () => {
        setLoading(true);
        api.getTenants()
            .then(data => setTenants(data))
            .catch(err => console.error("Failed to fetch tenants", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const filteredTenants = useMemo(() => {
        return tenants.filter(tenant => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = tenant.nombre.toLowerCase().includes(searchLower) || tenant.subdominio.toLowerCase().includes(searchLower);
            const matchesPlan = filterPlan ? tenant.planId === filterPlan : true;
            const matchesStatus = filterStatus ? tenant.estado === filterStatus : true;
            return matchesSearch && matchesPlan && matchesStatus;
        });
    }, [tenants, searchTerm, filterPlan, filterStatus]);

    const getStatusChip = (status: Tenant['estado']) => {
        switch (status) {
            case 'Activo':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span>;
            case 'Suspendido':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Suspendido</span>;
            case 'Prueba':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Prueba</span>;
        }
    }

    const handleEditClick = (tenant: Tenant) => {
        setTenantToEdit(tenant);
        setEditModalOpen(true);
    };

    const handleSuspendToggle = async () => {
        if (!tenantToSuspend) return;
        const newStatus = tenantToSuspend.estado === 'Activo' ? 'Suspendido' : 'Activo';
        try {
            await api.updateTenantStatus(tenantToSuspend.id, newStatus);
            fetchTenants(); // Re-fetch to get updated list
        } catch (error) {
            console.error("Failed to update tenant status", error);
            alert("Error al actualizar el estado del tenant.");
        } finally {
            setTenantToSuspend(null);
        }
    };

    const handleImpersonate = async () => {
        if (!tenantToImpersonate || !user) return;
        try {
            await api.logAuditEvent('IMPERSONATE_START', `tenant:${tenantToImpersonate.id}`, user);
            const adminUser = await impersonate(tenantToImpersonate.id);
            if (adminUser) {
                navigate('/tenant/admin');
            } else {
                alert("No se pudo encontrar un administrador para este tenant.");
            }
        } catch (error) {
            console.error("Failed to impersonate", error);
            alert("Error al intentar impersonar al usuario.");
        } finally {
            setTenantToImpersonate(null);
        }
    };
    
    const handleDelete = async () => {
        if (!tenantToDelete || deleteConfirmText !== tenantToDelete.nombre) {
            alert("El nombre del tenant no coincide.");
            return;
        }
        try {
            await api.deleteTenant(tenantToDelete.id);
            fetchTenants();
        } catch (error) {
            console.error("Failed to delete tenant", error);
            alert("Error al eliminar el tenant.");
        } finally {
            setTenantToDelete(null);
            setDeleteConfirmText('');
        }
    };

    if (loading) {
        return <div>Cargando tenants...</div>
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Tenants</h1>
                        <p className="text-gray-600 mt-1">Administre todos los clientes de la plataforma.</p>
                    </div>
                    <button onClick={() => setCreateModalOpen(true)} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary flex items-center shadow-sm">
                        <Building size={16} className="mr-2"/> Crear Nuevo Tenant
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o subdominio..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                    </div>
                     <select value={filterPlan} onChange={e => setFilterPlan(e.target.value as Plan['id'] | '')} className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                        <option value="">Todos los Planes</option>
                        <option value="plan-basic">Básico</option>
                        <option value="plan-pro">Pro</option>
                        <option value="plan-enterprise">Enterprise</option>
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Tenant['estado'] | '')} className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                        <option value="">Todos los Estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Suspendido">Suspendido</option>
                        <option value="Prueba">Prueba</option>
                    </select>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuarios</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Almacenamiento</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTenants.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{tenant.nombre}</div>
                                            <div className="text-sm text-gray-500">{tenant.subdominio}.isodrive.com</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.planNombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{getStatusChip(tenant.estado)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{tenant.userCount} / {tenant.userLimit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.storageUsed.toFixed(1)} GB / {tenant.storageLimit} GB</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tenant.fechaCreacion).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <TenantActions 
                                                tenant={tenant}
                                                onEdit={() => handleEditClick(tenant)}
                                                onSuspend={() => setTenantToSuspend(tenant)}
                                                onImpersonate={() => setTenantToImpersonate(tenant)}
                                                onDelete={() => setTenantToDelete(tenant)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTenants.length === 0 && <div className="p-6 text-center text-gray-500">No se encontraron tenants.</div>}
                    </div>
                </div>
            </div>

            <CreateTenantModal 
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchTenants}
            />

            {tenantToEdit && (
                <EditTenantModal
                    isOpen={isEditModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSuccess={fetchTenants}
                    tenant={tenantToEdit}
                />
            )}

            {tenantToSuspend && (
                <ConfirmationModal
                    isOpen={!!tenantToSuspend}
                    onClose={() => setTenantToSuspend(null)}
                    onConfirm={handleSuspendToggle}
                    title={`${tenantToSuspend.estado === 'Activo' ? 'Suspender' : 'Activar'} Tenant`}
                    message={`¿Está seguro de que desea ${tenantToSuspend.estado === 'Activo' ? 'suspender' : 'activar'} a "${tenantToSuspend.nombre}"? Sus usuarios ${tenantToSuspend.estado === 'Activo' ? 'no' : 'sí'} podrán iniciar sesión.`}
                    confirmText={tenantToSuspend.estado === 'Activo' ? 'Suspender' : 'Activar'}
                    confirmColor={tenantToSuspend.estado === 'Activo' ? 'yellow' : 'green'}
                />
            )}

            {tenantToImpersonate && (
                 <ConfirmationModal
                    isOpen={!!tenantToImpersonate}
                    onClose={() => setTenantToImpersonate(null)}
                    onConfirm={handleImpersonate}
                    title="Impersonar Tenant"
                    message={`Acción Auditada: Está a punto de iniciar sesión como Administrador del tenant "${tenantToImpersonate.nombre}". Esta acción es solo para fines de soporte y quedará registrada. ¿Continuar?`}
                    confirmText="Continuar e Impersonar"
                    confirmColor="blue"
                />
            )}
            
            {tenantToDelete && (
                 <ConfirmationModal
                    isOpen={!!tenantToDelete}
                    onClose={() => { setTenantToDelete(null); setDeleteConfirmText(''); }}
                    onConfirm={handleDelete}
                    title={`Eliminar Tenant: ${tenantToDelete.nombre}`}
                    confirmText="Eliminar Permanentemente"
                    confirmColor="red"
                    isConfirmDisabled={deleteConfirmText !== tenantToDelete.nombre}
                >
                    <p className="text-sm text-gray-600 mb-4">
                        Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos, documentos y usuarios asociados a este tenant.
                    </p>
                    <p className="text-sm text-gray-700 font-medium mb-2">
                        Para confirmar, por favor escriba "<strong className="text-red-600">{tenantToDelete.nombre}</strong>" en el campo de abajo.
                    </p>
                    <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                 </ConfirmationModal>
            )}
        </>
    );
};

export default TenantListPage;