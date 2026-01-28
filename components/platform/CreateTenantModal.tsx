import React, { useState, useEffect, useCallback } from 'react';
import { Plan, User } from '../../types';
import { X, Building, Loader2 } from 'lucide-react';
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
            <div className="p-4 border rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">Datos de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tenant-name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                        <input type="text" id="tenant-name" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="tenant-plan" className="block text-sm font-medium text-gray-700">Plan Asignado</label>
                        <select id="tenant-plan" value={planId} onChange={e => setPlanId(e.target.value)} className="mt-1 block w-full input-style">
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} (${p.precio}/mes)</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="tenant-subdomain" className="block text-sm font-medium text-gray-700">Subdominio</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                             <input 
                                type="text" 
                                id="tenant-subdomain" 
                                value={subdominio} 
                                onChange={handleSubdomainChange} 
                                required 
                                className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-brand-primary focus:border-brand-primary sm:text-sm border-gray-300 ${subdomainError ? 'border-red-500' : ''}`} 
                             />
                             <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">.isodrive.com</span>
                        </div>
                        {isSubdomainChecking && <p className="text-sm text-gray-500 mt-1 flex items-center"><Loader2 className="animate-spin mr-2" size={16}/> Verificando...</p>}
                        {subdomainError && <p className="text-sm text-red-600 mt-1">{subdomainError}</p>}
                    </div>
                </div>
            </div>
             {/* Admin Info */}
            <div className="p-4 border rounded-md">
                 <h3 className="font-medium text-gray-700 mb-2">Administrador Inicial</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700">Nombre del Admin</label>
                        <input type="text" id="admin-name" value={adminNombre} onChange={e => setAdminNombre(e.target.value)} required className="mt-1 block w-full input-style" />
                     </div>
                     <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">Email del Admin</label>
                        <input type="email" id="admin-email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className="mt-1 block w-full input-style" />
                     </div>
                </div>
                 <p className="text-xs text-gray-500 mt-3">Se enviará un correo de bienvenida al administrador con una contraseña provisional para su primer inicio de sesión.</p>
            </div>
            
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !!subdomainError || isSubdomainChecking} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
              {isSubmitting && <Loader2 className="animate-spin mr-2" size={16}/>}
              {isSubmitting ? 'Creando...' : 'Crear Tenant'}
            </button>
          </div>
        </form>
        <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
};

export default CreateTenantModal;