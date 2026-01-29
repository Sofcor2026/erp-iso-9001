import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, Permission, Role } from '../types';
import { supabase } from '../src/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isImpersonating: boolean;
    originalUser: User | null;
    login: (email: string, password: string) => Promise<void>;
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

    // Función para obtener datos completos del usuario desde la tabla users
    const fetchUserData = useCallback(async (authUserId: string): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          id,
          email,
          nombre,
          tenant_id,
          activo,
          role:roles (
            id,
            name,
            description,
            permissions,
            is_default
          )
        `)
                .eq('id', authUserId)
                .single();

            if (error) {
                console.error('Error fetching user data:', error);
                return null;
            }

            if (!data) {
                console.error('User not found in users table');
                return null;
            }

            // Transformar los datos de Supabase al formato de nuestro User type
            const roleData = Array.isArray(data.role) ? data.role[0] : data.role;
            const userData: User = {
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                role: {
                    id: roleData.id,
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions as Permission[],
                    isDefault: roleData.is_default,
                },
                tenantId: data.tenant_id,
                activo: data.activo,
            };

            return userData;
        } catch (error) {
            console.error('Error in fetchUserData:', error);
            return null;
        }
    }, []);

    // Establecer el usuario inicial y escuchar cambios
    useEffect(() => {
        let isMounted = true;

        // --- SAFETY TIMEOUT ---
        // Si en 4 segundos no hay respuesta clara, desbloqueamos la pantalla
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Auth check timed out. Forcing load completion.');
                setLoading(false);
            }
        }, 4000);

        async function initAuth() {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && isMounted) {
                    const userData = await fetchUserData(session.user.id);
                    if (userData && isMounted) {
                        setUser(userData);
                        // Restaurar impersonation if exists
                        const storedOriginalUser = localStorage.getItem('erp-original-user');
                        if (storedOriginalUser) {
                            try {
                                setOriginalUser(JSON.parse(storedOriginalUser));
                            } catch (e) {
                                localStorage.removeItem('erp-original-user');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setOriginalUser(null);
                    localStorage.removeItem('erp-original-user');
                    setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                }

                if (session?.user) {
                    const userData = await fetchUserData(session.user.id);
                    if (userData && isMounted) {
                        setUser(userData);
                    }
                }

                if (isMounted) {
                    setLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [fetchUserData]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                const userData = await fetchUserData(data.user.id);
                if (userData) {
                    // Verificar si el tenant está suspendido
                    if (userData.tenantId) {
                        const { data: tenant, error: tenantError } = await supabase
                            .from('tenants')
                            .select('estado')
                            .eq('id', userData.tenantId)
                            .single();

                        if (tenantError || tenant?.estado === 'Suspendido') {
                            await supabase.auth.signOut();
                            throw new Error('Tenant suspendido. Contacte al administrador.');
                        }
                    }

                    setUser(userData);
                } else {
                    throw new Error('Usuario no encontrado en el sistema. Contacte al administrador.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setOriginalUser(null);
            localStorage.removeItem('erp-original-user');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const impersonate = async (tenantId: string): Promise<User | null> => {
        if (!user || !hasPermission('platform:access')) {
            throw new Error('Only SuperAdmins can impersonate.');
        }

        setLoading(true);
        try {
            // Buscar el admin del tenant
            const { data, error } = await supabase
                .from('users')
                .select(`
          id,
          email,
          nombre,
          tenant_id,
          activo,
          role:roles (
            id,
            name,
            description,
            permissions,
            is_default
          )
        `)
                .eq('tenant_id', tenantId)
                .eq('role_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
                .single();

            if (error || !data) {
                console.error('Error finding tenant admin:', error);
                return null;
            }

            const roleData = Array.isArray(data.role) ? data.role[0] : data.role;
            const tenantAdmin: User = {
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                role: {
                    id: roleData.id,
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions as Permission[],
                    isDefault: roleData.is_default,
                },
                tenantId: data.tenant_id,
                activo: data.activo,
            };

            // Guardar el usuario original
            setOriginalUser(user);
            setUser(tenantAdmin);
            localStorage.setItem('erp-original-user', JSON.stringify(user));

            // Log audit event
            await supabase.from('audit_logs').insert({
                actor: user.email,
                action: 'IMPERSONATE_START',
                resource: `tenant:${tenantId}`,
                metadata: { original_user: user.email, impersonated_user: tenantAdmin.email }
            });

            return tenantAdmin;
        } catch (error) {
            console.error('Impersonation failed:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const stopImpersonating = async () => {
        if (!originalUser) return;

        // Log audit event
        if (user) {
            await supabase.from('audit_logs').insert({
                actor: originalUser.email,
                action: 'IMPERSONATE_STOP',
                resource: `tenant:${user.tenantId}`,
                metadata: { original_user: originalUser.email, impersonated_user: user.email }
            });
        }

        setUser(originalUser);
        setOriginalUser(null);
        localStorage.removeItem('erp-original-user');
    };

    const hasPermission = (permission: Permission): boolean => {
        return user?.role?.permissions?.includes(permission) ?? false;
    };

    const isImpersonating = !!originalUser;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isImpersonating,
                originalUser,
                impersonate,
                stopImpersonating,
                hasPermission,
            }}
        >
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
