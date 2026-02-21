import { Link, useLocation } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const iconClass = (active: boolean) =>
  `w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-black' : 'text-gray-500'}`;
const textClass = (active: boolean) =>
  `text-sm transition-colors ${active ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`;

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden shrink-0 rounded-lg bg-gray-100">
              <img src={logoSvg} alt="Anota logo" className="w-7 h-7 object-contain" />
            </div>
            {!isCollapsed && <h1 className="text-xl font-bold text-black truncate">Anota</h1>}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 pt-6 space-y-0.5 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/' ? 'bg-gray-100' : ''}`}
            title="Crear Nota Rápida"
          >
            <svg className={iconClass(location.pathname === '/')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.897l-2.685.8.8-2.685a4.5 4.5 0 011.897-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/')}>Crear Nota Rápida</span>}
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/dashboard' ? 'bg-gray-100' : ''}`}
            title="Dashboard"
          >
            <svg className={iconClass(location.pathname === '/dashboard')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/dashboard')}>Dashboard</span>}
          </Link>

          <Link
            to="/notas-rapidas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/notas-rapidas' ? 'bg-gray-100' : ''}`}
            title="Ver Notas Rápidas"
          >
            <svg className={iconClass(location.pathname === '/notas-rapidas')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/notas-rapidas')}>Notas Rápidas</span>}
          </Link>

          <Link
            to="/notas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/notas' ? 'bg-gray-100' : ''}`}
            title="Notas"
          >
            <svg className={iconClass(location.pathname === '/notas')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/notas')}>Notas</span>}
          </Link>

          <Link
            to="/tareas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/tareas' ? 'bg-gray-100' : ''}`}
            title="Tareas"
          >
            <svg className={iconClass(location.pathname === '/tareas')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/tareas')}>Tareas</span>}
          </Link>

          <Link
            to="/transcripcion-reunion"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/transcripcion-reunion' ? 'bg-gray-100' : ''}`}
            title="Transcripción de reuniones"
          >
            <svg className={iconClass(location.pathname === '/transcripcion-reunion')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/transcripcion-reunion')}>Transcripción</span>}
          </Link>

          <Link
            to="/carpetas"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${location.pathname === '/carpetas' ? 'bg-gray-100' : ''}`}
            title="Carpetas"
          >
            <svg className={iconClass(location.pathname === '/carpetas')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            {!isCollapsed && <span className={textClass(location.pathname === '/carpetas')}>Carpetas</span>}
          </Link>
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4 mx-4" />

        {/* Secondary */}
        <nav className="px-4 space-y-0.5 pb-4">
          <a
            href="#"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Favoritos"
          >
            <svg className={iconClass(false)} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            {!isCollapsed && <span className={textClass(false)}>Favoritos</span>}
          </a>

          <a
            href="#"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Archivados"
          >
            <svg className={iconClass(false)} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            {!isCollapsed && <span className={textClass(false)}>Archivados</span>}
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
