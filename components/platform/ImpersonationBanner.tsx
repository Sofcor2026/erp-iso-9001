import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCog, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImpersonationBanner: React.FC = () => {
    const { user, originalUser, stopImpersonating } = useAuth();
    const navigate = useNavigate();

    if (!originalUser) {
        return null;
    }

    const handleStopImpersonating = () => {
        stopImpersonating();
        navigate('/platform/admin');
    };

    return (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center text-sm font-medium z-50">
            <UserCog size={18} className="mr-3 flex-shrink-0" />
            <div className="flex-grow text-center">
                Estás en Modo Soporte, viendo como <strong>{user?.nombre || 'Admin'}</strong> (Tenant: {user?.tenantId?.replace('tenant-','')}).
            </div>
            <button
                onClick={handleStopImpersonating}
                className="ml-4 flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white transition-colors"
            >
                <LogOut size={16} className="mr-2" />
                Volver a mi cuenta
            </button>
        </div>
    );
};

export default ImpersonationBanner;
