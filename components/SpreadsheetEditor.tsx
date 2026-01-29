import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, X, Download, Loader2, Table } from 'lucide-react';
import { api } from '../services/api';
import { Document, User } from '../types';

interface SpreadsheetEditorProps {
    document: Document;
    user: User;
    onClose: () => void;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ document, user, onClose }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [columns, setColumns] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await api.getDocumentData(document.id);
                if (result && result.length > 0) {
                    setData(result);
                    setColumns(Object.keys(result[0]));
                } else {
                    setColumns(['ID', 'Descripción', 'Valor', 'Observaciones']);
                    setData([{ 'ID': '1', 'Descripción': '', 'Valor': '', 'Observaciones': '' }]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [document.id]);

    const handleCellChange = (rowIndex: number, col: string, value: string) => {
        const newData = [...data];
        newData[rowIndex][col] = value;
        setData(newData);
    };

    const addRow = () => {
        const newRow: any = {};
        columns.forEach(col => newRow[col] = '');
        setData([...data, newRow]);
    };

    const removeRow = (index: number) => {
        if (data.length === 1) return;
        setData(data.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateDocumentData(document.id, data, user);
            alert("Datos guardados exitosamente.");
        } catch (error) {
            alert("Error al guardar los datos.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex flex-col items-center justify-center gap-4 bg-white rounded-xl shadow-lg border">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <p className="text-gray-500 font-medium tracking-tight">Cargando base de datos editable...</p>
    </div>;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 lg:p-10">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden border border-white/20">
                <div className="px-8 py-6 bg-brand-primary text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Table size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{document.nombre}</h2>
                            <p className="text-white/70 text-sm font-medium">Editor Visual de Datos • Cód: {document.codigo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-white text-brand-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-accent transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-black/10 hover:bg-black/20 rounded-xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-gray-50/50">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ring-1 ring-black/5">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50/80 backdrop-blur-sm">
                                    <th className="w-12 px-4 py-4"></th>
                                    {columns.map(col => (
                                        <th key={col} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">{col}</th>
                                    ))}
                                    <th className="w-12 px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-4 text-center text-gray-300 text-xs font-bold">{rowIndex + 1}</td>
                                        {columns.map(col => (
                                            <td key={col} className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-none focus:ring-2 focus:ring-brand-primary/50 rounded-lg py-2 px-3 text-sm text-gray-700 transition-all font-medium"
                                                    value={row[col] || ''}
                                                    onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => removeRow(rowIndex)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={addRow}
                        className="mt-6 flex items-center gap-2 text-brand-primary font-bold hover:text-brand-secondary transition-all group scale-100 hover:scale-105 active:scale-95 origin-left"
                    >
                        <div className="p-1.5 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20">
                            <Plus size={20} />
                        </div>
                        Añadir Fila
                    </button>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center text-sm text-gray-400 font-medium">
                    <p>Los cambios se guardan como datos estructurados en la nube. Puedes exportarlos a Excel en cualquier momento.</p>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><Table size={14} className="text-gray-300" /> {data.length} Filas</span>
                        <span className="flex items-center gap-1.5"><Download size={14} className="text-gray-300" /> CVS/XLS Ready</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpreadsheetEditor;
