import { useEffect, useState, useRef } from 'react';
import { Layout } from './Layout';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import iziToast from 'izitoast';
import type { Nota, NotaResumen, ActualizarNotaRequest, CrearNotaRequest, CarpetaArbol, Etiqueta } from '../types/api';
import { BlockEditor, type BlockEditorRef } from './BlockEditor';
import { FormattingToolbar } from './FormattingToolbar';

const EMPTY_BLOCKS = JSON.stringify({
  blocks: [
    {
      type: 'paragraph',
      data: { text: '' },
    },
  ],
});

// Iconos/emojis disponibles para las notas (sin duplicados)
const ICONOS_NOTAS = [
  '📝', '📌', '💡', '📋', '📅', '📆', '⭐', '🌟', '✅', '❌',
  '🔖', '📎', '📁', '📂', '🗂️', '📇', '📊', '📈', '📉', '💼',
  '🎯', '🏷️', '🔔', '💭', '📖', '✏️', '🖊️', '📄', '💾', '🔒',
  '🔓', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🎨', '🎭',
  '🎪', '🎬', '🎤', '🎧', '🎵', '🎶', '📷', '📸', '🏠', '🏢',
  '🏫', '🚀', '⚡', '🔥', '💧', '🌱', '🌸', '🌻',
];

