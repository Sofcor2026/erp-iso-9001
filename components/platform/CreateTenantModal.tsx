import React, { useState, useEffect, useCallback } from 'react';
import { Plan, User as UserType } from '../../types';
import { X, Building, Loader2, User as UserIcon } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user: actor } = useAuth();
  const [nombre, setNombre] = useState('');
  const [subdominio, setSubdominio] = useState('');
  const [planId, setPlanId] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isSubdomainChecking, setIsSubdomainChecking] = useState(false);
  const [subdomainError, setSubdomainError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getPlans().then(fetchedPlans => {
        setPlans(fetchedPlans);
        if (fetchedPlans.length > 0) {
          setPlanId(fetchedPlans[0].id); // Default to the first plan
        }
      });
    }
  }, [isOpen]);

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const checkSubdomain = useCallback(
    debounce(async (domain: string) => {
      if (!domain || domain.length < 3) {
        setSubdomainError('');
        return;
      }
      setIsSubdomainChecking(true);
      try {
        const isTaken = await api.isSubdomainTaken(domain);
        setSubdomainError(isTaken ? 'Este subdominio ya está en uso.' : '');
      } catch (e) {
        setSubdomainError('Error al verificar el subdominio.');
      } finally {
        setIsSubdomainChecking(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    checkSubdomain(subdominio);
  }, [subdominio, checkSubdomain]);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdominio(value);
  };

  const clearForm = () => {
    setNombre('');
    setSubdominio('');
    setPlanId(plans.length > 0 ? plans[0].id : '');
    setAdminNombre('');
    setAdminEmail('');
    setSubdomainError('');
    setFormError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setFormError("No se pudo identificar al SuperAdmin. Por favor, inicie sesión de nuevo.");
      return;
    }
    if (subdomainError || !nombre || !subdominio || !adminNombre || !adminEmail || !planId) {
      setFormError("Por favor, complete todos los campos requeridos y corrija los errores.");
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      await api.createTenant(
        { nombre, subdominio, planId },
        { nombre: adminNombre, email: adminEmail },
        actor
      );
      alert(`Tenant "${nombre}" creado exitosamente.`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to create tenant", error);
      setFormError("Ocurrió un error al crear el tenant. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Crear Nuevo Tenant</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Tenant Info */}
            <div className="p-5 backdrop-blur-sm bg-blue-50/30 border border-blue-100 rounded-2xl">
              <h3 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
                <Building className="text-blue-600" size={20} />
                Datos de la Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="tenant-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Nombre Comercial</label>
                  <input type="text" id="tenant-name" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Industrias Metalurgicas S.A." className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>
                <div>
                  <label htmlFor="tenant-plan" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Plan de Suscripción</label>
                  <select id="tenant-plan" value={planId} onChange={e => setPlanId(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
                    {plans.length === 0 ? (
                      <option disabled>Cargando planes...</option>
                    ) : (
                      plans.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - ${p.precio.toLocaleString()}/mes</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="tenant-subdomain" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Identificador de Acceso (Subdominio)</label>
                  <div className="mt-1 flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <input
                      type="text"
                      id="tenant-subdomain"
                      value={subdominio}
                      onChange={handleSubdomainChange}
                      required
                      placeholder="minimo 3 letras"
                      className={`flex-1 min-w-0 block w-full px-4 py-3 border-none outline-none ${subdomainError ? 'text-red-600' : ''}`}
                    />
                    <span className="inline-flex items-center px-4 bg-gray-50 text-gray-400 font-medium text-sm border-l border-gray-200">.isodrive.app</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 px-1">Nota: Este alias identificará a la empresa en la plataforma (ej: {subdominio || 'empresa'}.isodrive.app)</p>
                  {isSubdomainChecking && <p className="text-xs text-blue-600 mt-2 flex items-center animate-pulse"><Loader2 className="animate-spin mr-2" size={14} /> Verificando disponibilidad...</p>}
                  {subdomainError && <p className="text-xs text-red-600 mt-2 flex items-center">{subdomainError}</p>}
                </div>
              </div>
            </div>

            {/* Admin Info */}
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
              <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                <UserIcon className="text-gray-500" size={20} />
                Administrador de la Cuenta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="admin-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Nombre Completo</label>
                  <input type="text" id="admin-name" value={adminNombre} onChange={e => setAdminNombre(e.target.value)} required placeholder="Ej: Juan Pérez" className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email Corporativo</label>
                  <input type="email" id="admin-email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="ejemplo@empresa.com" className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  Se enviará automáticamente un correo con las credenciales de acceso una vez creado el perfil.
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-600 font-medium text-center">{formError}</p>
              </div>
            )}
          </div>
          <div className="px-8 py-5 bg-white border-t rounded-b-3xl flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!subdomainError || isSubdomainChecking}
              className="px-8 py-3 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creando Empresa...
                </>
              ) : (
                'Crear Nueva Empresa'
              )}
            </button>
          </div>
        </form>
        <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
};

export default CreateTenantModal;