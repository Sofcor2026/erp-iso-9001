import React, { useState, useEffect } from 'react';
import { Role, Tenant } from '../../types';
import { X, UserPlus, Loader2, Mail, Shield, Building, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    fixedTenantId?: string; // If provided, the user can't choose tenant
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess, fixedTenantId }) => {
    const { user: actor } = useAuth();
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [tenantId, setTenantId] = useState(fixedTenantId || '');

    const [roles, setRoles] = useState<Role[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Fetch Roles
            api.getRoles().then(r => {
                setRoles(r);
                if (r.length > 0) setRoleId(r.find(role => role.name === 'EDITOR')?.id || r[0].id);
            });

            // Fetch Tenants only if SuperAdmin and no fixedTenantId
            if (actor?.role?.name === 'SUPERADMIN' && !fixedTenantId) {
                api.getTenants().then(setTenants);
            }
        }
    }, [isOpen, actor, fixedTenantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actor) return;

        if (!nombre || !email || !password || !roleId || (!tenantId && !fixedTenantId)) {
            setError("Por favor complete todos los campos.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.createUser({
                nombre,
                email,
                password,
                roleId,
                tenantId: fixedTenantId || tenantId
            }, actor);

            onSuccess();
            onClose();
            setNombre('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || "Error al crear usuario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserPlus className="text-blue-600" size={24} />
                        Crear Usuario
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Ana Maria"
                            />
                            <UserPlus className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="ana@empresa.com"
                            />
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña Inicial</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">El usuario podrá cambiarla después.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
                            <div className="relative">
                                <select
                                    value={roleId}
                                    onChange={e => setRoleId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                >
                                    {roles
                                        .filter(r => {
                                            if (actor?.role?.name === 'SUPERADMIN') return true;
                                            // El administrador del tenant solo puede crear Editores o Lectores
                                            return r.name === 'EDITOR' || r.name === 'LECTOR';
                                        })
                                        .map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))
                                    }
                                </select>
                                <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                        </div>

                        {!fixedTenantId && actor?.role?.name === 'SUPERADMIN' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa</label>
                                <div className="relative">
                                    <select
                                        value={tenantId}
                                        onChange={e => setTenantId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                    >
                                        <option value="">Seleccione...</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                    <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
