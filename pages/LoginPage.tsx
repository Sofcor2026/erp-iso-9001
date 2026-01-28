import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, ChevronRight, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError('Error al iniciar sesión. Por favor, verifique sus credenciales.');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0a0f1d] overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat transition-transform duration-[20000ms] hover:scale-110"
                style={{ backgroundImage: 'url("/erp_login_background_1769636649677.png")' }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#0a0f1d] via-transparent to-[#1e40af22]" />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-lg">
                <div className="backdrop-blur-xl bg-white/10 p-10 rounded-[2.5rem] border border-white/20 shadow-2xl space-y-8">
                    <div className="text-center space-y-3">
                        <div className="inline-flex p-4 rounded-3xl bg-brand-primary/20 border border-brand-primary/30 mb-2">
                            <div className="h-10 w-10 text-white flex items-center justify-center font-bold text-2xl">
                                ISO
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            ERP <span className="text-brand-accent">Drive 9000</span>
                        </h1>
                        <p className="text-blue-100/70 font-medium">Control total en la nube para tu empresa</p>
                    </div>

                    <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="group relative">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-2 block opacity-70">Email corporativo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-blue-300 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-white/10 transition-all text-lg"
                                        placeholder="correo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-2 block opacity-70">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-blue-300 opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-white/10 transition-all text-lg"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30">
                                <p className="text-sm text-red-200 text-center font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-2xl text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition-all duration-300 shadow-xl shadow-brand-primary/20 overflow-hidden"
                        >
                            <span className="relative z-10 font-bold text-lg flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        Entrar al Sistema
                                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-blue-200/40 text-sm font-medium">
                    © 2026 ERP ISO 9000 Pro • Privacidad y Seguridad Garantizada
                </p>
            </div>
        </div>
    );
};

export default LoginPage;