import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Document, ProcessType, DocumentStatus, DocumentType } from '../types';
import { Filter, List, Grid, FileText, UploadCloud, Download, RefreshCw, Search, Clock } from 'lucide-react';
import UploadDocumentModal from './UploadDocumentModal';
import SpreadsheetEditor from './SpreadsheetEditor';
import { api } from '../services/api';
import DocumentActions from './DocumentActions';
import EditDocumentModal from './EditDocumentModal';

const statusConfig = {
    [DocumentStatus.VIGENTE]: { color: 'bg-status-green', text: 'text-white' },
    [DocumentStatus.APROBADO]: { color: 'bg-status-blue', text: 'text-white' },
    [DocumentStatus.REVISION]: { color: 'bg-status-yellow', text: 'text-yellow-800' },
    [DocumentStatus.BORRADOR]: { color: 'bg-gray-200', text: 'text-gray-800' },
    [DocumentStatus.OBSOLETO]: { color: 'bg-status-red', text: 'text-white' },
};

const DocumentRow: React.FC<{ doc: Document, onStatusChange: (docId: string, status: DocumentStatus) => Promise<void>, onView: (doc: Document) => void, isExpiring: boolean }> = ({ doc, onStatusChange, onView, isExpiring }) => {
    return (
        <tr className="bg-white border-b hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                <FileText size={18} className="text-brand-primary mr-3" />
                <div>
                    <div>{doc.nombre}</div>
                    <div className="text-xs text-gray-500">{doc.codigo}</div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.version}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[doc.estado].color} ${statusConfig[doc.estado].text}`}>
                    {doc.estado}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.responsableNombre}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                {isExpiring && <Clock size={14} className="text-yellow-500 mr-2" title={`Próximo a vencer el ${doc.fechaRevision}`} />}
                {doc.fechaRevision}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <DocumentActions doc={doc} onStatusChange={onStatusChange} onView={onView} />
            </td>
        </tr>
    );
};

const DocumentCard: React.FC<{ doc: Document, onStatusChange: (docId: string, status: DocumentStatus) => Promise<void>, onView: (doc: Document) => void, isExpiring: boolean }> = ({ doc, onStatusChange, onView, isExpiring }) => {
    const status = statusConfig[doc.estado];
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border w-full">
            <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                    <div className="flex items-start">
                        <FileText size={20} className="text-brand-primary mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-gray-800 leading-tight">{doc.nombre}</p>
                            <p className="text-sm text-gray-500">{doc.codigo}</p>
                        </div>
                    </div>
                    <div className="pl-8 space-y-2 text-sm">
                        <div className="flex items-center">
                            <strong className="w-24 font-medium text-gray-600">Versión:</strong>
                            <span>{doc.version}</span>
                        </div>
                        <div className="flex items-center">
                            <strong className="w-24 font-medium text-gray-600">Estado:</strong>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color} ${status.text}`}>
                                {doc.estado}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <strong className="w-24 font-medium text-gray-600">Responsable:</strong>
                            <span className="truncate">{doc.responsableNombre}</span>
                        </div>
                        <div className="flex items-center">
                            <strong className="w-24 font-medium text-gray-600">Revisión:</strong>
                            <span className="truncate flex items-center">
                                {isExpiring && <Clock size={14} className="text-yellow-500 mr-2" title={`Próximo a vencer el ${doc.fechaRevision}`} />}
                                {doc.fechaRevision}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="ml-2">
                    <DocumentActions doc={doc} onStatusChange={onStatusChange} onView={onView} />
                </div>
            </div>
        </div>
    );
};

