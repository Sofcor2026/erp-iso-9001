import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { User, Permission } from '../types';
import { supabase } from '../src/lib/supabase';

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
    const initRef = useRef(false);

    const fetchUserData = useCallback(async (authUserId: string): Promise<User | null> => {
        try {
            console.log('[Auth] Fetching profile for:', authUserId);

            // Timeout para las consultas a la base de datos para evitar bloqueos infinitos
            // En TSX, usamos <T,> para evitar confusión con etiquetas JSX
            const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
                    )
                ]);
            };

            // Primero el usuario con una consulta simple para evitar errores de joins complejos si hay problemas de RLS
            const { data: userDataRaw, error: userError } = await withTimeout(
                supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUserId)
                    .single()
            );

            if (userError || !userDataRaw) {
                console.error('[Auth] User record not found or error:', userError);
                return null;
            }

            // Luego el rol por separado para asegurar que no falle todo el login por un join
            const { data: roleDataRaw, error: roleError } = await withTimeout(
                supabase
                    .from('roles')
                    .select('*')
                    .eq('id', userDataRaw.role_id)
                    .single()
            );

            if (roleError || !roleDataRaw) {
                console.error('[Auth] Role not found for user:', roleError);
                return null;
            }

            const userData: User = {
                id: userDataRaw.id,
                email: userDataRaw.email,
                nombre: userDataRaw.nombre,
                role: {
                    id: roleDataRaw.id,
                    name: roleDataRaw.name,
                    description: roleDataRaw.description,
                    permissions: roleDataRaw.permissions as Permission[],
                    isDefault: roleDataRaw.is_default,
                },
                tenantId: userDataRaw.tenant_id,
                activo: userDataRaw.activo,
            };

            console.log('[Auth] Profile fetched successfully');
            return userData;
        } catch (err) {
            console.error('[Auth] Critical error or timeout in fetchUserData:', err);
            return null;
        }
    }, []);


    useEffect(() => {
        // En producción el initRef previene doble ejecución
        if (initRef.current) return;
        initRef.current = true;

        let isSubscribed = true;

        const initialize = async () => {
            console.log('[Auth] Starting initial session check...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[Auth] Session check result:', session ? 'Session found' : 'No session');

                if (session?.user && isSubscribed) {
                    const userData = await fetchUserData(session.user.id);
                    if (userData && isSubscribed) {
                        console.log('[Auth] User data loaded from session');
                        setUser(userData);
                        const stored = localStorage.getItem('erp-original-user');
                        if (stored) {
                            try { setOriginalUser(JSON.parse(stored)); } catch { localStorage.removeItem('erp-original-user'); }
                        }
                    } else if (isSubscribed) {
                        console.warn('[Auth] No profile data found for session user');
                    }
                }
            } catch (err) {
                console.error('[Auth] Init error:', err);
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                    console.log('[Auth] Initialization finished.');
                }
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] State change event:', event);
            try {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    if (session?.user && isSubscribed) {
                        const userData = await fetchUserData(session.user.id);
                        if (userData && isSubscribed) {
                            setUser(userData);
                        } else if (isSubscribed) {
                            console.warn('[Auth] Failed to update user data after event:', event);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    if (isSubscribed) {
                        setUser(null);
                        setOriginalUser(null);
                        localStorage.removeItem('erp-original-user');
                    }
                }
            } catch (err) {
                console.error('[Auth] Error in onAuthStateChange:', err);
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                }
            }
        });

        // Fallback: si después de 10 segundos seguimos cargando, forzar el fin de carga
        const timer = setTimeout(() => {
            if (isSubscribed) {
                setLoading(prev => {
                    if (prev) {
                        console.warn('[Auth] Loading timeout reached. Force completing loading state.');
                        return false;
                    }
                    return prev;
                });
            }
        }, 10000);

        return () => {
            isSubscribed = false;
            subscription.unsubscribe();
            clearTimeout(timer);
            // No reseteamos initRef.current para evitar re-ejecución en StrictMode si sobrevive el componente
        };
    }, [fetchUserData]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (data.user) {
                const userData = await fetchUserData(data.user.id);
                if (!userData) {
                    // Espera mínima por si el trigger de onAuthStateChange está procesando
                    await new Promise(r => setTimeout(r, 800));
                    if (!user) throw new Error('Usuario registrado pero sin perfil configurado en el sistema.');
                } else {
                    setUser(userData);
                }
            }
        } catch (err: any) {
            console.error('[Auth] Login failed:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setOriginalUser(null);
        localStorage.removeItem('erp-original-user');
    };

    const impersonate = async (tenantId: string): Promise<User | null> => {
        if (!user) return null;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('role_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
                .single();

            if (error || !data) return null;

            const { data: roleData } = await supabase.from('roles').select('*').eq('id', data.role_id).single();
            if (!roleData) return null;

            const targetUser: User = {
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                role: {
                    id: roleData.id,
                    name: roleData.name,
                    description: roleData.description,
                    permissions: roleData.permissions,
                    isDefault: roleData.is_default
                },
                tenantId: data.tenant_id,
                activo: data.activo
            };

            setOriginalUser(user);
            setUser(targetUser);
            localStorage.setItem('erp-original-user', JSON.stringify(user));
            return targetUser;
        } finally {
            setLoading(false);
        }
    };

    const stopImpersonating = () => {
        if (originalUser) {
            setUser(originalUser);
            setOriginalUser(null);
            localStorage.removeItem('erp-original-user');
        }
    };

    const hasPermission = (permission: Permission): boolean => {
        return user?.role?.permissions?.includes(permission) ?? false;
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, logout, isImpersonating: !!originalUser,
            originalUser, impersonate, stopImpersonating, hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
