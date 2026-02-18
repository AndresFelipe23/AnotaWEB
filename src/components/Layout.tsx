import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('anota_sidebar_collapsed');
    return stored === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('anota_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Navbar */}
      <Navbar onMenuClick={toggleMobileMenu} isSidebarCollapsed={isSidebarCollapsed} />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={toggleMobileMenu}
            aria-hidden
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[min(280px,85vw)] max-w-full bg-white border-r border-gray-200 z-[60] lg:hidden flex flex-col shadow-xl pt-safe">
            <div className="flex items-center justify-between p-4 pt-6 border-b border-gray-100">
              <span className="text-lg font-bold text-black">Menú</span>
              <button
                onClick={toggleMobileMenu}
                className="p-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Cerrar menú"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-safe">
              <Link to="/" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Crear Nota Rápida</span>
              </Link>
              <Link to="/dashboard" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4v8H3v-8zm7-6h4v14h-4V6zm7 10h4v4h-4v-4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Dashboard</span>
              </Link>
              <Link to="/notas-rapidas" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Ver Notas Rápidas</span>
              </Link>
              <Link to="/transcripcion-reunion" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m0-9a7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Transcripción reunión</span>
              </Link>
              <Link to="/notas" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                <span className="text-sm font-medium text-gray-700">Notas</span>
              </Link>
              <Link to="/tareas" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Tareas</span>
              </Link>
              <Link to="/carpetas" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 active:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Carpetas</span>
              </Link>
            </nav>
          </aside>
        </>
      )}

      <div className="flex pt-14 sm:pt-16">
        {/* Main Content */}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 overflow-x-hidden ${
            isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
