import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Document, DocumentStatus } from '../../types';
import { FileText, Edit, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig = {
    [DocumentStatus.REVISION]: { color: 'bg-yellow-100 text-yellow-800', text: 'En Revisión' },
    [DocumentStatus.BORRADOR]: { color: 'bg-gray-100 text-gray-800', text: 'Borrador' },
};

const MyTasksPage: React.FC = () => {
    const { documents, loading, expiringDocuments } = useData();
    const { user } = useAuth();

    const myTasks = useMemo(() => {
        if (!user) return [];
        return documents.filter(doc => 
            doc.responsableId === user.id && 
            (doc.estado === DocumentStatus.BORRADOR || doc.estado === DocumentStatus.REVISION)
        ).sort((a, b) => new Date(b.fechaRevision).getTime() - new Date(a.fechaRevision).getTime());
    }, [documents, user]);

    const documentsToRevise = useMemo(() => {
        if (!user || (user.rol !== 'ADMIN' && user.rol !== 'EDITOR')) return [];
        return expiringDocuments
            .filter(doc => doc.responsableId === user.id)
            .sort((a, b) => new Date(a.fechaRevision).getTime() - new Date(b.fechaRevision).getTime());
    }, [expiringDocuments, user]);


    if (loading) {
        return <div>Cargando tareas...</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Mis Tareas</h1>
                <p className="text-gray-600 mt-1">Documentos que requieren tu atención inmediata o próxima.</p>
            </div>
            
            {documentsToRevise.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Clock className="text-yellow-500 mr-3"/>
                            Documentos Próximos a Vencer
                        </h2>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {documentsToRevise.map(doc => {
                             const revisionDate = new Date(doc.fechaRevision);
                             const today = new Date();
                             const diffTime = revisionDate.getTime() - today.getTime();
                             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                             return (
                                <li key={doc.id} className="p-4 hover:bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center">
                                    <FileText size={24} className="text-brand-primary mr-4" />
                                    <div>
                                        <Link to={`/drive/${doc.proceso}`} className="text-md font-semibold text-gray-800 hover:underline">{doc.nombre}</Link>
                                        <p className="text-sm text-gray-500">{doc.codigo} &middot; Proceso: {doc.proceso}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800`}>
                                        Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}
                                    </span>
                                    <span className="text-sm text-gray-500 hidden md:inline">
                                        Fecha: {new Date(doc.fechaRevision).toLocaleDateString()}
                                    </span>
                                    <Link to={`/drive/${doc.proceso}`} className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 flex items-center">
                                            <Edit size={14} className="mr-2"/> Revisar
                                    </Link>
                                </div>
                                </li>
                             );
                        })}
                    </ul>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border">
                 <div className="p-4 border-b">
                     <h2 className="text-lg font-semibold text-gray-800">Documentos en Borrador o Revisión</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                    {myTasks.length > 0 ? myTasks.map(doc => (
                        <li key={doc.id} className="p-4 hover:bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                           <div className="flex items-center">
                                <FileText size={24} className="text-brand-primary mr-4" />
                                <div>
                                    <Link to={`/drive/${doc.proceso}`} className="text-md font-semibold text-gray-800 hover:underline">{doc.nombre}</Link>
                                    <p className="text-sm text-gray-500">{doc.codigo} &middot; Proceso: {doc.proceso}</p>
                                </div>
                           </div>
                           <div className="flex items-center space-x-4">
                               <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig[doc.estado]?.color}`}>
                                   {statusConfig[doc.estado]?.text}
                               </span>
                               <span className="text-sm text-gray-500 hidden md:inline">
                                   Última modif.: {new Date(doc.fechaRevision).toLocaleDateString()}
                               </span>
                               <Link to={`/drive/${doc.proceso}`} className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 flex items-center">
                                    <Edit size={14} className="mr-2"/> Ir al Documento
                                </Link>
                           </div>
                        </li>
                    )) : (
                        <li className="p-6 text-center text-gray-500">
                            No tienes documentos en borrador o en revisión.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default MyTasksPage;