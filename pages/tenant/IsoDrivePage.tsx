import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DocumentList from '../../components/DocumentList';
import KpiList from '../../components/KpiList';
import { ProcessType, DocumentType } from '../../types';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const IsoDrivePage: React.FC = () => {
    const params = useParams<{ processType: string, level2: string, level3: string, level4: string }>();
    const { processType, level2, level3, level4 } = params;

    const crumbs = useMemo(() => {
        if (!processType) return [];
        
        const trail: Array<{ label: string; path?: string; }> = [];
        const decodedProcess = decodeURIComponent(processType);
        
        // 1. Process
        trail.push({ label: decodedProcess, path: `/drive/${processType}/documentos/${DocumentType.MANUAL}` });

        const isApoyo = processType === ProcessType.APOYO;

        if (isApoyo) {
            // /drive/:process/:subproceso/:view/:type
            const subproceso = level2 ? decodeURIComponent(level2) : null;
            const view = level3 ? decodeURIComponent(level3) : null;
            const docType = level4 ? decodeURIComponent(level4) : null;

            if (subproceso) {
                trail.push({ label: subproceso, path: `/drive/${processType}/${level2}/documentos/${DocumentType.MANUAL}` });
            }
            if (view === 'documentos' && docType) {
                trail.push({ label: docType });
            } else if (view === 'kpis') {
                trail.push({ label: "Indicadores (KPIs)" });
            }
        } else {
            // /drive/:process/:view/:type
            const view = level2 ? decodeURIComponent(level2) : null;
            const docType = level3 ? decodeURIComponent(level3) : null;

            if (view === 'documentos' && docType) {
                trail.push({ label: docType });
            } else if (view === 'kpis') {
                trail.push({ label: "Indicadores (KPIs)" });
            }
        }
        
        // Remove path from last crumb
        if (trail.length > 0) {
            delete trail[trail.length - 1].path;
        }

        return trail;
    }, [processType, level2, level3, level4]);


    if (!processType || !Object.values(ProcessType).includes(processType as ProcessType)) {
        return <Navigate to={`/drive/${ProcessType.ESTRATEGICO}/documentos/${DocumentType.MANUAL}`} replace />;
    }

    const renderContent = () => {
        const isKpiView = level2 === 'kpis' || level3 === 'kpis';
        if (isKpiView) {
            return <KpiList />;
        }
        
        return <DocumentList />;
    };
    
    return (
        <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
            <Breadcrumbs crumbs={crumbs} />
            <div className="flex-1">
                {renderContent()}
            </div>
        </div>
    );
};

export default IsoDrivePage;