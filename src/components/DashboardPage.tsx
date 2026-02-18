import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import type { CarpetaArbol, NotaResumen, NotaRapida, Tarea } from '../types/api';

/* ─── Colores por defecto para carpetas sin color ─── */
const FOLDER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#e11d48',
];

const getFolderColor = (carpeta: CarpetaArbol, index: number) =>
  carpeta.colorHex || FOLDER_COLORS[index % FOLDER_COLORS.length];

/* ─── Componente de tarjeta carpeta con forma de folder ─── */
const FolderCard = ({
  color,
  nombre,
  ruta,
  notasCount,
  onClick,
  dashed,
}: {
  color: string;
  nombre: string;
  ruta: string;
  notasCount: number;
  onClick: () => void;
  dashed?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative text-left w-full transition-transform duration-200 hover:-translate-y-1 touch-manipulation active:scale-[0.98]"
  >
    {/* Tab de la carpeta */}
    <div
      className="relative h-[14px] w-[40%] max-w-[90px] ml-[2px] rounded-t-lg"
      style={{
        background: dashed
          ? 'repeating-linear-gradient(90deg, #d1d5db 0, #d1d5db 6px, transparent 6px, transparent 12px)'
          : `linear-gradient(135deg, ${color}, ${color}dd)`,
      }}
    >
      {/* Curvita interna derecha del tab */}
      <div
        className="absolute -right-[8px] bottom-0 w-[8px] h-[8px]"
        style={{
          background: `radial-gradient(circle at 0 0, transparent 8px, ${dashed ? '#f9fafb' : color + '12'} 8px)`,
        }}
      />
    </div>

    {/* Cuerpo de la carpeta */}
    <div
      className={`relative rounded-2xl rounded-tl-none px-4 py-4 border-2 transition-all duration-200 ${
        dashed
          ? 'border-dashed border-gray-300 bg-gray-50/60 group-hover:border-gray-400 group-hover:bg-gray-50'
          : 'group-hover:shadow-lg'
      }`}
      style={
        dashed
          ? {}
          : {
              borderColor: `${color}40`,
              backgroundColor: `${color}08`,
            }
      }
    >
      {/* Efecto de brillo sutil en hover */}
      {!dashed && (
        <div
          className="absolute inset-0 rounded-2xl rounded-tl-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
            {nombre}
          </p>
          <p className="text-[11px] text-gray-400 truncate mt-1">{ruta}</p>
        </div>
        <div
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
          style={
            dashed
              ? { backgroundColor: '#f3f4f6', color: '#6b7280' }
              : { backgroundColor: `${color}18`, color }
          }
        >
          {notasCount}
        </div>
      </div>

      {/* Barra inferior decorativa */}
      {!dashed && (
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className="h-[3px] rounded-full flex-1 opacity-30"
            style={{ backgroundColor: color }}
          />
          <div
            className="h-[3px] rounded-full w-8 opacity-20"
            style={{ backgroundColor: color }}
          />
          <div
            className="h-[3px] rounded-full w-4 opacity-10"
            style={{ backgroundColor: color }}
          />
        </div>
      )}
    </div>
  </button>
);

/* ─── Dashboard principal ─── */
export const DashboardPage = () => {
  const [carpetas, setCarpetas] = useState<CarpetaArbol[]>([]);
  const [notas, setNotas] = useState<NotaResumen[]>([]);
  const [notasRapidas, setNotasRapidas] = useState<NotaRapida[]>([]);
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [tareasCompletadas, setTareasCompletadas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<CarpetaArbol | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true);
        const [carpetasData, notasData, notasRapidasData, tareasPend, tareasComp] =
          await Promise.all([
            apiService.obtenerArbolCarpetas(),
            apiService.obtenerNotas(undefined, true),
            apiService.obtenerNotasRapidas(),
            apiService.obtenerTareasPendientes(),
            apiService.obtenerTareasCompletadas().catch(() => [] as Tarea[]),
          ]);

        setCarpetas(carpetasData);
        setNotas(notasData);
        setNotasRapidas(notasRapidasData);
        setTareasPendientes(tareasPend);
        setTareasCompletadas(tareasComp);
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
  }, []);

  const notasPorCarpeta = useMemo(() => {
    const map = new Map<string | 'sin-carpeta', NotaResumen[]>();
    notas.forEach((n) => {
      const key = n.carpetaId || 'sin-carpeta';
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    });
    return map;
  }, [notas]);

  const notasSinCarpeta = notasPorCarpeta.get('sin-carpeta') || [];

  const totalTareas = tareasPendientes.length + tareasCompletadas.length;
  const porcentajeCompletadas =
    totalTareas > 0 ? Math.round((tareasCompletadas.length / totalTareas) * 100) : 0;

  const handleOpenNota = (id: string) => navigate(`/notas?open=${id}`);

  const handleOpenNotasDeCarpeta = (carpeta: CarpetaArbol | null) => {
    setCarpetaSeleccionada(carpeta);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  /* ─── Hora del día para saludo ─── */
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* ─── Header ─── */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">
                {saludo}
              </p>
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-900"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}
              >
                Resumen general
              </h1>
            </div>

            {/* Stats compactos */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: notas.length, label: 'Notas', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
                { value: notasRapidas.length, label: 'Rápidas', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
                { value: tareasPendientes.length, label: 'Pendientes', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${s.bg} ${s.border} border rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5`}
                >
                  <span className={`text-base font-bold ${s.text}`}>{s.value}</span>
                  <span className="text-[11px] text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Contenido scrollable ─── */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 px-4 sm:px-6 pb-8 pb-safe">
          {/* ═══ Carpetas ═══ */}
          <section className="mt-4 sm:mt-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Carpetas</h2>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {carpetas.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/notas')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors touch-manipulation text-left sm:text-right"
              >
                Gestionar carpetas →
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-0">
                    <div className="h-[14px] w-20 ml-[2px] rounded-t-lg bg-gray-200 animate-pulse" />
                    <div className="h-24 bg-gray-100 rounded-2xl rounded-tl-none border-2 border-gray-200 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : carpetas.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No tienes carpetas aún.</p>
                <p className="text-xs text-gray-400 mt-1">Crea una carpeta desde la vista de notas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {carpetas.map((c, i) => {
                  const notasEnCarpeta = notasPorCarpeta.get(c.id) || [];
                  return (
                    <FolderCard
                      key={c.id}
                      color={getFolderColor(c, i)}
                      nombre={c.nombre}
                      ruta={c.rutaString}
                      notasCount={notasEnCarpeta.length}
                      onClick={() => handleOpenNotasDeCarpeta(c)}
                    />
                  );
                })}

                {/* Sin carpeta */}
                <FolderCard
                  color="#9ca3af"
                  nombre="Sin carpeta"
                  ruta="Notas sin carpeta asignada"
                  notasCount={notasSinCarpeta.length}
                  onClick={() => handleOpenNotasDeCarpeta(null)}
                  dashed
                />
              </div>
            )}
          </section>

          {/* ═══ Notas rápidas ═══ */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Notas rápidas</h2>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  {notasRapidas.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/notas-rapidas')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors touch-manipulation text-left sm:text-right"
              >
                Ver todas →
              </button>
            </div>

            {notasRapidas.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 mb-3">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Aún no tienes notas rápidas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notasRapidas.slice(0, 6).map((n, i) => {
                  const noteColors = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#06b6d4'];
                  const color = (n as any).colorHex || noteColors[i % noteColors.length];
                  return (
                    <div
                      key={n.id}
                      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-default"
                    >
                      {/* Barra superior de color */}
                      <div className="h-1 w-full" style={{ backgroundColor: color }} />

                      <div className="px-4 py-3.5">
                        <p className="text-[13px] text-gray-700 line-clamp-3 leading-relaxed">
                          {n.contenido || 'Sin contenido'}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(n.fechaActualizacion || n.fechaCreacion).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <div
                            className="w-5 h-5 rounded-full opacity-20"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ═══ Notas recientes ═══ */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Notas recientes</h2>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {notas.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/notas')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors touch-manipulation text-left sm:text-right"
              >
                Ver todas →
              </button>
            </div>

            {notas.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Aún no tienes notas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {notas.slice(0, 8).map((n) => {
                  const fecha = new Date(n.fechaActualizacion);
                  const hoy = new Date();
                  const esHoy = fecha.toDateString() === hoy.toDateString();
                  const ayer = new Date(hoy);
                  ayer.setDate(ayer.getDate() - 1);
                  const esAyer = fecha.toDateString() === ayer.toDateString();
                  const fechaStr = esHoy
                    ? `Hoy, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                    : esAyer
                      ? `Ayer, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                      : fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleOpenNota(n.id)}
                      className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col touch-manipulation active:scale-[0.98]"
                    >
                      {/* Header con icono */}
                      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200">
                          {n.icono || '📝'}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 flex-shrink-0">{fechaStr}</span>
                      </div>

                      {/* Contenido */}
                      <div className="px-4 pb-4 flex-1 flex flex-col">
                        <p className="text-[13px] font-semibold text-gray-900 line-clamp-1 leading-tight">
                          {n.titulo || 'Sin título'}
                        </p>
                        {n.resumen ? (
                          <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed flex-1">
                            {n.resumen}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-300 italic mt-1.5 flex-1">Sin descripción</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-50">
                          {n.carpetaId ? (
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                              En carpeta
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">
                              Sin carpeta
                            </span>
                          )}
                          <div className="flex-1" />
                          <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ═══ Tareas ═══ */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Tareas</h2>
                {totalTareas > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    {porcentajeCompletadas}% completado
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/tareas')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors touch-manipulation text-left sm:text-right"
              >
                Ir a tareas →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Indicador circular de progreso + stats */}
              <div className="md:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
                {/* Anillo de progreso SVG */}
                <div className="relative w-28 h-28 mb-3">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - porcentajeCompletadas / 100)}`}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{porcentajeCompletadas}%</span>
                    <span className="text-[10px] text-gray-400">completado</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{tareasPendientes.length}</p>
                    <p className="text-[10px] text-rose-500 font-medium">Pendientes</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{tareasCompletadas.length}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Completadas</p>
                  </div>
                </div>
              </div>

              {/* Lista de tareas pendientes */}
              <div className="md:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-gray-900">Pendientes</p>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                    {tareasPendientes.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-52">
                  {tareasPendientes.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-gray-400">Sin tareas pendientes</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {tareasPendientes.slice(0, 5).map((t) => {
                        const prioridadColor =
                          t.prioridad === 1 ? '#ef4444' :
                          t.prioridad === 2 ? '#f59e0b' : '#6b7280';
                        return (
                          <div
                            key={t.id}
                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: prioridadColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-gray-800 truncate">{t.descripcion}</p>
                              {t.fechaVencimiento && (
                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(t.fechaVencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Card motivacional */}
              <div className="md:col-span-3 relative rounded-2xl shadow-sm p-5 text-white flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Patrón decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07]">
                  <svg viewBox="0 0 100 100" fill="none">
                    <circle cx="80" cy="20" r="40" stroke="white" strokeWidth="0.5" />
                    <circle cx="80" cy="20" r="25" stroke="white" strokeWidth="0.5" />
                    <circle cx="80" cy="20" r="10" stroke="white" strokeWidth="0.5" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 opacity-[0.05]">
                  <svg viewBox="0 0 100 100" fill="none">
                    <rect x="10" y="10" width="40" height="40" rx="8" stroke="white" strokeWidth="0.5" />
                    <rect x="30" y="30" width="40" height="40" rx="8" stroke="white" strokeWidth="0.5" />
                  </svg>
                </div>
                <div className="relative flex-1 flex flex-col">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-1.5">
                    Enfoque
                  </p>
                  <p className="text-sm font-semibold leading-snug">
                    Empieza por lo importante hoy.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed flex-1">
                    Prioriza, organiza y conecta tus tareas con notas.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/tareas')}
                    className="mt-3 self-start text-[11px] font-semibold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 touch-manipulation"
                  >
                    Ir a tareas
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ─── Modal notas por carpeta ─── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col animate-slideInRight mx-4 sm:mx-0">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Notas en carpeta
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {carpetaSeleccionada ? carpetaSeleccionada.nombre : 'Sin carpeta'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {(() => {
                  const notasModal = carpetaSeleccionada
                    ? notasPorCarpeta.get(carpetaSeleccionada.id) || []
                    : notasSinCarpeta;

                  if (notasModal.length === 0) {
                    return (
                      <div className="px-4 py-12 text-center">
                        <p className="text-sm text-gray-400">No hay notas en esta carpeta.</p>
                      </div>
                    );
                  }

                  return notasModal.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleOpenNota(n.id)}
                      className="w-full text-left px-5 py-3.5 hover:bg-gray-50/60 transition-colors flex items-center gap-3 touch-manipulation"
                    >
                      <span className="text-base flex-shrink-0">{n.icono || '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {n.titulo || 'Sin título'}
                        </p>
                        {n.resumen && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.resumen}</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ─── FAB global ─── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[60] pb-safe">
        {/* Backdrop */}
        {isFabOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setIsFabOpen(false)}
          />
        )}

        <div className="relative">
          {/* Opciones del FAB */}
          {[
            {
              label: 'Nueva nota rápida',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
              iconBg: 'bg-amber-500',
              route: '/',
              delay: '150ms',
            },
            {
              label: 'Nueva nota',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              iconBg: 'bg-blue-500',
              route: '/notas',
              delay: '75ms',
            },
            {
              label: 'Nueva tarea',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              iconBg: 'bg-emerald-500',
              route: '/tareas',
              delay: '0ms',
            },
            {
              label: 'Nueva transcripción',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v7m0-9a7 7 0 0114 0z" />
                </svg>
              ),
              iconBg: 'bg-violet-500',
              route: '/transcripcion-reunion',
              delay: '225ms',
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`absolute right-0 flex items-center gap-3 transition-all duration-300 ease-out ${
                isFabOpen
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75 pointer-events-none'
              }`}
              style={{
                bottom: `${(i + 1) * 56 + 8}px`,
                transitionDelay: isFabOpen ? item.delay : '0ms',
              }}
            >
              {/* Label */}
              <span className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium shadow-lg whitespace-nowrap">
                {item.label}
              </span>

              {/* Botón circular */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  navigate(item.route);
                }}
                className={`${item.iconBg} w-11 h-11 rounded-full text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation`}
              >
                {item.icon}
              </button>
            </div>
          ))}

          {/* Botón principal */}
          <button
            type="button"
            onClick={() => setIsFabOpen((prev) => !prev)}
            className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 focus:outline-none touch-manipulation ${
              isFabOpen
                ? 'bg-gray-900 rotate-45 shadow-2xl'
                : 'bg-black hover:shadow-2xl hover:scale-105'
            }`}
            aria-label="Acciones rápidas"
          >
            {/* Anillo de pulso */}
            {!isFabOpen && (
              <span className="absolute inset-0 rounded-full bg-black/30 animate-ping opacity-20" />
            )}
            <svg
              className="w-6 h-6 text-white transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </Layout>
  );
};
