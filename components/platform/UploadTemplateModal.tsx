import React, { useState, useEffect } from 'react';
import { TemplateType, Template } from '../../types';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template?: Template | null;
}

const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({ isOpen, onClose, onSuccess, template }) => {
  const { user } = useAuth();
  const isEditMode = !!template;

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TemplateType>('COTIZACION');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const clearForm = () => {
    setNombre('');
    setTipo('COTIZACION');
    setSelectedFile(null);
    setFileName('');
    setError('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setNombre(template.nombre);
        setTipo(template.tipo);
        setFileName(''); // Clear filename on open, as it's for a *new* file
      } else {
        clearForm();
      }
    }
  }, [isOpen, template, isEditMode]);

  const handleClose = () => {
    // No need to call clearForm here as useEffect handles it on open
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("No se ha podido identificar al usuario.");
      return;
    }
    // In edit mode, filename is not required
    if (!nombre || !tipo || (!isEditMode && !fileName)) {
      setError("Por favor, complete todos los campos y seleccione un archivo.");
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await api.updateTemplate(
          template.id,
          { nombre, tipo, file: selectedFile || undefined },
          user
        );
        alert(`Plantilla "${nombre}" actualizada exitosamente.`);
      } else {
        if (!selectedFile) throw new Error("Debe seleccionar un archivo.");
        await api.uploadTemplate({ nombre, tipo, file: selectedFile }, user);
        alert(`Plantilla "${nombre}" subida exitosamente.`);
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Failed to upload/update template", err);
      setError("Ocurrió un error al guardar la plantilla.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{isEditMode ? 'Editar Plantilla' : 'Subir Nueva Plantilla'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">Nombre de la Plantilla</label>
              <input type="text" id="template-name" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="template-type" className="block text-sm font-medium text-gray-700">Tipo de Plantilla</label>
              <select id="template-type" value={tipo} onChange={e => setTipo(e.target.value as TemplateType)} className="mt-1 block w-full input-style">
                <option value="COTIZACION">Cotización</option>
                <option value="ORDEN_COMPRA">Orden de Compra</option>
                <option value="DOTACION">Dotación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{isEditMode ? 'Reemplazar Archivo (Opcional)' : 'Archivo'}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-secondary focus-within:outline-none">
                      <span>Sube un archivo</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">{isEditMode ? 'para reemplazar el existente' : '(.html, .hbs)'}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {fileName ? <span className="font-medium text-gray-700">Seleccionado: {fileName}</span> : 'Hasta 2MB'}
                  </p>
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary disabled:bg-gray-400 flex items-center">
              {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
              {isSubmitting ? (isEditMode ? 'Guardando...' : 'Subiendo...') : (isEditMode ? 'Guardar Cambios' : 'Subir Plantilla')}
            </button>
          </div>
        </form>
        <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
};

export default UploadTemplateModal;