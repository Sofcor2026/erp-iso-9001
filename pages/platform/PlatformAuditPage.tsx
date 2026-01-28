import React, { useState, useEffect } from 'react';
import { Shield, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

const PlatformAuditPage: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.getAuditLogs()
            .then(setAuditLogs)
            .catch(err => console.error("Failed to load audit logs", err))
            .finally(() => setLoading(false));
    }, []);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Auditoría de la Plataforma</h1>
                <p className="text-gray-600 mt-1">Revise las acciones sensibles realizadas a nivel de plataforma.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
                <input type="text" placeholder="Buscar por actor o acción..." className="w-full md:w-1/3 input-style" />
                <input type="date" className="input-style" />
                <button className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                    <Filter size={16} className="mr-2"/> Filtrar
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurso</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             {loading ? (
                                <tr><td colSpan={4} className="text-center p-6 text-gray-500">Cargando registros...</td></tr>
                            ) : auditLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={new Date(log.timestamp).toString()}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.actor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{log.action}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{log.resource}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
        </div>
    );
};

export default PlatformAuditPage;