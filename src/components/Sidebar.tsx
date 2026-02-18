import { Link, useLocation } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Navbar dentro del sidebar para que esté por encima */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src={logoSvg} alt="Anota logo" className="w-7 h-7 object-contain" />
            </div>
            {!isCollapsed && <h1 className="text-xl font-bold text-black">Anota</h1>}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 pt-6 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/' ? 'bg-gray-100' : ''}`}
            title="Crear Nota Rápida"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Crear Nota Rápida</span>}
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/dashboard' ? 'bg-gray-100' : ''}`}
            title="Dashboard"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4v8H3v-8zm7-6h4v14h-4V6zm7 10h4v4h-4v-4z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Dashboard</span>}
          </Link>

          <Link
            to="/notas-rapidas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/notas-rapidas' ? 'bg-gray-100' : ''}`}
            title="Ver Notas Rápidas"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Ver Notas Rápidas</span>}
          </Link>

          <Link
            to="/notas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/notas' ? 'bg-gray-100' : ''}`}
            title="Notas"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Notas</span>}
          </Link>

          <Link
            to="/tareas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/tareas' ? 'bg-gray-100' : ''}`}
            title="Tareas"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Tareas</span>}
          </Link>

          <Link
            to="/transcripcion-reunion"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/transcripcion-reunion' ? 'bg-gray-100' : ''}`}
            title="Transcripción de reuniones"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m0-9a7 7 0 0114 0z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Transcripción reunión</span>}
          </Link>

          <Link
            to="/carpetas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/carpetas' ? 'bg-gray-100' : ''}`}
            title="Carpetas"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Carpetas</span>}
          </Link>
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4 mx-4"></div>

        {/* Additional Items */}
        <nav className="px-4 space-y-1 pb-4">
          <a
            href="#"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Favoritos"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Favoritos</span>}
          </a>

          <a
            href="#"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Archivados"
          >
            <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Archivados</span>}
          </a>
        </nav>
      </aside>

      {/* Floating Toggle Button - solo desktop */}
      <button
        onClick={onToggle}
        className={`hidden lg:flex fixed top-20 z-50 bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 items-center justify-center ${
          isCollapsed ? 'left-16' : 'left-[15.5rem]'
        }`}
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        style={{
          transform: isCollapsed ? 'translateX(-50%)' : 'translateX(-50%)',
        }}
      >
        <svg
          className={`w-4 h-4 text-gray-700 transition-transform duration-300 ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </>
  );
};
