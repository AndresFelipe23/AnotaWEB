import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import type { Tarea, CrearTareaRequest, ActualizarTareaRequest, GoogleTask } from '../types/api';
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

  // Google Tasks
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);

  useEffect(() => { cargarTareas(); }, []);

  // Manejar callback de Google OAuth
  useEffect(() => {
    const google = searchParams.get('google');
    const message = searchParams.get('message');
    if (google === 'success') {
      iziToast.success({ title: 'Google Tasks conectado', message: 'Tu cuenta de Google Tasks está conectada.', position: 'topRight' });
      setSearchParams({}, { replace: true });
      cargarGoogleStatus();
    } else if (google === 'error') {
      iziToast.error({ title: 'Error de Google', message: message || 'No se pudo conectar con Google Tasks.', position: 'topRight' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const cargarGoogleStatus = async () => {
    try {
      const { connected, email } = await apiService.getGoogleIntegrationStatus();
      setGoogleConnected(connected);
      setGoogleEmail(email ?? null);
      if (connected) cargarGoogleTasks();
    } catch {
      setGoogleConnected(false);
      setGoogleEmail(null);
    }
  };

  const cargarGoogleTasks = async () => {
    try {
      const tasks = await apiService.getGoogleTasks();
      setGoogleTasks(tasks);
      if (tasks.length === 0) {
        iziToast.info({ title: 'Google Tasks', message: 'No hay tareas en Google Tasks.', position: 'topRight', timeout: 3000 });
      }
    } catch (e: any) {
      console.error('Error cargando tareas de Google:', e);
      setGoogleTasks([]);
      iziToast.error({ 
        title: 'Error de Google Tasks', 
        message: e?.response?.data?.message || e?.message || 'No se pudieron cargar las tareas de Google', 
        position: 'topRight' 
      });
    }
  };

  useEffect(() => { cargarGoogleStatus(); }, []);

  const conectarGoogle = async () => {
    try {
      const { authUrl } = await apiService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (e: any) {
      iziToast.error({ title: 'Error', message: e?.response?.data?.message || 'No se pudo iniciar la conexión', position: 'topRight' });
    }
  };

  const desconectarGoogle = async () => {
    try {
      await apiService.disconnectGoogle();
      setGoogleConnected(false);
      setGoogleEmail(null);
      setGoogleTasks([]);
      iziToast.success({ title: 'Desconectado', message: 'Google Tasks desconectado.', position: 'topRight' });
    } catch (e: any) {
      iziToast.error({ title: 'Error', message: e?.response?.data?.message || 'No se pudo desconectar', position: 'topRight' });
    }
  };

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
      if (esTareaDeGoogle(id)) {
        // Extraer taskListId y taskId del ID compuesto: google-{taskListId}-{taskId}
        // El formato es: google-{taskListId}-{taskId}
        // Necesitamos encontrar el primer guion después de "google-" para separar taskListId y taskId
        const withoutPrefix = id.replace('google-', '');
        const firstDashIndex = withoutPrefix.indexOf('-');
        
        if (firstDashIndex === -1) {
          throw new Error('ID de tarea de Google inválido');
        }
        
        const taskListId = withoutPrefix.substring(0, firstDashIndex);
        const taskId = withoutPrefix.substring(firstDashIndex + 1);
        
        // Obtener el estado actual de la tarea
        const tarea = googleTasks.find(t => t.id === taskId && t.taskListId === taskListId);
        if (!tarea) {
          throw new Error('Tarea de Google no encontrada');
        }
        
        const nuevaCompletada = tarea.status !== 'completed';
        
        await apiService.completeGoogleTask(taskListId, taskId, nuevaCompletada);
        
        // Recargar tareas de Google y de Anota
        await cargarGoogleTasks();
        await cargarTareas();
      } else {
        await apiService.alternarEstadoTarea(id);
        await cargarTareas();
      }
      if (tareaEditando?.id === id) setTareaEditando(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'No se pudo actualizar';
      iziToast.error({ title: 'Error', message: msg, position: 'topRight' });
    } finally {
      setTareaAlternandoId(null);
    }
  };

  const handleAbrirEditar = (t: Tarea) => {
    const esGoogle = esTareaDeGoogle(t.id);
    if (esGoogle && t.estaCompletada) {
      iziToast.info({ 
        title: 'Tarea completada', 
        message: 'No se pueden editar tareas completadas.', 
        position: 'topRight',
        timeout: 2000
      });
      return;
    }
    setTareaEditando(t);
    setEditDescripcion(t.descripcion);
    setEditPrioridad(t.prioridad);
    setEditFechaVenc(t.fechaVencimiento ? t.fechaVencimiento.slice(0, 10) : '');
  };

  const handleGuardarEdicion = async () => {
    if (!tareaEditando || !editDescripcion.trim() || isGuardando) return;
    setIsGuardando(true);
    try {
      const esGoogle = esTareaDeGoogle(tareaEditando.id);
      
      if (esGoogle) {
        // Extraer taskListId y taskId del ID compuesto
        const withoutPrefix = tareaEditando.id.replace('google-', '');
        const firstDashIndex = withoutPrefix.indexOf('-');
        if (firstDashIndex === -1) {
          throw new Error('ID de tarea de Google inválido');
        }
        const taskListId = withoutPrefix.substring(0, firstDashIndex);
        const taskId = withoutPrefix.substring(firstDashIndex + 1);
        
        // Actualizar tarea de Google (solo título y fecha, sin prioridad)
        // Google Tasks espera fecha en formato YYYY-MM-DD o RFC3339
        const fechaParaGoogle = editFechaVenc || undefined;
        await apiService.updateGoogleTask(taskListId, taskId, editDescripcion.trim(), fechaParaGoogle);
        await cargarGoogleTasks();
      } else {
        // Actualizar tarea de Anota
        const data: ActualizarTareaRequest = {
          descripcion: editDescripcion.trim(),
          prioridad: editPrioridad,
          fechaVencimiento: fechaVencToApi(editFechaVenc),
        };
        await apiService.actualizarTarea(tareaEditando.id, data);
        await cargarTareas();
      }
      
      iziToast.success({ title: 'Guardada', message: 'Tarea actualizada', position: 'topRight' });
      setTareaEditando(null);
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
      const esGoogle = esTareaDeGoogle(id);
      
      if (esGoogle) {
        // Extraer taskListId y taskId del ID compuesto
        const withoutPrefix = id.replace('google-', '');
        const firstDashIndex = withoutPrefix.indexOf('-');
        if (firstDashIndex === -1) {
          throw new Error('ID de tarea de Google inválido');
        }
        const taskListId = withoutPrefix.substring(0, firstDashIndex);
        const taskId = withoutPrefix.substring(firstDashIndex + 1);
        
        await apiService.deleteGoogleTask(taskListId, taskId);
        await cargarGoogleTasks();
      } else {
        await apiService.eliminarTarea(id);
        await cargarTareas();
      }
      
      iziToast.success({ title: 'Eliminada', message: 'Tarea eliminada', position: 'topRight' });
      setShowDeleteConfirm(null);
      if (tareaEditando?.id === id) setTareaEditando(null);
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
  
  // Convertir tareas de Google a formato compatible con Tarea de Anota
  const convertirGoogleTaskATarea = (gt: GoogleTask): Tarea => ({
    id: `google-${gt.taskListId}-${gt.id}`,
    usuarioId: '',
    descripcion: gt.title,
    estaCompletada: gt.status === 'completed',
    prioridad: 2, // Prioridad media por defecto
    orden: 0,
    fechaVencimiento: gt.due,
    fechaCreacion: gt.completed || new Date().toISOString(),
    fechaCompletada: gt.completed,
    notaVinculadaId: undefined,
  });

  // Mezclar tareas de Anota con tareas de Google
  const tareasAnotaPendientes = pendientes;
  const tareasAnotaCompletadas = completadas;
  const tareasGooglePendientes = googleTasks
    .filter(gt => gt.status === 'needsAction')
    .map(convertirGoogleTaskATarea);
  const tareasGoogleCompletadas = googleTasks
    .filter(gt => gt.status === 'completed')
    .map(convertirGoogleTaskATarea);

  // Combinar listas
  const pendientesCombinadas = [...tareasAnotaPendientes, ...tareasGooglePendientes];
  const completadasCombinadas = [...tareasAnotaCompletadas, ...tareasGoogleCompletadas];
  
  const tareas = vista === 'pendientes' ? pendientesCombinadas : completadasCombinadas;
  const total = pendientesCombinadas.length + completadasCombinadas.length;
  const porcentaje = total > 0 ? Math.round((completadasCombinadas.length / total) * 100) : 0;

  // Agrupar pendientes por prioridad (solo de Anota para estadísticas)
  const altaPrioridad = tareasAnotaPendientes.filter(t => t.prioridad === 1);
  const mediaPrioridad = tareasAnotaPendientes.filter(t => t.prioridad === 2);
  const bajaPrioridad = tareasAnotaPendientes.filter(t => t.prioridad === 3);
  
  // Función para verificar si una tarea es de Google
  const esTareaDeGoogle = (tareaId: string) => tareaId.startsWith('google-');

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
    const esGoogle = esTareaDeGoogle(t.id);

    return (
      <div
        key={t.id}
        className={`group relative rounded-xl border-l-[3px] transition-all duration-200 ${
          t.estaCompletada
            ? 'border-l-green-400 bg-gray-50/80'
            : `${pri.border} bg-white hover:shadow-md`
        } ${esGoogle ? 'ring-1 ring-blue-100' : ''}`}
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
            title={esGoogle ? 'Marcar como completada en Google Tasks' : undefined}
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
            {!isEditing && esGoogle && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.16h6.01c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Tasks
                </span>
              </div>
            )}
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
                  {!esTareaDeGoogle(tareaEditando.id) && PRIORIDADES.map((p) => (
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
                  {esTareaDeGoogle(tareaEditando.id) && (
                    <span className="text-xs text-gray-400 italic">Las tareas de Google no tienen prioridad</span>
                  )}
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
                  {t.notaVinculadaId && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                      Vinculada a:{' '}
                      <Link
                        to={`/notas?open=${t.notaVinculadaId}`}
                        className="text-indigo-600 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.tituloNotaVinculada || 'Nota'}
                      </Link>
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
                    {completadasCombinadas.length}/{total}
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

            {/* Google Tasks - Estado de conexión */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {googleConnected ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.16h6.01c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google Tasks conectado
                    </span>
                    {googleEmail && <span className="text-xs text-gray-500 truncate max-w-[140px]">{googleEmail}</span>}
                    {googleTasks.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {googleTasks.filter(t => t.status === 'needsAction').length} pendientes, {googleTasks.filter(t => t.status === 'completed').length} completadas
                      </span>
                    )}
                  </div>
                  <button
                    onClick={desconectarGoogle}
                    className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  onClick={conectarGoogle}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.18H12v4.16h6.01c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Conectar Google Tasks
                </button>
              )}
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
                  {pendientesCombinadas.length > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      vista === 'pendientes' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {pendientesCombinadas.length}
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
                  {completadasCombinadas.length > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      vista === 'completadas' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {completadasCombinadas.length}
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
