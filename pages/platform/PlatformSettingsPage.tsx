import React, { useState, useEffect } from 'react';
import { Settings, Mail, CreditCard, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const PlatformSettingsPage: React.FC = () => {
    // State for SMTP form
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [isSavingSmtp, setIsSavingSmtp] = useState(false);

    // State for Stripe form
    const [stripePk, setStripePk] = useState('');
    const [stripeSk, setStripeSk] = useState('');
    const [isSavingStripe, setIsSavingStripe] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await api.getPlatformSettings();
                if (settings.smtp) {
                    setSmtpHost(settings.smtp.host || '');
                    setSmtpPort(settings.smtp.port || '');
                    setSmtpUser(settings.smtp.user || '');
                    setSmtpPass(settings.smtp.pass || '');
                }
                if (settings.stripe) {
                    setStripePk(settings.stripe.publicKey || '');
                    setStripeSk(settings.stripe.secretKey || '');
                }
            } catch (error) {
                console.error("Failed to load settings", error);
                alert("Could not load platform settings.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSmtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSmtp(true);
        try {
            await api.updateSmtpSettings({
                host: smtpHost,
                port: smtpPort,
                user: smtpUser,
                pass: smtpPass,
            });
            alert("Configuración SMTP guardada exitosamente.");
            // Reset password field after save for security
            setSmtpPass('********');
        } catch (error) {
            console.error("Failed to save SMTP settings", error);
            alert("Error al guardar la configuración SMTP.");
        } finally {
            setIsSavingSmtp(false);
        }
    };

    const handleStripeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingStripe(true);
        try {
            await api.updateStripeSettings({
                publicKey: stripePk,
                secretKey: stripeSk,
            });
            alert("Configuración de Pagos guardada exitosamente.");
            // Reset secret key field after save for security
            setStripeSk('********');
        } catch (error) {
            console.error("Failed to save Stripe settings", error);
            alert("Error al guardar la configuración de Pagos.");
        } finally {
            setIsSavingStripe(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Configuración de la Plataforma</h1>
                <p className="text-gray-600 mt-1">Gestione integraciones y parámetros globales del servicio.</p>
            </div>

            {/* SMTP Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                    <Mail size={20} className="mr-3 text-brand-primary" />
                    Integración de Email (SMTP)
                </h3>
                <form className="space-y-4" onSubmit={handleSmtpSubmit}>
                    <div>
                        <label htmlFor="smtp-host" className="block text-sm font-medium text-gray-700">Host SMTP</label>
                        <input id="smtp-host" type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="mt-1 block w-full input-style" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="smtp-port" className="block text-sm font-medium text-gray-700">Puerto</label>
                            <input id="smtp-port" type="text" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="smtp-user" className="block text-sm font-medium text-gray-700">Usuario</label>
                            <input id="smtp-user" type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="smtp-pass" className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input id="smtp-pass" type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="Dejar en blanco para no cambiar" className="mt-1 block w-full input-style" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSavingSmtp} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 flex items-center">
                            {isSavingSmtp && <Loader2 size={16} className="animate-spin mr-2" />}
                            {isSavingSmtp ? 'Guardando...' : 'Guardar Configuración SMTP'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Payment Gateway Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                    <CreditCard size={20} className="mr-3 text-brand-primary" />
                    Pasarela de Pagos (Stripe)
                </h3>
                <form className="space-y-4" onSubmit={handleStripeSubmit}>
                    <div>
                        <label htmlFor="stripe-pk" className="block text-sm font-medium text-gray-700">Clave Pública (Publishable Key)</label>
                        <input id="stripe-pk" type="text" value={stripePk} onChange={e => setStripePk(e.target.value)} placeholder="pk_test_..." className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="stripe-sk" className="block text-sm font-medium text-gray-700">Clave Secreta (Secret Key)</label>
                        <input id="stripe-sk" type="password" value={stripeSk} onChange={e => setStripeSk(e.target.value)} placeholder="Dejar en blanco para no cambiar" className="mt-1 block w-full input-style" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSavingStripe} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-400 flex items-center">
                            {isSavingStripe && <Loader2 size={16} className="animate-spin mr-2" />}
                            {isSavingStripe ? 'Guardando...' : 'Guardar Configuración de Pagos'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
        </div>
    );
};

export default PlatformSettingsPage;