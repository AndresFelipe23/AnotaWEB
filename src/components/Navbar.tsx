import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar = ({ onMenuClick, isSidebarCollapsed = false }: NavbarProps) => {
  const { usuario, logout } = useAuth();

  // Calcular el margen izquierdo del navbar basado en el estado del sidebar
  const sidebarWidth = isSidebarCollapsed ? 64 : 256;

  return (
    <nav 
      className="fixed top-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300"
      style={{
        left: `${sidebarWidth}px`,
        right: 0,
      }}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Menu Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Right: User Info and Actions */}
        <div className="flex items-center gap-4">
          {/* Search (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-40"
            />
          </div>

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-black">
                {usuario?.nombre} {usuario?.apellido}
              </p>
              <p className="text-xs text-gray-500">{usuario?.correo}</p>
            </div>
          </div>

          {/* User Avatar */}
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
            <span className="text-sm font-semibold text-gray-700">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};
