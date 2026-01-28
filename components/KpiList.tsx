import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { KPI, ProcessType } from '../types';
import { BarChart2, Target, Calendar, User, Download } from 'lucide-react';

const KpiCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex items-center text-gray-500 mb-2">
                    <BarChart2 size={16} className="mr-2 text-brand-primary" />
                    <h3 className="text-md font-semibold text-gray-800 truncate" title={kpi.nombre}>{kpi.nombre}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{kpi.proceso}</p>
            </div>
            <div className="space-y-2 text-sm border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center"><Target size={14} className="mr-2"/> Meta</span>
                    <span className="font-medium text-gray-800">{kpi.meta} {kpi.unidad}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center"><Calendar size={14} className="mr-2"/> Periodicidad</span>
                    <span className="font-medium text-gray-800">{kpi.periodicidad}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center"><User size={14} className="mr-2"/> Responsable</span>
                    <span className="font-medium text-gray-800">{kpi.responsableNombre}</span>
                </div>
            </div>
        </div>
    );
}

const KpiList: React.FC = () => {
    const params = useParams<{ processType: string, level2: string }>();
    const { kpis, loading } = useData();
    
    const { processType, level2 } = params;

    const isApoyo = processType === ProcessType.APOYO;
    const currentSubproceso = isApoyo ? decodeURIComponent(level2 || '') : undefined;

    const filteredKpis = useMemo(() => {
        return kpis.filter(kpi => {
            if (kpi.proceso !== processType) return false;
            if (currentSubproceso && kpi.subproceso !== currentSubproceso) return false;
            return true;
        });
    }, [kpis, processType, currentSubproceso]);

    const handleExport = () => {
        if (filteredKpis.length === 0) {
          alert("No hay KPIs para exportar.");
          return;
        }
      
        const headers = ['Nombre', 'Unidad', 'Meta', 'Periodicidad', 'Proceso', 'Subproceso', 'Responsable'];
        
        const escapeCsvField = (field: string | number | undefined) => {
            if (field === undefined || field === null) {
                return '';
            }
            const stringField = String(field);
            if (/[",\n\r]/.test(stringField)) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };
    
        const rows = filteredKpis.map(kpi => [
            escapeCsvField(kpi.nombre),
            escapeCsvField(kpi.unidad),
            escapeCsvField(kpi.meta),
            escapeCsvField(kpi.periodicidad),
            escapeCsvField(kpi.proceso),
            escapeCsvField(kpi.subproceso),
            escapeCsvField(kpi.responsableNombre),
        ].join(','));
      
        const csvContent = [headers.join(','), ...rows].join('\n');
      
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `export_kpis_${processType}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div>Cargando KPIs...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Indicadores (KPIs)</h3>
                <button 
                    onClick={handleExport} 
                    className="px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                >
                    <Download size={16} className="mr-2"/> Exportar CSV
                </button>
            </div>
            {filteredKpis.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredKpis.map(kpi => (
                        <KpiCard key={kpi.id} kpi={kpi} />
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center text-gray-500">
                    No se encontraron KPIs.
                </div>
            )}
        </div>
    );
};

export default KpiList;