import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import type { NotaRapida, ActualizarNotaRapidaRequest } from '../types/api';
import iziToast from 'izitoast';
import { gsap } from 'gsap';

interface ModalNotaRapidaProps {
  nota: NotaRapida | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

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

export const ModalNotaRapida = ({ nota, isOpen, onClose, onSave }: ModalNotaRapidaProps) => {
  const [contenido, setContenido] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (nota) {
      setContenido(nota.contenido);
      setColorSeleccionado(nota.colorHex || null);
      setShowDeleteConfirm(false);
    }
  }, [nota]);

  useEffect(() => {
    if (isOpen && nota) {
      // Resetear estados iniciales - panel viene desde la derecha
      if (overlayRef.current) {
        gsap.set(overlayRef.current, { opacity: 0 });
      }
      if (modalRef.current) {
        gsap.set(modalRef.current, { x: '100%' });
      }

      // Animación de entrada con delay
      requestAnimationFrame(() => {
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 1,
            duration: 0.25,
            ease: 'power2.out'
          });
        }
        if (modalRef.current) {
          gsap.to(modalRef.current, {
            x: 0,
            duration: 0.35,
            delay: 0.05,
            ease: 'power3.out'
          });
        }
      });

      // Auto-focus en el textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, nota]);

  // Auto-expandir textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(200, scrollHeight)}px`;
    }
  }, [contenido]);

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      // Animar panel deslizándose a la derecha
      gsap.to(modalRef.current, {
        x: '100%',
        duration: 0.3,
        ease: 'power3.in',
      });
      // Animar overlay
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.25,
        delay: 0.05,
        onComplete: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  const handleGuardar = async () => {
    if (!nota || !contenido.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const data: ActualizarNotaRapidaRequest = {
        contenido: contenido.trim(),
        colorHex: colorSeleccionado || undefined,
      };

      await apiService.actualizarNotaRapida(nota.id, data);
      
      iziToast.success({
        title: 'Guardado',
        message: 'Nota actualizada exitosamente',
        position: 'topRight',
      });

      onSave();
      handleClose();
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
    if (!nota || isSaving) return;

    setIsSaving(true);
    try {
      await apiService.archivarNotaRapida(nota.id);
      
      iziToast.success({
        title: 'Archivada',
        message: 'Nota archivada exitosamente',
        position: 'topRight',
      });

      onSave();
      handleClose();
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
    if (!nota || isDeleting) return;

    setIsDeleting(true);
    try {
      await apiService.eliminarNotaRapida(nota.id);
      
      iziToast.success({
        title: 'Eliminada',
        message: 'Nota eliminada exitosamente',
        position: 'topRight',
      });

      onSave();
      handleClose();
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
      handleClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGuardar();
    }
  };

  if (!isOpen || !nota) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel Lateral */}
      <div
        ref={modalRef}
        className="fixed right-0 top-0 h-full w-full sm:w-[600px] lg:w-[700px] bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
          {/* Header con borde de color */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group -ml-2"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6 text-gray-600 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                  Editar Nota Rápida
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {contenido.length} caracteres
                </p>
              </div>
            </div>
            {colorSeleccionado && (
              <div
                className="w-12 h-12 rounded-2xl shadow-md flex items-center justify-center"
                style={{ backgroundColor: colorSeleccionado }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Barra de color superior */}
          {colorSeleccionado && (
            <div
              className="h-1.5 w-full transition-colors duration-300"
              style={{ backgroundColor: colorSeleccionado }}
            />
          )}

          {/* Content - Full Height */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Textarea - Expandido para aprovechar espacio */}
            <div className="flex flex-col h-full">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Contenido de la nota
              </label>
              <textarea
                ref={textareaRef}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                className="flex-1 w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none text-gray-900 placeholder-gray-400 text-base leading-relaxed bg-white shadow-sm transition-all duration-200 min-h-[300px]"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  lineHeight: '1.75',
                }}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <p className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg border border-gray-300 font-mono">Ctrl+Enter</kbd>
                  <span>guardar</span>
                  <span className="text-gray-300">•</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg border border-gray-300 font-mono">Esc</kbd>
                  <span>cerrar</span>
                </p>
              </div>
            </div>

            {/* Selector de Color Compacto */}
            <div className="border-t-2 border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Color de la nota
              </label>
              <div className="grid grid-cols-6 gap-2.5">
                {COLORES.map((color) => (
                  <button
                    key={color.hex || 'none'}
                    onClick={() => setColorSeleccionado(color.hex)}
                    className={`group relative h-12 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                      color.hex === colorSeleccionado
                        ? 'ring-2 ring-black ring-offset-2 scale-105 shadow-lg'
                        : 'hover:scale-105 hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: color.bg,
                      borderColor: color.border,
                    }}
                    title={color.nombre}
                  >
                    {color.hex === colorSeleccionado && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                        <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                        {color.nombre}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Compacto */}
          <div className="p-6 bg-white border-t-2 border-gray-100 space-y-3">
            {!showDeleteConfirm ? (
              <>
                {/* Botón Principal */}
                <button
                  onClick={handleGuardar}
                  disabled={isSaving || isDeleting || !contenido.trim()}
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
    </div>
  );
};
