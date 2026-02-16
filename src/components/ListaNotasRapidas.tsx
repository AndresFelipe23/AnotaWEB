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
      textareaRef.current.style.height = `${Math.max(300, scrollHeight)}px`;
    }
  }, [contenidoEdit, notaSeleccionada]);

  const formatFecha = (fecha: string) => {
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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
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
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Header Compacto */}
      <div className="flex-shrink-0 border-b-2 border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
              Notas Rápidas
            </h1>
            {notas.length > 0 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                {notas.length}
              </span>
            )}
          </div>
          <Link
            to="/"
            className="px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-lg transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva
          </Link>
        </div>
      </div>

      {/* Layout 2 Columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Notas */}
        <div className="w-96 flex-shrink-0 border-r-2 border-gray-100 bg-gray-50 flex flex-col overflow-hidden">
          {/* Lista de Notas */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
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
                  <div
                    key={nota.id}
                    onClick={() => handleAbrirNota(nota)}
                    className={`group relative p-4 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-white shadow-lg ring-2 ring-black'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md'
                    }`}
                    style={{
                      borderLeft: color ? `4px solid ${color}` : '4px solid transparent',
                    }}
                  >
                    {/* Contenido de la nota */}
                    <div className="flex items-start gap-3">
                      {color && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {nota.contenido}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-gray-500">{formatFecha(nota.fechaActualizacion)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel de Contenido */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {!notaSeleccionada ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-3xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Selecciona una nota
                </h3>
                <p className="text-gray-500 mb-6">
                  Elige una nota de la lista para ver y editar su contenido
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-lg transition-all duration-200"
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
              className="flex-1 flex flex-col overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-black" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                    Editar Nota
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {contenidoEdit.length} caracteres
                  </p>
                </div>
                {colorEdit && (
                  <div
                    className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center"
                    style={{ backgroundColor: colorEdit }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Textarea - Ocupa todo el espacio */}
                <div className="h-full flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={contenidoEdit}
                    onChange={(e) => setContenidoEdit(e.target.value)}
                    placeholder="Escribe tu nota aquí..."
                    className="flex-1 w-full h-full p-6 border-none outline-none resize-none text-gray-900 placeholder-gray-400 text-base leading-relaxed bg-white focus:bg-gray-50 transition-colors duration-200"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      lineHeight: '1.75',
                    }}
                  />
                </div>
              </div>

              {/* Footer con selector de color */}
              <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <kbd className="px-2 py-1 bg-white rounded-lg border border-gray-300 font-mono shadow-sm">Ctrl+Enter</kbd>
                    <span>guardar</span>
                    <span className="text-gray-300 mx-1">•</span>
                    <kbd className="px-2 py-1 bg-white rounded-lg border border-gray-300 font-mono shadow-sm">Esc</kbd>
                    <span>deseleccionar</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {contenidoEdit.length} caracteres
                  </span>
                </div>

                {/* Selector de Color */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-gray-700">Color:</span>
                  <div className="flex gap-1.5">
                    {COLORES.map((color) => (
                      <button
                        key={color.hex || 'none'}
                        onClick={() => setColorEdit(color.hex)}
                        className={`group relative w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                          color.hex === colorEdit
                            ? 'ring-2 ring-black scale-110 shadow-md'
                            : 'hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: color.bg,
                          borderColor: color.border,
                        }}
                        title={color.nombre}
                      >
                        {color.hex === colorEdit && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-black flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-8 py-5 bg-white border-t-2 border-gray-100 space-y-3">
                {!showDeleteConfirm ? (
                  <>
                    {/* Botón Principal */}
                    <button
                      onClick={handleGuardar}
                      disabled={isSaving || isDeleting || !contenidoEdit.trim()}
                      className="w-full px-6 py-3.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando cambios...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Cambios
                        </>
                      )}
                    </button>

                    {/* Acciones Secundarias */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleArchivar}
                        disabled={isSaving || isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archivar
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving || isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group"
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-900">¿Eliminar permanentemente?</p>
                        <p className="text-xs text-red-700">Esta acción no se puede deshacer</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleEliminar}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Eliminando...
                          </>
                        ) : (
                          'Sí, Eliminar'
                        )}
                      </button>
                    </div>
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
