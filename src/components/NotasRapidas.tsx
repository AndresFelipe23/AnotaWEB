import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { CrearNotaRapidaRequest } from '../types/api';
import iziToast from 'izitoast';
import { gsap } from 'gsap';

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
type SpeechRecognitionCtor = new () => {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
};
const SpeechRecognitionAPI: SpeechRecognitionCtor | undefined =
  typeof window !== 'undefined'
    ? (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition
    : undefined;

export const NotasRapidas = () => {
  const navigate = useNavigate();
  const [contenido, setContenido] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([0, 0, 0, 0, 0]);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const interimRef = useRef('');
  // Refs to avoid stale closures inside recognition handlers
  const intentionalStopRef = useRef(false);
  const isListeningRef = useRef(false);
  const sentenceHistoryRef = useRef<string[]>([]);
  // Audio visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);
  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textoVisible = contenido + (interimTranscript ? ` ${interimTranscript}` : '');

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Auto-expandir textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(150, scrollHeight)}px`;
    }
  }, [contenido, interimTranscript]);

  // Animación de entrada con GSAP
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    }
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    }
  }, []);

  // Animación al enfocar
  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, { scale: isFocused ? 1.005 : 1, duration: 0.3, ease: 'power2.out' });
    }
  }, [isFocused]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      recognitionRef.current?.stop();
      stopAudioVisualization();
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setListenSeconds(0);
    timerRef.current = setInterval(() => setListenSeconds(s => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setListenSeconds(0);
  };

  // ── Visualización de audio ───────────────────────────────────────────────
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const indices = [2, 5, 9, 14, 19]; // Different frequency bands

      const animate = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const levels = indices.map(i => dataArray[Math.min(i, bufferLength - 1)] / 255);
        setAudioLevel(levels);
        audioAnimFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch {
      // Visualización no crítica, falla en silencio
    }
  };

  const stopAudioVisualization = () => {
    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel([0, 0, 0, 0, 0]);
  };

  // ── Historial para deshacer ──────────────────────────────────────────────
  const pushHistory = (text: string) => {
    sentenceHistoryRef.current.push(text);
    setCanUndo(true);
  };

  const undoLastSentence = () => {
    if (sentenceHistoryRef.current.length === 0) return;
    const last = sentenceHistoryRef.current.pop()!;
    setCanUndo(sentenceHistoryRef.current.length > 0);
    setContenido(prev => {
      const trimmed = prev.trimEnd();
      if (trimmed.endsWith(last)) return trimmed.slice(0, -last.length).trimEnd();
      // Fallback: quitar la cantidad de caracteres
      return trimmed.slice(0, Math.max(0, trimmed.length - last.length)).trimEnd();
    });
  };

  const resetHistory = () => {
    sentenceHistoryRef.current = [];
    setCanUndo(false);
  };

  // ── Limpiar caja ─────────────────────────────────────────────────────────
  const limpiarCaja = () => {
    if (isListeningRef.current) {
      intentionalStopRef.current = true;
      isListeningRef.current = false;
      interimRef.current = '';
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      stopAudioVisualization();
      stopTimer();
    }
    setContenido('');
    setInterimTranscript('');
    interimRef.current = '';
    resetHistory();
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '150px';
      textareaRef.current.blur();
    }
  };

  // ── Dictado ───────────────────────────────────────────────────────────────
  const toggleDictado = () => {
    if (!SpeechRecognitionAPI) {
      iziToast.warning({
        title: 'No disponible',
        message: 'Tu navegador no soporta dictado por voz. Prueba en Chrome o Edge.',
        position: 'topRight',
      });
      return;
    }

    if (isListeningRef.current) {
      // Detener dictado
      intentionalStopRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      // Confirmar el interim pendiente
      const pendiente = interimRef.current.trim();
      if (pendiente) {
        pushHistory(pendiente);
        setContenido(prev => (prev ? `${prev} ${pendiente}` : pendiente).trim());
        setInterimTranscript('');
        interimRef.current = '';
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopAudioVisualization();
      stopTimer();
      return;
    }

    // Iniciar dictado
    intentionalStopRef.current = false;
    isListeningRef.current = true;
    setIsListening(true);
    resetHistory();

    // startSession usa closure sobre refs para que funcione en auto-reinicio
    const startSession = () => {
      if (intentionalStopRef.current || !isListeningRef.current) return;

      const recognition = new SpeechRecognitionAPI!();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CO';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finals = '';
        let latestInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finals += (finals ? ' ' : '') + text;
          } else {
            latestInterim = text;
          }
        }
        if (finals) {
          const trimmed = finals.trim();
          pushHistory(trimmed);
          setContenido(prev => (prev ? `${prev} ${trimmed}` : trimmed).trim());
        }
        interimRef.current = latestInterim;
        setInterimTranscript(latestInterim);
      };

      recognition.onerror = (event: { error: string }) => {
        if (event.error === 'not-allowed') {
          intentionalStopRef.current = true;
          iziToast.warning({
            title: 'Micrófono bloqueado',
            message: 'Permite el acceso al micrófono para dictar.',
            position: 'topRight',
          });
        } else if (event.error === 'network') {
          intentionalStopRef.current = true;
          iziToast.error({
            title: 'Sin conexión',
            message: 'El dictado requiere conexión a internet.',
            position: 'topRight',
          });
        }
        // 'no-speech' y 'aborted' se manejan en onend con auto-reinicio
      };

      recognition.onend = () => {
        // Confirmar interim pendiente antes de (posible) reinicio
        const pendiente = interimRef.current.trim();
        if (pendiente) {
          pushHistory(pendiente);
          setContenido(prev => (prev ? `${prev} ${pendiente}` : pendiente).trim());
          setInterimTranscript('');
          interimRef.current = '';
        }

        if (!intentionalStopRef.current && isListeningRef.current) {
          // Auto-reinicio tras silencio — el navegador detiene la API pero nosotros seguimos
          setTimeout(startSession, 150);
        } else {
          isListeningRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;
          stopAudioVisualization();
          stopTimer();
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        isListeningRef.current = false;
        setIsListening(false);
        stopAudioVisualization();
        stopTimer();
        iziToast.error({
          title: 'Error',
          message: 'No se pudo iniciar el reconocimiento de voz.',
          position: 'topRight',
        });
      }
    };

    startSession();
    startTimer();
    startAudioVisualization();

    iziToast.info({
      title: 'Dictando',
      message: 'Habla ahora. El micrófono continúa activo entre pausas.',
      position: 'topRight',
      timeout: 3000,
    });
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Detener dictado si está activo y capturar el texto antes de limpiar
    if (isListeningRef.current) {
      intentionalStopRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      interimRef.current = '';
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopAudioVisualization();
      stopTimer();
    }

    const textoAGuardar = textoVisible.trim();
    if (!textoAGuardar || isSaving) return;

    setIsSaving(true);
    try {
      const data: CrearNotaRapidaRequest = { contenido: textoAGuardar };

      if (containerRef.current) {
        gsap.to(containerRef.current, { scale: 0.98, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      }

      await apiService.crearNotaRapida(data);
      limpiarCaja();

      if (containerRef.current) {
        gsap.to(containerRef.current, { opacity: 0.7, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      }

      iziToast.success({
        title: 'Guardado',
        message: 'Nota rápida creada exitosamente.',
        position: 'topRight',
        timeout: 5000,
        buttons: [
          ['<button style="background: black; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; margin-left: 10px;">Ver Notas Rápidas</button>', (_instance, toast) => {
            navigate('/notas-rapidas');
            iziToast.hide({}, toast);
          }, true]
        ]
      });
    } catch {
      iziToast.error({ title: 'Error', message: 'No se pudo guardar la nota', position: 'topRight' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Atajos de teclado ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      limpiarCaja();
    } else if (ctrl && e.key === 'm') {
      e.preventDefault();
      toggleDictado();
    } else if (ctrl && e.key === 'z' && isListening) {
      e.preventDefault();
      undoLastSentence();
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
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-black" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Nueva Nota
                </h2>

                {/* Botón de dictado */}
                <button
                  type="button"
                  onClick={toggleDictado}
                  disabled={!SpeechRecognitionAPI}
                  title={SpeechRecognitionAPI ? (isListening ? 'Detener dictado (Ctrl+M)' : 'Dictar con voz (Ctrl+M)') : 'Tu navegador no soporta dictado'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation ${
                    isListening
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isListening ? (
                    <>
                      {/* Barras de nivel de audio */}
                      <div className="flex items-end gap-[2px] h-4 w-6">
                        {audioLevel.map((level, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-red-500 rounded-full transition-all duration-75"
                            style={{ height: `${Math.max(20, level * 100)}%` }}
                          />
                        ))}
                      </div>
                      <span className="hidden sm:inline">Detener</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="hidden sm:inline">Dictar</span>
                    </>
                  )}
                </button>

                {/* Botón deshacer última frase (solo mientras dicta y hay historial) */}
                {isListening && canUndo && (
                  <button
                    type="button"
                    onClick={undoLastSentence}
                    title="Deshacer última frase (Ctrl+Z)"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 touch-manipulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="hidden sm:inline text-xs">Deshacer</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Contador de tiempo de dictado */}
                {isListening && (
                  <span className="text-sm font-mono font-semibold text-red-600 tabular-nums">
                    {formatTime(listenSeconds)}
                  </span>
                )}
                {textoVisible && (
                  <span className="text-sm text-gray-500 font-medium">
                    {textoVisible.length} caracteres
                  </span>
                )}
              </div>
            </div>

            {/* Estado de transcripción (solo al dictar) */}
            {isListening && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-emerald-700">
                  {interimTranscript ? 'Transcribiendo...' : 'Escuchando...'}
                </span>
                {interimTranscript && (
                  <span className="text-sm text-gray-400 truncate max-w-[200px] sm:max-w-xs" title={interimTranscript}>
                    «{interimTranscript}»
                  </span>
                )}
              </div>
            )}

            {/* Área de texto */}
            <div
              className={`relative mb-6 transition-all duration-300 rounded-xl ${
                isListening ? 'ring-2 ring-emerald-200 ring-offset-2 ring-offset-white' : ''
              }`}
            >
              <textarea
                ref={textareaRef}
                value={textoVisible}
                onChange={(e) => {
                  const v = e.target.value;
                  setContenido(v);
                  setInterimTranscript('');
                  interimRef.current = '';
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder={SpeechRecognitionAPI ? 'Escribe o pulsa el micrófono para dictar... (Ctrl+M)' : 'Comienza a escribir tu nota...'}
                className="w-full min-h-[200px] sm:min-h-[280px] lg:min-h-[340px] p-0 border-none outline-none resize-none text-black placeholder-gray-400 bg-transparent text-base sm:text-lg leading-relaxed focus:outline-none rounded-xl"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.125rem', lineHeight: '2rem' }}
              />
            </div>

            {/* Footer con atajos y botones */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 sm:pt-6 border-t-2 border-gray-100">
              {/* Atajos de teclado */}
              <div className="hidden sm:flex items-center gap-3 flex-wrap">
                {[
                  { keys: ['Ctrl', 'Enter'], label: 'Guardar' },
                  { keys: ['Ctrl', 'M'], label: 'Micrófono' },
                  { keys: ['Esc'], label: 'Cancelar' },
                ].map(({ keys, label }, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <div className="w-px h-4 bg-gray-300" />}
                    <div className="flex items-center gap-1">
                      {keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <kbd className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-sm">{k}</kbd>
                          {ki < keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{label}</span>
                  </div>
                ))}
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
                  disabled={isSaving || !textoVisible.trim()}
                  className="flex-1 sm:flex-initial w-full sm:w-auto px-4 sm:px-8 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-manipulation"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

        {/* Indicador de ayuda */}
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
