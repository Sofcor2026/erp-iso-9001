import React, { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Plus, Search, Users, Calendar, CheckCircle2, XCircle, Loader2, Edit2, ClipboardList, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { JobProfile, Training, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const CompetencyPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const canManage = hasPermission('competency:manage');
    const [activeTab, setActiveTab] = useState<'profiles' | 'trainings'>('profiles');
    const [loading, setLoading] = useState(true);

    // Data states
    const [profiles, setProfiles] = useState<JobProfile[]>([]);
    const [trainings, setTrainings] = useState<Training[]>([]);

    // UI states
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'profiles') {
                const data = await api.getJobProfiles(user?.tenantId);
                setProfiles(data);
            } else {
                const data = await api.getTrainings(user?.tenantId);
                setTrainings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Competencias y Formación (ISO 7.2)</h1>
                    <p className="text-gray-500">Gestione perfiles de cargo y planes de capacitación para dar cumplimiento al estándar.</p>
                </div>
                <div className="flex bg-white border rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profiles' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Briefcase size={18} />
                        Perfiles de Cargo
                    </button>
                    <button
                        onClick={() => setActiveTab('trainings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'trainings' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <GraduationCap size={18} />
                        Plan de Capacitación
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'profiles' ? "Buscar perfil..." : "Buscar capacitación..."}
                        className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-primary bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {canManage && (
                    <button
                        onClick={() => activeTab === 'profiles' ? setIsProfileModalOpen(true) : setIsTrainingModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                        <Plus size={20} />
                        {activeTab === 'profiles' ? 'Nuevo Perfil' : 'Nueva Capacitación'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
            ) : activeTab === 'profiles' ? (
                <ProfilesList profiles={profiles.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))} canManage={canManage} />
            ) : (
                <TrainingsList trainings={trainings.filter(t => t.nombre.toLowerCase().includes(searchTerm.toLowerCase()))} canManage={canManage} />
            )}

            {/* Modals placeholders - Implementing full logic later if needed, starting with UI structure */}
            {isProfileModalOpen && <JobProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={loadData} />}
            {isTrainingModalOpen && <TrainingModal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} onSave={loadData} />}
        </div>
    );
};

const ProfilesList: React.FC<{ profiles: JobProfile[], canManage: boolean }> = ({ profiles, canManage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
            <div key={profile.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && <button className="text-gray-400 hover:text-brand-primary"><Edit2 size={16} /></button>}
                </div>
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-brand-primary">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{profile.nombre}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{profile.descripcion || 'Sin descripción'}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Requisitos de Educación</span>
                        <p className="text-xs text-gray-700 line-clamp-2">{profile.educacionReq || 'No definidos'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Experiencia Mínima</span>
                        <p className="text-xs text-gray-700 line-clamp-2">{profile.experienciaReq || 'No definida'}</p>
                    </div>
                </div>
                <button className="w-full mt-4 py-2 text-sm font-bold text-brand-primary hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 flex items-center justify-center gap-2">
                    <ClipboardList size={16} /> Ver Perfil Completo
                </button>
            </div>
        ))}
        {profiles.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 italic">No hay perfiles de cargo definidos.</div>
        )}
    </div>
);

const TrainingsList: React.FC<{ trainings: Training[], canManage: boolean }> = ({ trainings, canManage }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Capacitación</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Fecha y Facilitador</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {trainings.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{t.nombre}</div>
                            <div className="text-xs text-gray-500 text-sm">{t.duracionHoras} horas</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Calendar size={14} className="text-brand-primary" />
                                {new Date(t.fechaProgramada).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">Instructor: {t.facilitador || 'Por definir'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${t.estado === 'Realizada' ? 'bg-green-100 text-green-700' :
                                    t.estado === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {t.estado === 'Realizada' ? <CheckCircle2 size={12} /> : t.estado === 'Cancelada' ? <XCircle size={12} /> : <Calendar size={12} />}
                                {t.estado}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 ml-auto">
                                <Users size={14} /> Registro de Asistencia
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {trainings.length === 0 && (
            <div className="p-20 text-center text-gray-400 italic">No hay capacitaciones programadas en el plan.</div>
        )}
    </div>
);

// --- Componentes de Modal Simplificados para la Demo ---
const JobProfileModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void }> = ({ isOpen, onClose, onSave }) => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '', descripcion: '', educacionReq: '', formacionReq: '', experienciaReq: '', habilidadesReq: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.addJobProfile(formData, user!);
            onSave();
            onClose();
        } catch (error) { alert("Error al guardar perfil"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Briefcase /> Definir Perfil de Cargo</h2>
                    <button onClick={onClose}><XCircle /></button>
                </div>
                <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Cargo</label>
                            <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Educación Requerida (Saber)</label>
                            <textarea placeholder="Ej: Profesional en Ingeniería, Técnico en..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" rows={2} value={formData.educacionReq} onChange={e => setFormData({ ...formData, educacionReq: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Experiencia Necesaria (Saber Hacer)</label>
                            <textarea placeholder="Ej: 2 años gestionando procesos de calidad..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" rows={2} value={formData.experienciaReq} onChange={e => setFormData({ ...formData, experienciaReq: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-xl shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                        {isSaving ? 'Guardando...' : 'Publicar Perfil de Cargo'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const TrainingModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: () => void }> = ({ isOpen, onClose, onSave }) => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '', descripcion: '', fechaProgramada: '', facilitador: '', duracionHoras: 1, estado: 'Programada' as 'Programada'
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.addTraining(formData, user!);
            onSave();
            onClose();
        } catch (error) { alert("Error al programar capacitación"); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><GraduationCap /> Programar Nueva Capacitación</h2>
                    <button onClick={onClose}><XCircle /></button>
                </div>
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tema de la Capacitación</label>
                            <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha y Hora</label>
                            <input required type="datetime-local" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.fechaProgramada} onChange={e => setFormData({ ...formData, fechaProgramada: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Duración (Horas)</label>
                            <input required type="number" step="0.5" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.duracionHoras} onChange={e => setFormData({ ...formData, duracionHoras: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-xl shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                        {isSaving ? 'Agregando al Plan Anual...' : 'Confirmar Programación'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompetencyPage;
