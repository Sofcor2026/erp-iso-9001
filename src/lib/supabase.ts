import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Helper type for database tables
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    nombre: string;
                    role_id: string;
                    tenant_id: string | null;
                    activo: boolean;
                    created_at: string;
                    updated_at: string;
                };
            };
            documents: {
                Row: {
                    id: string;
                    tenant_id: string;
                    codigo: string;
                    nombre: string;
                    proceso: string;
                    subproceso: string | null;
                    tipo: string;
                    version: number;
                    estado: string;
                    responsable_id: string;
                    fecha_emision: string;
                    fecha_revision: string;
                    archivo_url: string | null;
                    form_id: string | null;
                    form_type: string | null;
                    created_at: string;
                    updated_at: string;
                };
            };
            // Add more table types as needed
        };
    };
};
