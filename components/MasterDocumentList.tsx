import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Document, ProcessType, DocumentStatus, DocumentType } from '../types';
import { Edit, RefreshCw, Clock, ShieldAlert, Mail } from 'lucide-react';
import EditDocumentModal from './EditDocumentModal';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const statusConfig = {
    [DocumentStatus.VIGENTE]: { color: 'bg-status-green', text: 'text-white' },
    [DocumentStatus.APROBADO]: { color: 'bg-status-blue', text: 'text-white' },
    [DocumentStatus.REVISION]: { color: 'bg-status-yellow', text: 'text-yellow-800' },
    [DocumentStatus.BORRADOR]: { color: 'bg-gray-200', text: 'text-gray-800' },
    [DocumentStatus.OBSOLETO]: { color: 'bg-status-red', text: 'text-white' },
};

const MasterDocumentList: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const { documents, loading, expiringDocuments } = useData();
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);

    const canEdit = hasPermission('document:update') || hasPermission('tenant:admin');
    const [isStorageLimitReached, setIsStorageLimitReached] = useState(false);

    useEffect(() => {
        if (user?.tenantId) {
            api.getTenantById(user.tenantId).then(data => {
                if (data && data.storageUsed >= data.storageLimit) {
                    setIsStorageLimitReached(true);
                }
            });
        }
    }, [user?.tenantId]);

    // Filters state
    const [filterName, setFilterName] = useState('');
    const [filterCode, setFilterCode] = useState('');
    const [filterProcess, setFilterProcess] = useState<ProcessType | ''>('');
    const [filterType, setFilterType] = useState<DocumentType | ''>('');
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');

    const expiringDocIds = useMemo(() => new Set(expiringDocuments.map(d => d.id)), [expiringDocuments]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            if (filterName && !doc.nombre.toLowerCase().includes(filterName.toLowerCase())) return false;
            if (filterCode && !doc.codigo.toLowerCase().includes(filterCode.toLowerCase())) return false;
            if (filterProcess && doc.proceso !== filterProcess) return false;
            if (filterType && doc.tipo !== filterType) return false;
            if (filterStatus && doc.estado !== filterStatus) return false;
            return true;
        }).sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [documents, filterName, filterCode, filterProcess, filterType, filterStatus]);

    const handleResetFilters = () => {
        setFilterName('');
        setFilterCode('');
        setFilterProcess('');
        setFilterType('');
        setFilterStatus('');
    };

    const handleEditClick = (doc: Document) => {
        setEditingDoc(doc);
    };

    if (loading) {
        return <div>Cargando documentos...</div>;
    }

    return (
        <div className="space-y-4">
            {isStorageLimitReached && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-red-200">
                            <Mail className="text-red-500" size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Límite de Almacenamiento Alcanzado</p>
                            <p className="text-xs text-gray-600">Ha agotado el espacio disponible. No podrá subir nuevos archivos hasta ampliar su plan.</p>
                        </div>
                    </div>
                    <a
                        href="https://wa.me/573208159920"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Contactar Soporte
                    </a>
                </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border">
                {/* FILTERS */}
                <div className="p-4 border-b">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                        <div>
                            <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input id="filter-name" type="text" placeholder="Buscar por nombre..." value={filterName} onChange={e => setFilterName(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="filter-code" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <input id="filter-code" type="text" placeholder="Buscar por código..." value={filterCode} onChange={e => setFilterCode(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                        </div>
                        <div>
                            <label htmlFor="filter-process" className="block text-sm font-medium text-gray-700 mb-1">Proceso</label>
                            <select id="filter-process" value={filterProcess} onChange={e => setFilterProcess(e.target.value as ProcessType | '')} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                <option value="">Todos</option>
                                {Object.values(ProcessType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as DocumentType | '')} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                <option value="">Todos</option>
                                {Object.values(DocumentType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as DocumentStatus | '')} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                <option value="">Todos</option>
                                {Object.values(DocumentStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleResetFilters} className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 flex items-center">
                            <RefreshCw size={14} className="mr-2" /> Limpiar Filtros
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versión</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Revisión</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Editar</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDocuments.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div>{doc.nombre}</div>
                                        <div className="text-xs text-gray-500">{doc.codigo}</div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{doc.proceso}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{doc.tipo}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{doc.version}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[doc.estado].color} ${statusConfig[doc.estado].text}`}>
                                            {doc.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{doc.responsableNombre}</td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                        {expiringDocIds.has(doc.id) && <Clock size={14} className="text-yellow-500 mr-2" title={`Próximo a vencer el ${doc.fechaRevision}`} />}
                                        {doc.fechaRevision}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-center text-sm font-medium">
                                        {canEdit ? (
                                            <button
                                                onClick={() => handleEditClick(doc)}
                                                className="text-brand-primary hover:text-brand-secondary p-1 rounded-full hover:bg-blue-100 transition-colors"
                                                title="Editar Documento"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        ) : (
                                            <ShieldAlert size={16} className="text-gray-300 mx-auto" title="Sin permisos para editar" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredDocuments.length === 0 && <div className="p-6 text-center text-gray-500">No se encontraron documentos que coincidan con los filtros.</div>}
            </div>

            {editingDoc && (
                <EditDocumentModal
                    isOpen={!!editingDoc}
                    onClose={() => setEditingDoc(null)}
                    document={editingDoc}
                />
            )}
        </div>
    );
};

export default MasterDocumentList;