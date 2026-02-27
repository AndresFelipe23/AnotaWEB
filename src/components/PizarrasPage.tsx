import { useEffect, useState } from 'react';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import type { Pizarra } from '../types/api';
import { usePageHeader } from '../contexts/PageHeaderContext';
import { useNavigate } from 'react-router-dom';

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const PALETTES = [
  { bg: 'bg-violet-50',  dot: '#c4b5fd', icon: 'text-violet-400', border: 'border-violet-100', iconBg: 'bg-violet-100' },
  { bg: 'bg-sky-50',     dot: '#93c5fd', icon: 'text-sky-400',    border: 'border-sky-100',    iconBg: 'bg-sky-100'    },
  { bg: 'bg-emerald-50', dot: '#6ee7b7', icon: 'text-emerald-400',border: 'border-emerald-100',iconBg: 'bg-emerald-100'},
  { bg: 'bg-amber-50',   dot: '#fcd34d', icon: 'text-amber-400',  border: 'border-amber-100',  iconBg: 'bg-amber-100'  },
  { bg: 'bg-rose-50',    dot: '#fca5a5', icon: 'text-rose-400',   border: 'border-rose-100',   iconBg: 'bg-rose-100'   },
  { bg: 'bg-fuchsia-50', dot: '#e879f9', icon: 'text-fuchsia-400',border: 'border-fuchsia-100',iconBg: 'bg-fuchsia-100'},
  { bg: 'bg-orange-50',  dot: '#fb923c', icon: 'text-orange-400', border: 'border-orange-100', iconBg: 'bg-orange-100' },
  { bg: 'bg-teal-50',    dot: '#2dd4bf', icon: 'text-teal-400',   border: 'border-teal-100',   iconBg: 'bg-teal-100'   },
];

const getPalette = (id: string) => {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
};

export const PizarrasPage = () => {
  const [pizarras, setPizarras] = useState<Pizarra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { setPageHeader } = usePageHeader();
  const navigate = useNavigate();

  const cargarPizarras = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.obtenerPizarras({ incluirArchivadas: false });
      setPizarras(data);
    } catch (error) {
      console.error('Error al cargar pizarras', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarPizarras();
  }, []);

  useEffect(() => {
    setPageHeader('Pizarras', pizarras.length);
    return () => setPageHeader(null);
  }, [pizarras.length, setPageHeader]);

  const handleCrearPizarra = async () => {
    try {
      setIsCreating(true);
      const sceneVacia = JSON.stringify({ elements: [], appState: {}, files: {} });
      const { id } = await apiService.crearPizarra({
        titulo: 'Nueva pizarra',
        descripcion: '',
        sceneJson: sceneVacia,
      });
      await cargarPizarras();
      navigate(`/pizarras/${id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-gray-50">

        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Pizarras</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lienzos para diagramas, bocetos y esquemas.</p>
          </div>
          <button
            type="button"
            onClick={handleCrearPizarra}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 shadow-sm"
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nueva pizarra
              </>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && pizarras.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="4" y="5" width="16" height="12" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h4m-4 3h6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Aún no tienes pizarras</p>
                <p className="text-xs text-gray-400 mt-1">Crea una para empezar a dibujar.</p>
              </div>
              <button
                type="button"
                onClick={handleCrearPizarra}
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nueva pizarra
              </button>
            </div>
          )}

          {/* Grid */}
          {!isLoading && pizarras.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {pizarras.map((p) => {
                const pal = getPalette(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/pizarras/${p.id}`)}
                    className={`group text-left rounded-2xl bg-white border overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 ${pal.border}`}
                  >
                    {/* Preview area */}
                    <div
                      className={`relative h-28 sm:h-36 ${pal.bg} flex items-center justify-center overflow-hidden`}
                      style={{
                        backgroundImage: `radial-gradient(circle, ${pal.dot} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${pal.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${pal.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <rect x="4" y="5" width="16" height="12" rx="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h4m-4 3h6" />
                        </svg>
                      </div>
                      {p.notaId && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-white/80 text-indigo-600 border border-indigo-100 backdrop-blur-sm">
                          Vinculada
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate leading-snug">
                        {p.titulo || 'Sin título'}
                      </p>
                      {p.descripcion ? (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>
                      ) : (
                        <p className="text-[11px] text-gray-300 mt-0.5 italic">Sin descripción</p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{formatFecha(p.fechaActualizacion)}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
