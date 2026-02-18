import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import iziToast from 'izitoast';

// Devuelve el offset del primer Cluster webm (ID = 0x1F43B675).
// Todo lo anterior es el init segment (header puro, sin audio).
function findWebmClusterOffset(buf: Uint8Array): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0x1F && buf[i + 1] === 0x43 && buf[i + 2] === 0xB6 && buf[i + 3] === 0x75) {
      return i;
    }
  }
  return -1;
}

// Web Speech API - Chrome, Edge, Safari
const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

function buildNotaContenido(texto: string): string {
  const parrafos = texto
    .split(/\n+/)
    .filter((p) => p.trim().length > 0)
    .map((p) => ({ type: 'paragraph', data: { text: p.trim() } }));
  if (parrafos.length === 0) {
    parrafos.push({ type: 'paragraph', data: { text: ' ' } });
  }
  return JSON.stringify({ blocks: parrafos });
}

type ModoTranscripcion = 'microfono' | 'pestana';

export const MeetingTranscriberPage = () => {
  const [modo, setModo] = useState<ModoTranscripcion>('microfono');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [tituloNota, setTituloNota] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [supported, setSupported] = useState(false);
  const [errorPestana, setErrorPestana] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const manualStopRef = useRef(false);
  const tabCaptureRef = useRef<{ stream: MediaStream; recorder: MediaRecorder } | null>(null);
  const initChunkRef = useRef<Blob | null>(null);
  const firstClusterRef = useRef<Blob | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const wordCount = (transcript + ' ' + interimTranscript).trim().split(/\s+/).filter(Boolean).length;
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!isListening) { setRecordingTime(0); return; }
    const id = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isListening]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript]);

  useEffect(() => {
    setSupported(!!SpeechRecognition);
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let final = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? '';
      if (result.isFinal) {
        final += text;
      } else {
        interim += text;
      }
    }
    if (final) {
      setTranscript((prev) => (prev ? `${prev} ${final}` : final).trim());
      setInterimTranscript('');
    } else if (interim) {
      setInterimTranscript(interim);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    manualStopRef.current = false;
    try {
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CO';
      (recognition as unknown as { onresult: (e: SpeechRecognitionEvent) => void }).onresult = handleResult;
      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error !== 'aborted' && e.error !== 'no-speech') {
          console.error('SpeechRecognition error:', e.error);
          iziToast.warning({ title: 'Error de voz', message: e.message ?? e.error });
        }
      };
      recognition.onend = () => {
        if (!manualStopRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // ya detenido
          }
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      iziToast.info({ title: 'Escuchando', message: 'Habla para transcribir. Pulsa detener cuando termines.' });
    } catch (err) {
      console.error(err);
      iziToast.error({ title: 'Error', message: 'No se pudo iniciar el reconocimiento de voz' });
    }
  }, [handleResult]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (tabCaptureRef.current) {
      tabCaptureRef.current.recorder.stop();
      tabCaptureRef.current.stream.getTracks().forEach((t) => t.stop());
      // No nullamos aquí: onstop lo hace para que el último chunk se procese
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startCapturaPestana = useCallback(async () => {
    setErrorPestana(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        setErrorPestana('No se capturó audio. Marca "Compartir audio de la pestaña" al elegir la reunión.');
        return;
      }
      const audioOnlyStream = new MediaStream(audioTracks);
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'video/webm', 'video/webm;codecs=vp9'];
      const mimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) ?? undefined;
      const opts = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(audioOnlyStream, opts);
      const blobType = recorder.mimeType || 'audio/webm';

      const transcribirChunk = async (data: Blob) => {
        if (data.size === 0) return;
        try {
          const { texto } = await apiService.transcribirAudio(new Blob([data], { type: blobType }));
          const t = texto?.trim() ?? '';
          if (t) {
            setTranscript((prev) => (prev ? `${prev} ${t}` : t).trim());
          }
        } catch (err: unknown) {
          const msg = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response
            ? (err.response as { data?: { message?: string } }).data?.message
            : null;
          setErrorPestana(msg || 'Error al transcribir. Revisa que la API de OpenAI esté configurada.');
        }
      };

      // Chunk 0 = [EBML header + Tracks] + [primer Cluster de audio].
      // NO transcribimos chunk 0 solo: Whisper alucina con silencio de inicio.
      // Guardamos el header (sin audio) y el primer cluster, y los unimos al chunk 1.
      recorder.ondataavailable = async (e) => {
        if (e.data.size === 0 || !tabCaptureRef.current) return;

        if (!initChunkRef.current) {
          const buf = new Uint8Array(await e.data.arrayBuffer());
          const clusterOffset = findWebmClusterOffset(buf);
          if (clusterOffset > 0) {
            initChunkRef.current = new Blob([buf.slice(0, clusterOffset)], { type: blobType });
            firstClusterRef.current = new Blob([buf.slice(clusterOffset)], { type: blobType });
          } else {
            // Fallback: no se encontró Cluster, guardar todo y esperar
            initChunkRef.current = e.data;
          }
          // No transcribir chunk 0: esperar al chunk 1 para combinarlo
          return;
        }

        // Chunk 1 en adelante: header + (primer cluster si aún no se usó) + nuevo audio
        const parts: BlobPart[] = [initChunkRef.current];
        if (firstClusterRef.current) {
          parts.push(firstClusterRef.current);
          firstClusterRef.current = null; // ya se incluyó una sola vez con chunk 1
        }
        parts.push(e.data);
        transcribirChunk(new Blob(parts, { type: blobType }));
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setErrorPestana('Error al grabar. Prueba otra pestaña o navegador.');
      };

      recorder.onstop = () => {
        tabCaptureRef.current = null;
        initChunkRef.current = null;
        firstClusterRef.current = null;
      };

      try {
        recorder.start(5000); // 5 s para menor latencia
      } catch (startErr) {
        stream.getTracks().forEach((t) => t.stop());
        setErrorPestana(
          'No se pudo iniciar la grabación. Prueba en Chrome o Edge, seleccionando "Pestaña" y marcando "Compartir audio".'
        );
        throw startErr;
      }
      tabCaptureRef.current = { stream, recorder };
      setIsListening(true);
      iziToast.info({
        title: 'Capturando pestaña',
        message: 'Elige la pestaña de la reunión y marca "Compartir audio". Transcripción cada ~5 s.',
      });
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        setErrorPestana('Permiso denegado. Debes seleccionar una pestaña.');
      } else {
        setErrorPestana((err as Error).message ?? 'No se pudo capturar la pestaña');
      }
      iziToast.error({ title: 'Error', message: 'No se pudo iniciar la captura' });
    }
  }, []);

  const handleGuardarNota = async () => {
    const texto = `${transcript}${interimTranscript ? ` ${interimTranscript}` : ''}`.trim();
    if (!texto) {
      iziToast.warning({ title: 'Sin contenido', message: 'No hay texto para guardar' });
      return;
    }
    setIsSaving(true);
    try {
      const titulo = tituloNota.trim() || `Transcripción ${new Date().toLocaleString('es-CO')}`;
      const contenidoBloques = buildNotaContenido(texto);
      const resumen = texto.slice(0, 200) + (texto.length > 200 ? '...' : '');
      const { id } = await apiService.crearNota({
        titulo,
        resumen,
        icono: '🎙️',
        contenidoBloques,
      });
      iziToast.success({ title: 'Guardado', message: 'Transcripción guardada como nota' });
      setTranscript('');
      setInterimTranscript('');
      setTituloNota('');
      window.location.href = `/notas?nota=${id}`;
    } catch (err) {
      iziToast.error({ title: 'Error', message: 'No se pudo guardar la nota' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLimpiar = () => {
    setTranscript('');
    setInterimTranscript('');
    setTituloNota('');
  };

  const handleCopiar = async () => {
    const texto = `${transcript}${interimTranscript ? ` ${interimTranscript}` : ''}`.trim();
    if (!texto) {
      iziToast.warning({ title: 'Sin contenido', message: 'No hay texto para copiar' });
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      iziToast.success({ title: 'Copiado', message: 'Transcripción copiada al portapapeles' });
    } catch {
      iziToast.error({ title: 'Error', message: 'No se pudo copiar al portapapeles' });
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col bg-gray-50/50">

        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">Herramientas</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                Transcripción de reuniones
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isListening && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {formatTime(recordingTime)}
                </span>
              )}
              {(transcript || interimTranscript) && !isListening && (
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 pb-safe">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* ── Selector de modo ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'microfono' as ModoTranscripcion,
                  label: 'Solo mi voz',
                  desc: 'Transcribe desde el micrófono en tiempo real',
                  badge: 'Tiempo real',
                  badgeColor: 'bg-blue-50 text-blue-600 border-blue-100',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 00-7-7V5a7 7 0 0114 0v6z" />
                    </svg>
                  ),
                  disabled: !supported,
                },
                {
                  id: 'pestana' as ModoTranscripcion,
                  label: 'Pestaña de reunión',
                  desc: 'Captura todas las voces de Meet, Zoom o Teams',
                  badge: 'Requiere OpenAI',
                  badgeColor: 'bg-violet-50 text-violet-600 border-violet-100',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  disabled: false,
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  disabled={isListening || m.disabled}
                  className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                    modo === m.id
                      ? 'border-gray-900 bg-gray-900 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      modo === m.id ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.icon}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      modo === m.id ? 'bg-white/10 text-white/80 border-white/20' : m.badgeColor
                    }`}>
                      {m.badge}
                    </span>
                  </div>
                  <p className={`mt-3 text-[13px] font-semibold ${modo === m.id ? 'text-white' : 'text-gray-900'}`}>
                    {m.label}
                  </p>
                  <p className={`mt-0.5 text-[11px] leading-relaxed ${modo === m.id ? 'text-white/60' : 'text-gray-400'}`}>
                    {m.desc}
                  </p>
                  {modo === m.id && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white/60" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Aviso navegador incompatible ── */}
            {!supported && modo === 'microfono' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Navegador no compatible</p>
                  <p className="text-xs text-amber-700 mt-0.5">El reconocimiento de voz requiere Chrome, Edge o Safari.</p>
                </div>
              </div>
            )}

            {/* ── Tarjeta principal ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Barra de controles */}
              <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-row flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
                {/* Botón circular de grabación */}
                <div className="relative flex-shrink-0">
                  {isListening && (
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                  )}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : modo === 'pestana' ? startCapturaPestana : startListening}
                    disabled={modo === 'microfono' && !supported}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-95 touch-manipulation ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-700 text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isListening ? (
                      /* Cuadrado de stop */
                      <span className="w-5 h-5 rounded-sm bg-white" />
                    ) : (
                      /* Mic / monitor según modo */
                      modo === 'pestana' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 00-7-7V5a7 7 0 0114 0v6z" />
                        </svg>
                      )
                    )}
                  </button>
                </div>

                {/* Estado */}
                <div className="flex-1 min-w-0 w-full sm:w-auto text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {isListening
                      ? modo === 'pestana' ? 'Capturando audio de la pestaña...' : 'Escuchando tu voz...'
                      : 'Listo para grabar'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isListening
                      ? modo === 'pestana'
                        ? 'La transcripción aparece cada ~5 s'
                        : 'La transcripción es en tiempo real'
                      : modo === 'pestana'
                        ? 'Pulsa para capturar la pestaña de reunión'
                        : 'Pulsa para iniciar y habla cerca del micrófono'}
                  </p>
                  {errorPestana && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                      </svg>
                      {errorPestana}
                    </p>
                  )}
                </div>

                {/* Ondas de audio animadas (solo mientras graba) */}
                {isListening && (
                  <div className="flex items-end gap-0.5 h-6 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-gray-300"
                        style={{
                          height: `${[40, 70, 100, 60, 30][i - 1]}%`,
                          animation: `pulse ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Título de la nota */}
              <div className="px-4 sm:px-5 pt-4 pb-2">
                <input
                  type="text"
                  value={tituloNota}
                  onChange={(e) => setTituloNota(e.target.value)}
                  placeholder="Título de la nota (opcional)"
                  className="w-full px-0 py-1 text-base font-semibold text-gray-900 placeholder-gray-300 border-0 border-b border-gray-100 focus:border-gray-300 focus:outline-none bg-transparent transition-colors"
                />
              </div>

              {/* Área de transcripción */}
              <div className="px-4 sm:px-5 py-3 min-h-52 sm:min-h-64 max-h-72 sm:max-h-[28rem] overflow-y-auto">
                {transcript || interimTranscript ? (
                  <p className="text-[15px] sm:text-base text-gray-800 leading-[1.65] whitespace-pre-wrap">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-400 italic">{interimTranscript}</span>
                    )}
                    <span ref={transcriptEndRef} />
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center select-none">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-4a7 7 0 00-7-7V5a7 7 0 0114 0v6z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">
                      {isListening ? 'Habla ahora…' : 'Pulsa el botón y empieza a hablar'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGuardarNota}
                  disabled={isSaving || (!transcript && !interimTranscript)}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation w-full sm:w-auto sm:flex-initial min-w-0"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span className="sm:hidden">{isSaving ? 'Guardando…' : 'Guardar'}</span>
                  <span className="hidden sm:inline">{isSaving ? 'Guardando…' : 'Guardar como nota'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopiar}
                  disabled={!transcript && !interimTranscript}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation flex-1 sm:flex-initial min-w-0"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={handleLimpiar}
                  disabled={!transcript && !interimTranscript}
                  className="px-4 py-2.5 sm:py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation flex-1 sm:flex-initial"
                >
                  Limpiar
                </button>
                {(transcript || interimTranscript) && (
                  <span className="w-full sm:w-auto sm:ml-auto text-[11px] text-gray-400 tabular-nums text-center sm:text-right order-last sm:order-none">
                    {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
                  </span>
                )}
              </div>
            </div>

            {/* ── Tips ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  icon: '🎙️',
                  title: 'Micrófono',
                  text: 'Solo tu voz. Sin internet adicional. Activa el permiso del micro en el navegador.',
                },
                {
                  icon: '🖥️',
                  title: 'Pestaña de reunión',
                  text: 'Selecciona la pestaña de Meet, Zoom o Teams y marca "Compartir audio del sistema".',
                },
                {
                  icon: '💾',
                  title: 'Guardar',
                  text: 'Al guardar, la transcripción se convierte en una nota editable en tu espacio.',
                },
              ].map((tip) => (
                <div key={tip.title} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <span className="text-xl">{tip.icon}</span>
                  <p className="text-[12px] font-semibold text-gray-900 mt-2">{tip.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};
