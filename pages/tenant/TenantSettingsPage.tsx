import React from 'react';
import { Settings, Shield, Bell, User } from 'lucide-react';

const TenantSettingsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 text-premium-gradient">Configuración de la Organización</h1>
                <p className="text-gray-600 mt-1">Administre las preferencias y personalización de su tenant.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <Settings className="text-blue-600" size={24} />
                        </div>
                        <h2 className="text-lg font-semibold">General</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm" placeholder="Nombre..." />
                        </div>
                        <button className="mt-2 px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-secondary transition-colors">
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <Shield className="text-purple-600" size={24} />
                        </div>
                        <h2 className="text-lg font-semibold">Seguridad</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Configure las políticas de acceso y autenticación para sus usuarios.</p>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium">Autenticación de 2 Factores</span>
                        <div className="w-12 h-6 bg-gray-200 rounded-full cursor-not-allowed"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center mb-4 text-yellow-600">
                    <Bell className="mr-2" size={20} />
                    <h3 className="font-semibold text-gray-800">Nota del Sistema</h3>
                </div>
                <p className="text-sm text-gray-600">
                    Actualmente se encuentra en la versión de desarrollo. Algunas opciones de personalización avanzada (Logo, Colores de Marca) estarán disponibles en la próxima actualización.
                </p>
            </div>
        </div>
    );
};

export default TenantSettingsPage;
