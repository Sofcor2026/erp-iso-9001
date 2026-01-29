import React, { useState, useEffect } from 'react';
import { DocumentType } from '../types';
import { X, UploadCloud } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { nombre: string; codigo: string; tipo: DocumentType; file?: File; contentType: 'file' | 'spreadsheet'; }) => void;
  defaultType?: DocumentType;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onClose, onUpload, defaultType }) => {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<DocumentType>(DocumentType.PROCEDIMIENTO);
  const [contentType, setContentType] = useState<'file' | 'spreadsheet'>('file');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultType) {
      setTipo(defaultType);
    }
  }, [defaultType, isOpen]);

  const clearForm = () => {
    setNombre('');
    setCodigo('');
    setTipo(defaultType || DocumentType.PROCEDIMIENTO);
    setContentType('file');
    setFileName('');
    setFile(null);
    setError('');
  }

  const handleClose = () => {
    clearForm();
    onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigo || (contentType === 'file' && !file)) {
      setError("Por favor, complete todos los campos y seleccione un archivo.");
      return;
    }
    setError('');
    onUpload({
      nombre,
      codigo,
      tipo,
      file: file || undefined,
      contentType
    });
    handleClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFileName(selectedFile.name);
      setFile(selectedFile);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <style>{`
          @keyframes fade-in-scale {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards ease-out; }
        `}</style>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Nuevo Documento</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex p-1 bg-gray-100 rounded-lg mb-2">
              <button
                type="button"
                onClick={() => setContentType('file')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${contentType === 'file' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Archivo (PDF/IMG)
              </button>
              <button
                type="button"
                onClick={() => setContentType('spreadsheet')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${contentType === 'spreadsheet' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Base de Datos (Editable)
              </button>
            </div>

            <div>
              <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
              <input type="text" id="doc-name" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="doc-code" className="block text-sm font-medium text-gray-700">Código del Documento</label>
              <input type="text" id="doc-code" value={codigo} onChange={e => setCodigo(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="doc-type" className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
              <select id="doc-type" value={tipo} onChange={e => setTipo(e.target.value as DocumentType)} disabled={!!defaultType} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md disabled:bg-gray-100">
                {Object.values(DocumentType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {contentType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Archivo</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary">
                        <span>Sube un archivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">o arrástralo y suéltalo</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {fileName ? <span className="font-medium text-gray-700">Seleccionado: {fileName}</span> : 'PNG, JPG, PDF de hasta 10MB'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {contentType === 'spreadsheet' && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 flex gap-3">
                <div className="bg-blue-100 p-2 rounded-lg h-fit">
                  <UploadCloud size={16} />
                </div>
                <div>
                  <p className="font-bold">Modo Base de Datos Activado</p>
                  <p>No requiere archivo. Se creará una tabla vacía que podrás editar directamente en la plataforma.</p>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
              Subir Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;