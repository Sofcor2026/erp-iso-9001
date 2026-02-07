import React, { useState, useEffect } from 'react';
import { Gavel, Plus, Search, CheckCircle2, XCircle, Trash2, Edit2, Loader2, Calendar, FileText, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { LegalRequirement } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const LegalMatrixPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const canManage = hasPermission('legal:manage');
    const [requirements, setRequirements] = useState<LegalRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCumplimiento, setFilterCumplimiento] = useState<'ALL' | 'SI' | 'NO'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LegalRequirement | null>(null);

    // Form state
    const [formData, setFormData] = useState<Omit<LegalRequirement, 'id'>>({
        norma: '',
        articulo: '',
        descripcion: '',
        autoridad: '',
        cumplimiento: false,
        evidencia: '',
        fechaVerificacion: new Date().toISOString().split('T')[0]
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRequirements();
    }, []);

    const fetchRequirements = async () => {
        setLoading(true);
        try {
            const data = await api.getLegalMatrix(user?.tenantId);
            setRequirements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequirements = requirements.filter(r => {
        const matchesSearch = r.norma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.autoridad?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesCumplimiento = filterCumplimiento === 'ALL' ||
            (filterCumplimiento === 'SI' ? r.cumplimiento : !r.cumplimiento);
        return matchesSearch && matchesCumplimiento;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            if (editingItem) {
                await api.updateLegalRequirement(editingItem.id, formData, user);
            } else {
                await api.addLegalRequirement(formData, user);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({
                norma: '',
                articulo: '',
                descripcion: '',
                autoridad: '',
                cumplimiento: false,
                evidencia: '',
                fechaVerificacion: new Date().toISOString().split('T')[0]
            });
            fetchRequirements();
        } catch (error) {
            alert("Error al guardar requisito legal");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item: LegalRequirement) => {
        setEditingItem(item);
        setFormData({
            norma: item.norma,
            articulo: item.articulo || '',
            descripcion: item.descripcion,
            autoridad: item.autoridad || '',
            cumplimiento: item.cumplimiento,
            evidencia: item.evidencia || '',
            fechaVerificacion: item.fechaVerificacion || new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Está seguro de eliminar este requisito legal?")) return;
        if (!user) return;
        try {
            await api.deleteLegalRequirement(id, user);
            fetchRequirements();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Matriz Legal (ISO 9001 & SG-SST)</h1>
                    <p className="text-gray-500">Gestione el cumplimiento de la normativa colombiana vigente (Decreto 1072, etc.).</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({
                                norma: '',
                                articulo: '',
                                descripcion: '',
                                autoridad: '',
                                cumplimiento: false,
                                evidencia: '',
                                fechaVerificacion: new Date().toISOString().split('T')[0]
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                    >
                        <Plus size={20} />
                        Nuevo Requisito
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por norma, descripción o autoridad..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white border rounded-lg p-1">
                    <button
                        onClick={() => setFilterCumplimiento('ALL')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterCumplimiento === 'ALL' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterCumplimiento('SI')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterCumplimiento === 'SI' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Cumple
                    </button>
                    <button
                        onClick={() => setFilterCumplimiento('NO')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterCumplimiento === 'NO' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        No Cumple
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Norma / Autoridad</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Descripción / Artículo</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Estado</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Última Verificación</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredRequirements.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{req.norma}</div>
                                    <div className="text-xs text-gray-500 uppercase">{req.autoridad || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-800 line-clamp-2" title={req.descripcion}>{req.descripcion}</div>
                                    {req.articulo && <div className="text-xs text-brand-primary font-bold mt-1">Art. {req.articulo}</div>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${req.cumplimiento ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {req.cumplimiento ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        {req.cumplimiento ? 'CUMPLE' : 'NO CUMPLE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        {req.fechaVerificacion || 'Sin fecha'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(req)}
                                                    className="p-1 text-gray-400 hover:text-brand-primary transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRequirements.length === 0 && (
                    <div className="p-12 text-center">
                        <Gavel size={48} className="mx-auto text-gray-200 mb-4" />
                        <div className="text-gray-400 italic font-medium">No se encontraron requisitos en la matriz legal.</div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-brand-primary font-bold mt-2 hover:underline"
                        >
                            Comenzar a documentar norma
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'Editar Requisito' : 'Nuevo Requisito Legal'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Norma</label>
                                    <input
                                        required
                                        placeholder="Ej: Decreto 1072 de 2015"
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.norma}
                                        onChange={(e) => setFormData({ ...formData, norma: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Autoridad</label>
                                    <input
                                        placeholder="Ej: MinTrabajo"
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.autoridad}
                                        onChange={(e) => setFormData({ ...formData, autoridad: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Artículo(s)</label>
                                    <input
                                        placeholder="Ej: 2.2.4.6.1 al 2.2.4.6.3"
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.articulo}
                                        onChange={(e) => setFormData({ ...formData, articulo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Verificación</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                        value={formData.fechaVerificacion}
                                        onChange={(e) => setFormData({ ...formData, fechaVerificacion: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Requisito</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Copie aquí el texto principal de la obligación legal..."
                                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Evidencia de Cumplimiento / Acción</label>
                                <textarea
                                    rows={2}
                                    placeholder="Ej: Contrato de ARL, Matriz de riesgos actualizada..."
                                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                                    value={formData.evidencia}
                                    onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.cumplimiento}
                                        onChange={(e) => setFormData({ ...formData, cumplimiento: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none focus:ring-4 focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                                <div>
                                    <span className="text-sm font-bold text-gray-700">Estado de Cumplimiento</span>
                                    <p className="text-xs text-gray-500">{formData.cumplimiento ? 'Norma cumplida al 100%' : 'Pendiente de implementación o parcial'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
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
                                    className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : null}
                                    {editingItem ? 'Actualizar Requisito' : 'Guardar en Matriz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LegalMatrixPage;
