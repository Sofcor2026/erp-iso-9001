import React, { useState, useRef, useEffect } from 'react';
import { Document, DocumentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { MoreVertical, CheckCircle, Send, Eye, Download, Edit, Archive, History, ThumbsDown, Loader2 } from 'lucide-react';

interface DocumentActionsProps {
    doc: Document;
    onStatusChange: (docId: string, status: DocumentStatus) => Promise<void>;
    onView?: (doc: Document) => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ doc, onStatusChange, onView }) => {
    const { user, hasPermission } = useAuth();
    const { createNewVersion } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGenericClick = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const handleCreateVersion = async () => {
        if (!window.confirm('¿Desea crear una nueva versión de este documento? El sistema clonará el archivo actual y le asignará el estado de Borrador.')) return;

        setIsCreatingVersion(true);
        try {
            await createNewVersion(doc.id);
            alert('Nueva versión creada con éxito. Ahora puede encontrarla en el listado como Borrador.');
        } catch (error) {
            alert('Error al crear la nueva versión.');
        } finally {
            setIsCreatingVersion(false);
            setIsOpen(false);
        }
    };

    const renderActions = () => {
        const isAdmin = user?.role?.name === 'ADMIN' || hasPermission('platform:access');
        const canPublish = hasPermission('document:publish');
        const canSubmit = hasPermission('document:submit');
        const canDownload = hasPermission('document:download');
        const canCreate = hasPermission('document:create');

        return (
            <>
                {/* Publish-level actions */}
                {canPublish && doc.estado === DocumentStatus.REVISION && (
                    <>
                        <button onClick={() => handleGenericClick(() => onStatusChange(doc.id, DocumentStatus.APROBADO))} className="action-item group text-green-600">
                            <CheckCircle size={16} className="mr-3" /> Aprobar
                        </button>
                        <button onClick={() => handleGenericClick(() => onStatusChange(doc.id, DocumentStatus.BORRADOR))} className="action-item group text-red-600">
                            <ThumbsDown size={16} className="mr-3" /> Rechazar
                        </button>
                    </>
                )}
                {canPublish && doc.estado === DocumentStatus.APROBADO && (
                    <button onClick={() => handleGenericClick(() => onStatusChange(doc.id, DocumentStatus.VIGENTE))} className="action-item group text-blue-600">
                        <Send size={16} className="mr-3" /> Publicar
                    </button>
                )}
                {canPublish && doc.estado === DocumentStatus.VIGENTE && (
                    <button onClick={() => handleGenericClick(() => onStatusChange(doc.id, DocumentStatus.OBSOLETO))} className="action-item group text-red-600">
                        <Archive size={16} className="mr-3" /> Declarar Obsoleto
                    </button>
                )}

                {/* Submit-level actions */}
                {canSubmit && doc.estado === DocumentStatus.BORRADOR && (
                    <button onClick={() => handleGenericClick(() => onStatusChange(doc.id, DocumentStatus.REVISION))} className="action-item group text-brand-primary">
                        <Send size={16} className="mr-3" /> Solicitar Revisión
                    </button>
                )}

                {/* Create-level actions (for new versions) */}
                {canCreate && (doc.estado === DocumentStatus.VIGENTE || isAdmin) && (
                    <button
                        onClick={handleCreateVersion}
                        disabled={isCreatingVersion}
                        className="action-item group text-indigo-600 disabled:opacity-50"
                    >
                        {isCreatingVersion ? <Loader2 size={16} className="mr-3 animate-spin" /> : <History size={16} className="mr-3" />}
                        Crear Nueva Versión
                    </button>
                )}

                {/* Download Actions - Allow Admin to download anything */}
                {(canDownload || isAdmin) && (
                    <button
                        onClick={() => handleGenericClick(() => window.open(doc.archivoUrl, '_blank'))}
                        className="action-item group text-gray-700"
                    >
                        <Download size={16} className="mr-3" /> Descargar
                    </button>
                )}
            </>
        )
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <style>{`
                .action-item { 
                    width: 100%; 
                    text-align: left; 
                    display: flex; 
                    align-items: center; 
                    padding: 0.75rem 1rem; 
                    font-size: 0.875rem; 
                    color: #374151; 
                    transition: all 0.2s;
                } 
                .action-item:hover { 
                    background-color: #f9fafb; 
                    color: #111827;
                }
            `}</style>
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    className={`inline-flex justify-center w-full rounded-full p-2 text-sm font-medium transition-colors ${isOpen ? 'bg-gray-100 text-brand-primary' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'} focus:outline-none`}
                >
                    <MoreVertical size={20} />
                </button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-[100] border border-gray-100 py-2">
                    <div className="px-4 py-2 mb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones de archivo</p>
                    </div>
                    <div role="menu" aria-orientation="vertical">
                        <button
                            onClick={() => handleGenericClick(() => onView ? onView(doc) : window.open(doc.archivoUrl, '_blank'))}
                            className="action-item group font-medium"
                        >
                            <Eye size={16} className="mr-3 text-brand-primary" /> {doc.contentType === 'spreadsheet' ? 'Abrir Editor' : 'Ver Detalles'}
                        </button>
                        <div className="my-1 border-t border-gray-50"></div>
                        {renderActions()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentActions;