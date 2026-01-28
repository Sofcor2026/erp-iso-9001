import React from 'react';
import MasterDocumentList from '../../components/MasterDocumentList';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';


const MasterListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Protect route for users with permission only
  if (!hasPermission('tenant:view_master_list')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col bg-gray-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Listado Maestro de Documentos</h1>
        <p className="text-gray-600 mt-1">Vista centralizada para buscar, filtrar y editar todos los documentos de la organización.</p>
      </div>
      <div className="flex-1">
        <MasterDocumentList />
      </div>
    </div>
  );
};

export default MasterListPage;