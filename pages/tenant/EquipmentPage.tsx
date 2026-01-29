import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Search, Loader2, User, Calendar, CheckSquare } from 'lucide-react';
import { api } from '../../services/api';
import { EquipmentAssignment, User as AppUser } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedUser, setSelectedUser] = useState('');
    const [itemName, setItemName] = useState('');
    const [qty, setQty] = useState(1);
    const [talla, setTalla] = useState('');
    const [notas, setNotas] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                api.getDotaciones(),
                api.getUsers()
            ]);
            setAssignments(data);
            setUsers(usersData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedUser) return;

        setIsSaving(true);
        try {
            await api.addDotacion({
                employeeId: selectedUser,
                itemNombre: itemName,
                cantidad: qty,
                talla: talla,
                estado: 'Entregado',
                fechaEntrega: new Date().toISOString().split('T')[0],
                notas: notas
            }, currentUser);

            setIsModalOpen(false);
            fetchData();
            // Reset form
            setSelectedUser('');
            setItemName('');
            setQty(1);
            setTalla('');
            setNotas('');
        } catch (error) {
            alert("Error al guardar dotación");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-primary" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <HardHat className="text-brand-primary" />
                        Gestión de Dotaciones (PPE)
                    </h1>
                    <p className="text-gray-500">Registro de entrega de elementos de protección y uniformes.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    <Plus size={20} />
                    Asignar Dotación
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elemento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad / Talla</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No hay registros de dotación.</td>
                            </tr>
                        ) : (
                            assignments.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <User size={16} className="text-brand-primary" />
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">{item.employeeNombre || 'Desconocido'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{item.itemNombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.cantidad} unidades {item.talla ? `(Talla: ${item.talla})` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {item.fechaEntrega}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                            {item.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Nueva Asignación</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Seleccionar empleado...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Elemento / Equipo</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Casco, Botas, Overol"
                                    className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={qty}
                                        onChange={(e) => setQty(parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Talla (opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: L, 42, S"
                                        className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={talla}
                                        onChange={(e) => setTalla(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea
                                    rows={2}
                                    className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentPage;
