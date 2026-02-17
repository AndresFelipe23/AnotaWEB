import { useEffect, useState } from 'react';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import iziToast from 'izitoast';
import type { CarpetaArbol, CrearCarpetaRequest } from '../types/api';

export const CarpetasPage = () => {
  const [carpetas, setCarpetas] = useState<CarpetaArbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [carpetaPadreId, setCarpetaPadreId] = useState<string | null>(null);
  const [nombrePadre, setNombrePadre] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarCarpetas = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.obtenerArbolCarpetas();
      setCarpetas(data);
    } catch (error: any) {
      console.error('Error al cargar carpetas:', error);
      iziToast.error({ title: 'Error', message: 'No se pudieron cargar las carpetas', position: 'topRight' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarCarpetas();
  }, []);

  const abrirFormRaiz = () => {
    setCarpetaPadreId(null);
    setNombrePadre('');
    setNombreNueva('');
    setShowForm(true);
  };

  const abrirFormSubcarpeta = (id: string, nombre: string) => {
    setCarpetaPadreId(id);
    setNombrePadre(nombre);
    setNombreNueva('');
    setShowForm(true);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNueva.trim()) return;
    try {
      setIsSaving(true);
      const payload: CrearCarpetaRequest = {
        nombre: nombreNueva.trim(),
        carpetaPadreId: carpetaPadreId || undefined,
      };
      await apiService.crearCarpeta(payload);
      setShowForm(false);
      setNombreNueva('');
      setCarpetaPadreId(null);
      await cargarCarpetas();
      iziToast.success({
        title: 'Carpeta creada',
        message: carpetaPadreId ? 'Subcarpeta creada correctamente' : 'Carpeta creada correctamente',
        position: 'topRight',
      });
    } catch (error: any) {
      iziToast.error({
        title: 'Error',
        message: error?.response?.data?.message || 'No se pudo crear la carpeta',
        position: 'topRight',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar la carpeta "${nombre}" y todas sus subcarpetas? Las notas quedarán sin carpeta.`)) return;
    try {
      setEliminandoId(id);
      await apiService.eliminarCarpeta(id);
      await cargarCarpetas();
      iziToast.success({ title: 'Eliminada', message: 'Carpeta eliminada', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({
        title: 'Error',
        message: error?.response?.data?.message || 'No se pudo eliminar la carpeta',
        position: 'topRight',
      });
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1
            className="text-3xl font-semibold text-black"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
          >
            Carpetas
          </h1>
          <button
            type="button"
            onClick={abrirFormRaiz}
            className="px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva carpeta
          </button>
        </div>

        <p className="mb-8 text-sm text-gray-500">
          Organiza tus notas en un árbol de carpetas. Crea carpetas raíz y subcarpetas anidadas para reflejar
          tus proyectos, áreas o clientes.
        </p>

        {showForm && (
          <form onSubmit={handleCrear} className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {carpetaPadreId ? `Nueva subcarpeta en "${nombrePadre}"` : 'Nueva carpeta'}
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
                placeholder="Nombre de la carpeta"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/70"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSaving || !nombreNueva.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-black rounded-xl hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Creando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-40 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 px-4 rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-gray-200 rounded-md" />
                    <div className="h-2.5 w-48 bg-gray-100 rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100" />
                    <div className="w-8 h-8 rounded-lg bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : carpetas.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No tienes carpetas</p>
            <p className="text-sm text-gray-500 mb-6">Crea una carpeta para organizar tus notas.</p>
            <button
              type="button"
              onClick={abrirFormRaiz}
              className="px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900"
            >
              Crear primera carpeta
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gray-900 text-white text-xs font-semibold">
                  {carpetas.length}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Árbol de carpetas
                  </p>
                  <p className="text-xs text-gray-500">
                    {carpetas.some(c => c.nivel > 0) ? 'Incluye carpetas anidadas y rutas completas.' : 'Todas las carpetas están al mismo nivel.'}
                  </p>
                </div>
              </div>
            </div>
            <ul className="space-y-0.5 pb-2">
            {carpetas.map((c) => (
              <li
                key={c.id}
                className="group flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  style={{ paddingLeft: `${(c.nivel || 0) * 18}px` }}
                >
                  {/* Indicador de nivel */}
                  {c.nivel > 0 && (
                    <span className="w-px h-6 bg-gradient-to-b from-gray-200 to-gray-300 rounded-full" />
                  )}
                  {/* Icono + nombre */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 border border-gray-200"
                      style={{
                        backgroundColor: c.colorHex ? `${c.colorHex}15` : '#F9FAFB',
                        borderColor: c.colorHex || '#E5E7EB',
                      }}
                    >
                      <span>{c.icono || '📁'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.nombre}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {c.rutaString}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => abrirFormSubcarpeta(c.id, c.nombre)}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Nueva subcarpeta"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(c.id, c.nombre)}
                    disabled={eliminandoId === c.id}
                    className="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                    title="Eliminar"
                  >
                    {eliminandoId === c.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </li>
            ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};
