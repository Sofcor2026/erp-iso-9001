
import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '../../types';
import { MoreVertical, Edit, ToggleLeft, ToggleRight, UserCog, Trash2 } from 'lucide-react';

interface TenantActionsProps {
    tenant: Tenant;
    onEdit: () => void;
    onSuspend: () => void;
    onImpersonate: () => void;
    onDelete: () => void;
}

const TenantActions: React.FC<TenantActionsProps> = ({ tenant, onEdit, onSuspend, onImpersonate, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActionClick = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const suspendActionText = tenant.estado === 'Activo' ? 'Suspender' : 'Activar';
    const SuspendIcon = tenant.estado === 'Activo' ? ToggleLeft : ToggleRight;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                    className="inline-flex justify-center w-full rounded-md p-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none"
                    id="options-menu"
                    aria-haspopup="true"
                    aria-expanded="true"
                >
                    <MoreVertical size={20} />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={() => handleActionClick(onEdit)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                            <Edit size={16} className="mr-3" />
                            Editar
                        </button>
                        <button onClick={() => handleActionClick(onSuspend)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                            <SuspendIcon size={16} className="mr-3" />
                            {suspendActionText}
                        </button>
                        <button onClick={() => handleActionClick(onImpersonate)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                            <UserCog size={16} className="mr-3" />
                            Impersonar (Soporte)
                        </button>
                        <button onClick={() => handleActionClick(onDelete)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem">
                            <Trash2 size={16} className="mr-3" />
                            Eliminar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantActions;
