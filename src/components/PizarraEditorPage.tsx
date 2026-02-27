import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { apiService } from '../services/api';
import type { Pizarra } from '../types/api';
import { usePageHeader } from '../contexts/PageHeaderContext';
import iziToast from 'izitoast';
import { Excalidraw, MainMenu, languages } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// El tipo de la API imperativa se infiere del prop excalidrawAPI del componente
type ExcalidrawAPI = Parameters<NonNullable<ComponentProps<typeof Excalidraw>['excalidrawAPI']>>[0];

export const PizarraEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pizarra, setPizarra] = useState<Pizarra | null>(null);
  const [sceneJson, setSceneJson] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [langCode, setLangCode] = useState<string>(
    () => localStorage.getItem('anota_excalidraw_lang') ?? 'es'
  );
  const { setPageHeader } = usePageHeader();
  const navigate = useNavigate();

  // Clave de borrador local por pizarra
  const draftKey = id ? `anota_pizarra_draft_${id}` : null;

  useEffect(() => {
    const cargar = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await apiService.obtenerPizarraPorId(id);
        setPizarra(data);
        setTitulo(data.titulo);
        setDescripcion(data.descripcion || '');
        // Preferir borrador local (cambios no guardados) sobre datos del servidor
        const draft = draftKey ? localStorage.getItem(draftKey) : null;
        setSceneJson(draft ?? data.sceneJson ?? JSON.stringify({ elements: [], appState: {}, files: {} }));
        setPageHeader(data.titulo || 'Pizarra', null);
      } catch (error) {
        console.error('Error al cargar la pizarra', error);
        iziToast.error({ title: 'Error', message: 'No se pudo cargar la pizarra', position: 'topRight' });
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
    return () => setPageHeader(null);
  }, [id, setPageHeader]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-guardar borrador en localStorage ante cada cambio del canvas
  useEffect(() => {
    if (!draftKey || !sceneJson) return;
    localStorage.setItem(draftKey, sceneJson);
  }, [draftKey, sceneJson]);

  const handleGuardar = async (overrides?: { titulo?: string; descripcion?: string }) => {
    if (!pizarra || !id) return;
    const tituloFinal = overrides?.titulo ?? titulo;
    const descripcionFinal = overrides?.descripcion ?? descripcion;
    try {
      setIsSaving(true);
      await apiService.actualizarPizarra(id, {
        titulo: tituloFinal || 'Sin título',
        descripcion: descripcionFinal || undefined,
        sceneJson: sceneJson || JSON.stringify({ elements: [], appState: {}, files: {} }),
        notaId: pizarra.notaId ?? null,
        esArchivada: pizarra.esArchivada,
      });
      // Al guardar en el servidor el borrador local ya no es necesario
      if (draftKey) localStorage.removeItem(draftKey);
      iziToast.success({ title: 'Guardado', message: 'Pizarra actualizada', position: 'topRight' });
    } catch (error) {
      console.error('Error al guardar pizarra', error);
      iziToast.error({ title: 'Error', message: 'No se pudo guardar la pizarra', position: 'topRight' });
    } finally {
      setIsSaving(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEliminar = async () => {
    if (!id) return;
    try {
      await apiService.eliminarPizarra(id);
      iziToast.success({ title: 'Eliminada', message: 'La pizarra se eliminó correctamente', position: 'topRight' });
      navigate('/pizarras');
    } catch (error) {
      console.error('Error al eliminar pizarra', error);
      iziToast.error({ title: 'Error', message: 'No se pudo eliminar la pizarra', position: 'topRight' });
    }
  };

  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [draftTitulo, setDraftTitulo] = useState('');
  const [draftDescripcion, setDraftDescripcion] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPI | null>(null);
  // Cambiar este key fuerza el remount de Excalidraw con los nuevos initialData
  const [excalidrawKey, setExcalidrawKey] = useState(0);

  const initialData = useMemo(() => {
    try {
      const parsed = sceneJson ? JSON.parse(sceneJson) : {};
      const elements = parsed.elements ?? [];
      const files = parsed.files ?? {};
      const appStateBase = parsed.appState ?? {};
      return {
        elements,
        appState: {
          ...appStateBase,
          collaborators: new Map(),
        },
        files,
        // Centra la vista en los elementos al montar/reimportar
        scrollToContent: elements.length > 0,
      };
    } catch {
      return {
        elements: [],
        appState: { collaborators: new Map() },
        files: {},
      };
    }
  }, [sceneJson]);

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const elements = parsed.elements ?? [];
      const files = parsed.files ?? {};
      const appStateBase = parsed.appState ?? {};

      // Actualiza sceneJson → initialData se recalcula con los nuevos datos
      // Luego incrementa la key para que Excalidraw se remonte con esos initialData
      // (initialData incluye files y scrollToContent:true, que updateScene no soporta)
      setSceneJson(JSON.stringify({ elements, appState: appStateBase, files }));
      setExcalidrawKey(k => k + 1);

      iziToast.success({
        title: 'Importado',
        message: 'El archivo de pizarra se cargó correctamente.',
        position: 'topRight',
      });
    } catch (error) {
      console.error('Error al importar archivo de pizarra', error);
      iziToast.error({
        title: 'Error',
        message: 'No se pudo leer el archivo. Verifica que sea un JSON de Excalidraw.',
        position: 'topRight',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleExportFile = () => {
    try {
      const base = sceneJson ? JSON.parse(sceneJson) : initialData;
      const exportData = {
        type: 'excalidraw',
        version: 2,
        source: 'https://excalidraw.com',
        elements: base.elements ?? [],
        appState: base.appState ?? {},
        files: base.files ?? {},
      };
      const content = JSON.stringify(exportData);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo || 'pizarra'}.excalidraw`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar archivo de pizarra', error);
      iziToast.error({
        title: 'Error',
        message: 'No se pudo descargar el archivo.',
        position: 'topRight',
      });
    }
  };

  return (
    <Layout hideNavbar>
      <div className="w-full h-screen flex flex-col overflow-hidden bg-white">
        {isLoading || !pizarra ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            Cargando pizarra...
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden bg-gray-50">
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 border-t border-gray-200 bg-white overflow-hidden">
                  <Excalidraw
                    key={excalidrawKey}
                    excalidrawAPI={(api) => { excalidrawRef.current = api; }}
                    initialData={initialData}
                    langCode={langCode}
                    onChange={(elements, appState, files) => {
                      const { collaborators, ...restAppState } = appState as any;
                      setSceneJson(JSON.stringify({ elements, appState: restAppState, files }));
                    }}
                  >
                    <MainMenu>
                      <MainMenu.Item
                        onSelect={() => {
                          navigate('/pizarras');
                        }}
                      >
                        Volver a las pizarras
                      </MainMenu.Item>
                      <MainMenu.Separator />
                      <MainMenu.Group title="Preferencias">
                        <MainMenu.DefaultItems.ChangeCanvasBackground />
                        <MainMenu.DefaultItems.ToggleTheme />
                        <MainMenu.ItemCustom>
                          <div className="flex items-center justify-between gap-3 px-3 py-2 w-full">
                            <span className="text-sm">Idioma</span>
                            <select
                              value={langCode}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                setLangCode(e.target.value);
                                localStorage.setItem('anota_excalidraw_lang', e.target.value);
                              }}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                            >
                              {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                              ))}
                            </select>
                          </div>
                        </MainMenu.ItemCustom>
                      </MainMenu.Group>
                      <MainMenu.Separator />
                      <MainMenu.Item
                        onSelect={() => {
                          fileInputRef.current?.click();
                        }}
                      >
                        Importar archivo (.excalidraw/.json)
                      </MainMenu.Item>
                      <MainMenu.Item
                        onSelect={handleExportFile}
                      >
                        Descargar archivo (.excalidraw)
                      </MainMenu.Item>
                      <MainMenu.Item
                        onSelect={() => {
                          setDraftTitulo(titulo);
                          setDraftDescripcion(descripcion);
                          setIsMetaModalOpen(true);
                        }}
                      >
                        Nombre y descripción
                      </MainMenu.Item>
                      <MainMenu.Item
                        onSelect={() => {
                          if (!isSaving) {
                            void handleGuardar();
                          }
                        }}
                      >
                        {isSaving ? 'Guardando…' : 'Guardar pizarra'}
                      </MainMenu.Item>
                      <MainMenu.Separator />
                      <MainMenu.Item
                        onSelect={() => {
                          setShowDeleteConfirm(true);
                        }}
                      >
                        Eliminar pizarra
                      </MainMenu.Item>
                    </MainMenu>
                  </Excalidraw>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.excalidraw,application/json"
              className="hidden"
              onChange={handleImportFile}
            />

            {isMetaModalOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-[200]"
                  onClick={() => setIsMetaModalOpen(false)}
                  aria-hidden="true"
                />
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Nombre y descripción de la pizarra
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={draftTitulo}
                          onChange={(e) => setDraftTitulo(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                          placeholder="Título de la pizarra"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={draftDescripcion}
                          onChange={(e) => setDraftDescripcion(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                          placeholder="Descripción breve (opcional)..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsMetaModalOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setTitulo(draftTitulo);
                          setDescripcion(draftDescripcion);
                          setIsMetaModalOpen(false);
                          if (!isSaving) {
                            await handleGuardar({ titulo: draftTitulo, descripcion: draftDescripcion });
                          }
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-black rounded-xl hover:bg-gray-900"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {showDeleteConfirm && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 z-[200]"
                  onClick={() => setShowDeleteConfirm(false)}
                  aria-hidden="true"
                />
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Eliminar pizarra
                    </h2>
                    <p className="text-xs text-gray-600">
                      ¿Estás seguro de que quieres eliminar esta pizarra? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowDeleteConfirm(false);
                          await handleEliminar();
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

