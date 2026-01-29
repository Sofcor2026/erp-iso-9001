import React, { useState, useEffect } from 'react';
import { DocumentType } from '../types';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    nombre: string;
    codigo: string;
    tipo: DocumentType;
    file?: File;
    contentType: 'file' | 'spreadsheet';
    initialData?: any[];
  }) => void;
  defaultType?: DocumentType;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onClose, onUpload, defaultType }) => {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<DocumentType>(DocumentType.PROCEDIMIENTO);
  const [contentType, setContentType] = useState<'file' | 'spreadsheet'>('file');
  const [initialData, setInitialData] = useState<any[] | null>(null);
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
    setInitialData(null);
    setFileName('');
    setFile(null);
    setError('');
  }

  const handleClose = () => {
    clearForm();
    onClose();
  }

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          setInitialData(data);
          setFileName(file.name);
          // Auto-fill name if empty
          if (!nombre) setNombre(file.name.replace(/\.[^/.]+$/, ""));
        } else {
          setError("El archivo Excel parece estar vacío.");
        }
      } catch (err) {
        setError("Error al leer el archivo Excel. Asegúrese de que sea un formato válido.");
      }
    };
    reader.readAsBinaryString(file);
  };

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
      contentType,
      initialData: initialData || undefined
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
                onClick={() => { setContentType('file'); setInitialData(null); setFileName(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${contentType === 'file' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Archivo (PDF/IMG)
              </button>
              <button
                type="button"
                onClick={() => { setContentType('spreadsheet'); setFileName(''); }}
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
            {contentType === 'file' ? (
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
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg h-fit">
                      <FileSpreadsheet size={20} className="text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-800">Cargar desde Excel (Opcional)</p>
                      <p className="text-xs text-blue-600">Importa tus filas y columnas existentes.</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelImport}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-4 border-2 border-dashed rounded-xl transition-all flex flex-col items-center gap-2 ${initialData ? 'border-green-300 bg-green-50' : 'border-blue-200 bg-white group-hover:border-blue-400 group-hover:bg-blue-50'}`}>
                      {initialData ? (
                        <>
                          <CheckCircle2 size={24} className="text-green-500" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-green-700">{fileName}</p>
                            <p className="text-[10px] text-green-600">{initialData.length} filas detectadas</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-blue-400" />
                          <p className="text-xs font-medium text-blue-500">Clic para importar Excel</p>
                        </>
                      )}
                    </div>
                  </div>

                  {!initialData && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 bg-gray-100/50 p-2 rounded-md">
                      <AlertCircle size={12} />
                      <span>Si no subes nada, se creará una base de datos vacía.</span>
                    </div>
                  )}
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