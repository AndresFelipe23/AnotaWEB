import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { CrearNotaRapidaRequest } from '../types/api';
import iziToast from 'izitoast';
import { gsap } from 'gsap';

export const NotasRapidas = () => {
  const navigate = useNavigate();
  const [contenido, setContenido] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Auto-expandir textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(150, scrollHeight)}px`;
    }
  }, [contenido]);

  // Animación de entrada con GSAP
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
    }
  }, []);

  // Animación cuando se enfoca
  useEffect(() => {
    if (containerRef.current && isFocused) {
      gsap.to(containerRef.current, {
        scale: 1.005,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else if (containerRef.current && !isFocused) {
      gsap.to(containerRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isFocused]);

  const limpiarCaja = () => {
    setContenido('');
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '150px';
      textareaRef.current.blur();
    }
  };

  const handleSave = async () => {
    if (!contenido.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const data: CrearNotaRapidaRequest = {
        contenido: contenido.trim(),
      };

      // Animación de guardado
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          scale: 0.98,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        });
      }

      await apiService.crearNotaRapida(data);
      
      // Limpiar inmediatamente después de guardar
      limpiarCaja();

      // Animación de éxito
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0.7,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        });
      }

      // Mostrar alerta con opción de ir a ver las notas
      iziToast.success({
        title: 'Guardado',
        message: 'Nota rápida creada exitosamente. Puedes ver todas tus notas rápidas en la vista de Notas Rápidas.',
        position: 'topRight',
        timeout: 5000,
        buttons: [
          ['<button style="background: black; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; margin-left: 10px;">Ver Notas Rápidas</button>', (_instance, toast) => {
            navigate('/notas-rapidas');
            iziToast.hide({}, toast);
          }, true]
        ]
      });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape para cancelar
    else if (e.key === 'Escape') {
      limpiarCaja();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center pt-6 sm:pt-10 pb-safe px-4 sm:px-6">
      <div className="w-full max-w-5xl">
        {/* Título principal */}
        <div ref={titleRef} className="mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-light text-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
            Notas Rápidas
          </h1>
        </div>

        {/* Tarjeta del editor */}
        <div
          ref={containerRef}
          className={`relative bg-white border-2 rounded-2xl sm:rounded-3xl transition-all duration-300 ${
            isFocused
              ? 'border-black shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
              : 'border-gray-200 hover:border-gray-300 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-10">
            {/* Header del editor */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-black" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Nueva Nota
                </h2>
              </div>
              {contenido && (
                <span className="text-sm text-gray-500 font-medium">
                  {contenido.length} caracteres
                </span>
              )}
            </div>

            {/* Área de texto */}
            <div className="relative mb-6">
              <textarea
                ref={textareaRef}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Comienza a escribir tu nota..."
                className="w-full min-h-[200px] sm:min-h-[280px] lg:min-h-[340px] p-0 border-none outline-none resize-none text-black placeholder-gray-400 bg-transparent text-base sm:text-lg leading-relaxed focus:outline-none"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.125rem',
                  lineHeight: '2rem',
                }}
              />
            </div>

            {/* Footer con atajos y botones */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 sm:pt-6 border-t-2 border-gray-100">
              {/* Atajos de teclado - ocultos en móvil */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <kbd className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">
                      Ctrl
                    </kbd>
                    <span className="text-gray-400 text-sm">+</span>
                    <kbd className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">
                      Enter
                    </kbd>
                  </div>
                  <span className="text-sm text-gray-500 ml-1">Guardar</span>
                </div>
                <div className="w-px h-5 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <kbd className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">
                    Esc
                  </kbd>
                  <span className="text-sm text-gray-500 ml-1">Cancelar</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                <button
                  onClick={limpiarCaja}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 border border-gray-200 touch-manipulation"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !contenido.trim()}
                  className="flex-1 sm:flex-initial w-full sm:w-auto px-4 sm:px-8 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="sm:hidden">Guardar</span>
                      <span className="hidden sm:inline">Guardar Nota</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de ayuda - oculto en móvil */}
        {!contenido && !isFocused && (
          <div className="hidden sm:flex mt-6 items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Usa los atajos de teclado para una experiencia más rápida
          </div>
        )}
      </div>
    </div>
  );
};
