import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ProcessType, DocumentType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
    ChevronRight, 
    FileText, 
    BarChart2, 
    Users, 
    ShoppingCart, 
    HardHat, 
    Settings, 
    Shield,
    FilePlus,
    ClipboardCheck,
    ClipboardList,
    X,
    Target,
    Briefcase,
    Wrench
} from 'lucide-react';

const DOCUMENT_TYPES = Object.values(DocumentType);
const APOYO_SUBPROCESOS = [
    { key: 'Gestión Humana', label: 'Gestión Humana', icon: Users },
    { key: 'Compras', label: 'Compras', icon: ShoppingCart },
    { key: 'Infraestructura', label: 'Infraestructura', icon: HardHat },
];

interface NavItemProps {
    to: string;
    label: string;
    level: number;
    icon?: React.ElementType;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, level, icon: Icon, onClick }) => {
    return (
        <li onClick={onClick}>
            <NavLink
                to={to}
                end
                className={({ isActive }) =>
                    `flex items-center py-1.5 rounded-md text-sm transition-colors w-full ${
                        isActive
                            ? 'font-semibold text-brand-primary bg-blue-50'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
                style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
                {Icon && <Icon size={18} className="mr-3 text-gray-500 flex-shrink-0" />}
                <span>{label}</span>
            </NavLink>
        </li>
    );
};

interface CollapsibleProps {
    label: string;
    nodeKey: string;
    level: number;
    expandedKeys: Set<string>;
    toggleNode: (key: string) => void;
    icon?: React.ElementType;
    children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ label, nodeKey, level, expandedKeys, toggleNode, icon: Icon, children }) => {
    const isOpen = expandedKeys.has(nodeKey);

    return (
        <li>
            <button
                onClick={() => toggleNode(nodeKey)}
                className="w-full flex items-center justify-between py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
                <div className="flex items-center">
                    {Icon && <Icon size={18} className="mr-3 text-gray-500 flex-shrink-0" />}
                    <span className="text-sm">{label}</span>
                </div>
                <ChevronRight size={16} className={`text-gray-500 transition-transform duration-200 mr-2 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && <ul className="mt-1 space-y-1">{children}</ul>}
        </li>
    );
};

interface TenantSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeProcess: ProcessType;
}


