import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { NotaResumen } from '../types/api';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar = ({ onMenuClick, isSidebarCollapsed = false }: NavbarProps) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<NotaResumen[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = async (value: string) => {
    setSearch(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setIsSearchOpen(true);
    try {
      setIsSearching(true);
      const data = await apiService.obtenerNotas(undefined, true);
      const term = value.toLowerCase();
      const filtered = data.filter((n) => {
        const t = (n.titulo || '').toLowerCase();
        const r = (n.resumen || '').toLowerCase();
        return t.includes(term) || r.includes(term);
      });
      setResults(filtered.slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenNota = (id: string) => {
    setIsSearchOpen(false);
    setSearch('');
    setResults([]);
    navigate(`/notas?open=${id}`);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-14 sm:h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
      }`}
    >
      <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6 gap-2">
        {/* Left: Menu Button + Logo on mobile */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 p-2.5 -ml-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors lg:hidden touch-manipulation"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="lg:hidden text-base font-bold text-black truncate">Anota</span>
        </div>

        {/* Right: Search, User, Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Search: icon on mobile, full on md+ */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden flex-shrink-0 p-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Buscar"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors flex-1 max-w-xs">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar notas..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-40"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                  setSearch('');
                  setResults([]);
                }
              }}
              onFocus={() => {
                if (search.trim() && results.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
            />
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Menú de usuario"
              aria-expanded={isUserDropdownOpen}
            >
              {/* User Info - Solo visible en pantallas medianas+ */}
              <div className="hidden sm:block min-w-0 text-left">
                <p className="text-sm font-semibold text-black truncate">
                  {usuario?.nombre} {usuario?.apellido}
                </p>
                <p className="text-xs text-gray-500 truncate">{usuario?.correo}</p>
              </div>

              {/* User Avatar */}
              <div className="flex-shrink-0 w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                <span className="text-sm font-semibold text-gray-700">
                  {usuario?.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Dropdown Arrow */}
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isUserDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info en el dropdown */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-black truncate">
                    {usuario?.nombre} {usuario?.apellido}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{usuario?.correo}</p>
                </div>

                {/* Logout Button */}
                <div className="px-2 pt-2">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm transition-colors touch-manipulation"
                    aria-label="Cerrar sesión"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Search modal - full screen on mobile */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 pb-safe">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setIsSearchOpen(false);
              setSearch('');
              setResults([]);
            }}
          />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl sm:mx-4 max-h-[85vh] sm:max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.16em]">
                  Buscar notas
                </p>
                <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearch('');
                  setResults([]);
                }}
                  className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-500 touch-manipulation"
                  aria-label="Cerrar búsqueda"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar notas..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto py-2 max-h-60 sm:max-h-80">
              {!search.trim() && (
                <p className="px-4 py-3 text-xs text-gray-500">
                  Escribe para buscar en los títulos y resúmenes de tus notas.
                </p>
              )}
              {search.trim() && isSearching && (
                <p className="px-4 py-3 text-xs text-gray-500">Buscando notas...</p>
              )}
              {search.trim() && !isSearching && results.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-500">
                  No se encontraron notas que coincidan con “{search}”.
                </p>
              )}
              {results.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpenNota(n.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-2"
                >
                  <div className="mt-0.5 text-sm">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-gray-700 text-xs">
                      {n.icono || '📝'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {n.titulo || 'Sin título'}
                    </p>
                    {n.resumen && (
                      <p className="text-xs text-gray-500 truncate">
                        {n.resumen}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
