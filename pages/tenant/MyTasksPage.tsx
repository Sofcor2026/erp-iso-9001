import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Document, DocumentStatus } from '../../types';
import { FileText, Edit, Clock, GraduationCap, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig = {
    [DocumentStatus.REVISION]: { color: 'bg-yellow-100 text-yellow-800', text: 'En Revisión' },
    [DocumentStatus.BORRADOR]: { color: 'bg-gray-100 text-gray-800', text: 'Borrador' },
};

const MyTasksPage: React.FC = () => {
    const { documents, trainings, loading, expiringDocuments } = useData();
    const { user } = useAuth();

    const myTasks = useMemo(() => {
        if (!user) return [];
        return documents.filter(doc =>
            doc.responsableId === user.id &&
            (doc.estado === DocumentStatus.BORRADOR || doc.estado === DocumentStatus.REVISION)
        ).sort((a, b) => new Date(b.fechaRevision).getTime() - new Date(a.fechaRevision).getTime());
    }, [documents, user]);

    const documentsToRevise = useMemo(() => {
        if (!user || (user.role?.name !== 'ADMIN' && user.role?.name !== 'EDITOR')) return [];
        return expiringDocuments
            .filter(doc => doc.responsableId === user.id)
            .sort((a, b) => new Date(a.fechaRevision).getTime() - new Date(b.fechaRevision).getTime());
    }, [expiringDocuments, user]);

    const upcomingTrainings = useMemo(() => {
        if (!user) return [];
        return (trainings || [])
            .filter(t => t.estado === 'Programada' && new Date(t.fechaProgramada) >= new Date())
            .sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime());
    }, [trainings, user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 text-gray-500">
                <Clock className="animate-spin mb-4" size={40} />
                <p>Cargando tus tareas pendientes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Tareas</h1>
                <p className="text-gray-500 mt-2 text-lg font-medium">Gestiona tus responsabilidades, capacitaciones y pendientes ISO.</p>
            </header>

            {/* 1. Capacitaciones (NUEVO) */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-blue-50/30">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <GraduationCap className="text-brand-primary mr-3" size={24} />
                        Plan de Capacitación Personal
                        <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary text-white">
                            {upcomingTrainings.length}
                        </span>
                    </h2>
                </div>
                <ul className="divide-y divide-gray-100">
                    {upcomingTrainings.length > 0 ? upcomingTrainings.map(t => (
                        <li key={t.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-white border border-blue-100 rounded-xl flex items-center justify-center text-brand-primary shadow-sm mr-4">
                                    <Calendar size={20} />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-lg font-bold text-gray-900">{t.nombre}</div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{t.duracionHoras} horas</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-sm text-gray-500 italic">Instructor: {t.facilitador || 'T. Humano'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-gray-700">{new Date(t.fechaProgramada).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                    <div className="text-xs text-gray-400 font-medium">Hora: {new Date(t.fechaProgramada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <Link to="/tenant/competency" className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all">
                                    Ver curso
                                </Link>
                            </div>
                        </li>
                    )) : (
                        <li className="p-10 text-center text-gray-400 italic font-medium">
                            No tienes capacitaciones programadas por el momento.
                        </li>
                    )}
                </ul>
            </section>

            {/* 2. Próximos a Vencer */}
            {documentsToRevise.length > 0 && (
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <Clock className="text-red-500 mr-3" />
                            Documentos Próximos a Vencer
                        </h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {documentsToRevise.map(doc => {
                            const revisionDate = new Date(doc.fechaRevision);
                            const today = new Date();
                            const diffTime = revisionDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            return (
                                <li key={doc.id} className="p-5 hover:bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mr-4">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <Link to={`/drive/${doc.proceso}`} className="text-md font-bold text-gray-800 hover:text-brand-primary">{doc.nombre}</Link>
                                            <p className="text-xs text-gray-400 font-medium">{doc.codigo} &middot; Proceso: {doc.proceso}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${diffDays <= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                            Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}
                                        </span>
                                        <Link to={`/drive/${doc.proceso}`} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all">
                                            Revisar
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* 3. Borradores o Revisiones */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Borradores y Versiones en Curso</h2>
                </div>
                <ul className="divide-y divide-gray-100">
                    {myTasks.length > 0 ? myTasks.map(doc => (
                        <li key={doc.id} className="p-5 hover:bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mr-4">
                                    <Edit size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <Link to={`/drive/${doc.proceso}`} className="text-md font-bold text-gray-800 hover:text-brand-primary">{doc.nombre}</Link>
                                    <p className="text-xs text-gray-400 font-medium">{doc.codigo} &middot; Proceso: {doc.proceso}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${statusConfig[doc.estado]?.color}`}>
                                    {statusConfig[doc.estado]?.text}
                                </span>
                                <Link to={`/drive/${doc.proceso}`} className="text-brand-primary text-sm font-bold hover:underline">
                                    Editar contenido
                                </Link>
                            </div>
                        </li>
                    )) : (
                        <li className="p-12 text-center text-gray-400 italic font-medium">
                            No tienes flujos de documentos iniciados.
                        </li>
                    )}
                </ul>
            </section>
        </div>
    );
};

export default MyTasksPage;