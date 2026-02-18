import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import type { NotaRapida, ActualizarNotaRapidaRequest } from '../types/api';
import iziToast from 'izitoast';
import { Link } from 'react-router-dom';

const COLORES = [
  { hex: null, nombre: 'Sin color', bg: '#FFFFFF', border: '#E5E7EB' },
  { hex: '#EF4444', nombre: 'Rojo', bg: '#FEE2E2', border: '#EF4444' },
  { hex: '#F59E0B', nombre: 'Ámbar', bg: '#FEF3C7', border: '#F59E0B' },
  { hex: '#10B981', nombre: 'Esmeralda', bg: '#D1FAE5', border: '#10B981' },
  { hex: '#3B82F6', nombre: 'Azul', bg: '#DBEAFE', border: '#3B82F6' },
  { hex: '#8B5CF6', nombre: 'Violeta', bg: '#EDE9FE', border: '#8B5CF6' },
  { hex: '#EC4899', nombre: 'Rosa', bg: '#FCE7F3', border: '#EC4899' },
  { hex: '#06B6D4', nombre: 'Cian', bg: '#CFFAFE', border: '#06B6D4' },
  { hex: '#84CC16', nombre: 'Lima', bg: '#ECFCCB', border: '#84CC16' },
  { hex: '#F97316', nombre: 'Naranja', bg: '#FFEDD5', border: '#F97316' },
  { hex: '#14B8A6', nombre: 'Turquesa', bg: '#CCFBF1', border: '#14B8A6' },
  { hex: '#A855F7', nombre: 'Púrpura', bg: '#F3E8FF', border: '#A855F7' },
];

