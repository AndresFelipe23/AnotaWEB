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
    <div
      ref={containerRef}
      className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100"
      style={{ backgroundImage: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)' }}
    >
      <div className="w-full max-w-4xl flex flex-col" style={{ minHeight: 'min(calc(100vh - 6rem), 720px)' }}>
        {/* Card tipo glass + más ancha y alta */}
        <div
          className={`flex-1 flex flex-col rounded-[1.75rem] transition-all duration-300 overflow-hidden ${
            isFocused
              ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.25),0_25px_70px_-18px_rgba(99,102,241,0.2)]'
              : 'shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_48px_-16px_rgba(0,0,0,0.14)]'
          }`}
        >
          <div className="flex-1 flex flex-col min-h-0 bg-white/90 backdrop-blur-xl border border-white/70">
            {/* Barra superior: título + controles */}
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-b border-slate-200/80">
              <span className="text-sm font-semibold text-slate-500">Notas Rápidas</span>
              <div className="flex items-center gap-2">
                {isListening && (
                  <span className="text-xs font-mono tabular-nums text-indigo-600 font-medium">{formatTime(listenSeconds)}</span>
                )}
                {textoVisible && !isListening && (
                  <span className="text-xs text-slate-400">{textoVisible.length}</span>
                )}
                {isListening && canUndo && (
                  <button
                    type="button"
                    onClick={undoLastSentence}
                    title="Deshacer (Ctrl+Z)"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleDictado}
                  disabled={!SpeechRecognitionAPI}
                  title={SpeechRecognitionAPI ? (isListening ? 'Detener (Ctrl+M)' : 'Dictar (Ctrl+M)') : 'Dictado no disponible'}
                  className={`p-2.5 rounded-xl transition-all touch-manipulation ${
                    isListening
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {isListening ? (
                    <div className="flex items-end gap-0.5 h-4 w-5 justify-center">
                      {audioLevel.map((level, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white rounded-full transition-all duration-75 flex-1 min-h-1"
                          style={{ height: `${Math.max(20, level * 100)}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Estado dictado */}
            {isListening && (
              <div className="flex-shrink-0 flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-indigo-50/90 border-b border-indigo-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <span className="text-xs font-medium text-indigo-700">
                  {interimTranscript ? 'Transcribiendo...' : 'Escuchando...'}
                </span>
                {interimTranscript && (
                  <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-sm" title={interimTranscript}>
                    «{interimTranscript}»
                  </span>
                )}
              </div>
            )}

            {/* Área de texto: más altura y padding */}
            <div className={`flex-1 min-h-0 flex flex-col px-6 sm:px-8 py-5 sm:py-6 transition-all ${isListening ? 'ring-2 ring-indigo-100 ring-inset rounded-2xl' : ''}`}>
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
                placeholder={SpeechRecognitionAPI ? 'Escribe o dicta con el micrófono (Ctrl+M)' : '¿Qué tienes en mente?'}
                className="w-full flex-1 min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] p-0 border-none outline-none resize-none bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-base sm:text-lg lg:text-[1.125rem] leading-[1.85] sm:leading-[2]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {/* Footer: atajos + acciones */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 sm:px-8 py-4 bg-slate-50/90 border-t border-slate-200/80">
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500">⌘</kbd><kbd className="ml-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500">Enter</kbd> guardar</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500">⌘</kbd><kbd className="ml-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500">M</kbd> dictar</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-500">Esc</kbd> limpiar</span>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={limpiarCaja}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 rounded-xl transition-colors touch-manipulation"
                  disabled={isSaving}
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !textoVisible.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 touch-manipulation transition-all"
                >
                  {isSaving ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
