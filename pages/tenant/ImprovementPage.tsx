import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ImprovementFinding, ImprovementAction, User } from '../../types';
import {
    Plus,
    Search,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Loader2,
    Calendar,
    Target,
    ArrowRight,
    X,
    ClipboardList,
    AlertTriangle,
    Save,
    User as UserIcon,
    PlusCircle
} from 'lucide-react';

const ImprovementPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const [findings, setFindings] = useState<ImprovementFinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState<ImprovementFinding | null>(null);
    const [actions, setActions] = useState<ImprovementAction[]>([]);

    // Analysis state
    const [fiveWhys, setFiveWhys] = useState<string[]>(['', '', '', '', '']);
    const [ishikawa, setIshikawa] = useState<Record<string, string[]>>({
        'Mano de Obra': ['', ''],
        'Maquinaria': ['', ''],
        'Métodos': ['', ''],
        'Materiales': ['', ''],
        'Medición': ['', ''],
        'Medio Ambiente': ['', '']
    });

    const canManageImprovement = hasPermission('improvement:manage');

    useEffect(() => {
        if (user?.tenantId) {
            fetchFindings();
        }
    }, [user]);

    const fetchFindings = async () => {
        try {
            setLoading(true);
            const data = await api.getImprovementFindings(user?.tenantId);
            setFindings(data);
        } catch (error) {
            console.error('Error fetching findings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFinding = async (finding: ImprovementFinding) => {
        setSelectedFinding(finding);
        // Reset analysis state from finding data
        if (finding.analisisCausaRaiz?.cincoPorques) {
            setFiveWhys(finding.analisisCausaRaiz.cincoPorques);
        } else {
            setFiveWhys(['', '', '', '', '']);
        }

        if (finding.analisisCausaRaiz?.ishikawa) {
            setIshikawa(finding.analisisCausaRaiz.ishikawa);
        } else {
            setIshikawa({
                'Mano de Obra': ['', ''],
                'Maquinaria': ['', ''],
                'Métodos': ['', ''],
                'Materiales': ['', ''],
                'Medición': ['', ''],
                'Medio Ambiente': ['', '']
            });
        }

        // Fetch actions
        try {
            const findingActions = await api.getImprovementActions(finding.id);
            setActions(findingActions);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!selectedFinding || !user) return;
        try {
            await api.updateImprovementFinding(selectedFinding.id, {
                ...selectedFinding,
                analisisCausaRaiz: {
                    cincoPorques: fiveWhys.filter(w => w.trim() !== ''),
                    ishikawa: ishikawa
                },
                estado: 'En Análisis'
            }, user);
            await fetchFindings();
            alert("Análisis guardado exitosamente");
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFinding || !user) return;
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const newAction = {
            finding_id: selectedFinding.id,
            tarea: formData.get('tarea') as string,
            responsable_id: formData.get('responsable') as string,
            fecha_limite: formData.get('fecha_limite') as string,
            estado: 'Pendiente' as any
        };

        try {
            await api.addImprovementAction(newAction, user);
            const updatedActions = await api.getImprovementActions(selectedFinding.id);
            setActions(updatedActions);
            // If it's the first action, maybe move state to "En Plan de Acción"
            if (selectedFinding.estado !== 'En Plan de Acción' && selectedFinding.estado !== 'Cerrado') {
                await api.updateImprovementFinding(selectedFinding.id, { estado: 'En Plan de Acción' }, user);
                await fetchFindings();
            }
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredFindings = findings.filter(f =>
        f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.fuente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (estado: string) => {
        switch (estado) {
            case 'Cerrado': return 'bg-green-100 text-green-700 border-green-200';
            case 'En Plan de Acción': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Análisis': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Abierto': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="text-brand-primary" />
                        Sistema de Mejora Continua
                    </h1>
                    <p className="text-gray-500">Gestión de No Conformidades y Mejora (ISO 9001:2015 Cláusula 10)</p>
                </div>
                {canManageImprovement && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 font-bold"
                    >
                        <Plus size={20} />
                        Reportar Hallazgo
                    </button>
                )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 italic font-bold">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-gray-50 rounded-lg"><ClipboardList className="text-gray-400" /></div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Hallazgos</p>
                        <p className="text-xl font-black text-gray-800">{findings.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="text-red-500" /></div>
                    <div>
                        <p className="text-[10px] text-red-500 uppercase tracking-widest">No Conformidades</p>
                        <p className="text-xl font-black text-red-600">
                            {findings.filter(f => f.estado === 'Abierto').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg"><Clock className="text-blue-500" /></div>
                    <div>
                        <p className="text-[10px] text-blue-500 uppercase tracking-widest">En Ejecución</p>
                        <p className="text-xl font-black text-blue-600">
                            {findings.filter(f => f.estado === 'En Plan de Acción' || f.estado === 'En Análisis').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 shadow-brand-primary">
                    <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="text-green-500" /></div>
                    <div>
                        <p className="text-[10px] text-green-500 uppercase tracking-widest">Cerrados / Eficaces</p>
                        <p className="text-xl font-black text-green-600">
                            {findings.filter(f => f.estado === 'Cerrado').length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-brand-primary italic">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descripción, fuente o proceso..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white transition-all text-sm font-bold shadow-brand-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-brand-primary" size={32} />
                            <p className="text-gray-500 animate-pulse">Consultando bitácora de mejora...</p>
                        </div>
                    ) : filteredFindings.length > 0 ? (
                        <table className="w-full text-left font-bold">
                            <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Descripción del Hallazgo</th>
                                    <th className="px-6 py-4">Fuente / Contexto</th>
                                    <th className="px-6 py-4">Reportado</th>
                                    <th className="px-6 py-4">Estado Actual</th>
                                    <th className="px-6 py-4 text-right">Interacción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredFindings.map((finding) => (
                                    <tr key={finding.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-800 line-clamp-1">{finding.descripcion}</span>
                                                <span className="text-[10px] text-brand-primary font-bold mt-1 bg-brand-primary/5 w-fit px-1.5 rounded uppercase tracking-tighter">ID: {finding.id.split('-')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-600 mb-1">{finding.fuente}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{finding.procesoAsociado || 'Sin Proceso'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                                <Calendar size={14} className="text-gray-300" />
                                                {new Date(finding.fechaReporte).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(finding.estado)}`}>
                                                {finding.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleSelectFinding(finding)}
                                                className="px-4 py-1.5 bg-white border border-gray-200 text-brand-primary rounded-lg text-xs font-black hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm"
                                            >
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center shadow-brand-primary">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                                <AlertTriangle className="text-gray-200" size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-1">Cero Hallazgos Pendientes</h3>
                            <p className="text-gray-400 max-w-xs mx-auto text-sm italic">
                                Excelente. No se han detectado no conformidades o áreas de mejora en este momento.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalle y Gestión (Ishikawa, 5 Whys, Acciones) */}
            {selectedFinding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 bg-brand-primary text-white flex justify-between items-center shrink-0 shadow-lg italic">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 border border-white/30`}>
                                        {selectedFinding.estado}
                                    </span>
                                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">ISO 9001:2015 Clause 10.2</span>
                                </div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <ClipboardList size={28} />
                                    Gestión de Mejora #{(selectedFinding.id).split('-')[0].toUpperCase()}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedFinding(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-gray-50/50 italic">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm col-span-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Descripción del Evento / Hallazgo</h4>
                                    <p className="text-gray-800 font-bold text-lg leading-relaxed">{selectedFinding.descripcion}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Fuente</p>
                                        <p className="font-bold text-gray-700">{selectedFinding.fuente}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Proceso Impactado</p>
                                        <p className="font-bold text-gray-700">{selectedFinding.procesoAsociado}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Root Cause Analysis SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-brand-primary/10 pb-2">
                                    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                        <Target size={18} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Análisis de Causa Raíz</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* 5 Whys */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-sm text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-brand-primary text-white text-[10px] flex items-center justify-center">5</div>
                                                Los 5 Porqués
                                            </h4>
                                            <button onClick={handleSaveAnalysis} className="p-2 text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all" title="Guardar cambios">
                                                <Save size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {fiveWhys.map((why, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <span className="text-xs font-black text-gray-300 mt-2.5">¿Por qué?</span>
                                                    <input
                                                        disabled={!canManageImprovement}
                                                        value={why}
                                                        onChange={(e) => {
                                                            const newWhys = [...fiveWhys];
                                                            newWhys[idx] = e.target.value;
                                                            setFiveWhys(newWhys);
                                                        }}
                                                        placeholder="..."
                                                        className="flex-1 border-b-2 border-gray-50 focus:border-brand-primary bg-transparent py-2 outline-none text-sm font-bold text-gray-700 transition-colors"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ishikawa (Simplified table format) */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-sm text-gray-800 uppercase tracking-widest">Ishikawa (6Ms)</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.keys(ishikawa).map((m) => (
                                                <div key={m} className="space-y-1.5">
                                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">{m}</p>
                                                    <input
                                                        disabled={!canManageImprovement}
                                                        placeholder="Causa primaria..."
                                                        className="w-full text-[10px] font-bold p-1 bg-gray-50 rounded border-none outline-none focus:ring-1 focus:ring-brand-primary/20"
                                                        value={ishikawa[m][0]}
                                                        onChange={(e) => {
                                                            const newIsh = { ...ishikawa };
                                                            newIsh[m][0] = e.target.value;
                                                            setIshikawa(newIsh);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Plan SECTION */}
                            <div className="space-y-6 shadow-brand-primary">
                                <div className="flex items-center gap-3 border-b-2 border-brand-primary/10 pb-2">
                                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Plan de Acción / Medidas Correctivas</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Add Action Row (Only for creators/managers) */}
                                    {canManageImprovement && (
                                        <form onSubmit={handleAddAction} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm italic font-bold">
                                            <div className="md:col-span-5">
                                                <input name="tarea" required placeholder="Defina la tarea correctiva o preventiva..." className="w-full text-xs font-bold p-2 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-primary/20 h-10" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 rounded-xl h-10">
                                                    <UserIcon size={14} className="text-gray-400" />
                                                    <select name="responsable" required className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold">
                                                        <option value="">Responsable...</option>
                                                        <option value={user?.id}>Yo mismo</option>
                                                        {/* Other users would be here in a real scenario */}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="md:col-span-3">
                                                <input name="fecha_limite" type="date" required className="w-full text-[10px] font-bold p-2 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-primary/20 h-10" />
                                            </div>
                                            <div className="md:col-span-1">
                                                <button type="submit" className="w-full h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:bg-brand-secondary transition-all shadow-md">
                                                    <PlusCircle size={20} />
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Action List Table */}
                                    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden italic shadow-brand-primary">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">Tarea / Actividad</th>
                                                    <th className="px-6 py-4">Líder</th>
                                                    <th className="px-6 py-4">Fecha Límite</th>
                                                    <th className="px-6 py-4">Estado</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 font-bold">
                                                {actions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs italic">No se han definido acciones para este hallazgo.</td>
                                                    </tr>
                                                ) : (
                                                    actions.map((action) => (
                                                        <tr key={action.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-bold text-gray-700">{action.tarea}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-black">
                                                                        {action.responsableNombre?.[0] || 'U'}
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-600 font-black">{action.responsableNombre || 'Cargando...'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-[10px] font-black text-gray-500">{new Date(action.fecha_limite).toLocaleDateString()}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${action.estado === 'Verificada' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                        action.estado === 'Ejecutada' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                            'bg-orange-50 text-orange-600 border-orange-100'
                                                                    }`}>
                                                                    {action.estado}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {/* Potential for verify button here */}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Reporte INICIAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-brand-primary text-white italic">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <Plus size={24} />
                                Reportar Nuevo Hallazgo ISO
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form className="p-8 space-y-6" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                fuente: formData.get('fuente') as string,
                                descripcion: formData.get('descripcion') as string,
                                procesoAsociado: formData.get('proceso') as string,
                            };
                            try {
                                setLoading(true);
                                await api.addImprovementFinding(data, user!);
                                setIsCreateModalOpen(false);
                                fetchFindings();
                            } catch (error) {
                                console.error('Error adding finding:', error);
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Fuente de Información</label>
                                <select name="fuente" required className="w-full px-4 py-3 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold text-gray-700 italic">
                                    <option value="Auditoría Interna">Auditoría Interna de Calidad</option>
                                    <option value="Auditoría Externa">Auditoría de Certificación (Ente)</option>
                                    <option value="PQR / Queja de Cliente">PQR / Insatisfacción de Cliente</option>
                                    <option value="Seguimiento de Indicadores">Desvío de KPI / Seguimiento</option>
                                    <option value="Revisión por la Dirección">Output Revisión Gerencial</option>
                                    <option value="Salida No Conforme">Reporte de Servicio No Conforme</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Proceso del SGC Responsable</label>
                                <input name="proceso" type="text" placeholder="Ej: Dirección, Operaciones, Gestión Humana..." className="w-full px-4 py-3 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold text-gray-700 italic" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Descripción Detallada del Hallazgo</label>
                                <textarea name="descripcion" required rows={4} placeholder="Describa la evidencia encontrada y el incumplimiento detectado..." className="w-full px-4 py-3 rounded-2xl border-none bg-gray-50 focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold text-gray-700 leading-relaxed italic"></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 italic">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-gray-400 font-black uppercase text-xs tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-primary text-white rounded-2xl hover:bg-brand-secondary font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Registrar Hallazgo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImprovementPage;