export const ListaNotasRapidas = () => {
  const [notas, setNotas] = useState<NotaRapida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotaRapida | null>(null);
  const [contenidoEdit, setContenidoEdit] = useState('');
  const [colorEdit, setColorEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notasArchivadas, setNotasArchivadas] = useState<NotaRapida[]>([]);
  const [isLoadingArchivadas, setIsLoadingArchivadas] = useState(false);
  const [showArchivadasPanel, setShowArchivadasPanel] = useState(false);
  const [notaRestaurandoId, setNotaRestaurandoId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    try {
      setIsLoading(true);
      const notasData = await apiService.obtenerNotasRapidas();
      setNotas(notasData);
    } catch (error: any) {
      console.error('Error al cargar notas rápidas:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error?.message || 'No se pudieron cargar las notas rápidas';
      
      if (import.meta.env.DEV && errorData?.innerException) {
        console.error('Error interno:', errorData.innerException);
        console.error('Stack trace:', errorData.stackTrace);
      }
      
      iziToast.error({
        title: 'Error',
        message: errorMessage,
        position: 'topRight',
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarNotasArchivadas = async () => {
    try {
      setIsLoadingArchivadas(true);
      const data = await apiService.obtenerNotasRapidasArchivadas();
      setNotasArchivadas(data);
    } catch (error: any) {
      console.error('Error al cargar notas rápidas archivadas:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error?.message || 'No se pudieron cargar las notas rápidas archivadas';

      iziToast.error({
        title: 'Error',
        message: errorMessage,
        position: 'topRight',
        timeout: 5000,
      });
    } finally {
      setIsLoadingArchivadas(false);
    }
  };

  const handleAbrirNota = (nota: NotaRapida) => {
    setNotaSeleccionada(nota);
    setContenidoEdit(nota.contenido);
    setColorEdit(nota.colorHex || null);
    setShowDeleteConfirm(false);
  };

  const handleCerrarPanel = () => {
    setNotaSeleccionada(null);
    setContenidoEdit('');
    setColorEdit(null);
    setShowDeleteConfirm(false);
  };

  const handleGuardar = async () => {
    if (!notaSeleccionada || !contenidoEdit.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const data: ActualizarNotaRapidaRequest = {
        contenido: contenidoEdit.trim(),
        colorHex: colorEdit || undefined,
      };

      await apiService.actualizarNotaRapida(notaSeleccionada.id, data);

      iziToast.success({
        title: 'Guardado',
        message: 'Nota actualizada exitosamente',
        position: 'topRight',
      });

      await cargarNotas();
      handleCerrarPanel();
    } catch (error) {
      iziToast.error({
        title: 'Error',
        message: 'No se pudo guardar la nota',
        position: 'topRight',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchivar = async () => {
    if (!notaSeleccionada || isSaving) return;

    setIsSaving(true);
    try {
      await apiService.archivarNotaRapida(notaSeleccionada.id);

      iziToast.success({
        title: 'Archivada',
        message: 'Nota archivada exitosamente',
        position: 'topRight',
      });

      await cargarNotas();
      if (showArchivadasPanel) {
        await cargarNotasArchivadas();
      }
      handleCerrarPanel();
    } catch (error) {
      iziToast.error({
        title: 'Error',
        message: 'No se pudo archivar la nota',
        position: 'topRight',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!notaSeleccionada || isDeleting) return;

    setIsDeleting(true);
    try {
      await apiService.eliminarNotaRapida(notaSeleccionada.id);

      iziToast.success({
        title: 'Eliminada',
        message: 'Nota eliminada exitosamente',
        position: 'topRight',
      });

      await cargarNotas();
      if (showArchivadasPanel) {
        await cargarNotasArchivadas();
      }
      handleCerrarPanel();
    } catch (error) {
      iziToast.error({
        title: 'Error',
        message: 'No se pudo eliminar la nota',
        position: 'topRight',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCerrarPanel(); // Deseleccionar nota
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGuardar();
    }
  };

  // Auto-focus en textarea cuando se selecciona una nota
  useEffect(() => {
    if (notaSeleccionada && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [notaSeleccionada]);

  // Auto-expandir textarea
  useEffect(() => {
    if (textareaRef.current && notaSeleccionada) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(500, scrollHeight)}px`;
    }
  }, [contenidoEdit, notaSeleccionada]);

  const formatFecha = (fecha: string) => {
    // La API ya devuelve hora local ajustada, solo formateamos
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === ayer.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const handleToggleArchivadasPanel = async () => {
    const next = !showArchivadasPanel;
    setShowArchivadasPanel(next);
    if (next) {
      await cargarNotasArchivadas();
    }
  };

  const handleRecuperarNotaArchivada = async (notaId: string) => {
    if (notaRestaurandoId) return;
    setNotaRestaurandoId(notaId);
    try {
      await apiService.recuperarNotaRapida(notaId);
      iziToast.success({
        title: 'Recuperada',
        message: 'La nota ha sido restaurada a la lista principal',
        position: 'topRight',
      });
      await Promise.all([cargarNotas(), cargarNotasArchivadas()]);
    } catch (error) {
      iziToast.error({
        title: 'Error',
        message: 'No se pudo recuperar la nota',
        position: 'topRight',
      });
    } finally {
      setNotaRestaurandoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl w-80 mb-3 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-64 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl w-40 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-full"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-5/6"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-4/6"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/6"></div>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header Compacto */}
      <div className="flex-shrink-0 border-b-2 border-gray-100 bg-white px-4 sm:px-6 lg:px-8 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-black" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              Notas Rápidas
            </h1>
            {notas.length > 0 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                {notas.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleToggleArchivadasPanel}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 flex items-center gap-2 touch-manipulation ${
                showArchivadasPanel
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Archivadas</span>
              {notasArchivadas.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/40 text-[10px]">
                  {notasArchivadas.length}
                </span>
              )}
            </button>
            <Link
              to="/"
              className="px-4 sm:px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nueva
            </Link>
          </div>
        </div>
      </div>

      {/* Panel lateral de notas archivadas */}
      {showArchivadasPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setShowArchivadasPanel(false)}
          ></div>
          <div className="w-full sm:w-[420px] md:w-[460px] lg:w-[500px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Notas archivadas
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {notasArchivadas.length === 0
                    ? 'No tienes notas rápidas archivadas'
                    : `${notasArchivadas.length} nota${notasArchivadas.length > 1 ? 's' : ''} archivada${notasArchivadas.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={() => setShowArchivadasPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3 bg-gray-50/60">
              {isLoadingArchivadas ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-500">
                  Cargando notas archivadas...
                </div>
              ) : notasArchivadas.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-xs text-gray-500 px-6">
                  Cuando archives una nota rápida, la verás aquí para poder recuperarla o eliminarla definitivamente.
                </div>
              ) : (
                notasArchivadas.map((nota) => (
                  <div
                    key={nota.id}
                    className="rounded-2xl bg-white border border-gray-200 px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {nota.colorHex && (
                        <span
                          className="mt-1 w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: nota.colorHex }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] text-gray-900 leading-relaxed line-clamp-4"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {nota.contenido}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 border border-gray-200">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatFecha(nota.fechaCreacion)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleRecuperarNotaArchivada(nota.id)}
                        disabled={notaRestaurandoId === nota.id}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-black rounded-xl hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {notaRestaurandoId === nota.id && (
                          <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        <span>Recuperar</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (isDeleting) return;
                          setIsDeleting(true);
                          try {
                            await apiService.eliminarNotaRapida(nota.id);
                            iziToast.success({
                              title: 'Eliminada',
                              message: 'La nota archivada se eliminó permanentemente',
                              position: 'topRight',
                            });
                            await cargarNotasArchivadas();
                          } catch (error) {
                            iziToast.error({
                              title: 'Error',
                              message: 'No se pudo eliminar la nota archivada',
                              position: 'topRight',
                            });
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Layout 2 Columnas / Responsive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50/60">
        {/* Sidebar de Notas */}
        <div className="w-full lg:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50 flex flex-col overflow-hidden">
          {/* Lista de Notas */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 scrollbar-hide pt-4 px-2 sm:px-4">
            {notas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sin notas</p>
                <p className="text-xs text-gray-500">Crea tu primera nota rápida</p>
              </div>
            ) : (
              notas.map((nota) => {
                const isSelected = notaSeleccionada?.id === nota.id;
                const color = nota.colorHex;

                return (
                  <div key={nota.id} className="px-2 sm:px-4 py-1">
                    <div
                      onClick={() => handleAbrirNota(nota)}
                      className={`group relative cursor-pointer transition-transform duration-200 touch-manipulation active:scale-[0.98]`}
                    >
                      {/* Tarjeta tipo nota adhesiva */}
                      <div
                        className={`relative rounded-3xl px-4 pt-6 pb-4 shadow-sm border bg-gradient-to-br from-white via-white to-gray-50 ${
                          isSelected
                            ? 'border-black shadow-[0_18px_40px_rgba(15,23,42,0.30)] -translate-y-1'
                            : 'border-gray-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.20)]'
                        }`}
                        style={{
                          borderColor: color || '#E5E7EB',
                          background:
                            color
                              ? `radial-gradient(circle at 0 0, ${color}22, transparent 55%), radial-gradient(circle at 100% 100%, ${color}11, #F9FAFB)`
                              : undefined,
                        }}
                      >
                        {/* Pin superior */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className="w-5 h-5 rounded-full bg-black/80 shadow-md flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>

                        {/* Esquina doblada */}
                        <div className="absolute right-0 top-0 w-8 h-8 overflow-hidden rounded-tr-3xl">
                          <div className="absolute right-0 top-0 w-6 h-6 bg-white/80 shadow-[0_0_0_1px_rgba(148,163,184,0.5)] rotate-45 translate-x-3 -translate-y-3" />
                        </div>

                        {/* Contenido */}
                        <div className="relative">
                          <p
                            className="text-[13px] text-slate-900 leading-relaxed line-clamp-5"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {nota.contenido}
                          </p>

                          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-1 border border-slate-200/80">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatFecha(nota.fechaCreacion)}</span>
                            </div>

                            {color && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Color</span>
                                <span
                                  className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/80"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Borde resaltado si está activa */}
                        {isSelected && (
                          <div className="pointer-events-none absolute inset-px rounded-[1.4rem] border border-black/60 border-dashed" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel de Contenido */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {!notaSeleccionada ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Selecciona una nota
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-6">
                  Elige una nota de la lista para ver y editar su contenido
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-lg transition-all duration-200 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear Nueva Nota
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 flex flex-col overflow-hidden px-2 sm:px-3 py-2 sm:py-3"
              onKeyDown={handleKeyDown}
            >
              {/* Contenedor tipo documento (sin bordes externos) */}
              <div className="flex-1 flex flex-col rounded-3xl bg-white overflow-hidden">
                {/* Header compacto */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-center gap-3">
                    {colorEdit && (
                      <div
                        className="w-7 h-7 rounded-xl shadow-sm flex items-center justify-center border border-white"
                        style={{ backgroundColor: colorEdit }}
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <h2
                      className="text-base font-semibold text-gray-900"
                      style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
                    >
                      Nota rápida
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400">{contenidoEdit.length} caracteres</span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-white overflow-y-auto scrollbar-hide">
                  <div className="flex-1 flex flex-col px-4 sm:px-6 py-4">
                    <textarea
                      ref={textareaRef}
                      value={contenidoEdit}
                      onChange={(e) => setContenidoEdit(e.target.value)}
                      placeholder="Escribe tu nota aquí..."
                      className="w-full flex-1 min-h-[200px] sm:min-h-[calc(100vh-280px)] border-none outline-none resize-none text-gray-900 placeholder-gray-400 text-[15px] sm:text-base lg:text-lg leading-relaxed lg:leading-[1.95] bg-transparent focus:outline-none"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer unificado: color + acciones */}
              <div className="flex-shrink-0 mt-2 px-3 sm:px-4 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                {/* Colores + atajos */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLORES.map((color) => (
                      <button
                        key={color.hex || 'none'}
                        onClick={() => setColorEdit(color.hex)}
                        className={`group relative w-6 h-6 rounded-full border transition-all duration-200 ${
                          color.hex === colorEdit
                            ? 'border-black ring-2 ring-black/60 scale-110 shadow-md'
                            : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.bg }}
                        title={color.nombre}
                      >
                        {color.hex === colorEdit && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-gray-50 rounded border border-gray-200 font-mono">Ctrl+Enter</kbd>
                    <span>guardar</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-50 rounded border border-gray-200 font-mono">Esc</kbd>
                    <span>cerrar</span>
                  </div>
                </div>

                {/* Botones de acción */}
                {!showDeleteConfirm ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleGuardar}
                      disabled={isSaving || isDeleting || !contenidoEdit.trim()}
                      className="flex-1 min-w-0 px-4 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg touch-manipulation"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleArchivar}
                      disabled={isSaving || isDeleting}
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archivar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSaving || isDeleting}
                      className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 touch-manipulation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-semibold text-red-900">¿Eliminar permanentemente?</span>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEliminar}
                      disabled={isDeleting}
                      className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                    >
                      {isDeleting ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Eliminar'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
