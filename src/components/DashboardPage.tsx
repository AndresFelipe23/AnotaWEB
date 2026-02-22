import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
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

/* Colores solo visuales para tarjetas de notas recientes en el dashboard (no se guardan en BD) */
const DASHBOARD_NOTE_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

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

  /* ─── Datos para gráficos (Recharts) ─── */
  const chartNotasPorCarpeta = useMemo(() => {
    const items: { nombre: string; cantidad: number; color: string }[] = [];
    carpetas.forEach((c, i) => {
      const count = (notasPorCarpeta.get(c.id) || []).length;
      if (count > 0) items.push({ nombre: c.nombre, cantidad: count, color: getFolderColor(c, i) });
    });
    if (notasSinCarpeta.length > 0) items.push({ nombre: 'Sin carpeta', cantidad: notasSinCarpeta.length, color: '#9ca3af' });
    return items.sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);
  }, [carpetas, notasPorCarpeta, notasSinCarpeta.length]);

  const chartTareasPorPrioridad = useMemo(() => {
    const alta = tareasPendientes.filter((t) => t.prioridad === 1).length;
    const media = tareasPendientes.filter((t) => t.prioridad === 2).length;
    const baja = tareasPendientes.filter((t) => t.prioridad !== 1 && t.prioridad !== 2).length;
    return [
      { name: 'Alta', cantidad: alta, color: '#ef4444' },
      { name: 'Media', cantidad: media, color: '#f59e0b' },
      { name: 'Baja', cantidad: baja, color: '#6b7280' },
    ];
  }, [tareasPendientes]);

  const chartActividadNotas = useMemo(() => {
    const dias: { dia: string; notas: number }[] = [];
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = notas.filter((n) => (n.fechaActualizacion || '').slice(0, 10) === key).length;
      dias.push({
        dia: d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
        notas: count,
      });
    }
    return dias;
  }, [notas]);

  const chartTareasCompletadasPorDia = useMemo(() => {
    const dias: { dia: string; completadas: number }[] = [];
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = tareasCompletadas.filter(
        (t) => t.fechaCompletada && t.fechaCompletada.slice(0, 10) === key
      ).length;
      dias.push({
        dia: d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit' }),
        completadas: count,
      });
    }
    return dias;
  }, [tareasCompletadas]);

  const chartTareasPorVencimiento = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);
    let hoyCount = 0;
    let semanaCount = 0;
    let sinFecha = 0;
    let vencidas = 0;
    let despues = 0;
    tareasPendientes.forEach((t) => {
      if (!t.fechaVencimiento) {
        sinFecha++;
        return;
      }
      const v = new Date(t.fechaVencimiento);
      v.setHours(0, 0, 0, 0);
      if (v < hoy) vencidas++;
      else if (v.getTime() === hoy.getTime()) hoyCount++;
      else if (v <= finSemana) semanaCount++;
      else despues++;
    });
    return [
      { name: 'Vencidas', value: vencidas, color: '#ef4444' },
      { name: 'Hoy', value: hoyCount, color: '#f59e0b' },
      { name: 'Esta semana', value: semanaCount, color: '#3b82f6' },
      { name: 'Después', value: despues, color: '#8b5cf6' },
      { name: 'Sin fecha', value: sinFecha, color: '#9ca3af' },
    ].filter((x) => x.value > 0);
  }, [tareasPendientes]);

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
        <div className="flex-1 overflow-y-auto bg-white px-4 sm:px-6 pb-8 pb-safe">
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
                      className="group relative rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-default"
                      style={{
                        borderColor: color || '#E5E7EB',
                        background: color
                          ? `radial-gradient(circle at 0 0, ${color}22, transparent 55%), radial-gradient(circle at 100% 100%, ${color}11, #F9FAFB)`
                          : undefined,
                      }}
                    >
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
                          {color && (
                            <div
                              className="w-5 h-5 rounded-full shadow-sm border border-white/80"
                              style={{ backgroundColor: color }}
                            />
                          )}
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
                {notas.slice(0, 8).map((n, index) => {
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
                  const color = DASHBOARD_NOTE_COLORS[index % DASHBOARD_NOTE_COLORS.length];

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleOpenNota(n.id)}
                      className="group text-left rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col touch-manipulation active:scale-[0.98]"
                      style={{
                        borderColor: `${color}40`,
                        background: `radial-gradient(circle at 0 0, ${color}18, transparent 50%), radial-gradient(circle at 100% 100%, ${color}0c, #fff)`,
                      }}
                    >
                      {/* Header con icono */}
                      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/60 flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          {n.icono || '📝'}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 flex-shrink-0">{fechaStr}</span>
                      </div>

                      {/* Contenido */}
                      <div className="px-4 pb-4 flex-1 flex flex-col">
                        <p className="text-[13px] font-semibold text-gray-900 line-clamp-1 leading-tight">
                          {n.titulo || 'Sin título'}
                        </p>
                        {n.resumen ? (
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5 leading-relaxed flex-1">
                            {n.resumen}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic mt-1.5 flex-1">Sin descripción</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                          {n.carpetaId ? (
                            <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[120px]" style={{ backgroundColor: `${color}15` }}>
                              En carpeta
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}10` }}>
                              Sin carpeta
                            </span>
                          )}
                          <div className="flex-1" />
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                            title="Color de la tarjeta (solo vista)"
                          />
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

          {/* ═══ Gráficos ═══ */}
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Resumen visual</h2>
                <p className="text-[11px] text-gray-500">Gráficos de actividad y distribución</p>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                    <div className="h-4 w-24 bg-gray-200 rounded-lg ml-5 mt-5 animate-pulse" />
                    <div className="h-52 mt-4 bg-gray-100 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Notas por carpeta */}
                <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 opacity-80" />
                  <div className="pl-5 pr-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Notas por carpeta</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">Distribución en tus carpetas</p>
                  </div>
                  {chartNotasPorCarpeta.length === 0 ? (
                    <div className="px-4 pb-6 pt-2 flex flex-col items-center justify-center text-center min-h-[200px]">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">Sin datos aún</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Crea carpetas y añade notas</p>
                    </div>
                  ) : (
                    <div className="px-2 pb-4 pt-0">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartNotasPorCarpeta} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="nombre" width={88} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v: number) => [v, 'Notas']}
                            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                            labelStyle={{ fontWeight: 600 }}
                          />
                          <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} maxBarSize={28}>
                            {chartNotasPorCarpeta.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Tareas pendientes por prioridad */}
                <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-amber-500 opacity-80" />
                  <div className="pl-5 pr-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Tareas por prioridad</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">Pendientes: Alta, Media, Baja</p>
                  </div>
                  {tareasPendientes.length === 0 ? (
                    <div className="px-4 pb-6 pt-2 flex flex-col items-center justify-center text-center min-h-[200px]">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 012-2h2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">Sin tareas pendientes</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Las que añadas aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="px-2 pb-4 pt-0">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartTareasPorPrioridad} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v: number) => [v, 'Tareas']}
                            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            cursor={{ fill: 'rgba(244, 63, 94, 0.06)' }}
                          />
                          <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartTareasPorPrioridad.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Actividad de notas (últimos 7 días) */}
                <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-400 to-blue-600 opacity-80" />
                  <div className="pl-5 pr-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Notas actualizadas</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">Últimos 7 días</p>
                  </div>
                  <div className="px-2 pb-4 pt-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartActividadNotas} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                        <defs>
                          <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v: number) => [v, 'Notas']}
                          contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                        />
                        <Bar dataKey="notas" fill="url(#barGradientBlue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tareas completadas por día (últimos 7 días) */}
                <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-green-600 opacity-80" />
                  <div className="pl-5 pr-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Tareas completadas</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">Últimos 7 días</p>
                  </div>
                  <div className="px-2 pb-4 pt-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartTareasCompletadasPorDia} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                        <defs>
                          <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v: number) => [v, 'Completadas']}
                          contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                        />
                        <Bar dataKey="completadas" fill="url(#barGradientGreen)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tareas pendientes por vencimiento (dona) */}
                <div className="group relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md lg:col-span-2">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-purple-600 opacity-80" />
                  <div className="pl-5 pr-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Vencimiento de tareas</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">Pendientes por fecha de vencimiento</p>
                  </div>
                  {chartTareasPorVencimiento.length === 0 ? (
                    <div className="px-4 pb-6 pt-2 flex flex-col items-center justify-center text-center min-h-[220px]">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">Sin tareas con fecha</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Asigna fechas a tus tareas para ver la distribución</p>
                    </div>
                  ) : (
                    <div className="px-2 pb-4 pt-0">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={chartTareasPorVencimiento}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={64}
                            outerRadius={92}
                            paddingAngle={3}
                            label={({ name, value }) => (
                              <text fill="#374151" fontSize={11} fontWeight={600}>
                                {name}: {value}
                              </text>
                            )}
                          >
                            {chartTareasPorVencimiento.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number) => [v, 'Tareas']}
                            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          />
                          <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: 8 }} formatter={(value) => <span style={{ fontSize: 11, color: '#4b5563' }}>{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
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
