import { useCallback, useEffect, useState } from 'react';

const TOOLBAR_BUTTONS = [
  { command: 'bold', label: 'B', title: 'Negrita (Ctrl+B)', style: 'font-bold' },
  { command: 'italic', label: 'I', title: 'Cursiva (Ctrl+I)', style: 'italic' },
  { command: 'underline', label: 'U', title: 'Subrayado (Ctrl+U)', style: 'underline' },
  { command: 'strikeThrough', label: 'S', title: 'Tachado', style: 'line-through' },
] as const;

export const FormattingToolbar = () => {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough');
    setActiveFormats(formats);
  }, []);

  const execFormat = useCallback((command: string) => {
    document.execCommand(command, false);
    updateActiveFormats();
  }, [updateActiveFormats]);

  const execHighlight = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const parentMark = (range.commonAncestorContainer as HTMLElement).closest?.('mark') ||
      (range.commonAncestorContainer.parentElement?.closest?.('mark'));
    if (parentMark) {
      const text = document.createTextNode(parentMark.textContent || '');
      parentMark.replaceWith(text);
    } else {
      const contents = range.extractContents();
      const mark = document.createElement('mark');
      mark.style.backgroundColor = '#fef08a';
      mark.style.borderRadius = '2px';
      mark.style.padding = '0 2px';
      mark.appendChild(contents);
      range.insertNode(mark);
    }
  }, []);

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

  useEffect(() => {
    const handler = () => updateActiveFormats();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [updateActiveFormats]);

  return (
    <div className="flex-shrink-0 flex items-center gap-0.5 px-4 py-2 bg-gray-50/80 border-b border-gray-200">
      {TOOLBAR_BUTTONS.map((btn) => (
        <button
          key={btn.command}
          type="button"
          title={btn.title}
          onMouseDown={(e) => { e.preventDefault(); execFormat(btn.command); }}
          className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${
            activeFormats.has(btn.command)
              ? 'bg-gray-800 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className={btn.style}>{btn.label}</span>
        </button>
      ))}
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        title="Resaltar"
        onMouseDown={(e) => { e.preventDefault(); execHighlight(); }}
        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-yellow-100 hover:text-yellow-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
      <button
        type="button"
        title="Código inline"
        onMouseDown={(e) => { e.preventDefault(); execInlineCode(); }}
        className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-mono text-gray-600 hover:bg-gray-200 transition-colors"
      >
        {'</>'}
      </button>
    </div>
  );
};
