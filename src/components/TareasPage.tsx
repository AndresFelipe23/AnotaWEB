import { useState, useEffect, useRef } from 'react';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import type { Tarea, CrearTareaRequest, ActualizarTareaRequest } from '../types/api';
import iziToast from 'izitoast';

const PRIORIDADES = [
  { valor: 1, etiqueta: 'Alta', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', dot: 'bg-red-500', ring: 'ring-red-100' },
  { valor: 2, etiqueta: 'Media', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-400', dot: 'bg-amber-400', ring: 'ring-amber-100' },
  { valor: 3, etiqueta: 'Baja', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400', ring: 'ring-gray-100' },
];

export const TareasPage = () => {
  const [pendientes, setPendientes] = useState<Tarea[]>([]);
  const [completadas, setCompletadas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vista, setVista] = useState<'pendientes' | 'completadas'>('pendientes');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState(2);
  const [nuevaFechaVenc, setNuevaFechaVenc] = useState('');
  const [isCreando, setIsCreando] = useState(false);
  const [showCrear, setShowCrear] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrioridad, setEditPrioridad] = useState(2);
  const [editFechaVenc, setEditFechaVenc] = useState('');
  const [isGuardando, setIsGuardando] = useState(false);
  const [tareaAlternandoId, setTareaAlternandoId] = useState<string | null>(null);
  const [tareaEliminandoId, setTareaEliminandoId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargarTareas(); }, []);

  useEffect(() => {
    if (showCrear && inputRef.current) inputRef.current.focus();
  }, [showCrear]);

  const cargarTareas = async () => {
    try {
      setIsLoading(true);
      const pend = await apiService.obtenerTareasPendientes();
      setPendientes(pend);
      try {
        const compl = await apiService.obtenerTareasCompletadas();
        setCompletadas(compl);
      } catch (errCompl: any) {
        setCompletadas([]);
        if (errCompl?.response?.status === 500) {
          iziToast.warning({ title: 'Aviso', message: 'Tareas completadas no disponibles.', position: 'topRight' });
        }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudieron cargar las tareas';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setIsLoading(false);
    }
  };

  const fechaVencToApi = (soloFecha: string) => {
    if (!soloFecha) return undefined;
    return `${soloFecha}T23:59:59.000-05:00`;
  };

  const handleCrear = async () => {
    if (!nuevaDescripcion.trim() || isCreando) return;
    setIsCreando(true);
    try {
      const data: CrearTareaRequest = {
        descripcion: nuevaDescripcion.trim(),
        prioridad: nuevaPrioridad,
        fechaVencimiento: fechaVencToApi(nuevaFechaVenc),
      };
      await apiService.crearTarea(data);
      iziToast.success({ title: 'Creada', message: 'Tarea creada', position: 'topRight' });
      setNuevaDescripcion('');
      setNuevaPrioridad(2);
      setNuevaFechaVenc('');
      setShowCrear(false);
      await cargarTareas();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudo crear la tarea';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setIsCreando(false);
    }
  };

  const handleAlternar = async (id: string) => {
    if (tareaAlternandoId) return;
    setTareaAlternandoId(id);
    try {
      await apiService.alternarEstadoTarea(id);
      await cargarTareas();
      if (tareaEditando?.id === id) setTareaEditando(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudo actualizar';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setTareaAlternandoId(null);
    }
  };

  const handleAbrirEditar = (t: Tarea) => {
    setTareaEditando(t);
    setEditDescripcion(t.descripcion);
    setEditPrioridad(t.prioridad);
    setEditFechaVenc(t.fechaVencimiento ? t.fechaVencimiento.slice(0, 10) : '');
  };

  const handleGuardarEdicion = async () => {
    if (!tareaEditando || !editDescripcion.trim() || isGuardando) return;
    setIsGuardando(true);
    try {
      const data: ActualizarTareaRequest = {
        descripcion: editDescripcion.trim(),
        prioridad: editPrioridad,
        fechaVencimiento: fechaVencToApi(editFechaVenc),
      };
      await apiService.actualizarTarea(tareaEditando.id, data);
      iziToast.success({ title: 'Guardada', message: 'Tarea actualizada', position: 'topRight' });
      setTareaEditando(null);
      await cargarTareas();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudo guardar';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setIsGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (tareaEliminandoId) return;
    setTareaEliminandoId(id);
    try {
      await apiService.eliminarTarea(id);
      iziToast.success({ title: 'Eliminada', message: 'Tarea eliminada', position: 'topRight' });
      setShowDeleteConfirm(null);
      if (tareaEditando?.id === id) setTareaEditando(null);
      await cargarTareas();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudo eliminar';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setTareaEliminandoId(null);
    }
  };

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) {
      return `Hoy ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined });
  };

  const estaVencida = (fecha?: string) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date() && new Date(fecha).toDateString() !== new Date().toDateString();
  };

  const prioridadInfo = (p: number) => PRIORIDADES.find((x) => x.valor === p) || PRIORIDADES[1];
  const tareas = vista === 'pendientes' ? pendientes : completadas;
  const total = pendientes.length + completadas.length;
  const porcentaje = total > 0 ? Math.round((completadas.length / total) * 100) : 0;

  // Agrupar pendientes por prioridad
  const altaPrioridad = pendientes.filter(t => t.prioridad === 1);
  const mediaPrioridad = pendientes.filter(t => t.prioridad === 2);
  const bajaPrioridad = pendientes.filter(t => t.prioridad === 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/60">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando tareas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderTarea = (t: Tarea) => {
    const pri = prioridadInfo(t.prioridad);
    const isEditing = tareaEditando?.id === t.id;
    const isDeleting = showDeleteConfirm === t.id;
    const vencida = !t.estaCompletada && estaVencida(t.fechaVencimiento);

    return (
      <div
        key={t.id}
        className={`group relative rounded-xl border-l-[3px] transition-all duration-200 ${
          t.estaCompletada
            ? 'border-l-green-400 bg-gray-50/80'
            : `${pri.border} bg-white hover:shadow-md`
        }`}
      >
        <div className="flex items-start gap-3 px-3 sm:px-4 py-3">
          {/* Checkbox */}
          <button
            onClick={() => handleAlternar(t.id)}
            disabled={tareaAlternandoId === t.id}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 touch-manipulation ${
              t.estaCompletada
                ? 'bg-green-500 border-green-500'
                : `border-gray-300 hover:border-gray-500 ${pri.ring} hover:ring-2`
            } disabled:opacity-50`}
          >
            {t.estaCompletada ? (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : tareaAlternandoId === t.id ? (
              <svg className="w-3 h-3 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
          </button>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuardarEdicion()}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                  autoFocus
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => setEditPrioridad(p.valor)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        editPrioridad === p.valor
                          ? `${p.bg} ${p.color} ${p.border} ring-1 ${p.ring}`
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.etiqueta}
                    </button>
                  ))}
                  <input
                    type="date"
                    value={editFechaVenc}
                    onChange={(e) => setEditFechaVenc(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      onClick={() => setTareaEditando(null)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarEdicion}
                      disabled={isGuardando || !editDescripcion.trim()}
                      className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-gray-800 transition-colors touch-manipulation"
                    >
                      {isGuardando ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !t.estaCompletada && handleAbrirEditar(t)}
                className={!t.estaCompletada ? 'cursor-pointer touch-manipulation' : ''}
              >
                <p className={`text-sm leading-relaxed ${
                  t.estaCompletada
                    ? 'line-through text-gray-400'
                    : 'text-gray-800 font-medium'
                }`}>
                  {t.descripcion}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {!t.estaCompletada && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${pri.bg} ${pri.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                      {pri.etiqueta}
                    </span>
                  )}
                  {t.fechaVencimiento && (
                    <span className={`inline-flex items-center gap-1 text-[11px] ${
                      vencida ? 'text-red-600 font-semibold' : 'text-gray-400'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {vencida && 'Vencida: '}{formatFecha(t.fechaVencimiento)}
                    </span>
                  )}
                  {t.estaCompletada && t.fechaCompletada && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {formatFecha(t.fechaCompletada)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Acciones: siempre visibles en móvil (no hay hover), hover en desktop */}
          {!isEditing && (
            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
              {!t.estaCompletada && (
                <button
                  onClick={() => handleAbrirEditar(t)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors touch-manipulation"
                  title="Editar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {isDeleting ? (
                <div className="flex items-center gap-1 bg-red-50 rounded-lg px-1">
                  <button
                    onClick={() => handleEliminar(t.id)}
                    disabled={tareaEliminandoId === t.id}
                    className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 touch-manipulation"
                  >
                    {tareaEliminandoId === t.id ? '...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-800 touch-manipulation"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(t.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors touch-manipulation"
                  title="Eliminar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-gray-50/60">
        {/* Header con estadisticas */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-black" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
                  Tareas
                </h1>
                {total > 0 && (
                  <span className="text-xs font-semibold text-gray-400">
                    {completadas.length}/{total}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setShowCrear(!showCrear); setVista('pendientes'); }}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nueva tarea
              </button>
            </div>

            {/* Barra de progreso */}
            {total > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 tabular-nums w-10 text-right">{porcentaje}%</span>
              </div>
            )}

            {/* Tabs + stats compactos */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-3">
              <div className="flex rounded-xl bg-gray-100 p-0.5 w-full sm:w-auto">
                <button
                  onClick={() => setVista('pendientes')}
                  className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 touch-manipulation ${
                    vista === 'pendientes'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pendientes
                  {pendientes.length > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      vista === 'pendientes' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {pendientes.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setVista('completadas')}
                  className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 touch-manipulation ${
                    vista === 'completadas'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completadas
                  {completadas.length > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      vista === 'completadas' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {completadas.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Mini stats */}
              {vista === 'pendientes' && pendientes.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-400">
                  {altaPrioridad.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {altaPrioridad.length} alta
                    </span>
                  )}
                  {mediaPrioridad.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {mediaPrioridad.length} media
                    </span>
                  )}
                  {bajaPrioridad.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      {bajaPrioridad.length} baja
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto pb-safe">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Formulario nueva tarea */}
            {showCrear && vista === 'pendientes' && (
              <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
                  placeholder="Describe la tarea..."
                  className="w-full px-0 py-1 text-sm font-medium border-none focus:outline-none placeholder:text-gray-400 bg-transparent"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {PRIORIDADES.map((p) => (
                      <button
                        key={p.valor}
                        type="button"
                        onClick={() => setNuevaPrioridad(p.valor)}
                        className={`px-2.5 py-1.5 sm:py-1 text-xs font-semibold rounded-lg border transition-all touch-manipulation ${
                          nuevaPrioridad === p.valor
                            ? `${p.bg} ${p.color} ${p.border} ring-1 ${p.ring}`
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${p.dot}`} />
                        {p.etiqueta}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={nuevaFechaVenc}
                        onChange={(e) => setNuevaFechaVenc(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-black/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setShowCrear(false); setNuevaDescripcion(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCrear}
                      disabled={!nuevaDescripcion.trim() || isCreando}
                      className="px-4 py-1.5 bg-black text-white rounded-lg font-semibold text-xs hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 touch-manipulation"
                    >
                      {isCreando ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      Crear tarea
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de tareas */}
            {tareas.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-5 bg-gray-100 rounded-2xl flex items-center justify-center">
                  {vista === 'pendientes' ? (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {vista === 'pendientes' ? 'Todo al dia' : 'Sin tareas completadas'}
                </p>
                <p className="text-xs text-gray-400">
                  {vista === 'pendientes'
                    ? 'No tienes tareas pendientes. Crea una nueva para empezar.'
                    : 'Completa tareas pendientes para verlas aqui.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tareas.map(renderTarea)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
