import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import IsoDrivePage from './tenant/IsoDrivePage';
import PurchaseOrderPage from './PurchaseOrderPage';
import MyTasksPage from './tenant/MyTasksPage';
import TenantSettingsPage from './tenant/TenantSettingsPage';
import TenantAuditPage from './tenant/TenantAuditPage';
import TenantUserPage from './tenant/TenantUserPage';
import EquipmentPage from './tenant/EquipmentPage';
import QuotesPage from './tenant/QuotesPage';
import { ProcessType, DocumentType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TenantSidebar from '../components/tenant/TenantSidebar';
import MasterListPage from './tenant/MasterListPage';


const TenantHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  switch (user?.role?.name) {
    case 'ADMIN':
      return <Navigate to={`/drive/${ProcessType.CONTROL}/documentos/${DocumentType.MANUAL}`} replace />;
    case 'EDITOR':
      return <Navigate to="/tasks" replace />;
    case 'LECTOR':
    default:
      return <Navigate to={`/drive/${ProcessType.ESTRATEGICO}/documentos/${DocumentType.MANUAL}`} replace />;
  }
}


const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getNavLinkClass = (isActive: boolean) =>
    `${isActive
      ? 'border-brand-primary text-brand-primary'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors focus:outline-none`;

  const getActiveProcessType = (): ProcessType => {
    const pathSegments = location.pathname.split('/');
    // e.g., /drive/Estratégico/documentos/Manual -> segments[2] is 'Estratégico'
    const processSegment = pathSegments[2] || '';
    const matchedProcess = Object.values(ProcessType).find(p => p === decodeURIComponent(processSegment));
    return matchedProcess || ProcessType.ESTRATEGICO;
  }

  const activeProcess = getActiveProcessType();

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="bg-white border-b border-gray-200 flex-shrink-0 hidden lg:block">
        <nav className="-mb-px flex px-4" aria-label="Tabs">
          <NavLink to={`/drive/${ProcessType.ESTRATEGICO}/documentos/${DocumentType.MANUAL}`} className={() => getNavLinkClass(activeProcess === ProcessType.ESTRATEGICO)}>
            {ProcessType.ESTRATEGICO}
          </NavLink>
          <NavLink to={`/drive/${ProcessType.MISIONAL}/documentos/${DocumentType.MANUAL}`} className={() => getNavLinkClass(activeProcess === ProcessType.MISIONAL)}>
            {ProcessType.MISIONAL}
          </NavLink>
          <NavLink to={`/drive/${ProcessType.APOYO}/Gestión Humana/documentos/${DocumentType.MANUAL}`} className={() => getNavLinkClass(activeProcess === ProcessType.APOYO)}>
            {ProcessType.APOYO}
          </NavLink>
          <NavLink to={`/drive/${ProcessType.CONTROL}/documentos/${DocumentType.MANUAL}`} className={() => getNavLinkClass(activeProcess === ProcessType.CONTROL)}>
            {ProcessType.CONTROL}
          </NavLink>
        </nav>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <TenantSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeProcess={activeProcess} />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 h-full">
            <Routes>
              <Route path="/drive/:processType/:level2?/:level3?/:level4?" element={<IsoDrivePage />} />
              <Route path="/forms/purchase-order/new" element={<PurchaseOrderPage />} />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/master-list/documents" element={<MasterListPage />} />
              <Route path="/tenant/settings" element={<TenantSettingsPage />} />
              <Route path="/tenant/audit" element={<TenantAuditPage />} />
              <Route path="/tenant/users" element={<TenantUserPage />} />
              <Route path="/tenant/equipment" element={<EquipmentPage />} />
              <Route path="/tenant/quotes" element={<QuotesPage />} />
              <Route path="/*" element={<TenantHomeRedirect />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;