import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Building, Trash2, Tag, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Contacto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const ContactsPage: React.FC = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'CLIENTE' | 'PROVEEDOR'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        razonSocial: '',
        rut_nit: '',
        email: '',
        tipo: 'CLIENTE' as 'CLIENTE' | 'PROVEEDOR'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const data = await api.getContactos(user?.tenantId);
            setContacts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.rut_nit.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || c.tipo === filterType;
        return matchesSearch && matchesType;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            await api.addContacto(formData, user);

            setIsModalOpen(false);
            setFormData({ razonSocial: '', rut_nit: '', email: '', tipo: 'CLIENTE' });
            fetchContacts();
        } catch (error) {
            alert("Error al guardar contacto");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Clientes y Proveedores</h1>
                    <p className="text-gray-500">Gestione la base de datos de terceros para cotizaciones y compras.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Contacto
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o NIT..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white border rounded-lg p-1">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'ALL' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('CLIENTE')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'CLIENTE' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Clientes
                    </button>
                    <button
                        onClick={() => setFilterType('PROVEEDOR')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'PROVEEDOR' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Proveedores
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Razón Social</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">NIT / RUT</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredContacts.map(contact => (
                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{contact.razonSocial}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{contact.rut_nit}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${contact.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        <Tag size={12} />
                                        {contact.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{contact.email}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredContacts.length === 0 && (
                    <div className="p-10 text-center text-gray-400 italic">No se encontraron contactos.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Nuevo Contacto</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Contacto</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'CLIENTE' })}
                                        className={`py-2 rounded-md text-sm font-bold transition-all ${formData.tipo === 'CLIENTE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Cliente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'PROVEEDOR' })}
                                        className={`py-2 rounded-md text-sm font-bold transition-all ${formData.tipo === 'PROVEEDOR' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Proveedor
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Razón Social</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.razonSocial}
                                        onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">NIT / RUT</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.rut_nit}
                                        onChange={(e) => setFormData({ ...formData, rut_nit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Contacto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactsPage;
