import React, { useState, useEffect } from 'react';
import StatCard from '../../components/platform/StatCard';
import { DollarSign, Users, Building, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const PlatformHomePage: React.FC = () => {
    const [stats, setStats] = useState<{ mrr: number; activeTenants: number; totalUsers: number; } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPlatformStats()
            .then(setStats)
            .catch(err => console.error("Failed to fetch platform stats", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard de la Plataforma</h1>
                <p className="text-gray-600 mt-1">Vista general de la salud comercial y técnica del servicio.</p>
            </div>

            {/* Business KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Ingreso Mensual Recurrente (MRR)"
                    value={stats?.mrr.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }) || '$0 COP'}
                    icon={<DollarSign size={24} />}
                />
                <StatCard
                    title="Empresas Activas"
                    value={stats?.activeTenants.toString() || '0'}
                    icon={<Building size={24} />}
                />
                <StatCard
                    title="Usuarios Totales Activos"
                    value={stats?.totalUsers.toString() || '0'}
                    icon={<Users size={24} />}
                />
            </div>

            {/* Charts Section - Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-800">Nuevas Empresas (Últimos 30 días)</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">Gráfico de tendencia no disponible</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-800">Planes más Populares</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">Gráfico de torta no disponible</div>
                </div>
            </div>

            {/* Technical Health */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Salud Técnica</h2>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <ul className="divide-y divide-gray-200">
                        <li className="py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-700">Base de Datos</span>
                            <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-2" /> Operacional</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-700">Cache (Redis)</span>
                            <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-2" /> Operacional</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-700">Almacenamiento (S3)</span>
                            <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-2" /> Operacional</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-700">Latencia API (p95)</span>
                            <span className="flex items-center text-gray-700"><Clock size={16} className="mr-2" /> 120ms</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-700">Tasa de Errores (5xx)</span>
                            <span className="flex items-center text-yellow-600"><AlertCircle size={16} className="mr-2" /> 0.01%</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PlatformHomePage;