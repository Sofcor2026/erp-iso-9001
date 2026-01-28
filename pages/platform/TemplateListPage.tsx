import React, { useState, useEffect } from 'react';
import { FileText, Upload, Edit } from 'lucide-react';
import { api } from '../../services/api';
import { Template } from '../../types';
import UploadTemplateModal from '../../components/platform/UploadTemplateModal';

const TemplateListPage: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);


    const fetchTemplates = () => {
        setLoading(true);
        api.getTemplates()
            .then(setTemplates)
            .catch(err => console.error("Failed to fetch templates", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleOpenCreateModal = () => {
        setTemplateToEdit(null);
        setUploadModalOpen(true);
    };

    const handleOpenEditModal = (template: Template) => {
        setTemplateToEdit(template);
        setUploadModalOpen(true);
    };

    const handleCloseModal = () => {
        setUploadModalOpen(false);
        setTemplateToEdit(null);
    };

    if (loading) {
        return <div>Cargando plantillas...</div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Biblioteca de Plantillas Globales</h1>
                        <p className="text-gray-600 mt-1">Administre las plantillas base para los formularios de los tenants.</p>
                    </div>
                    <button onClick={handleOpenCreateModal} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary flex items-center shadow-sm">
                        <Upload size={16} className="mr-2"/> Subir Nueva Plantilla
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de la Plantilla</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versión</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {templates.map(template => (
                                    <tr key={template.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.tipo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.version}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.lastUpdated}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => handleOpenEditModal(template)} className="text-brand-primary hover:text-brand-secondary p-1 rounded-full hover:bg-blue-100 transition-colors">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <UploadTemplateModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchTemplates}
                template={templateToEdit}
            />
        </>
    );
};

export default TemplateListPage;