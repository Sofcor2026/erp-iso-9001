import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Building, Mail, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();

    const permissionLabels: Record<string, string> = {
        'tenant:admin': 'Administrador de Empresa',
        'tenant:view_master_list': 'Ver Listado Maestro',
        'tenant:manage_users': 'Gestionar Usuarios',
        'document:create': 'Crear Documentos',
        'document:update': 'Actualizar Documentos',
        'document:publish': 'Publicar Documentos',
        'document:submit': 'Enviar a Revisión',
        'document:download': 'Descargar Documentos',
        'document:view_all': 'Acceso Total a Documentos',
        'kpi:manage': 'Gestionar Indicadores (KPIs)',
        'kpi:read': 'Ver Indicadores (KPIs)',
        'form:create': 'Generar Formularios y OCs',
        'legal:manage': 'Gestionar Matriz Legal',
        'legal:read': 'Consultar Matriz Legal',
        'competency:manage': 'Gestionar Competencias y Formación',
        'competency:read': 'Ver Perfiles y Plan de Formación',
        'platform:access': 'Acceso a Consola de Plataforma'
    };

    if (!user) return null;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-brand-primary text-4xl font-bold">
                            {user.nombre.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{user.nombre}</h1>
                            <p className="text-gray-500 font-medium">{user.role?.name} - {user.email}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${user.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {user.activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Información de la Cuenta
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                                    <Mail size={12} /> Email
                                </p>
                                <p className="text-gray-800 font-medium">{user.email}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                                    <Shield size={12} /> Rol
                                </p>
                                <p className="text-gray-800 font-medium">{user.role?.name}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                                    <Building size={12} /> ID Empresa
                                </p>
                                <p className="text-gray-800 font-mono text-xs truncate">{user.tenantId || 'SISTEMA'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1.5">
                                    <Calendar size={12} /> Fecha de Registro
                                </p>
                                <p className="text-gray-800 font-medium">--/--/----</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Seguridad</h2>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                            Cambiar Contraseña
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-brand-primary p-6 rounded-2xl text-white shadow-lg shadow-brand-primary/20">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Shield size={20} /> Permisos Habilitados
                        </h3>
                        <p className="text-xs opacity-80 mb-4">Acciones permitidas por tu nivel de acceso.</p>
                        <ul className="space-y-2">
                            {user.role?.permissions.map(perm => (
                                <li key={perm} className="text-xs bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2 border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                                    {permissionLabels[perm] || perm}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
