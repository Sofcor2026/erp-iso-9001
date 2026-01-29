import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building, FileText, BarChart2, Shield, Settings, Package, ShieldCheck, Users } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
}

const navItems = [
    { to: "/platform/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/platform/tenants", icon: Building, label: "Tenants" },
    { to: "/platform/users", icon: Users, label: "Usuarios" },
    { to: "/platform/plans", icon: Package, label: "Planes" },
    { to: "/platform/roles", icon: ShieldCheck, label: "Roles y Permisos" },
    { to: "/platform/templates", icon: FileText, label: "Plantillas" },
    { to: "/platform/audit", icon: Shield, label: "Auditoría" },
    { to: "/platform/settings", icon: Settings, label: "Configuración" },
];

const PlatformSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    return (
        <aside className={`bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
            <div className={`p-4 ${isOpen ? 'block' : 'hidden'}`}>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Plataforma</h2>
                <nav>
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <NavLink
                                    to={item.to}
                                    end={item.to === "/platform/admin"}
                                    className={({ isActive }) => `flex items-center py-2 px-3 rounded-lg font-medium ${isActive ? 'bg-gray-100 text-brand-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <item.icon className="mr-3" size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}

export default PlatformSidebar;