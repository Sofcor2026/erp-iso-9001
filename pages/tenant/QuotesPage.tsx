import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    Search,
    Loader2,
    Calendar,
    DollarSign,
    FileText,
    Trash2,
    CheckCircle,
    XCircle,
    Eye,
    ChevronLeft
} from 'lucide-react';
import { api } from '../../services/api';
import { Quote, Contacto, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const QuotesPage: React.FC = () => {
    const { user: currentUser, hasPermission } = useAuth();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [clients, setClients] = useState<Contacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    // Form state for NEW quote
    const [selectedClient, setSelectedClient] = useState('');
    const [currentItems, setCurrentItems] = useState<{ id: string, descripcion: string, cantidad: number, precioUnitario: number }[]>([]);
    const [newItem, setNewItem] = useState({ descripcion: '', cantidad: 1, precioUnitario: 0 });
    const [isSaving, setIsSaving] = useState(false);

    const canManageValue = hasPermission('tenant:admin') || (currentUser?.role?.name === 'EDITOR');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, contacts] = await Promise.all([
                api.getCotizaciones(),
                api.getContactos(currentUser?.tenantId)
            ]);
            setQuotes(data);
            setClients(contacts.filter(c => c.tipo === 'CLIENTE'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!newItem.descripcion) return;
        setCurrentItems([...currentItems, { ...newItem, id: Math.random().toString(36).substr(2, 9) }]);
        setNewItem({ descripcion: '', cantidad: 1, precioUnitario: 0 });
    };

    const removeItem = (id: string) => {
        setCurrentItems(currentItems.filter(item => item.id !== id));
    };

    const totalQuote = currentItems.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedClient || currentItems.length === 0) return;

        setIsSaving(true);
        try {
            await api.addCotizacion({
                clienteId: selectedClient,
                monto: totalQuote,
                items: currentItems,
                fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }, currentUser);

            setIsModalOpen(false);
            fetchData();
            // Reset form
            setSelectedClient('');
            setCurrentItems([]);
        } catch (error) {
            alert("Error al guardar cotización");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async (quoteId: string, status: Quote['estado']) => {
        if (!currentUser) return;
        try {
            await api.updateQuoteStatus(quoteId, status, currentUser);
            fetchData();
            if (selectedQuote && selectedQuote.id === quoteId) {
                setSelectedQuote({ ...selectedQuote, estado: status });
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
        <p className="text-gray-500 font-medium animate-pulse italic">Cargando portafolio comercial...</p>
    </div>;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-brand-primary" />
                        Gestión de Cotizaciones
                    </h1>
                    <p className="text-gray-500">Administre las propuestas comerciales y estados de venta con robustez.</p>
                </div>
                {canManageValue && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 font-bold"
                    >
                        <Plus size={20} />
                        Generar Propuesta
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Cotizado</p>
                    <p className="text-xl font-bold text-gray-800">${new Intl.NumberFormat().format(quotes.reduce((acc, q) => acc + q.monto, 0))}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Pendientes</p>
                    <p className="text-xl font-bold text-blue-600">{quotes.filter(q => q.estado === 'Pendiente').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-1">Aprobadas</p>
                    <p className="text-xl font-bold text-green-600">{quotes.filter(q => q.estado === 'Aprobada').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Cerradas/Rechazo</p>
                    <p className="text-xl font-bold text-red-600">{quotes.filter(q => q.estado === 'Rechazada').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-brand-primary italic font-bold">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Propuesta #</th>
                                <th className="px-6 py-4">Cliente / Contacto</th>
                                <th className="px-6 py-4">Valor Total</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic font-medium">No hay registros comerciales disponibles.</td>
                                </tr>
                            ) : (
                                quotes.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-primary tracking-tighter">
                                            {q.numero}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-800">{q.clienteNombre || 'S/N'}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">Asignado a: {q.vendedorNombre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-extrabold">
                                            ${new Intl.NumberFormat().format(q.monto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-300" />
                                                {new Date(q.fechaEmision).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${q.estado === 'Aprobada' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    q.estado === 'Rechazada' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                {q.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedQuote(q)}
                                                className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CREACIÓN robusto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-brand-primary text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 italic">
                                    <FileText size={22} />
                                    Generar Nueva Propuesta Comercial
                                </h2>
                                <p className="text-white/70 text-xs italic font-medium">Complete los conceptos y cantidades para el cliente.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <ChevronLeft className="rotate-180" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 italic">Cliente</label>
                                    <select
                                        required
                                        className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 focus:ring-0 focus:border-brand-primary outline-none text-sm font-bold italic"
                                        value={selectedClient}
                                        onChange={(e) => setSelectedClient(e.target.value)}
                                    >
                                        <option value="">Seleccionar destinatario...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                                    </select>
                                </div>
                                <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 flex flex-col justify-center">
                                    <p className="text-[10px] text-brand-primary uppercase font-bold tracking-widest mb-1">Total Calculado</p>
                                    <p className="text-2xl font-black text-brand-primary">${new Intl.NumberFormat().format(totalQuote)}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 italic border-b pb-2">
                                    Conceptos y Partidas
                                </h3>

                                {/* Item Form */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <div className="md:col-span-6">
                                        <input
                                            placeholder="Descripción del servicio o producto..."
                                            className="w-full border rounded-lg p-2 text-sm italic py-2.5"
                                            value={newItem.descripcion}
                                            onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input
                                            type="number"
                                            placeholder="Cant"
                                            className="w-full border rounded-lg p-2 text-sm text-center py-2.5"
                                            value={newItem.cantidad}
                                            onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                placeholder="Precio Unit"
                                                className="w-full border rounded-lg pl-5 p-2 text-sm py-2.5"
                                                value={newItem.precioUnitario}
                                                onChange={(e) => setNewItem({ ...newItem, precioUnitario: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="w-full h-full bg-brand-primary text-white rounded-lg flex items-center justify-center hover:bg-brand-secondary transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 italic">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 text-gray-500 font-bold uppercase tracking-tight">
                                            <tr>
                                                <th className="px-4 py-2">Ítem</th>
                                                <th className="px-4 py-2 text-center">Cant</th>
                                                <th className="px-4 py-2 text-right">Precio</th>
                                                <th className="px-4 py-2 text-right">Subtotal</th>
                                                <th className="px-4 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {currentItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No se han añadido conceptos a la propuesta.</td>
                                                </tr>
                                            ) : (
                                                currentItems.map((item) => (
                                                    <tr key={item.id} className="bg-white hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-bold text-gray-700">{item.descripcion}</td>
                                                        <td className="px-4 py-3 text-center">{item.cantidad}</td>
                                                        <td className="px-4 py-3 text-right">${new Intl.NumberFormat().format(item.precioUnitario)}</td>
                                                        <td className="px-4 py-3 text-right font-extrabold text-brand-primary">${new Intl.NumberFormat().format(item.cantidad * item.precioUnitario)}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50 shrink-0 italic">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-white transition-all font-bold"
                            >
                                Cancelar Registro
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving || currentItems.length === 0}
                                className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 font-black shadow-lg shadow-brand-primary/20"
                            >
                                {isSaving && <Loader2 size={18} className="animate-spin" />}
                                Emitir Propuesta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal DETALLE robusto */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col font-bold">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div className="italic">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border ${selectedQuote.estado === 'Aprobada' ? 'bg-green-100 text-green-700 border-green-200' :
                                        selectedQuote.estado === 'Rechazada' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                    {selectedQuote.estado}
                                </span>
                                <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                                    <FileText className="text-brand-primary" size={32} />
                                    {selectedQuote.numero}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">{selectedQuote.clienteNombre}</p>
                            </div>
                            <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <ChevronLeft className="rotate-180" size={28} />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto space-y-8 bg-gray-50/30 italic">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                                    <p className="text-gray-700">{new Date(selectedQuote.fechaEmision).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Vencimiento</p>
                                    <p className="text-red-500">{new Date(selectedQuote.fechaVencimiento).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Responsable</p>
                                    <p className="text-gray-700 font-bold">{selectedQuote.vendedorNombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-brand-primary uppercase tracking-widest mb-1">Monto Total</p>
                                    <p className="text-2xl font-black text-brand-primary">${new Intl.NumberFormat().format(selectedQuote.monto)}</p>
                                </div>
                            </div>

                            <div className="space-y-4 shadow-brand-primary">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b pb-2">Conceptos Detallados</h3>
                                <div className="space-y-3">
                                    {selectedQuote.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.descripcion}</p>
                                                <p className="text-[10px] text-gray-500 font-semibold">{item.cantidad} x ${new Intl.NumberFormat().format(item.precioUnitario)}</p>
                                            </div>
                                            <p className="text-lg font-black text-brand-primary tracking-tighter">${new Intl.NumberFormat().format(item.cantidad * item.precioUnitario)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions for Editor/Admin */}
                            {canManageValue && selectedQuote.estado === 'Pendiente' && (
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedQuote.id, 'Rechazada')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-100 transition-all font-black uppercase text-xs tracking-widest"
                                    >
                                        <XCircle size={18} />
                                        Rechazar Propuesta
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedQuote.id, 'Aprobada')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 rounded-2xl border border-green-100 hover:bg-green-100 transition-all font-black uppercase text-xs tracking-widest"
                                    >
                                        <CheckCircle size={18} />
                                        Aprobar y Cerrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotesPage;
