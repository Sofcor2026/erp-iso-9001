
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  children?: React.ReactNode;
  confirmText: string;
  confirmColor?: 'red' | 'yellow' | 'green' | 'blue';
  isConfirmDisabled?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText,
  confirmColor = 'red',
  isConfirmDisabled = false,
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    red: { bg: 'bg-red-600', hoverBg: 'hover:bg-red-700', ring: 'focus:ring-red-500' },
    yellow: { bg: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-600', ring: 'focus:ring-yellow-500' },
    green: { bg: 'bg-green-600', hoverBg: 'hover:bg-green-700', ring: 'focus:ring-green-500' },
    blue: { bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' },
  };
  const selectedColor = colorClasses[confirmColor];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300">
        <div className="p-6">
          <div className="flex items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${selectedColor.bg} bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10`}>
              <AlertTriangle className={`h-6 w-6 text-${confirmColor}-600`} aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                {message && <p className="text-sm text-gray-500">{message}</p>}
                {children}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-sm font-medium text-white ${selectedColor.bg} border border-transparent rounded-md shadow-sm ${selectedColor.hoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedColor.ring} disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
