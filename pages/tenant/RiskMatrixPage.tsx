import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { RiskMatrix } from '../../types';
import {
    Plus,
    Search,
    AlertTriangle,
    Shield,
    Target,
    Activity,
    Filter,
    Loader2,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    X,
    Save,
    Calendar,
    ChevronRight,
    Info,
    CheckCircle2
} from 'lucide-react';

const RiskMatrixPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const [risks, setRisks] = useState<RiskMatrix[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New Risk Form State
    const [newRisk, setNewRisk] = useState({
        proceso: '',
        tipo: 'Riesgo' as 'Riesgo' | 'Oportunidad',
        descripcion: '',
        causas: '',
        consecuencias: '',
        probabilidad: 1,
        impacto: 1,
        plan_mitigacion: '',
        responsable_id: ''
    });

    const canManageRisks = hasPermission('risk:manage');

    useEffect(() => {
        if (user?.tenantId) {
            fetchRisks();
        }
    }, [user]);

    const fetchRisks = async () => {
        try {
            setLoading(true);
            const data = await api.getRiskMatrix(user?.tenantId);
            setRisks(data);
        } catch (error) {
            console.error('Error fetching risk matrix:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRisk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            setIsSaving(true);
            await api.addRiskMatrix(newRisk, user);
            await fetchRisks();
            setIsCreateModalOpen(false);
            setNewRisk({
                proceso: '',
                tipo: 'Riesgo',
                descripcion: '',
                causas: '',
                consecuencias: '',
                probabilidad: 1,
                impacto: 1,
                plan_mitigacion: '',
                responsable_id: ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const getRiskLevel = (prob: number, imp: number) => {
        const score = prob * imp;
        if (score >= 15) return { label: 'Extremo', color: 'bg-red-600', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        if (score >= 10) return { label: 'Alto', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        if (score >= 5) return { label: 'Medio', color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        return { label: 'Bajo', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    };

    const filteredRisks = risks.filter(r =>
        r.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.proceso.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 italic font-bold">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-[2.5rem] font-black text-gray-800 flex items-center gap-4 leading-none tracking-tight">
                        <AlertTriangle className="text-orange-500" size={48} />
                        Gestión de Riesgos y Oportunidades
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg font-bold italic">ISO 9001:2015 - Pensamiento Basado en Riesgos (Capítulo 6.1)</p>
                </div>
                {canManageRisks && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/30 font-black uppercase text-sm tracking-widest group"
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                        Identificar Hallazgo
                    </button>
                )}
            </div>

            {/* Dashboard Matriz */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-40 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600"><AlertTriangle size={24} /></div>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-50/50 px-2 py-1 rounded-lg">Crítico</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-800">{risks.filter(r => r.probabilidad * r.impacto >= 15).length}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-black">Riesgos Extremos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-40 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><ShieldCheck size={24} /></div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-50/50 px-2 py-1 rounded-lg">Protegido</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-800">{risks.filter(r => r.plan_mitigacion).length}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-black">Con Plan de Mitigación</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-40 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-50/50 px-2 py-1 rounded-lg">Crecimiento</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-800">{risks.filter(r => r.tipo === 'Oportunidad').length}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-black">Oportunidades</p>
                    </div>
                </div>
                <div className="bg-brand-primary p-6 rounded-[2rem] shadow-xl shadow-brand-primary/20 flex flex-col justify-between h-40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80} /></div>
                    <div className="z-10 bg-white/20 p-2 rounded-xl w-fit"><Activity className="text-white" size={20} /></div>
                    <div className="z-10">
                        <p className="text-3xl font-black text-white">{risks.length}</p>
                        <p className="text-xs text-white/70 uppercase tracking-widest font-black">Total Matriz</p>
                    </div>
                </div>
            </div>

            {/* Matrix Filters & Heatmap Toggle */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden text-brand-primary italic">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-50/30">
                    <div className="relative flex-1 max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Filtrar por proceso o descripción crítica..."
                            className="w-full pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-0 bg-white shadow-sm font-bold text-gray-700 italic border-2 border-transparent focus:border-brand-primary/30 transition-all text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-4 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-24 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="text-lg font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Consultando panorama de riesgos...</p>
                        </div>
                    ) : filteredRisks.length > 0 ? (
                        <table className="w-full text-left font-bold">
                            <thead className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b">
                                <tr>
                                    <th className="px-8 py-6">Hallazgo / Hallazgo</th>
                                    <th className="px-8 py-6">Tipo</th>
                                    <th className="px-8 py-6 text-center">Severidad (P x I)</th>
                                    <th className="px-8 py-6">Nivel</th>
                                    <th className="px-8 py-6">Acción de Control</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-bold">
                                {filteredRisks.map((risk) => {
                                    const level = getRiskLevel(risk.probabilidad, risk.impacto);
                                    return (
                                        <tr key={risk.id} className="hover:bg-gray-50/50 transition-all group">
                                            <td className="px-8 py-8">
                                                <div className="flex flex-col gap-1.5 max-w-md">
                                                    <span className="text-lg font-black text-gray-800 leading-tight group-hover:text-brand-primary transition-colors">{risk.descripcion}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-lg">{risk.proceso}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${risk.tipo === 'Riesgo' ? 'text-red-500' : 'text-green-500'}`}>
                                                    {risk.tipo === 'Riesgo' ? <AlertTriangle size={14} /> : <ArrowUpRight size={14} />}
                                                    {risk.tipo}
                                                </span>
                                            </td>
                                            <td className="px-8 py-8 text-center">
                                                <div className="flex items-center justify-center gap-2 font-black text-gray-800 text-lg">
                                                    <span className="text-gray-300 transform scale-75">{risk.probabilidad} x {risk.impacto} =</span>
                                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${level.color} shadow-lg shadow-${level.color.split('-')[1]}-500/30`}>
                                                        {risk.probabilidad * risk.impacto}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm ${level.bg} ${level.text} ${level.border}`}>
                                                    {level.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-8">
                                                {risk.plan_mitigacion ? (
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 w-fit">
                                                        <ShieldCheck size={16} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1 max-w-[150px]">{risk.plan_mitigacion}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-300 uppercase italic">Sin Mitigación</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-8 text-right">
                                                <button className="p-3 text-gray-300 hover:text-brand-primary hover:bg-brand-primary/5 rounded-2xl transition-all">
                                                    <ChevronRight size={24} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-24 text-center font-bold">
                            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-inner">
                                <Shield className="text-gray-200" size={64} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Escenario Bajo Control</h3>
                            <p className="text-gray-400 max-w-sm mx-auto text-lg italic leading-relaxed">
                                No se han identificado eventos activos en la matriz de riesgos para los filtros seleccionados.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Creación/Interactivo */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <div className="bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] font-bold border-8 border-white">
                        <div className="px-10 py-8 bg-brand-primary text-white flex justify-between items-center shrink-0 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                            <div className="relative z-10 transition-all italic">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 italic">Modulo ISO v2.0</span>
                                    <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">Metodología 5x5</span>
                                </div>
                                <h2 className="text-3xl font-black flex items-center gap-4 italic font-bold">
                                    <Shield size={40} className="text-white" />
                                    Identificación de Riesgo/Oportunidad
                                </h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="relative z-10 p-3 hover:bg-white/10 rounded-3xl transition-all">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRisk} className="flex-1 overflow-y-auto p-12 space-y-12 bg-gray-50/30 italic">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Side: Details */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Info size={16} />
                                            Información Contextual
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2 shadow-brand-primary">Tipo de Evento</label>
                                                <div className="flex p-1 bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRisk({ ...newRisk, tipo: 'Riesgo' })}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${newRisk.tipo === 'Riesgo' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        RIESGO
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRisk({ ...newRisk, tipo: 'Oportunidad' })}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${newRisk.tipo === 'Oportunidad' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        OPORTUNIDAD
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Proceso</label>
                                                <input
                                                    required
                                                    placeholder="Ej: Operaciones..."
                                                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-brand-primary outline-none transition-all text-sm font-bold shadow-brand-primary h-[54px]"
                                                    value={newRisk.proceso}
                                                    onChange={e => setNewRisk({ ...newRisk, proceso: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Descripción del Hallazgo</label>
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="Describa el evento identificado..."
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-brand-primary outline-none transition-all text-sm font-bold h-24  shadow-brand-primary"
                                                value={newRisk.descripcion}
                                                onChange={e => setNewRisk({ ...newRisk, descripcion: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Causas Posibles</label>
                                            <textarea
                                                rows={2}
                                                placeholder="¿Qué origina esto?"
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-brand-primary outline-none transition-all text-xs font-bold shadow-brand-primary"
                                                value={newRisk.causas}
                                                onChange={e => setNewRisk({ ...newRisk, causas: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Consecuencias</label>
                                            <textarea
                                                rows={2}
                                                placeholder="Impacto en el sistema..."
                                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-brand-primary outline-none transition-all text-xs font-bold shadow-brand-primary"
                                                value={newRisk.consecuencias}
                                                onChange={e => setNewRisk({ ...newRisk, consecuencias: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Scoring & Mitigation */}
                                <div className="space-y-8 bg-white/50 p-8 rounded-[3rem] border-2 border-white shadow-sm font-bold italic">
                                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                        <Activity size={16} />
                                        Evaluación de Severidad
                                    </h4>

                                    <div className="flex flex-col gap-8">
                                        {/* Probabilidad Slider */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pl-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Probabilidad de Ocurrencia</span>
                                                <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-black text-gray-800 shadow-inner">{newRisk.probabilidad}</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="5" step="1"
                                                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-primary"
                                                value={newRisk.probabilidad}
                                                onChange={e => setNewRisk({ ...newRisk, probabilidad: parseInt(e.target.value) })}
                                            />
                                            <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] px-1 italic">
                                                <span>Muy Baja</span>
                                                <span>Remota</span>
                                                <span>Posible</span>
                                                <span>Frecuente</span>
                                                <span>Casi Seguro</span>
                                            </div>
                                        </div>

                                        {/* Impacto Slider */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pl-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Impacto en el Negocio</span>
                                                <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-black text-gray-800 shadow-inner">{newRisk.impacto}</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="5" step="1"
                                                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-primary"
                                                value={newRisk.impacto}
                                                onChange={e => setNewRisk({ ...newRisk, impacto: parseInt(e.target.value) })}
                                            />
                                            <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] px-1">
                                                <span>Insignificante</span>
                                                <span>Menor</span>
                                                <span>Moderado</span>
                                                <span>Mayor</span>
                                                <span>Catastrófico</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Result */}
                                    <div className="pt-6 border-t-2 border-dashed border-gray-100">
                                        <div className="flex items-center justify-between px-6 py-6 bg-white rounded-3xl border-2 border-gray-50 shadow-sm relative overflow-hidden group">
                                            <div className={`absolute top-0 right-0 w-1/3 h-full opacity-10 ${getRiskLevel(newRisk.probabilidad, newRisk.impacto).color} skew-x-12`}></div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Nivel de Riesgo Inherente</p>
                                                <p className="text-3xl font-black text-gray-800 tracking-tighter">Puntaje: {newRisk.probabilidad * newRisk.impacto}</p>
                                            </div>
                                            <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl ${getRiskLevel(newRisk.probabilidad, newRisk.impacto).color}`}>
                                                {getRiskLevel(newRisk.probabilidad, newRisk.impacto).label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 italic">Plan de Mitigación / Contingencia</label>
                                        <textarea
                                            rows={2}
                                            placeholder="¿Qué acciones se tomarán para controlar esto?"
                                            className="w-full px-5 py-4 rounded-3xl border-2 border-gray-100 bg-white shadow-sm focus:border-brand-primary outline-none transition-all text-sm font-bold shadow-brand-primary italic"
                                            value={newRisk.plan_mitigacion}
                                            onChange={e => setNewRisk({ ...newRisk, plan_mitigacion: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-12 pb-6 italic">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-10 py-5 text-gray-400 font-black uppercase text-xs tracking-[0.3em] hover:text-gray-600 transition-colors"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-14 py-5 bg-brand-primary text-white rounded-3xl hover:bg-brand-secondary font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl shadow-brand-primary/40 flex items-center gap-3 disabled:grayscale disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Incorporar a Matriz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskMatrixPage;
