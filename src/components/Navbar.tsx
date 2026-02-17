import { useState } from 'react';
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
      {/* Search modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              setIsSearchOpen(false);
              setSearch('');
              setResults([]);
            }}
          />
          <div
            className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.16em]">
                Resultados de búsqueda
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearch('');
                  setResults([]);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Cerrar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
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
