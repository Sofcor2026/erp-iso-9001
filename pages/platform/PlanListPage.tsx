import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit } from 'lucide-react';
import { api } from '../../services/api';
import { Plan } from '../../types';
import CreatePlanModal from '../../components/platform/CreatePlanModal';

const PlanListPage: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);

    const fetchPlans = () => {
        setLoading(true);
        api.getPlans()
            .then(setPlans)
            .catch(err => console.error("Failed to fetch plans", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenCreateModal = () => {
        setPlanToEdit(null);
        setPlanModalOpen(true);
    };

    const handleOpenEditModal = (plan: Plan) => {
        setPlanToEdit(plan);
        setPlanModalOpen(true);
    };

    const handleCloseModal = () => {
        setPlanModalOpen(false);
        setPlanToEdit(null);
    };

    if (loading) {
        return <div>Cargando planes...</div>
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Planes</h1>
                        <p className="text-gray-600 mt-1">Cree y administre los planes de suscripción para sus tenants.</p>
                    </div>
                    <button onClick={handleOpenCreateModal} className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary flex items-center shadow-sm">
                        <Plus size={16} className="mr-2"/> Crear Nuevo Plan
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Plan</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite de Usuarios</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite de Almacenamiento</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {plans.map(plan => (
                                    <tr key={plan.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}/mes</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.userLimit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.storageLimit} GB</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => handleOpenEditModal(plan)} className="text-brand-primary hover:text-brand-secondary p-1 rounded-full hover:bg-blue-100 transition-colors">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <CreatePlanModal
                isOpen={isPlanModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchPlans}
                plan={planToEdit}
            />
        </>
    );
};

export default PlanListPage;