export const NotasPage = () => {
  const [notas, setNotas] = useState<NotaResumen[]>([]);
  const [notaSeleccionada, setNotaSeleccionada] = useState<Nota | null>(null);
  const [isLoadingLista, setIsLoadingLista] = useState(true);
  const [, setIsLoadingNota] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [icono, setIcono] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [contenidoBloques, setContenidoBloques] = useState<string>(EMPTY_BLOCKS);
  const [showArchivadasPanel, setShowArchivadasPanel] = useState(false);
  const [notasArchivadas, setNotasArchivadas] = useState<NotaResumen[]>([]);
  const [isLoadingArchivadas, setIsLoadingArchivadas] = useState(false);
  const [filtroFavoritas, setFiltroFavoritas] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notaAEliminarId, setNotaAEliminarId] = useState<string | null>(null);
  const [notaRestaurandoId, setNotaRestaurandoId] = useState<string | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaArbol[]>([]);
  const [showMoverCarpeta, setShowMoverCarpeta] = useState(false);
  const [showEtiquetasPicker, setShowEtiquetasPicker] = useState(false);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [nuevaEtiquetaNombre, setNuevaEtiquetaNombre] = useState('');
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState<Set<string>>(new Set(['sin-carpeta']));
  const [sidebarNotasColapsado, setSidebarNotasColapsado] = useState(false);
  const editorRef = useRef<BlockEditorRef>(null);
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').toLowerCase();
  const openId = searchParams.get('open');

  useEffect(() => {
    cargarCarpetas();
    cargarEtiquetas();
  }, []);

  const cargarEtiquetas = async () => {
    try {
      const data = await apiService.obtenerEtiquetas();
      setEtiquetas(data);
    } catch (error: any) {
      console.error('Error al cargar etiquetas:', error);
    }
  };

  useEffect(() => {
    cargarNotas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCarpetas = async () => {
    try {
      const data = await apiService.obtenerArbolCarpetas();
      setCarpetas(data);
    } catch (error: any) {
      console.error('Error al cargar carpetas:', error);
    }
  };

  const cargarNotas = async () => {
    try {
      setIsLoadingLista(true);
      const data = await apiService.obtenerNotas(undefined, true);
      const notasUnicas = Array.from(
        new Map(data.map(nota => [nota.id, nota])).values()
      ).sort((a, b) => {
        const fechaA = new Date(a.fechaActualizacion).getTime();
        const fechaB = new Date(b.fechaActualizacion).getTime();
        return fechaB - fechaA;
      });
      setNotas(notasUnicas);
    } catch (error: any) {
      console.error('Error al cargar notas:', error);
    } finally {
      setIsLoadingLista(false);
    }
  };

  const toggleSeccion = (id: string) => {
    setSeccionesExpandidas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const notasSinCarpeta = notas.filter(n => !n.carpetaId);
  const notasPorCarpeta = new Map<string, NotaResumen[]>();
  carpetas.forEach(c => {
    notasPorCarpeta.set(c.id, notas.filter(n => n.carpetaId === c.id));
  });

  const cargarNota = async (id: string) => {
    try {
      setIsLoadingNota(true);
      const nota = await apiService.obtenerNotaPorId(id);
      setNotaSeleccionada(nota);
      setTitulo(nota.titulo ?? '');
      setResumen(nota.resumen ?? '');
      setIcono(nota.icono ?? '');
      // Asegurar que siempre tenemos un JSON válido
      const contenido = nota.contenidoBloques && nota.contenidoBloques.trim() 
        ? nota.contenidoBloques 
        : EMPTY_BLOCKS;
      setContenidoBloques(contenido);
    } catch (error: any) {
      console.error('Error al cargar nota:', error);
    } finally {
      setIsLoadingNota(false);
    }
  };

  const handleSeleccionarNota = (id: string) => {
    // En móvil, colapsar el sidebar para que se vea el editor al abrir la nota
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarNotasColapsado(true);
    }
    cargarNota(id);
  };

  // Abrir nota directamente si viene desde el buscador global (query param open)
  useEffect(() => {
    if (openId) {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarNotasColapsado(true);
      }
      cargarNota(openId);
    }
  }, [openId]);

  const handleNuevaNota = async () => {
    try {
      setIsSaving(true);
      const payload: CrearNotaRequest = {
        titulo: 'Nueva nota',
        resumen: '',
        icono: '',
        contenidoBloques: EMPTY_BLOCKS,
        carpetaId: undefined,
      };
      const { id } = await apiService.crearNota(payload);
      await cargarNotas();
      await cargarNota(id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAsignarEtiquetas = async (notaId: string, etiquetaIds: string[]) => {
    try {
      await apiService.asignarEtiquetasANota(notaId, etiquetaIds);
      if (notaSeleccionada?.id === notaId) {
        const etiquetasActuales = etiquetas.filter(e => etiquetaIds.includes(e.id));
        setNotaSeleccionada({ ...notaSeleccionada, etiquetas: etiquetasActuales });
      }
      setShowEtiquetasPicker(false);
      iziToast.success({ title: 'Etiquetas actualizadas', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudieron actualizar las etiquetas', position: 'topRight' });
    }
  };

  const handleCrearEtiqueta = async () => {
    const nombre = nuevaEtiquetaNombre.trim();
    if (!nombre) return;
    try {
      setCreandoEtiqueta(true);
      const { id } = await apiService.crearEtiqueta({ nombre });
      const nueva: Etiqueta = { id, usuarioId: '', nombre, fechaCreacion: new Date().toISOString() };
      setEtiquetas(prev => [...prev, nueva]);
      setNuevaEtiquetaNombre('');
      if (notaSeleccionada) {
        const actuales = notaSeleccionada.etiquetas?.map(e => e.id) || [];
        await apiService.asignarEtiquetasANota(notaSeleccionada.id, [...actuales, id]);
        setNotaSeleccionada({ ...notaSeleccionada, etiquetas: [...(notaSeleccionada.etiquetas || []), nueva] });
      }
      iziToast.success({ title: 'Etiqueta creada', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo crear la etiqueta', position: 'topRight' });
    } finally {
      setCreandoEtiqueta(false);
    }
  };

  const handleEliminarEtiqueta = async (e: React.MouseEvent, etiquetaId: string) => {
    e.stopPropagation();
    try {
      await apiService.eliminarEtiqueta(etiquetaId);
      setEtiquetas(prev => prev.filter(ev => ev.id !== etiquetaId));
      if (notaSeleccionada?.etiquetas) {
        setNotaSeleccionada({
          ...notaSeleccionada,
          etiquetas: notaSeleccionada.etiquetas.filter(ev => ev.id !== etiquetaId),
        });
      }
      iziToast.success({ title: 'Etiqueta eliminada', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo eliminar la etiqueta', position: 'topRight' });
    }
  };

  const handleToggleEtiqueta = (etiquetaId: string) => {
    if (!notaSeleccionada) return;
    const actuales = notaSeleccionada.etiquetas?.map(e => e.id) || [];
    const tiene = actuales.includes(etiquetaId);
    const nuevas = tiene ? actuales.filter(id => id !== etiquetaId) : [...actuales, etiquetaId];
    handleAsignarEtiquetas(notaSeleccionada.id, nuevas);
  };

  const handleMoverNota = async (notaId: string, nuevaCarpetaId: string | null) => {
    try {
      await apiService.moverNota(notaId, { carpetaId: nuevaCarpetaId || undefined });
      if (notaSeleccionada?.id === notaId) {
        setNotaSeleccionada({ ...notaSeleccionada, carpetaId: nuevaCarpetaId || undefined });
      }
      await cargarNotas();
      setShowMoverCarpeta(false);
      iziToast.success({ title: 'Nota movida', message: 'La nota se movió correctamente', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo mover la nota', position: 'topRight' });
    }
  };

  const cargarNotasArchivadas = async () => {
    try {
      setIsLoadingArchivadas(true);
      const data = await apiService.obtenerNotasArchivadas();
      setNotasArchivadas(data);
    } catch (error: any) {
      console.error('Error al cargar notas archivadas:', error);
      iziToast.error({ title: 'Error', message: 'No se pudieron cargar las notas archivadas', position: 'topRight' });
    } finally {
      setIsLoadingArchivadas(false);
    }
  };

  const handleToggleArchivadasPanel = () => {
    const next = !showArchivadasPanel;
    setShowArchivadasPanel(next);
    if (next) cargarNotasArchivadas();
  };

  const handleArchivar = async (id: string) => {
    try {
      await apiService.archivarNota(id);
      if (notaSeleccionada?.id === id) {
        setNotaSeleccionada(null);
        setTitulo('');
        setResumen('');
        setIcono('');
        setContenidoBloques(EMPTY_BLOCKS);
      }
      await cargarNotas();
      if (showArchivadasPanel) await cargarNotasArchivadas();
      iziToast.success({ title: 'Archivada', message: 'La nota se archivó correctamente', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo archivar la nota', position: 'topRight' });
    }
  };

  const handleAlternarFavorito = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await apiService.alternarFavorito(id);
      await cargarNotas();
      if (notaSeleccionada?.id === id) {
        setNotaSeleccionada({ ...notaSeleccionada, esFavorita: !notaSeleccionada.esFavorita });
      }
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo actualizar el favorito', position: 'topRight' });
    }
  };

  const handleRecuperar = async (id: string) => {
    try {
      setNotaRestaurandoId(id);
      await apiService.recuperarNota(id);
      await cargarNotasArchivadas();
      await cargarNotas();
      iziToast.success({ title: 'Recuperada', message: 'La nota se recuperó correctamente', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo recuperar la nota', position: 'topRight' });
    } finally {
      setNotaRestaurandoId(null);
    }
  };

  const handleSolicitarEliminar = (id: string) => {
    setNotaAEliminarId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!notaAEliminarId) return;
    try {
      await apiService.eliminarNota(notaAEliminarId);
      if (notaSeleccionada?.id === notaAEliminarId) {
        setNotaSeleccionada(null);
        setTitulo('');
        setResumen('');
        setIcono('');
        setContenidoBloques(EMPTY_BLOCKS);
      }
      await cargarNotas();
      if (showArchivadasPanel) await cargarNotasArchivadas();
      setShowDeleteConfirm(false);
      setNotaAEliminarId(null);
      iziToast.success({ title: 'Eliminada', message: 'La nota se eliminó permanentemente', position: 'topRight' });
    } catch (error: any) {
      iziToast.error({ title: 'Error', message: 'No se pudo eliminar la nota', position: 'topRight' });
    }
  };

  const aplicarFiltro = (lista: NotaResumen[]) => {
    let resultado = filtroFavoritas ? lista.filter(n => n.esFavorita) : lista;
    if (searchTerm) {
      resultado = resultado.filter((n) => {
        const t = (n.titulo || '').toLowerCase();
        const r = (n.resumen || '').toLowerCase();
        return t.includes(searchTerm) || r.includes(searchTerm);
      });
    }
    return resultado;
  };
  const notasSinCarpetaVisibles = aplicarFiltro(notasSinCarpeta);

  const renderItemNota = (n: NotaResumen) => {
    const isActive = notaSeleccionada?.id === n.id;
    return (
      <div
        key={n.id}
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
          isActive ? 'bg-gray-100' : ''
        }`}
      >
        <div
          onClick={() => handleSeleccionarNota(n.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSeleccionarNota(n.id);
            }
          }}
          role="button"
          tabIndex={0}
          className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer touch-manipulation"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAlternarFavorito(e, n.id);
            }}
            className="shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
            title={n.esFavorita ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <svg
              className={`w-4 h-4 ${n.esFavorita ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
              fill={n.esFavorita ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          {n.icono && <span className="text-lg shrink-0">{n.icono}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-black truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
              {n.titulo || 'Sin título'}
            </p>
            {n.resumen && <p className="text-xs text-gray-500 truncate">{n.resumen}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleArchivar(n.id); }}
          className="shrink-0 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Archivar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>
      </div>
    );
  };

  const handleGuardar = async () => {
    if (!notaSeleccionada || !titulo.trim()) return;
    setIsSaving(true);
    try {
      // Obtener el contenido directamente del editor para asegurar que tenemos lo más reciente
      let contenidoFinal = contenidoBloques;
      if (editorRef.current) {
        const contenidoDelEditor = await editorRef.current.getContent();
        if (contenidoDelEditor) {
          contenidoFinal = contenidoDelEditor;
          // Actualizar el estado local también
          setContenidoBloques(contenidoDelEditor);
        }
      }
      
      // Asegurar que tenemos contenido válido
      if (!contenidoFinal || !contenidoFinal.trim()) {
        contenidoFinal = EMPTY_BLOCKS;
      }
      
      const payload: ActualizarNotaRequest = {
        titulo: titulo.trim(),
        resumen: resumen.trim() || undefined,
        icono: icono.trim() || undefined,
        contenidoBloques: contenidoFinal,
      };
      
      await apiService.actualizarNota(notaSeleccionada.id, payload);
      
      // Actualizar la nota seleccionada localmente sin recargar para evitar perder el contenido
      setNotaSeleccionada({
        ...notaSeleccionada,
        titulo: titulo.trim(),
        resumen: resumen.trim() || undefined,
        icono: icono.trim() || undefined,
        contenidoBloques: contenidoFinal,
        fechaActualizacion: new Date().toISOString(),
      });
      
      // Solo recargar la lista, no la nota completa para evitar reinicializar el editor
      await cargarNotas();
    } catch (error: any) {
      console.error('Error al guardar nota:', error);
      alert('Error al guardar la nota. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1
                className="text-xl sm:text-2xl font-semibold text-black"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
              >
                Notas
              </h1>
              {notas.length > 0 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                  {notas.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleToggleArchivadasPanel}
                className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 touch-manipulation ${
                  showArchivadasPanel ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archivadas
              </button>
              <button
                onClick={handleNuevaNota}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva nota
                </>
              )}
              </button>
            </div>
          </div>
        </div>

        {/* Layout 2 columnas */}
        <div className="flex-1 flex overflow-hidden bg-gray-50/60">
          {/* Lista de notas - Estilo Notion (colapsable) */}
          <aside
            className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-in-out shrink-0 overflow-hidden ${
              sidebarNotasColapsado ? 'w-0 min-w-0' : 'w-full lg:w-80'
            }`}
          >
            <div className="px-3 sm:px-4 py-3 border-b border-gray-100 space-y-2 flex-shrink-0">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFiltroFavoritas(false)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors touch-manipulation ${
                    !filtroFavoritas ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroFavoritas(true)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 touch-manipulation ${
                    filtroFavoritas ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Favoritas
                </button>
              </div>
              <input
                type="text"
                placeholder="Buscar nota..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/70"
              />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
              {isLoadingLista ? (
                <div className="p-4 text-xs text-gray-500">Cargando notas...</div>
              ) : (
                <>
                  {/* Sin carpeta - Primero */}
                  <div className="mb-1">
                    <button
                      type="button"
                      onClick={() => toggleSeccion('sin-carpeta')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform ${seccionesExpandidas.has('sin-carpeta') ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="shrink-0">📄</span>
                      <span className="truncate">Sin carpeta</span>
                      {notasSinCarpetaVisibles.length > 0 && (
                        <span className="ml-auto text-xs text-gray-400">{notasSinCarpetaVisibles.length}</span>
                      )}
                    </button>
                    {seccionesExpandidas.has('sin-carpeta') && (
                      <div className="pl-6 pr-2">
                        {notasSinCarpetaVisibles.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-400">Sin notas</p>
                        ) : (
                          notasSinCarpetaVisibles.map((n) => renderItemNota(n))
                        )}
                      </div>
                    )}
                  </div>
                  {/* Carpetas con sus notas */}
                  {carpetas.map((c) => {
                    const notasEnCarpeta = aplicarFiltro(notasPorCarpeta.get(c.id) || []);
                    return (
                      <div key={c.id} className="mb-1" style={{ paddingLeft: `${(c.nivel || 0) * 8}px` }}>
                        <button
                          type="button"
                          onClick={() => toggleSeccion(c.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 shrink-0 transition-transform ${seccionesExpandidas.has(c.id) ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="shrink-0">{c.icono || '📁'}</span>
                          <span className="truncate">{c.nombre}</span>
                          {notasEnCarpeta.length > 0 && (
                            <span className="ml-auto text-xs text-gray-400">{notasEnCarpeta.length}</span>
                          )}
                        </button>
                        {seccionesExpandidas.has(c.id) && (
                          <div className="pl-6 pr-2">
                            {notasEnCarpeta.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-gray-400">Sin notas</p>
                            ) : (
                              notasEnCarpeta.map((n) => renderItemNota(n))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {notas.length === 0 && !filtroFavoritas && (
                    <div className="p-6 text-xs text-gray-500">
                      Crea tu primera nota para empezar.
                    </div>
                  )}
                  {notas.length > 0 && notasSinCarpetaVisibles.length === 0 && carpetas.every(c => aplicarFiltro(notasPorCarpeta.get(c.id) || []).length === 0) && (
                    <div className="p-6 text-xs text-gray-500">
                      {filtroFavoritas ? 'No tienes notas favoritas.' : 'Crea tu primera nota para empezar.'}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Botón para recoger/expandir sidebar de notas */}
          <button
            type="button"
            onClick={() => setSidebarNotasColapsado(!sidebarNotasColapsado)}
            className="shrink-0 w-9 sm:w-8 h-12 flex items-center justify-center border-r border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors self-center rounded-r-lg shadow-sm -ml-px z-10 touch-manipulation"
            title={sidebarNotasColapsado ? 'Mostrar lista de notas' : 'Ocultar lista de notas'}
            aria-label={sidebarNotasColapsado ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${sidebarNotasColapsado ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Panel Archivadas (lateral derecho) */}
          {showArchivadasPanel && (
            <aside className="w-72 sm:w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-gray-800">Notas archivadas</h3>
                  <button
                    type="button"
                    onClick={() => setShowArchivadasPanel(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 touch-manipulation"
                    title="Cerrar"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {isLoadingArchivadas ? (
                  <div className="p-4 text-xs text-gray-500">Cargando...</div>
                ) : notasArchivadas.length === 0 ? (
                  <div className="p-6 text-xs text-gray-500 text-center">No hay notas archivadas.</div>
                ) : (
                  notasArchivadas.map((n) => (
                    <div
                      key={n.id}
                      className="group flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
                    >
                      {n.icono && <span className="text-lg shrink-0">{n.icono}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{n.titulo || 'Sin título'}</p>
                        {n.resumen && <p className="text-xs text-gray-500 truncate">{n.resumen}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleRecuperar(n.id)}
                          disabled={notaRestaurandoId === n.id}
                          className="p-2 rounded-lg hover:bg-green-100 text-green-600 disabled:opacity-50"
                          title="Recuperar"
                        >
                          {notaRestaurandoId === n.id ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSolicitarEliminar(n.id)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                          title="Eliminar permanentemente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}

          {/* Editor de nota */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {!notaSeleccionada ? (
              <div className="flex-1 flex items-center justify-center text-center px-4 sm:px-6 text-sm text-gray-500">
                Selecciona una nota de la lista o crea una nueva.
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Toolbar de formato - FIJA, no se mueve al hacer scroll */}
                <FormattingToolbar />

                {/* Área de contenido con scroll - prioriza máximo espacio */}
                <div className="flex-1 overflow-y-auto bg-white">
                  <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
                    {/* Título, resumen e icono - compactos en la zona de contenido */}
                    <div className="mb-0">
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-lg bg-white hover:bg-gray-50 transition-colors"
                            title="Elegir icono"
                          >
                            {icono || (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                            )}
                          </button>
                          {showIconPicker && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setShowIconPicker(false)} aria-hidden="true" />
                              <div className="absolute left-0 top-full mt-1 z-[110] p-3 bg-white border border-gray-200 rounded-xl shadow-lg w-64">
                                <p className="text-xs font-semibold text-gray-600 mb-2 px-1">Elegir icono</p>
                                <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto">
                                  <button type="button" onClick={() => { setIcono(''); setShowIconPicker(false); }} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg ${!icono ? 'bg-gray-200 ring-1 ring-black/20' : 'hover:bg-gray-100'}`} title="Sin icono">—</button>
                                  {ICONOS_NOTAS.map((emoji, idx) => (
                                    <button key={`icon-${idx}-${emoji}`} type="button" onClick={() => { setIcono(emoji); setShowIconPicker(false); }} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 ${icono === emoji ? 'bg-gray-200 ring-1 ring-black/20' : ''}`} title={emoji}>{emoji}</button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={titulo}
                              onChange={(e) => setTitulo(e.target.value)}
                              placeholder="Título de la nota"
                              className="flex-1 px-0 py-1 text-lg sm:text-xl font-bold border-none focus:outline-none bg-transparent placeholder:text-gray-400 min-w-0"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            />
                            <button
                              type="button"
                              onClick={(e) => notaSeleccionada && handleAlternarFavorito(e, notaSeleccionada.id)}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100"
                              title={notaSeleccionada?.esFavorita ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            >
                              <svg className={`w-5 h-5 ${notaSeleccionada?.esFavorita ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} fill={notaSeleccionada?.esFavorita ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                          </div>
                          <textarea
                            value={resumen}
                            onChange={(e) => setResumen(e.target.value)}
                            placeholder="Descripción breve de la nota para encontrarla rápido..."
                            className="w-full mt-2 px-0 py-1 text-sm text-gray-600 border-none resize-none focus:outline-none bg-transparent placeholder:text-gray-400 leading-relaxed block"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Editor - contenido principal, máximo espacio */}
                    <div className="min-h-[50vh] mt-0">
                      <BlockEditor
                        ref={editorRef}
                        key={notaSeleccionada.id}
                        notaId={notaSeleccionada.id}
                        value={contenidoBloques}
                        onChange={setContenidoBloques}
                        hideToolbar
                      />
                    </div>
                  </div>
                </div>

                {/* Footer compacto y fijo */}
                <div className="flex-shrink-0 px-4 sm:px-6 lg:px-12 py-2.5 border-t border-gray-100 bg-white">
                  <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {notaSeleccionada.etiquetas && notaSeleccionada.etiquetas.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {notaSeleccionada.etiquetas.map((e) => (
                            <span
                              key={e.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border border-gray-200"
                              style={{ backgroundColor: e.colorHex ? `${e.colorHex}20` : '#f3f4f6', borderColor: e.colorHex || '#e5e7eb' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.colorHex || '#9ca3af' }} />
                              {e.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(notaSeleccionada.fechaActualizacion).toLocaleString('es-ES')}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowMoverCarpeta(!showMoverCarpeta)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                          title="Mover a carpeta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="text-xs hidden sm:inline">Mover</span>
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setShowMoverCarpeta(false); setShowEtiquetasPicker(!showEtiquetasPicker); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                            title="Etiquetas"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="text-xs hidden sm:inline">Etiquetas</span>
                            {(notaSeleccionada.etiquetas?.length ?? 0) > 0 && (
                              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 rounded-full">
                                {notaSeleccionada.etiquetas!.length}
                              </span>
                            )}
                          </button>
                          {showEtiquetasPicker && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setShowEtiquetasPicker(false)} aria-hidden="true" />
                              <div className="absolute left-0 bottom-full mb-1 z-[110] py-2 px-2 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] max-h-60 overflow-y-auto">
                                <p className="text-xs font-semibold text-gray-600 px-2 mb-2">Etiquetas</p>
                                {etiquetas.map((e) => {
                                    const seleccionada = notaSeleccionada.etiquetas?.some(ev => ev.id === e.id);
                                    return (
                                      <div
                                        key={e.id}
                                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${
                                          seleccionada ? 'bg-gray-100' : ''
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleToggleEtiqueta(e.id)}
                                          className="flex-1 flex items-center gap-2 min-w-0 text-left"
                                        >
                                          <span
                                            className="w-3 h-3 rounded-full shrink-0 border border-gray-300"
                                            style={{ backgroundColor: e.colorHex || '#e5e7eb' }}
                                          />
                                          <span className="truncate font-medium">{e.nombre}</span>
                                          {seleccionada && (
                                            <svg className="w-4 h-4 text-green-600 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(ev) => handleEliminarEtiqueta(ev, e.id)}
                                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                          title="Eliminar etiqueta"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}
                                <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2 px-2">
                                  <input
                                    type="text"
                                    value={nuevaEtiquetaNombre}
                                    onChange={(e) => setNuevaEtiquetaNombre(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCrearEtiqueta()}
                                    placeholder="Nueva etiqueta..."
                                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleCrearEtiqueta}
                                    disabled={!nuevaEtiquetaNombre.trim() || creandoEtiqueta}
                                    className="px-3 py-1.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {creandoEtiqueta ? '...' : 'Crear'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {showMoverCarpeta && (
                          <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowMoverCarpeta(false)} aria-hidden="true" />
                            <div className="absolute left-0 bottom-full mb-1 z-[110] py-2 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px] max-h-60 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => handleMoverNota(notaSeleccionada.id, null)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                                  !notaSeleccionada.carpetaId ? 'bg-gray-100 font-medium' : ''
                                }`}
                              >
                                <span>📋</span> Sin carpeta
                              </button>
                              {carpetas.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleMoverNota(notaSeleccionada.id, c.id)}
                                  style={{ paddingLeft: `${16 + (c.nivel || 0) * 12}px` }}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 truncate ${
                                    notaSeleccionada.carpetaId === c.id ? 'bg-gray-100 font-medium' : ''
                                  }`}
                                >
                                  <span className="shrink-0">{c.icono || '📁'}</span>
                                  <span className="truncate">{c.nombre}</span>
                                </button>
                              ))}
                              {carpetas.length === 0 && (
                                <p className="px-4 py-2 text-xs text-gray-500">Crea carpetas en la sección Carpetas</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleArchivar(notaSeleccionada.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Archivar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSolicitarEliminar(notaSeleccionada.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Eliminar permanentemente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleGuardar}
                      disabled={isSaving || !titulo.trim()}
                      className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                    >
                      {isSaving ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Modal confirmar eliminar */}
        {showDeleteConfirm && (
          <>
            <div className="fixed inset-0 bg-black/40 z-[200]" onClick={() => setShowDeleteConfirm(false)} aria-hidden="true" />
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar nota</h3>
                <p className="text-sm text-gray-600 mb-6">
                  ¿Estás seguro? Esta acción no se puede deshacer y la nota se eliminará permanentemente.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setNotaAEliminarId(null); }}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 touch-manipulation"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarEliminar}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 touch-manipulation"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

