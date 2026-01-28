import React, { useState, useEffect } from 'react';
import { Tenant, Plan } from '../../types';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant: Tenant;
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({ isOpen, onClose, onSuccess, tenant }) => {
  const [nombre, setNombre] = useState('');
  const [planId, setPlanId] = useState('');
  const [userLimit, setUserLimit] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getPlans().then(setAvailablePlans);
    }
  }, [isOpen]);

  useEffect(() => {
    if (tenant) {
        setNombre(tenant.nombre);
        setPlanId(tenant.planId);
        setUserLimit(tenant.userLimit);
        setStorageLimit(tenant.storageLimit);
    }
  }, [tenant]);

  const handleClose = () => {
    setFormError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
        await api.updateTenant(tenant.id, { nombre, planId, userLimit, storageLimit });
        alert(`Tenant "${nombre}" actualizado exitosamente.`);
        onSuccess();
        handleClose();
    } catch (error) {
        console.error("Failed to update tenant", error);
        setFormError("Ocurrió un error al actualizar el tenant. Inténtelo de nuevo.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Editar Tenant: {tenant.nombre}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label htmlFor="edit-tenant-name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                <input type="text" id="edit-tenant-name" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
            <div>
                <label htmlFor="edit-tenant-plan" className="block text-sm font-medium text-gray-700">Plan Asignado</label>
                <select id="edit-tenant-plan" value={planId} onChange={e => setPlanId(e.target.value)} className="mt-1 block w-full input-style">
                     {availablePlans.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                     ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="edit-user-limit" className="block text-sm font-medium text-gray-700">Límite de Usuarios</label>
                    <input type="number" id="edit-user-limit" value={userLimit} onChange={e => setUserLimit(Number(e.target.value))} required className="mt-1 block w-full input-style" />
                </div>
                 <div>
                    <label htmlFor="edit-storage-limit" className="block text-sm font-medium text-gray-700">Límite Almacenamiento (GB)</label>
                    <input type="number" id="edit-storage-limit" value={storageLimit} onChange={e => setStorageLimit(Number(e.target.value))} required className="mt-1 block w-full input-style" />
                </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center">
              {isSubmitting && <Loader2 className="animate-spin mr-2" size={16}/>}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
        <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
};

export default EditTenantModal;