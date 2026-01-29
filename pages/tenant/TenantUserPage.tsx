import React, { useState, useEffect, useCallback } from 'react';
import { User, Tenant } from '../../types';
import { api } from '../../services/api';
import { Users, Plus, Search, Shield, CheckCircle2, XCircle, Mail, AlertTriangle, Trash2 } from 'lucide-react';
import CreateUserModal from '../../components/shared/CreateUserModal';
import { useAuth } from '../../contexts/AuthContext';

const TenantUserPage: React.FC = () => {
    const { user: actor } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Bandera para habilitar/deshabilitar la gestión autónoma por parte del cliente
    const CAN_TENANT_MANAGE_USERS = false;

    const fetchUsers = useCallback(async () => {
        if (!actor?.tenantId) return;
        setLoading(true);
        try {
            const [allUsers, tenantData] = await Promise.all([
                api.getUsers(),
                api.getTenantById(actor.tenantId)
            ]);
            const tenantUsers = allUsers.filter(u => u.tenantId === actor.tenantId);
            setUsers(tenantUsers);
            setTenant(tenantData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [actor?.tenantId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Administración de Equipo</h1>
                    <p className="text-gray-600 mt-1">Gestione los perfiles de Editor y Lector para su empresa.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                    {tenant && (
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-medium text-sm ${users.length >= tenant.userLimit ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            <Users size={16} />
                            Cupo: {users.length} / {tenant.userLimit}
                        </div>
                    )}
                    {(CAN_TENANT_MANAGE_USERS || actor?.role?.name === 'SUPERADMIN') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={tenant ? users.length >= tenant.userLimit : false}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all font-bold"
                        >
                            <Plus size={20} />
                            Invitar Miembro
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {!CAN_TENANT_MANAGE_USERS && actor?.role?.name !== 'SUPERADMIN' && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-blue-200">
                                <Mail className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Gestión por Sofcor</p>
                                <p className="text-xs text-gray-600">Para añadir o eliminar usuarios de su equipo, por favor solicítelo a su asesor.</p>
                            </div>
                        </div>
                        <a
                            href="https://wa.me/573208159920"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm text-center"
                        >
                            Contactar Asesor
                        </a>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">Cargando equipo...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No hay miembros registrados aún.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                    {u.nombre.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.nombre}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                <Shield size={12} />
                                                {u.role.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.activo ? (
                                                <span className="text-green-600 flex items-center gap-1 text-sm font-medium"><CheckCircle2 size={16} /> Activo</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1 text-sm font-medium"><XCircle size={16} /> Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {(CAN_TENANT_MANAGE_USERS || actor?.role?.name === 'SUPERADMIN') ? (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
                                                            await api.deleteUser(u.id, actor!);
                                                            fetchUsers();
                                                        }
                                                    }}
                                                    className="text-gray-400 hover:text-red-600 transition-colors px-2 py-1"
                                                    title="Eliminar usuario"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium italic">Solo lectura</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <CreateUserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchUsers}
                    fixedTenantId={actor?.tenantId}
                />
            )}
        </div>
    );
};

export default TenantUserPage;
