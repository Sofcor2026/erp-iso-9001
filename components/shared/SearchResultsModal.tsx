import React, { useMemo, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Document, KPI, ProcessType } from '../../types';
import { FileText, BarChart2, Loader2, Search } from 'lucide-react';

// Helper to get the correct link for a search result
const getLinkForResult = (item: Document | KPI): string => {
    const isDocument = 'codigo' in item;
    const base = `/drive/${encodeURIComponent(item.proceso)}`;
    const subproceso = item.subproceso ? `/${encodeURIComponent(item.subproceso)}` : '';

    if (isDocument) {
        const doc = item as Document;
        if (doc.proceso === ProcessType.APOYO) {
            // A default subproceso might be needed if it's missing but required for the path
            return `${base}${subproceso || '/General'}/documentos/${encodeURIComponent(doc.tipo)}`;
        }
        return `${base}/documentos/${encodeURIComponent(doc.tipo)}`;
    } else {
        const kpi = item as KPI;
         if (kpi.proceso === ProcessType.APOYO) {
            return `${base}${subproceso || '/General'}/kpis`;
        }
        return `${base}/kpis`;
    }
}


interface SearchResultsModalProps {
    query: string;
    onClose: () => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ query, onClose }) => {
    const { documents, kpis, loading } = useData();
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const searchResults = useMemo(() => {
        if (!query) {
            return { documents: [], kpis: [] };
        }
        const lowerCaseQuery = query.toLowerCase();
        
        const filteredDocs = documents.filter(doc => 
            doc.nombre.toLowerCase().includes(lowerCaseQuery) ||
            doc.codigo.toLowerCase().includes(lowerCaseQuery)
        );

        const filteredKpis = kpis.filter(kpi => 
            kpi.nombre.toLowerCase().includes(lowerCaseQuery)
        );

        return { documents: filteredDocs, kpis: filteredKpis };
    }, [query, documents, kpis]);
    
    const hasResults = searchResults.documents.length > 0 || searchResults.kpis.length > 0;

    const renderContent = () => {
        if (loading && query) {
            return <div className="flex items-center justify-center p-8 text-gray-500"><Loader2 className="animate-spin mr-2"/> Buscando...</div>
        }
        if (!query) {
            return <div className="flex flex-col items-center justify-center p-8 text-gray-400"><Search size={48} className="mb-4"/><p>Busca documentos y KPIs en toda la organización.</p></div>
        }
        if (!hasResults) {
            return <div className="p-8 text-center text-gray-500">No se encontraron resultados para "<strong>{query}</strong>".</div>
        }
        return (
            <div className="divide-y divide-gray-100">
                {searchResults.documents.length > 0 && (
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documentos</h3>
                        <ul className="space-y-1">
                           {searchResults.documents.map(doc => (
                               <li key={doc.id}>
                                   <NavLink to={getLinkForResult(doc)} onClick={onClose} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                       <FileText size={18} className="mr-3 text-brand-primary flex-shrink-0" />
                                       <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                                            <p className="text-xs text-gray-500 truncate">{doc.codigo} &middot; {doc.proceso}</p>
                                       </div>
                                   </NavLink>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
                 {searchResults.kpis.length > 0 && (
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">KPIs</h3>
                        <ul className="space-y-1">
                           {searchResults.kpis.map(kpi => (
                               <li key={kpi.id}>
                                   <NavLink to={getLinkForResult(kpi)} onClick={onClose} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                       <BarChart2 size={18} className="mr-3 text-status-green flex-shrink-0" />
                                       <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-medium text-gray-800 truncate">{kpi.nombre}</p>
                                            <p className="text-xs text-gray-500 truncate">{kpi.proceso}</p>
                                       </div>
                                   </NavLink>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-10 backdrop-blur-sm" onClick={onClose}>
            <div ref={modalRef} onClick={(e) => e.stopPropagation()} className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl border overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SearchResultsModal;
