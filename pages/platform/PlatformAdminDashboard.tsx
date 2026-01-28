import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import PlatformSidebar from '../../components/platform/PlatformSidebar';
import PlatformHomePage from './PlatformHomePage';
import TenantListPage from './TenantListPage';
import PlanListPage from './PlanListPage';
import TemplateListPage from './TemplateListPage';
import PlatformAuditPage from './PlatformAuditPage';
import PlatformSettingsPage from './PlatformSettingsPage';
import RoleManagementPage from './RoleManagementPage';

const PlatformAdminDashboard: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="h-screen w-full flex flex-col bg-gray-50">
            <Header onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-1 overflow-hidden">
                <PlatformSidebar isOpen={isSidebarOpen} />
                <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Routes>
                        <Route path="/platform/admin" element={<PlatformHomePage />} />
                        <Route path="/platform/tenants" element={<TenantListPage />} />
                        <Route path="/platform/plans" element={<PlanListPage />} />
                        <Route path="/platform/roles" element={<RoleManagementPage />} />
                        <Route path="/platform/templates" element={<TemplateListPage />} />
                        <Route path="/platform/audit" element={<PlatformAuditPage />} />
                        <Route path="/platform/settings" element={<PlatformSettingsPage />} />
                        {/* Redirección por defecto para el superadmin */}
                        <Route path="/*" element={<Navigate to="/platform/admin" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default PlatformAdminDashboard;