const TenantSidebar: React.FC<TenantSidebarProps> = ({ isOpen, setIsOpen, activeProcess }) => {
    const { hasPermission } = useAuth();
    const location = useLocation();
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const newExpandedKeys = new Set<string>();

        // Expand based on URL path
        if (pathSegments[1]) { // e.g. 'drive'
             newExpandedKeys.add(decodeURIComponent(pathSegments[1]));
        }
        if (pathSegments[2]) { // e.g. 'Estratégico' or 'Apoyo'
             newExpandedKeys.add(decodeURIComponent(pathSegments[2]));
        }
        if (pathSegments[3]) { // e.g. 'Gestión Humana' or 'documentos'
             newExpandedKeys.add(decodeURIComponent(pathSegments[3]));
             if(pathSegments[2] && pathSegments[3]) {
                newExpandedKeys.add(`${decodeURIComponent(pathSegments[2])}-${decodeURIComponent(pathSegments[3])}`);
             }
        }
        if (pathSegments[4]) {
             if(pathSegments[3] && pathSegments[4]) {
                newExpandedKeys.add(`${decodeURIComponent(pathSegments[3])}-${decodeURIComponent(pathSegments[4])}`);
             }
        }

        setExpandedKeys(newExpandedKeys);
    }, [location.pathname]);
    
    const toggleNode = (key: string) => {
        setExpandedKeys(prev => {
            const newKeys = new Set(prev);
            if (newKeys.has(key)) {
                newKeys.delete(key);
            } else {
                newKeys.add(key);
            }
            return newKeys;
        });
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };
    
    // Desktop: Renders context for the active process
    const renderDesktopTree = () => {
        const renderEstrategicoTree = () => (
            <>
                <Collapsible label="Documentos" nodeKey="documentos" level={0} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem
                            key={type}
                            to={`/drive/${ProcessType.ESTRATEGICO}/documentos/${type}`}
                            label={type}
                            level={1}
                        />
                    ))}
                </Collapsible>
                <NavItem to={`/drive/${ProcessType.ESTRATEGICO}/kpis`} label="Indicadores (KPIs)" level={0} icon={BarChart2}/>
            </>
        );

        const renderMisionalTree = () => (
            <>
                <NavItem to={`/drive/${ProcessType.MISIONAL}/kpis`} label="Indicadores (KPIs)" level={0} icon={BarChart2}/>
                <Collapsible label="Documentos" nodeKey="documentos" level={0} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem
                            key={type}
                            to={`/drive/${ProcessType.MISIONAL}/documentos/${type}`}
                            label={type}
                            level={1}
                        />
                    ))}
                </Collapsible>
            </>
        );

        const renderApoyoTree = () => (
            <>
                {APOYO_SUBPROCESOS.map(sub => (
                    <Collapsible key={sub.key} label={sub.label} nodeKey={sub.key} level={0} icon={sub.icon} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                        <NavItem to={`/drive/${ProcessType.APOYO}/${sub.key}/kpis`} label="Indicadores (KPIs)" level={1} icon={BarChart2}/>
                        <Collapsible label="Documentos" nodeKey={`${sub.key}-documentos`} level={1} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                            {DOCUMENT_TYPES.map(type => (
                                <NavItem
                                    key={type}
                                    to={`/drive/${ProcessType.APOYO}/${sub.key}/documentos/${type}`}
                                    label={type}
                                    level={2}
                                />
                            ))}
                        </Collapsible>
                    </Collapsible>
                ))}
            </>
        );
        
        const renderControlTree = () => (
            <>
                <NavItem to={`/drive/${ProcessType.CONTROL}/kpis`} label="Indicadores (KPIs)" level={0} icon={BarChart2}/>
                <Collapsible label="Documentos" nodeKey="documentos" level={0} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem
                            key={type}
                            to={`/drive/${ProcessType.CONTROL}/documentos/${type}`}
                            label={type}
                            level={1}
                        />
                    ))}
                </Collapsible>
                {hasPermission('tenant:admin') && (
                    <>
                        <div className="my-2 border-t border-gray-200 -mx-4"></div>
                        <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                        <NavItem to="/master-list/documents" label="Listado Maestro" level={0} icon={ClipboardList}/>
                        <NavItem to="/tenant/settings" label="Configuración" level={0} icon={Settings}/>
                        <NavItem to="/tenant/audit" label="Auditoría" level={0} icon={Shield}/>
                    </>
                )}
            </>
        );
        
        switch(activeProcess) {
            case ProcessType.ESTRATEGICO: return renderEstrategicoTree();
            case ProcessType.MISIONAL: return renderMisionalTree();
            case ProcessType.APOYO: return renderApoyoTree();
            case ProcessType.CONTROL: return renderControlTree();
            default: return null;
        }
    };
    
    // Mobile: Renders the full navigation tree
    const renderMobileTree = () => (
        <>
            <Collapsible label={ProcessType.ESTRATEGICO} nodeKey={ProcessType.ESTRATEGICO} level={0} icon={Target} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                <NavItem onClick={handleLinkClick} to={`/drive/${ProcessType.ESTRATEGICO}/kpis`} label="Indicadores (KPIs)" level={1} icon={BarChart2}/>
                <Collapsible label="Documentos" nodeKey={`${ProcessType.ESTRATEGICO}-documentos`} level={1} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem onClick={handleLinkClick} key={type} to={`/drive/${ProcessType.ESTRATEGICO}/documentos/${type}`} label={type} level={2} />
                    ))}
                </Collapsible>
            </Collapsible>
            <Collapsible label={ProcessType.MISIONAL} nodeKey={ProcessType.MISIONAL} level={0} icon={Briefcase} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                 <NavItem onClick={handleLinkClick} to={`/drive/${ProcessType.MISIONAL}/kpis`} label="Indicadores (KPIs)" level={1} icon={BarChart2}/>
                <Collapsible label="Documentos" nodeKey={`${ProcessType.MISIONAL}-documentos`} level={1} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem onClick={handleLinkClick} key={type} to={`/drive/${ProcessType.MISIONAL}/documentos/${type}`} label={type} level={2} />
                    ))}
                </Collapsible>
            </Collapsible>
            <Collapsible label={ProcessType.APOYO} nodeKey={ProcessType.APOYO} level={0} icon={Wrench} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                 {APOYO_SUBPROCESOS.map(sub => (
                    <Collapsible key={sub.key} label={sub.label} nodeKey={sub.key} level={1} icon={sub.icon} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                        <NavItem onClick={handleLinkClick} to={`/drive/${ProcessType.APOYO}/${sub.key}/kpis`} label="Indicadores (KPIs)" level={2} icon={BarChart2}/>
                        <Collapsible label="Documentos" nodeKey={`${sub.key}-documentos`} level={2} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                            {DOCUMENT_TYPES.map(type => (
                                <NavItem onClick={handleLinkClick} key={type} to={`/drive/${ProcessType.APOYO}/${sub.key}/documentos/${type}`} label={type} level={3} />
                            ))}
                        </Collapsible>
                    </Collapsible>
                ))}
            </Collapsible>
            <Collapsible label={ProcessType.CONTROL} nodeKey={ProcessType.CONTROL} level={0} icon={ClipboardCheck} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                <NavItem onClick={handleLinkClick} to={`/drive/${ProcessType.CONTROL}/kpis`} label="Indicadores (KPIs)" level={1} icon={BarChart2}/>
                <Collapsible label="Documentos" nodeKey={`${ProcessType.CONTROL}-documentos`} level={1} icon={FileText} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                    {DOCUMENT_TYPES.map(type => (
                        <NavItem onClick={handleLinkClick} key={type} to={`/drive/${ProcessType.CONTROL}/documentos/${type}`} label={type} level={2} />
                    ))}
                </Collapsible>
                {hasPermission('tenant:admin') && (
                    <>
                        <div className="my-2 border-t border-gray-200"></div>
                        <NavItem onClick={handleLinkClick} to="/master-list/documents" label="Listado Maestro" level={1} icon={ClipboardList}/>
                        <NavItem onClick={handleLinkClick} to="/tenant/settings" label="Configuración" level={1} icon={Settings}/>
                        <NavItem onClick={handleLinkClick} to="/tenant/audit" label="Auditoría" level={1} icon={Shield}/>
                    </>
                )}
            </Collapsible>
        </>
    );

    return (
        <aside className={`bg-white border-r border-gray-200 w-72 flex-shrink-0 p-4 overflow-y-auto flex flex-col fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center lg:hidden mb-2">
                <h2 className="text-lg font-semibold text-gray-800 px-3">Menú</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-gray-700">
                    <X size={24}/>
                </button>
            </div>
            
            <div className="flex-grow">
                {/* Mobile Sidebar Content */}
                <div className="lg:hidden">
                    <nav><ul className="space-y-1">{renderMobileTree()}</ul></nav>
                </div>
                {/* Desktop Sidebar Content */}
                <div className="hidden lg:block">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 px-3">{activeProcess}</h2>
                    <nav><ul className="space-y-1">{renderDesktopTree()}</ul></nav>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200">
                <ul className="space-y-1">
                     {hasPermission('form:create') && (
                        <Collapsible label="Formularios" nodeKey="forms" level={0} icon={FilePlus} expandedKeys={expandedKeys} toggleNode={toggleNode}>
                             <NavItem
                                onClick={handleLinkClick}
                                to="/forms/purchase-order/new"
                                label="Nueva Orden Compra"
                                level={1}
                            />
                        </Collapsible>
                    )}
                    {(hasPermission('document:create') || hasPermission('document:submit')) && (
                        <NavItem
                            onClick={handleLinkClick}
                            to="/tasks"
                            label="Mis Tareas"
                            level={0}
                            icon={ClipboardCheck}
                        />
                    )}
                </ul>
            </div>
        </aside>
    );
};

export default TenantSidebar;