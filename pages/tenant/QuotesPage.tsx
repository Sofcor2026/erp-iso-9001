import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Loader2, User, Calendar, DollarSign, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { Quote, Contacto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const QuotesPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [clients, setClients] = useState<Contacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedClient, setSelectedClient] = useState('');
    const [monto, setMonto] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, contacts] = await Promise.all([
                api.getCotizaciones(),
                api.getProveedores()
            ]);
            setQuotes(data);
            setClients(contacts.filter(c => c.tipo === 'CLIENTE'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedClient) return;

        setIsSaving(true);
        try {
            await api.addCotizacion({
                clienteId: selectedClient,
                monto: monto,
                items: [],
                fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }, currentUser);

            setIsModalOpen(false);
            fetchData();
            setSelectedClient('');
            setMonto(0);
        } catch (error) {
            alert("Error al guardar cotización");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-brand-primary" />
                        Gestión de Cotizaciones
                    </h1>
                    <p className="text-gray-500">Administre las propuestas comerciales y estados de venta.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    <Plus size={20} />
                    Nueva Cotización
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No hay registros de cotización.</td>
                            </tr>
                        ) : (
                            quotes.map((q) => (
                                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-primary">
                                        {q.numero}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{q.clienteNombre || 'Desconocido'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        ${new Intl.NumberFormat().format(q.monto)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {q.fechaEmision}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${q.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border-green-200' :
                                                q.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-blue-100 text-blue-800 border-blue-200'
                                            }`}>
                                            {q.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Nueva Cotización</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total ($)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        className="w-full border rounded-lg pl-9 p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={monto}
                                        onChange={(e) => setMonto(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    Crear Propuesta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotesPage;