const DocumentList: React.FC = () => {
    const params = useParams<{ processType: string, level2: string, level3: string, level4: string }>();
    const { documents, loading, updateDocumentStatus, addDocument, expiringDocuments } = useData();
    const { user, hasPermission } = useAuth();

    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [tenant, setTenant] = useState<any>(null);
    const [isStorageLimitReached, setIsStorageLimitReached] = useState(false);
    const [selectedEditDocument, setSelectedEditDocument] = useState<Document | null>(null);

    const [editingDocument, setEditingDocument] = useState<Document | null>(null);
    const [filterName, setFilterName] = useState('');
    const [filterCode, setFilterCode] = useState('');
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
    const [filterType, setFilterType] = useState<DocumentType | ''>('');

    const { processType, level2, level3, level4 } = params;

    const isApoyo = processType === ProcessType.APOYO;
    const currentSubproceso = isApoyo ? decodeURIComponent(level2 || '') : undefined;
    const currentDocumentType = (isApoyo ? level4 : level3) as DocumentType | undefined;

    const expiringDocIds = useMemo(() => new Set(expiringDocuments.map(d => d.id)), [expiringDocuments]);

    useEffect(() => {
        if (user?.tenantId) {
            api.getTenantById(user.tenantId).then(data => {
                setTenant(data);
                if (data && data.storageUsed >= data.storageLimit) {
                    setIsStorageLimitReached(true);
                }
            });
        }
    }, [user?.tenantId]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            if (doc.proceso !== processType) return false;
            if (currentSubproceso && doc.subproceso !== currentSubproceso) return false;
            if (currentDocumentType && doc.tipo !== currentDocumentType) return false;

            if (filterName && !doc.nombre.toLowerCase().includes(filterName.toLowerCase())) return false;
            if (filterCode && !doc.codigo.toLowerCase().includes(filterCode.toLowerCase())) return false;
            if (filterStatus && doc.estado !== filterStatus) return false;
            if (filterType && doc.tipo !== filterType) return false;

            return true;
        });
    }, [documents, processType, currentSubproceso, currentDocumentType, filterName, filterCode, filterStatus, filterType]);

    const handleResetFilters = () => {
        setFilterName('');
        setFilterCode('');
        setFilterStatus('');
        setFilterType('');
    };

    const handleView = (doc: Document) => {
        if (doc.contentType === 'spreadsheet') {
            setEditingDocument(doc);
        } else {
            setSelectedEditDocument(doc);
        }
    };

    const handleUpload = async (data: { nombre: string; codigo: string; tipo: DocumentType; file?: File; contentType: 'file' | 'spreadsheet'; initialData?: any[]; }) => {
        if (!user) return;
        try {
            const newDocument = await api.addDocument({
                ...data,
                file: data.file as File, // api.ts handles optionality
                proceso: processType as ProcessType,
                subproceso: currentSubproceso,
                responsableId: user.id,
                tipo: currentDocumentType || data.tipo,
                contentType: data.contentType,
                initialData: data.initialData
            }, user);
            addDocument(newDocument);
            setUploadModalOpen(false);
        } catch (error: any) {
            console.error("Failed to upload document", error);
            alert(error.message || "Error al subir el archivo. Por favor, inténtelo de nuevo.");
        }
    };

    const handleStatusChange = (docId: string, status: DocumentStatus) => {
        if (!user) return Promise.reject("User not found");
        return updateDocumentStatus(docId, status, user);
    };

    const handleExport = () => {
        if (filteredDocuments.length === 0) {
            alert("No hay documentos para exportar.");
            return;
        }

        const headers = ['Código', 'Nombre', 'Versión', 'Estado', 'Responsable', 'Última Revisión'];

        const escapeCsvField = (field: string | number) => {
            const stringField = String(field);
            if (/[",\n\r]/.test(stringField)) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const rows = filteredDocuments.map(doc => [
            escapeCsvField(doc.codigo),
            escapeCsvField(doc.nombre),
            escapeCsvField(doc.version),
            escapeCsvField(doc.estado),
            escapeCsvField(doc.responsableNombre),
            escapeCsvField(doc.fechaRevision),
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `export_documentos_${processType}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div>Cargando documentos...</div>;
    }

    if (!user) {
        return null;
    }

    const canUpload = hasPermission('document:create');
    const isReadOnly = !hasPermission('document:update') && !hasPermission('document:create');

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span>Documentos</span>
                            {isReadOnly && (
                                <span className="ml-3 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Vista de solo lectura
                                </span>
                            )}
                            {isStorageLimitReached && (
                                <span className="ml-3 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    Almacenamiento Lleno (Contactar Soporte)
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center space-x-2">
                            {canUpload && currentDocumentType && (
                                <button
                                    onClick={() => setUploadModalOpen(true)}
                                    disabled={isStorageLimitReached}
                                    className={`px-3 py-1.5 border rounded-md text-sm font-medium text-white flex items-center shadow-sm transition-all ${isStorageLimitReached ? 'bg-gray-400 cursor-not-allowed grayscale' : 'bg-brand-primary hover:bg-brand-secondary active:scale-95'}`}
                                >
                                    <UploadCloud size={16} className="mr-2" /> Nuevo Documento
                                </button>
                            )}
                            <button onClick={handleExport} className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                                <Download size={16} className="mr-2" /> Exportar CSV
                            </button>
                            <div className="flex items-center border rounded-md">
                                <button className="p-2 text-gray-600 bg-gray-100"><List size={16} /></button>
                                <button className="p-2 text-gray-400 hover:bg-gray-100"><Grid size={16} /></button>
                            </div>
                        </div>
                    </div>
                    {/* FILTERS */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="relative">
                                <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <Search className="absolute h-5 w-5 text-gray-400 top-9 left-3" />
                                <input id="filter-name" type="text" placeholder="Buscar por nombre..." value={filterName} onChange={e => setFilterName(e.target.value)} className="mt-1 block w-full pl-10 pr-3 py-2 border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md" />
                            </div>
                            <div className="relative">
                                <label htmlFor="filter-code" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                <Search className="absolute h-5 w-5 text-gray-400 top-9 left-3" />
                                <input id="filter-code" type="text" placeholder="Buscar por código..." value={filterCode} onChange={e => setFilterCode(e.target.value)} className="mt-1 block w-full pl-10 pr-3 py-2 border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as DocumentType | '')} disabled={!!currentDocumentType} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md disabled:bg-gray-100">
                                    <option value="">Todos</option>
                                    {Object.values(DocumentType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            {!isReadOnly && (
                                <div>
                                    <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as DocumentStatus | '')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                                        <option value="">Todos</option>
                                        {Object.values(DocumentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleResetFilters} className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 flex items-center">
                                <RefreshCw size={14} className="mr-2" /> Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-[10px] sm:text-xs">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Versión</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Última Revisión</th>
                                <th scope="col" className="relative px-6 py-3 min-w-[100px]"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 min-h-[300px]">
                            {filteredDocuments.map(doc => (
                                <DocumentRow key={doc.id} doc={doc} onStatusChange={handleStatusChange} onView={handleView} isExpiring={expiringDocIds.has(doc.id)} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-4">
                    {filteredDocuments.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} onStatusChange={handleStatusChange} onView={handleView} isExpiring={expiringDocIds.has(doc.id)} />
                    ))}
                </div>

                {filteredDocuments.length === 0 && <div className="p-6 text-center text-gray-500">No se encontraron documentos.</div>}
            </div>

            {canUpload && (
                <UploadDocumentModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    onUpload={handleUpload}
                    defaultType={currentDocumentType}
                />
            )}
            {editingDocument && user && (
                <SpreadsheetEditor
                    document={editingDocument}
                    user={user}
                    onClose={() => setEditingDocument(null)}
                />
            )}
            {selectedEditDocument && (
                <EditDocumentModal
                    isOpen={!!selectedEditDocument}
                    onClose={() => setSelectedEditDocument(null)}
                    document={selectedEditDocument}
                />
            )}
        </>
    );
};

export default DocumentList;