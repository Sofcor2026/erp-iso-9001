import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plan } from '../../types';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: Plan | null;
}

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose, onSuccess, plan }) => {
  const { user } = useAuth();
  const isEditMode = !!plan;

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState(0);
  const [userLimit, setUserLimit] = useState(5);
  const [storageLimit, setStorageLimit] = useState(1);
  const [descripcion, setDescripcion] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const clearForm = () => {
    setNombre('');
    setPrecio(0);
    setUserLimit(5);
    setStorageLimit(1);
    setDescripcion('');
    setFormError('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setNombre(plan.nombre);
        setPrecio(plan.precio);
        setUserLimit(plan.userLimit);
        setStorageLimit(plan.storageLimit);
        setDescripcion(plan.descripcion);
      } else {
        clearForm();
      }
    }
  }, [isOpen, plan, isEditMode]);


  const handleClose = () => {
    // Clear form state on close, but without re-rendering unnecessarily
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setFormError("No se ha podido identificar al usuario. Por favor, inicie sesión de nuevo.");
        return;
    }
    if (!nombre || precio < 0 || userLimit <= 0 || storageLimit <= 0) {
        setFormError("Por favor, complete todos los campos requeridos con valores válidos.");
        return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
        const planData = { nombre, precio, userLimit, storageLimit, descripcion };
        if (isEditMode) {
            await api.updatePlan(plan.id, planData, user);
            alert(`Plan "${nombre}" actualizado exitosamente.`);
        } else {
            await api.createPlan(planData, user);
            alert(`Plan "${nombre}" creado exitosamente.`);
        }
        onSuccess();
        handleClose();
    } catch (error) {
        console.error("Failed to save plan", error);
        setFormError("Ocurrió un error al guardar el plan. Inténtelo de nuevo.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{isEditMode ? 'Editar Plan' : 'Crear Nuevo Plan'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
              <input type="text" id="plan-name" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="plan-price" className="block text-sm font-medium text-gray-700">Precio Mensual (COP)</label>
              <input type="number" id="plan-price" value={precio} onChange={e => setPrecio(Number(e.target.value))} required min="0" className="mt-1 block w-full input-style" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="plan-users" className="block text-sm font-medium text-gray-700">Límite de Usuarios</label>
                    <input type="number" id="plan-users" value={userLimit} onChange={e => setUserLimit(Number(e.target.value))} required min="1" className="mt-1 block w-full input-style" />
                </div>
                <div>
                    <label htmlFor="plan-storage" className="block text-sm font-medium text-gray-700">Almacenamiento (GB)</label>
                    <input type="number" id="plan-storage" value={storageLimit} onChange={e => setStorageLimit(Number(e.target.value))} required min="1" className="mt-1 block w-full input-style" />
                </div>
            </div>
            <div>
              <label htmlFor="plan-desc" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="plan-desc" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} className="mt-1 block w-full input-style" />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-brand-secondary disabled:bg-gray-400 flex items-center">
              {isSubmitting && <Loader2 className="animate-spin mr-2" size={16}/>}
              {isSubmitting ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Plan')}
            </button>
          </div>
        </form>
        <style>{`.input-style { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; } .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
};

export default CreatePlanModal;