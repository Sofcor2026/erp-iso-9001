import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Bell, User as UserIcon, LogOut, ChevronDown, Menu, Clock, GraduationCap } from 'lucide-react';
import SearchResultsModal from './shared/SearchResultsModal';
import { useData } from '../contexts/DataContext';
import { Document, KPI, ProcessType } from '../types';

const getLinkForResult = (item: Document | KPI): string => {
  const isDocument = 'codigo' in item;
  const base = `/drive/${encodeURIComponent(item.proceso)}`;
  const subproceso = item.subproceso ? `/${encodeURIComponent(item.subproceso)}` : '';

  if (isDocument) {
    const doc = item as Document;
    if (doc.proceso === ProcessType.APOYO) {
      return `${base}${subproceso || '/General'}/documentos/${encodeURIComponent(doc.tipo)}`;
    }
    return `${base}/documentos/${encodeURIComponent(doc.tipo)}`;
  } else {
    const kpi = item as KPI;
    if (kpi.proceso === ProcessType.APOYO) {
      return `${base}${subproceso || '/General'}/kpis`;
    }
    return `${base}/kpis`;
  }
}

const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { expiringDocuments, trainings } = useData();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // User profile dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K to focus search logic
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchFocus = () => {
    setSearchModalOpen(true);
  };

  const handleSearchClose = () => {
    setSearchModalOpen(false);
    // Do not clear query, so the user can click away and back.
    // It will be cleared when a link is clicked or on Escape.
  };


  return (
    <>
      <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 py-3 h-16 flex-shrink-0 z-20 relative">
        <div className="flex items-center">
          <button onClick={onToggleSidebar} className="text-gray-500 hover:text-gray-800 lg:hidden mr-4">
            <Menu size={24} />
          </button>
          <NavLink to="/" className="text-xl font-bold text-gray-800">
            ISO Drive
          </NavLink>
        </div>

        <div className="flex-1 max-w-lg mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar documentos, KPIs... (Ctrl+K)"
              className="block w-full bg-gray-100 border border-gray-300 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-brand-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <Bell size={20} />
              {(expiringDocuments.length + (trainings?.filter((t: any) => t.estado === 'Programada').length || 0)) > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary justify-center items-center text-white text-[10px] font-bold">
                    {expiringDocuments.length + (trainings?.filter((t: any) => t.estado === 'Programada').length || 0)}
                  </span>
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 text-sm text-gray-700 border-b bg-gray-50">
                  <p className="font-semibold text-gray-800 uppercase text-[10px] tracking-widest">Tareas ISO Pendientes</p>
                </div>
                {(expiringDocuments.length > 0 || trainings?.some((t: any) => t.estado === 'Programada')) ? (
                  <ul>
                    {/* Capacitaciones */}
                    {trainings?.filter((t: any) => t.estado === 'Programada').map((t: any) => (
                      <li key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/50 transition-colors">
                        <button
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate('/tenant/competency');
                          }}
                          className="flex items-start w-full text-left px-4 py-3 text-sm"
                        >
                          <GraduationCap size={20} className="mr-3 text-brand-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-gray-800">Capacitación: {t.nombre}</p>
                            <p className="text-xs text-gray-500 font-medium">Programada: {new Date(t.fechaProgramada).toLocaleDateString()}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                    {/* Documentos */}
                    {expiringDocuments.map(doc => {
                      const revisionDate = new Date(doc.fechaRevision);
                      const today = new Date();
                      const diffTime = revisionDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                      return (
                        <li key={doc.id} className="border-b border-gray-50 last:border-0">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate(getLinkForResult(doc));
                            }}
                            className="flex items-start w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Clock size={20} className="mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-gray-800">{doc.nombre}</p>
                              <p className="text-xs text-red-600 font-bold">Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}.</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No hay notificaciones nuevas.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
              <div className="h-8 w-8 bg-brand-accent rounded-full flex items-center justify-center text-white font-semibold">
                {user?.nombre.charAt(0)}
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-700">{user?.nombre}</span>
              <ChevronDown size={16} className="text-gray-500 hidden md:inline" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-semibold">{user?.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <a href="#/profile" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserIcon size={16} className="mr-2" /> Perfil
                </a>
                <button
                  onClick={logout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} className="mr-2" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {isSearchModalOpen && <SearchResultsModal query={searchQuery} onClose={() => {
        setSearchModalOpen(false);
        setSearchQuery('');
      }} />}
    </>
  );
};

export default Header;