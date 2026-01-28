
import React from 'react';
import PurchaseOrderForm from '../components/PurchaseOrderForm';

const PurchaseOrderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Crear Nueva Orden de Compra</h1>
        <p className="text-gray-600 mt-1">Diligencie los detalles de la orden de compra y agregue los productos o servicios.</p>
      </div>
      <PurchaseOrderForm />
    </div>
  );
};

export default PurchaseOrderPage;
