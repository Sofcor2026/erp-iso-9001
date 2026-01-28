import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { api } from '../services/api';
import { Document, DocumentStatus, DocumentType, ProcessType, User } from '../types';
import { X, Save, Loader2, History } from 'lucide-react';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

const APOYO_SUBPROCESOS_KEYS = ['Gestión Humana', 'Compras', 'Infraestructura'];


const EditDocumentModal: React.FC<EditDocumentModalProps> = ({ isOpen, onClose, document }) => {
    const { updateDocument } = useData();
    const [formData, setFormData] = useState<Partial<Document>>({});
    const [users, setUsers] = useState<User[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (document) {
            setFormData({ ...document });
        }
        api.getUsers().then(setUsers);
    }, [document, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let processedValue: string | number = value;
        if (name === "version") {
            processedValue = parseInt(value, 10);
            if (isNaN(processedValue)) processedValue = formData.version || 1;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const { id, responsableNombre, historial, ...updateData } = formData;
            if(!id) throw new Error("Document ID is missing");
            // Remove properties that are not part of the update payload, like linked objects
            const updatePayload = { ...updateData };
            delete (updatePayload as any).vinculos; 

            await updateDocument(id, updatePayload);
            onClose();
        } catch (err) {
            console.error("Failed to save document", err);
            setError('Error al guardar el documento. Por favor, intente de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <style>{`
                @keyframes fade-in-scale {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards ease-out; }
                .input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); } 
                .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
                `}</style>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Editar Documento (Listado Maestro)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                                <input type="text" id="nombre" name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
                                <input type="text" id="codigo" name="codigo" value={formData.codigo || ''} onChange={handleChange} required className="mt-1 block w-full input-style" />
                            </div>
                             <div>
                                <label htmlFor="proceso" className="block text-sm font-medium text-gray-700">Proceso</label>
                                <select id="proceso" name="proceso" value={formData.proceso || ''} onChange={handleChange} className="mt-1 block w-full input-style">
                                    {Object.values(ProcessType).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subproceso" className="block text-sm font-medium text-gray-700">Subproceso (Apoyo)</label>
                                <select id="subproceso" name="subproceso" value={formData.subproceso || ''} onChange={handleChange} disabled={formData.proceso !== ProcessType.APOYO} className="mt-1 block w-full input-style disabled:bg-gray-100">
                                     <option value="">N/A</option>
                                    {APOYO_SUBPROCESOS_KEYS.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
                                <select id="tipo" name="tipo" value={formData.tipo || ''} onChange={handleChange} className="mt-1 block w-full input-style">
                                     {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="version" className="block text-sm font-medium text-gray-700">Versión</label>
                                <input type="number" id="version" name="version" value={formData.version || 1} onChange={handleChange} min="1" className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="fechaRevision" className="block text-sm font-medium text-gray-700">Fecha de Vigencia</label>
                                <input type="date" id="fechaRevision" name="fechaRevision" value={formData.fechaRevision || ''} onChange={handleChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                                <select id="estado" name="estado" value={formData.estado || ''} onChange={handleChange} className="mt-1 block w-full input-style">
                                    {Object.values(DocumentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="responsableId" className="block text-sm font-medium text-gray-700">Responsable</label>
                                <select id="responsableId" name="responsableId" value={formData.responsableId || ''} onChange={handleChange} className="mt-1 block w-full input-style">
                                     <option value="" disabled>Seleccione un usuario</option>
                                    {users.filter(u => u.rol !== 'SUPERADMIN').map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Change History Section */}
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                                <History size={20} className="mr-2 text-gray-500" />
                                Historial de Cambios
                            </h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 bg-gray-50 p-2 rounded-md border">
                                {formData.historial && formData.historial.length > 0 ? (
                                    formData.historial.map(entry => (
                                        <div key={entry.id} className="text-sm p-2 bg-white rounded-md border shadow-sm">
                                            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                                                <span>{new Date(entry.fecha).toLocaleString('es-CO')}</span>
                                                <span className="font-semibold">v{entry.version}</span>
                                            </div>
                                            <p className="font-medium text-gray-700">{entry.cambios}</p>
                                            <p className="text-xs text-gray-500 mt-1">por: {entry.autor}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No hay historial de cambios para este documento.</p>
                                )}
                            </div>
                        </div>
                        
                         {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 flex items-center">
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2"/>}
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDocumentModal;