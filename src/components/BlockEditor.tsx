import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react';

interface BlockEditorProps {
  value?: string;
  onChange: (data: string) => void;
  notaId?: string;
  /** Cuando true, no se muestra la toolbar interna (se usa una externa fija) */
  hideToolbar?: boolean;
}

export interface BlockEditorRef {
  getContent: () => Promise<string | null>;
}

// Botones de la toolbar fija
const TOOLBAR_BUTTONS = [
  {
    command: 'bold',
    label: 'B',
    title: 'Negrita (Ctrl+B)',
    style: 'font-bold',
  },
  {
    command: 'italic',
    label: 'I',
    title: 'Cursiva (Ctrl+I)',
    style: 'italic',
  },
  {
    command: 'underline',
    label: 'U',
    title: 'Subrayado (Ctrl+U)',
    style: 'underline',
  },
  {
    command: 'strikeThrough',
    label: 'S',
    title: 'Tachado',
    style: 'line-through',
  },
] as const;

export const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(({ value, onChange, notaId, hideToolbar }, ref) => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const lastSavedContentRef = useRef<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    getContent: async () => {
      if (!editorRef.current) return null;
      try {
        const output = await editorRef.current.save();
        return JSON.stringify(output);
      } catch {
        return null;
      }
    },
  }));

  // Detectar formatos activos en la selección actual
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
    setActiveFormats(formats);
  }, []);

  // Ejecutar comando de formato
  const execFormat = useCallback((command: string) => {
    document.execCommand(command, false);
    updateActiveFormats();
  }, [updateActiveFormats]);

  // Insertar resaltado (highlight)
  const execHighlight = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    // Verificar si ya está dentro de un <mark>
    const parentMark = (range.commonAncestorContainer as HTMLElement).closest?.('mark') ||
      (range.commonAncestorContainer.parentElement?.closest?.('mark'));

    if (parentMark) {
      // Quitar highlight
      const text = document.createTextNode(parentMark.textContent || '');
      parentMark.replaceWith(text);
    } else {
      // Aplicar highlight
      const contents = range.extractContents();
      const mark = document.createElement('mark');
      mark.style.backgroundColor = '#fef08a';
      mark.style.borderRadius = '2px';
      mark.style.padding = '0 2px';
      mark.appendChild(contents);
      range.insertNode(mark);
    }
  }, []);

  // Insertar código inline
  const execInlineCode = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const parentCode = (range.commonAncestorContainer as HTMLElement).closest?.('code') ||
      (range.commonAncestorContainer.parentElement?.closest?.('code'));

    if (parentCode) {
      const text = document.createTextNode(parentCode.textContent || '');
      parentCode.replaceWith(text);
    } else {
      const contents = range.extractContents();
      const code = document.createElement('code');
      code.appendChild(contents);
      range.insertNode(code);
    }
  }, []);

  // Escuchar cambios de selección para actualizar estado de botones
  useEffect(() => {
    const handler = () => updateActiveFormats();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [updateActiveFormats]);

  const notaIdRef = useRef<string | undefined>(undefined);
  const valueRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let initTimeoutId: ReturnType<typeof setTimeout>;

    if (notaIdRef.current === notaId && editorRef.current) {
      return;
    }

    if (initTimeoutId) {
      clearTimeout(initTimeoutId);
    }

    notaIdRef.current = notaId;
    valueRef.current = value;

    const initEditor = async () => {
      if (!holderRef.current || isInitializingRef.current) {
        return;
      }

      if (holderRef.current && holderRef.current.children.length > 0 && editorRef.current) {
        return;
      }

      isInitializingRef.current = true;

      if (holderRef.current) {
        holderRef.current.innerHTML = '';
      }

      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch {
          // ignorar
        }
        editorRef.current = null;
      }

      const EditorJS = (await import('@editorjs/editorjs')).default;
      const Header = (await import('@editorjs/header')).default;
      const List = (await import('@editorjs/list')).default;
      const Checklist = (await import('@editorjs/checklist')).default as any;
      const Quote = (await import('@editorjs/quote')).default;
      const Code = (await import('@editorjs/code')).default;
      const InlineCode = (await import('@editorjs/inline-code')).default;
      const Marker = (await import('@editorjs/marker')).default as any;
      const LinkTool = (await import('@editorjs/link')).default as any;
      const Delimiter = (await import('@editorjs/delimiter')).default;
      const Table = (await import('@editorjs/table')).default;
      const Paragraph = (await import('@editorjs/paragraph')).default;

      // Iconos SVG para cada nivel de header
      const headerIcons: Record<number, string> = {
        1: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h12"/><path d="M4 18h8"/></svg>`,
        2: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h12"/><path d="M4 18h8"/></svg>`,
        3: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 13h10"/><path d="M4 19h6"/></svg>`,
      };

      const createHeaderLevelTool = (level: number) => {
        const tag = `H${level}`;
        return class extends Header {
          static get toolbox() {
            const titles: Record<number, string> = { 1: 'Encabezado 1', 2: 'Encabezado 2', 3: 'Encabezado 3' };
            return { title: titles[level] || `Encabezado ${level}`, icon: headerIcons[level] || headerIcons[3] };
          }
          static get isReadOnlySupported() { return true; }
          static get pasteConfig() { return { tags: [tag] }; }
          constructor({ data, api, readOnly }: any) {
            super({ data: data ? { ...data, level } : { level, text: '' }, api, readOnly, config: { levels: [level], defaultLevel: level, placeholder: `Escribe encabezado ${level}...` } });
          }
          save(blockContent: any) { return { ...super.save(blockContent), level }; }
        };
      };

      // Inline tool mínimo: solo registra sanitize rules para que EditorJS preserve los tags
      const createSanitizerTool = (tags: string[], title: string) => {
        const sanitizeRules: Record<string, any> = {};
        for (const t of tags) sanitizeRules[t] = {};
        return class {
          static get isInline() { return true; }
          static get title() { return title; }
          static get sanitize() { return sanitizeRules; }
          render() {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = title[0];
            btn.style.display = 'none';
            return btn;
          }
          surround() {}
          checkState() { return false; }
        };
      };

      // Registrar sanitizer tools para cada formato
      const BoldSanitizer = createSanitizerTool(['b', 'strong'], 'Bold');
      const ItalicSanitizer = createSanitizerTool(['i', 'em'], 'Italic');
      const UnderlineSanitizer = createSanitizerTool(['u'], 'Underline');
      const StrikeSanitizer = createSanitizerTool(['s', 'strike', 'del'], 'Strike');
      // Mark necesita preservar el atributo style para el color de fondo
      const MarkSanitizerClass = class {
        static get isInline() { return true; }
        static get title() { return 'Highlight'; }
        static get sanitize() { return { mark: { style: true } }; }
        render() { const btn = document.createElement('button'); btn.style.display = 'none'; return btn; }
        surround() {}
        checkState() { return false; }
      };

      // Lista de inline tools para el inlineToolbar de cada bloque
      const allInlineTools = ['bold', 'italic', 'underline', 'strike', 'markHighlight', 'marker', 'inlineCode'];

      let initialData: any = undefined;
      if (value) {
        try { initialData = JSON.parse(value); } catch { initialData = undefined; }
      }

      try {
        editorRef.current = new EditorJS({
          holder: holderRef.current,
          autofocus: false,
          data: initialData,
          placeholder: 'Escribe "/" para ver los bloques disponibles...',
          // inlineToolbar habilitado para registrar sanitize rules (popup oculto por CSS)
          inlineToolbar: allInlineTools,
          tools: {
            paragraph: {
              class: Paragraph as any,
              inlineToolbar: allInlineTools,
              config: { placeholder: 'Escribe aquí... (usa "/" para bloques)' },
            },
            header1: { class: createHeaderLevelTool(1), inlineToolbar: allInlineTools },
            header2: { class: createHeaderLevelTool(2), inlineToolbar: allInlineTools },
            header3: { class: createHeaderLevelTool(3), inlineToolbar: allInlineTools },
            list: {
              class: List as any,
              inlineToolbar: allInlineTools,
              config: { defaultStyle: 'unordered' },
            },
            checklist: { class: Checklist, inlineToolbar: allInlineTools },
            quote: {
              class: Quote,
              inlineToolbar: allInlineTools,
              config: { quotePlaceholder: 'Escribe una cita', captionPlaceholder: 'Autor o fuente' },
            },
            code: { class: Code, config: { placeholder: 'Escribe tu código aquí...' } },
            table: {
              class: Table as any,
              inlineToolbar: allInlineTools,
              config: { rows: 2, cols: 2, withHeadings: true },
            },
            linkTool: { class: LinkTool, config: { endpoint: '', placeholder: 'Pega un link...' } },
            delimiter: { class: Delimiter },
            inlineCode: { class: InlineCode },
            marker: { class: Marker },
            // Inline tools para sanitizer (preservar tags HTML al guardar)
            bold: BoldSanitizer,
            italic: ItalicSanitizer,
            underline: UnderlineSanitizer,
            strike: StrikeSanitizer,
            markHighlight: MarkSanitizerClass,
          },
          onChange: async () => {
            if (!editorRef.current || !isMounted) return;
            if (timeoutId) clearTimeout(timeoutId);
            try {
              timeoutId = setTimeout(async () => {
                if (!editorRef.current || !isMounted) return;
                try {
                  const saveContent = async () => {
                    if (!editorRef.current || !isMounted) return;
                    const output = await editorRef.current.save();
                    if (isMounted && output) {
                      const jsonString = JSON.stringify(output);
                      if (lastSavedContentRef.current !== jsonString) {
                        lastSavedContentRef.current = jsonString;
                        onChange(jsonString);
                      }
                    }
                  };
                  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(saveContent, { timeout: 200 });
                  } else {
                    await saveContent();
                  }
                } catch { /* ignore */ }
              }, 200);
            } catch { /* ignore */ }
          },
        });

        await editorRef.current.isReady;
        isInitializingRef.current = false;
        lastSavedContentRef.current = value || null;
      } catch (err) {
        console.error('Error al inicializar EditorJS:', err);
        isInitializingRef.current = false;
      }
    };

    initTimeoutId = setTimeout(() => { initEditor(); }, 0);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (initTimeoutId) clearTimeout(initTimeoutId);
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch { /* ignore */ }
        editorRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [notaId]);

  return (
    <div className="flex flex-col h-full">
      {!hideToolbar && (
        <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 rounded-t-2xl sticky top-0 z-10">
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.command}
              type="button"
              title={btn.title}
              onMouseDown={(e) => { e.preventDefault(); execFormat(btn.command); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all duration-150 ${
                activeFormats.has(btn.command) ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={btn.style}>{btn.label}</span>
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button type="button" title="Resaltar" onMouseDown={(e) => { e.preventDefault(); execHighlight(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-150">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          </button>
          <button type="button" title="Código inline" onMouseDown={(e) => { e.preventDefault(); execInlineCode(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150">{'</>'}</button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <span className="text-[10px] text-gray-400 ml-1 select-none">Selecciona texto para formatear</span>
        </div>
      )}
      <div ref={holderRef} className="flex-1 min-h-[400px]" style={{ overflow: 'visible' }} />
    </div>
  );
});

BlockEditor.displayName = 'BlockEditor';
