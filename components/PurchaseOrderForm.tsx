import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Contacto, OrdenCompraItem, ProcessType } from '../types';
import { PlusCircle, Trash2, Send } from 'lucide-react';

const PurchaseOrderForm: React.FC = () => {
  const [proveedores, setProveedores] = useState<Contacto[]>([]);
  const [proveedorId, setProveedorId] = useState('');
  const [centroCosto, setCentroCosto] = useState('');
  const [condiciones, setCondiciones] = useState('Pago a 30 días');
  const [items, setItems] = useState<OrdenCompraItem[]>([
    { id: `item-${Date.now()}`, descripcion: '', cantidad: 1, precioUnitario: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { fetchData: refreshDocuments } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    api.getProveedores().then(setProveedores);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof Omit<OrdenCompraItem, 'id'>, value: string) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const numericValue = field === 'descripcion' ? value : parseFloat(value) || 0;
        return { ...item, [field]: numericValue };
      }
      return item;
    });
    setItems(newItems);
  };
  
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
    const impuestos = subtotal * 0.19; // IVA 19%
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId || items.some(i => !i.descripcion || i.cantidad <= 0 || i.precioUnitario <= 0)) {
        setError('Por favor, seleccione un proveedor y complete todos los campos de los ítems correctamente.');
        return;
    }
    if (!user) {
        setError('No se ha podido identificar al usuario. Por favor, inicie sesión de nuevo.');
        return;
    }

    setError('');
    setIsSubmitting(true);
    try {
        // FIX: Add the missing 'fecha' property to satisfy the type signature of 'createOrdenCompra'.
        await api.createOrdenCompra({
            proveedorId,
            fecha: new Date().toISOString().split('T')[0],
            items,
            centroCosto,
            condiciones,
            ...totals,
        }, user);
        
        alert('Orden de Compra creada exitosamente. El documento asociado se ha generado en el proceso de Apoyo.');
        await refreshDocuments(); // Refresh document list
        navigate(`/docs/${ProcessType.APOYO}`);

    } catch (err) {
        console.error(err);
        setError('Ocurrió un error al crear la orden de compra.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      {/* Header del Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700">Proveedor</label>
          <select
            id="proveedor"
            value={proveedorId}
            onChange={e => setProveedorId(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
          >
            <option value="" disabled>Seleccione un proveedor</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial} (NIT: {p.rut_nit})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="centro-costo" className="block text-sm font-medium text-gray-700">Centro de Costo</label>
          <input
            type="text"
            id="centro-costo"
            value={centroCosto}
            onChange={e => setCentroCosto(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          />
        </div>
      </div>

      {/* Items de la Orden */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-gray-800">Ítems</h3>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <input
              type="text"
              placeholder="Descripción"
              value={item.descripcion}
              onChange={e => handleItemChange(item.id, 'descripcion', e.target.value)}
              required
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            />
            <input
              type="number"
              placeholder="Cant."
              value={item.cantidad}
              onChange={e => handleItemChange(item.id, 'cantidad', e.target.value)}
              min="1"
              required
              className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            />
            <input
              type="number"
              placeholder="Precio Unit."
              value={item.precioUnitario}
              onChange={e => handleItemChange(item.id, 'precioUnitario', e.target.value)}
              min="0"
              step="0.01"
              required
              className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            />
             <span className="w-24 text-right text-sm text-gray-600">
              {(item.cantidad * item.precioUnitario).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
            </span>
            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-secondary mt-2">
          <PlusCircle size={16} />
          Agregar Ítem
        </button>
      </div>

       {/* Condiciones y Totales */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
         <div>
            <label htmlFor="condiciones" className="block text-sm font-medium text-gray-700">Condiciones de Entrega/Pago</label>
            <textarea
                id="condiciones"
                value={condiciones}
                onChange={e => setCondiciones(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
         </div>
         <div className="space-y-2 text-right">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                <span className="text-sm text-gray-800">{totals.subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">IVA (19%):</span>
                <span className="text-sm text-gray-800">{totals.impuestos.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
            </div>
             <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">{totals.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
            </div>
         </div>
       </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      {/* Acciones */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400"
        >
          <Send size={16} className="mr-2"/>
          {isSubmitting ? 'Generando...' : 'Generar Orden y Documento'}
        </button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;
