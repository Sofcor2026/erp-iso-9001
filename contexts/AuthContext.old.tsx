import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, Permission } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isImpersonating: boolean;
  originalUser: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  impersonate: (tenantId: string) => Promise<User | null>;
  stopImpersonating: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('erp-user');
      const storedOriginalUser = localStorage.getItem('erp-original-user');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedOriginalUser) {
        setOriginalUser(JSON.parse(storedOriginalUser));
      }
    } catch (error) {
      console.error('Failed to check auth status', error);
      setUser(null);
      setOriginalUser(null);
      localStorage.removeItem('erp-user');
      localStorage.removeItem('erp-original-user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string) => {
    setLoading(true);
    const loggedInUser = await api.login(email);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('erp-user', JSON.stringify(loggedInUser));
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setOriginalUser(null);
    localStorage.removeItem('erp-user');
    localStorage.removeItem('erp-original-user');
  };

  const impersonate = async (tenantId: string) => {
    if (!user || !hasPermission('platform:access')) {
        throw new Error("Only SuperAdmins can impersonate.");
    }
    setLoading(true);
    try {
        const tenantAdmin = await api.getTenantAdmin(tenantId);
        if (tenantAdmin) {
            setOriginalUser(user);
            setUser(tenantAdmin);
            localStorage.setItem('erp-original-user', JSON.stringify(user));
            localStorage.setItem('erp-user', JSON.stringify(tenantAdmin));
            return tenantAdmin;
        }
        return null;
    } catch(error) {
        console.error("Impersonation failed", error);
        return null;
    } finally {
        setLoading(false);
    }
  };

  const stopImpersonating = () => {
    if (!originalUser) return;
    setUser(originalUser);
    setOriginalUser(null);
    localStorage.setItem('erp-user', JSON.stringify(originalUser));
    localStorage.removeItem('erp-original-user');
  };
  
  const hasPermission = (permission: Permission): boolean => {
      return user?.role?.permissions?.includes(permission) ?? false;
  };

  const isImpersonating = !!originalUser;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isImpersonating, originalUser, impersonate, stopImpersonating, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};