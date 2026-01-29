import React, { useState, useRef, useEffect } from 'react';
import { Document, DocumentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MoreVertical, CheckCircle, Send, Eye, Download, Edit, Archive, History, ThumbsDown } from 'lucide-react';

interface DocumentActionsProps {
    doc: Document;
    onStatusChange: (docId: string, status: DocumentStatus) => Promise<void>;
    onView?: (doc: Document) => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ doc, onStatusChange, onView }) => {
    const { user, hasPermission } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
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

    const renderActions = () => {
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
                {canCreate && doc.estado === DocumentStatus.VIGENTE && (
                    <button className="action-item group">
                        <History size={16} className="mr-3" /> Crear Nueva Versión
                    </button>
                )}

                {/* Download Actions */}
                {canDownload && doc.estado === DocumentStatus.VIGENTE && (
                    <button className="action-item group">
                        <Download size={16} className="mr-3" /> Descargar
                    </button>
                )}
            </>
        )
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <style>{`.action-item { width: 100%; text-align: left; display: flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; color: #374151; } .action-item:hover { background-color: #f3f4f6; }`}</style>
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    className="inline-flex justify-center w-full rounded-md p-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none"
                >
                    <MoreVertical size={20} />
                </button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                            onClick={() => handleGenericClick(() => onView ? onView(doc) : window.open(doc.archivoUrl, '_blank'))}
                            className="action-item group"
                        >
                            <Eye size={16} className="mr-3" /> {doc.contentType === 'spreadsheet' ? 'Abrir Editor' : 'Ver Archivo'}
                        </button>
                        <div className="my-1 border-t border-gray-100"></div>
                        {renderActions()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentActions;