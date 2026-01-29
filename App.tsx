import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PlatformAdminDashboard from './pages/platform/PlatformAdminDashboard';
import ImpersonationBanner from './components/platform/ImpersonationBanner';

const AppRouter: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Si no hay usuario y ya cargamos, al login
  if (!user) return <Navigate to="/login" replace />;

  if (hasPermission('platform:access')) {
    return <PlatformAdminDashboard />;
  }
  return <Dashboard />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AuthBoundary />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

const AuthBoundary: React.FC = () => {
  const { user, loading, isImpersonating, hasPermission } = useAuth();

  const getHomeRoute = (roleName: string | undefined) => {
    if (hasPermission('platform:access')) return '/platform/admin';
    switch (roleName) {
      case 'ADMIN': return '/tenant/admin';
      default: return '/';
    }
  };

  // Pantalla de carga ultra-ligera (max 3 segundos por el timeout del contexto)
  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium">Iniciando sistema...</p>
      </div>
    );
  }

  return (
    <>
      {isImpersonating && <ImpersonationBanner />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getHomeRoute(user.role?.name)} replace />} />
        <Route path="/*" element={<AppRouter />} />
      </Routes>
    </>
  );
};

export default App;