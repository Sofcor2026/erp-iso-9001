import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { SupplierEvaluation, Contacto } from '../../types';
import {
    Plus,
    Search,
    Truck,
    Star,
    Calendar,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowUpRight,
    Trophy,
    Target,
    ChevronRight,
    X,
    Save,
    Award,
    Clock,
    DollarSign,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';

const SupplierEvaluationPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
    const [suppliers, setSuppliers] = useState<Contacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New Eval Form State
    const [newEval, setNewEval] = useState({
        contacto_id: '',
        fecha_evaluacion: new Date().toISOString().split('T')[0],
        criterioCalidad: 50,
        criterioTiempo: 50,
        criterioPrecio: 50,
        observaciones: ''
    });

    const canEvaluate = hasPermission('supplier:evaluate');

    useEffect(() => {
        if (user?.tenantId) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [evals, contacts] = await Promise.all([
                api.getSupplierEvaluations(user?.tenantId),
                api.getContactos(user?.tenantId)
            ]);
            setEvaluations(evals);
            setSuppliers(contacts.filter(c => c.tipo === 'PROVEEDOR'));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateFinalScore = () => {
        // Simple equal weights for now: (Quality + Time + Price) / 3
        return Math.round((newEval.criterioCalidad + newEval.criterioTiempo + newEval.criterioPrecio) / 3);
    };

    const getStatusForScore = (score: number) => {
        if (score >= 85) return 'Aprobado';
        if (score >= 70) return 'Condicionado';
        return 'No Apto';
    };

    const handleCreateEval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newEval.contacto_id) return;

        const score = calculateFinalScore();
        const status = getStatusForScore(score);

        try {
            setIsSaving(true);
            await api.addSupplierEvaluation({
                ...newEval,
                puntajeFinal: score,
                estado_proveedor: status
            }, user);
            await fetchData();
            setIsCreateModalOpen(false);
            setNewEval({
                contacto_id: '',
                fecha_evaluacion: new Date().toISOString().split('T')[0],
                criterioCalidad: 50,
                criterioTiempo: 50,
                criterioPrecio: 50,
                observaciones: ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Aprobado': return 'bg-green-100 text-green-700 border-green-200';
            case 'Condicionado': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'No Apto': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-orange-600';
        return 'text-red-600';
    };

    const filteredEvaluations = evaluations.filter(e =>
        e.contactoNombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 italic font-bold">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-[2.5rem] font-black text-gray-800 flex items-center gap-4 leading-none tracking-tight italic">
                        <Award className="text-brand-primary" size={48} />
                        Evaluación y Control de Proveedores
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg font-bold italic">ISO 9001:2015 Clause 8.4 - Evaluación de proveedores externos</p>
                </div>
                {canEvaluate && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-[2rem] hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/30 font-black uppercase text-sm tracking-widest group"
                    >
                        <Plus size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                        Ejecutar Evaluación
                    </button>
                )}
            </div>

            {/* Performance Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative group font-bold">
                    <Trophy size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.3em] mb-2">Estado de Suministros</p>
                        <p className="text-5xl font-black mb-1">{evaluations.filter(e => e.estado_proveedor === 'Aprobado').length}</p>
                        <p className="text-sm font-bold opacity-80 italic italic">Proveedores Calificados como APTOS</p>
                        <div className="mt-6 flex items-center gap-2 text-xs font-black bg-white/20 w-fit px-4 py-2 rounded-2xl backdrop-blur-md">
                            <CheckCircle2 size={16} />
                            <span className="uppercase tracking-widest">Nivel de Confianza Alto</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col justify-center relative overflow-hidden group shadow-brand-primary italic">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={80} /></div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-2 font-bold italic">ISO Quality Score</p>
                    <p className="text-5xl font-black text-gray-800 mb-1">
                        {evaluations.length > 0
                            ? (evaluations.reduce((acc, e) => acc + e.puntajeFinal, 0) / evaluations.length).toFixed(1)
                            : '0.0'}
                    </p>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest italic">Promedio General del Sistema</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex flex-col justify-center relative overflow-hidden group shadow-brand-primary">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle size={80} /></div>
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.3em] mb-2 font-bold italic italic font-bold">Alertas en Cadena</p>
                    <p className="text-5xl font-black text-red-600 mb-1">
                        {evaluations.filter(e => e.estado_proveedor === 'No Apto').length}
                    </p>
                    <p className="text-xs text-red-300 font-black uppercase tracking-widest italic font-bold">Proveedores Críticos / No Aptos</p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden font-black text-brand-primary italic">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-50/30">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar en historial de evaluaciones..."
                            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-none focus:ring-0 bg-white shadow-sm font-bold text-gray-700 italic border-2 border-transparent focus:border-brand-primary/30 transition-all text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto text-brand-primary font-bold italic">
                    {loading ? (
                        <div className="p-24 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="text-lg font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em] italic">Analizando desempeño comercial...</p>
                        </div>
                    ) : filteredEvaluations.length > 0 ? (
                        <table className="w-full text-left font-bold italic">
                            <thead className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b">
                                <tr>
                                    <th className="px-8 py-6">Proveedor / Entidad</th>
                                    <th className="px-8 py-6">Fecha Eval</th>
                                    <th className="px-8 py-6">Puntaje ISO</th>
                                    <th className="px-8 py-6">Variables (C/T/P)</th>
                                    <th className="px-8 py-6">Dictamen</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-black">
                                {filteredEvaluations.map((evalu) => (
                                    <tr key={evalu.id} className="hover:bg-gray-50/30 transition-all group font-bold font-black">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-brand-primary/5 flex items-center justify-center text-brand-primary shadow-inner">
                                                    <Truck size={24} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-gray-800 group-hover:text-brand-primary transition-colors underline decoration-brand-primary/10 decoration-2 underline-offset-4">{evalu.contactoNombre}</span>
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">ID Fiscal: {evalu.contacto_id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold italic">
                                                <Calendar size={16} className="text-gray-300" />
                                                {new Date(evalu.fecha_evaluacion).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-800 shadow-sm border border-gray-100">
                                                    {Math.round(evalu.puntajeFinal)}
                                                </div>
                                                <div className="flex-1 min-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${evalu.puntajeFinal >= 85 ? 'bg-green-500' : evalu.puntajeFinal >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                        style={{ width: `${evalu.puntajeFinal}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 italic font-bold">
                                            <div className="flex items-center gap-6 text-[10px] font-black text-gray-400">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="uppercase tracking-[0.2em] opacity-40">Calidad</span>
                                                    <span className="text-gray-800 text-sm">{evalu.criterioCalidad}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="uppercase tracking-[0.2em] opacity-40">Tiempo</span>
                                                    <span className="text-gray-800 text-sm">{evalu.criterioTiempo}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="uppercase tracking-[0.2em] opacity-40">Precio</span>
                                                    <span className="text-gray-800 text-sm">{evalu.criterioPrecio}%</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${getStatusStyle(evalu.estado_proveedor)}`}>
                                                {evalu.estado_proveedor}
                                            </span>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <button className="p-3 text-gray-300 hover:text-brand-primary hover:bg-brand-primary/5 rounded-2xl transition-all">
                                                <ChevronRight size={24} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-24 text-center font-bold italic font-black">
                            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-inner">
                                <Truck className="text-gray-200" size={64} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Sin Historial de Evaluación</h3>
                            <p className="text-gray-400 max-w-sm mx-auto text-lg italic leading-relaxed">
                                Comience evaluando un proveedor externo para asegurar la calidad de sus entradas según ISO 9001.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Creación INTERACTIVO */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
                    <div className="bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] font-bold border-8 border-white italic">
                        <div className="px-12 py-10 bg-brand-primary text-white flex justify-between items-center shrink-0 shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16 blur-3xl"></div>
                            <div className="relative z-10 font-bold italic">
                                <div className="flex items-center gap-3 mb-2 font-bold italic">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/20">Control de Entradas</span>
                                    <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">Procedimiento ISO: 004</span>
                                </div>
                                <h2 className="text-4xl font-black flex items-center gap-4 tracking-tight font-bold italic">
                                    <Award size={48} className="text-white/90" />
                                    Nueva Evaluación de Desempeño
                                </h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="relative z-10 p-4 hover:bg-white/10 rounded-[2rem] transition-all">
                                <X size={36} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEval} className="flex-1 overflow-y-auto p-12 space-y-12 bg-gray-50/50 italic font-bold">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                {/* Details & Context */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2 italic font-bold">Entidad a Evaluar</label>
                                            <select
                                                required
                                                className="w-full px-6 py-4 rounded-[1.5rem] border-none bg-white shadow-xl focus:ring-4 focus:ring-brand-primary/10 text-sm font-black text-gray-700 italic border-2 border-gray-100 h-16 shadow-brand-primary"
                                                value={newEval.contacto_id}
                                                onChange={e => setNewEval({ ...newEval, contacto_id: e.target.value })}
                                            >
                                                <option value="">Seleccione Proveedor Registrado...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.razon_social}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2 italic">Fecha de Auditoría Interna</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-6 py-4 rounded-[1.5rem] border-none bg-white shadow-xl focus:ring-4 focus:ring-brand-primary/10 text-sm font-black text-gray-700 italic border-2 border-gray-100 h-16 shadow-brand-primary"
                                                value={newEval.fecha_evaluacion}
                                                onChange={e => setNewEval({ ...newEval, fecha_evaluacion: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-2 italic">Observaciones del Evaluador</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Describa el sustento de la calificación técnica..."
                                                className="w-full px-6 py-4 rounded-[1.5rem] border-none bg-white shadow-xl focus:ring-4 focus:ring-brand-primary/10 text-sm font-black text-gray-700 italic border-2 border-gray-100 shadow-brand-primary"
                                                value={newEval.observaciones}
                                                onChange={e => setNewEval({ ...newEval, observaciones: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Scoring Logic */}
                                <div className="bg-white p-10 rounded-[3.5rem] border-4 border-white shadow-2xl relative font-bold italic">
                                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.4em] mb-10 flex items-center gap-3 italic">
                                        <Activity size={18} />
                                        Métricas de Cumplimiento
                                    </h4>

                                    <div className="space-y-10">
                                        {/* Slider: Calidad */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center italic">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 italic">
                                                    <CheckCircle2 size={12} className="text-green-500" />
                                                    Calidad del Producto/Servicio
                                                </span>
                                                <span className="text-lg font-black text-gray-800">{newEval.criterioCalidad}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="1"
                                                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-primary"
                                                value={newEval.criterioCalidad}
                                                onChange={e => setNewEval({ ...newEval, criterioCalidad: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        {/* Slider: Tiempo */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center italic">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 italic">
                                                    <Clock size={12} className="text-blue-500" />
                                                    Tiempo de Entrega / Cumplimiento
                                                </span>
                                                <span className="text-lg font-black text-gray-800">{newEval.criterioTiempo}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="1"
                                                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-primary shadow-brand-primary"
                                                value={newEval.criterioTiempo}
                                                onChange={e => setNewEval({ ...newEval, criterioTiempo: parseInt(e.target.value) })}
                                            />
                                        </div>

                                        {/* Slider: Precio */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center italic">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 italic">
                                                    <DollarSign size={12} className="text-amber-500" />
                                                    Competitividad en Precio
                                                </span>
                                                <span className="text-lg font-black text-gray-800">{newEval.criterioPrecio}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="1"
                                                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-primary italic shadow-brand-primary"
                                                value={newEval.criterioPrecio}
                                                onChange={e => setNewEval({ ...newEval, criterioPrecio: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-10 border-t-2 border-dashed border-gray-100 flex flex-col items-center italic">
                                        <div className={`w-32 h-32 rounded-[2.5rem] flex flex-col items-center justify-center border-4 border-white shadow-2xl transition-all duration-500 mb-4 ${calculateFinalScore() >= 85 ? 'bg-green-500 text-white rotate-6' :
                                                calculateFinalScore() >= 70 ? 'bg-orange-500 text-white -rotate-6' :
                                                    'bg-red-500 text-white rotate-12'
                                            }`}>
                                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Puntaje</span>
                                            <span className="text-4xl font-black">{calculateFinalScore()}</span>
                                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">ISO</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] font-bold italic">Resultado del Dictamen</p>
                                        <p className="text-xl font-black text-gray-800 uppercase tracking-widest mt-1 italic">{getStatusForScore(calculateFinalScore())}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-10 pt-10 border-t border-gray-100 font-bold italic shadow-brand-primary">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-12 py-5 text-gray-400 font-black uppercase text-xs tracking-[0.4em] hover:text-gray-600 transition-colors italic"
                                >
                                    Abortar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || !newEval.contacto_id}
                                    className="px-16 py-6 bg-brand-primary text-white rounded-[2rem] hover:bg-brand-secondary font-black uppercase text-xs tracking-[0.4em] transition-all shadow-2xl shadow-brand-primary/40 flex items-center gap-4 disabled:grayscale disabled:opacity-50 italic"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                    Finalizar Evaluación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierEvaluationPage;
