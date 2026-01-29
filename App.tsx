import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PlatformAdminDashboard from './pages/platform/PlatformAdminDashboard';
import ImpersonationBanner from './components/platform/ImpersonationBanner';
import { Role } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router />
      </DataProvider>
    </AuthProvider>
  );
};

const AppRouter: React.FC = () => {
  const { hasPermission } = useAuth();

  if (hasPermission('platform:access')) {
    return <PlatformAdminDashboard />;
  }
  // All other roles go to the tenant dashboard
  return <Dashboard />;
}


const Router: React.FC = () => {
  const { user, loading, isImpersonating, hasPermission } = useAuth();

  const getHomeRoute = (roleName: string | undefined) => {
    switch (roleName) {
      case 'SUPERADMIN': return '/platform/admin';
      case 'ADMIN': return '/tenant/admin';
      case 'EDITOR': return '/tenant/editor';
      case 'LECTOR': return '/tenant/viewer';
      default:
        if (hasPermission('platform:access')) return '/platform/admin';
        return '/';
    }
  };

  return (
    <HashRouter>
      {isImpersonating && <ImpersonationBanner />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getHomeRoute(user.role.name)} replace />} />
        <Route path="/*" element={user ? <AppRouter /> : (loading ? <div className="flex items-center justify-center h-screen bg-white text-gray-400">Verificando sesión...</div> : <Navigate to="/login" replace />)} />
      </Routes>
    </HashRouter>
  );
};

export default App;