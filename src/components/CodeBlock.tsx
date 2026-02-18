/**
 * Bloque de código personalizado para EditorJS con resaltado de sintaxis
 * Extiende @editorjs/code y agrega soporte para múltiples lenguajes y resaltado con Prism.js
 */

import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-git';

// Lenguajes disponibles
const LANGUAGES = [
  { value: '', label: 'Sin lenguaje' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'html', label: 'HTML' },
  { value: 'xml', label: 'XML' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'git', label: 'Git' },
];

export default class CodeBlock {
  static get toolbox() {
    return {
      title: 'Código',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 5L2.5 10L7.5 15M12.5 5L17.5 10L12.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  private language: string = '';
  private api: any;
  private data: any;
  private textarea: HTMLTextAreaElement | null = null;

  constructor({ data, api, readOnly: _readOnly }: any) {
    this.api = api;
    this.data = data || {};
    // Asegurar que el lenguaje se carga correctamente desde los datos guardados
    this.language = (data && data.language) ? data.language : '';
    
    // Si no hay lenguaje pero hay código, intentar detectar el lenguaje
    if (!this.language && data && data.code) {
      // Detectar lenguaje básico por extensión común
      const codeText = data.code.trim();
      if (codeText.startsWith('<!DOCTYPE') || codeText.startsWith('<html')) {
        this.language = 'html';
      } else if (codeText.startsWith('<?xml')) {
        this.language = 'xml';
      } else if (codeText.match(/^(function|const|let|var|class|import|export)\s/)) {
        this.language = 'javascript';
      }
    }
  }

  render() {
    // Crear wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-code-block';
    wrapper.style.cssText = 'margin: 1em 0; border-radius: 8px; overflow: hidden; border: 1px solid #2d2d2d;';

    // Crear textarea para edición
    const textarea = document.createElement('textarea');
    textarea.value = this.data.code || '';
    textarea.placeholder = 'Escribe tu código aquí...';
    textarea.spellcheck = false;

    // Crear pre y code para mostrar el código resaltado
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    // Agregar clase del lenguaje para que Prism funcione correctamente
    if (this.language) {
      code.className = `language-${this.language}`;
    }
    pre.appendChild(code);
    code.textContent = this.data.code || '';

    // Contenedor para el código (textarea o pre según el modo)
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-block-container';
    codeContainer.style.cssText = 'position: relative;';

    if (!this.api.readOnly.isReadOnly) {
      // En modo edición, mostrar textarea y pre (pre para mostrar resaltado)
      codeContainer.appendChild(textarea);
      // También agregar pre para mostrar resaltado en tiempo real
      pre.style.display = 'none'; // Oculto inicialmente, se mostrará cuando haya lenguaje
      codeContainer.appendChild(pre);
    } else {
      // En modo lectura, solo mostrar pre con código resaltado
      codeContainer.appendChild(pre);
    }

    wrapper.appendChild(codeContainer);
    this.textarea = textarea;

    // Crear contenedor para el header con selector de lenguaje
    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #1e1e1e;
      border-bottom: 1px solid #333;
      border-radius: 8px 8px 0 0;
    `;

    // Selector de lenguaje
    const langSelect = document.createElement('select');
    langSelect.className = 'code-block-lang-select';
    langSelect.style.cssText = `
      background: #2d2d2d;
      color: #d4d4d4;
      border: 1px solid #3e3e3e;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      outline: none;
    `;
    LANGUAGES.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.label;
      langSelect.appendChild(option);
    });

    // Si hay lenguaje guardado pero no está en la lista, agregarlo
    if (this.language && !Array.from(langSelect.options).some((opt: HTMLOptionElement) => opt.value === this.language)) {
      const option = document.createElement('option');
      option.value = this.language;
      option.textContent = this.language;
      langSelect.appendChild(option);
    }

    // Asegurar que el selector muestre el lenguaje correcto (después de agregar las opciones)
    langSelect.value = this.language || '';

    // Label "Lenguaje"
    const langLabel = document.createElement('span');
    langLabel.textContent = 'Lenguaje:';
    langLabel.style.cssText = `
      color: #9ca3af;
      font-size: 12px;
      margin-right: 8px;
      font-weight: 500;
    `;

    const langContainer = document.createElement('div');
    langContainer.style.cssText = 'display: flex; align-items: center;';
    langContainer.appendChild(langLabel);
    langContainer.appendChild(langSelect);

    header.appendChild(langContainer);

    // Botón copiar
    const copyButton = document.createElement('button');
    copyButton.className = 'code-block-copy-btn';
    copyButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span style="margin-left: 4px; font-size: 12px;">Copiar</span>
    `;
    copyButton.style.cssText = `
      display: flex;
      align-items: center;
      background: #2d2d2d;
      color: #d4d4d4;
      border: 1px solid #3e3e3e;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    copyButton.onmouseenter = () => {
      copyButton.style.background = '#3d3d3d';
      copyButton.style.borderColor = '#4d4d4d';
    };
    copyButton.onmouseleave = () => {
      copyButton.style.background = '#2d2d2d';
      copyButton.style.borderColor = '#3e3e3e';
    };

    copyButton.onclick = () => {
      const codeText = this.api.readOnly.isReadOnly 
        ? (this.data.code || '') 
        : (textarea.value || code.textContent || '');
      navigator.clipboard.writeText(codeText).then(() => {
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span style="margin-left: 4px; font-size: 12px;">Copiado!</span>
        `;
        setTimeout(() => {
          copyButton.innerHTML = originalText;
        }, 2000);
      });
    };

    header.appendChild(copyButton);

    // Estilos mejorados para el bloque de código
    pre.style.cssText = `
      margin: 0 !important;
      padding: 16px !important;
      background: #1e1e1e !important;
      border-radius: 0 0 8px 8px !important;
      overflow-x: auto !important;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #d4d4d4 !important;
      border: none !important;
    `;

    code.style.cssText = `
      background: transparent !important;
      padding: 0 !important;
      border: none !important;
      font-family: inherit !important;
      font-size: inherit !important;
    `;

    textarea.style.cssText = `
      background: #1e1e1e !important;
      color: #d4d4d4 !important;
      border: none !important;
      padding: 16px !important;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
      resize: vertical !important;
      min-height: 150px !important;
      border-radius: 0 0 8px 8px !important;
    `;

    // Insertar header antes del contenedor de código
    wrapper.insertBefore(header, codeContainer);

    // Mapa de colores por tipo de token (estilo VS Code Dark+)
    const TOKEN_COLORS: Record<string, string> = {
      'comment': '#6a9955',
      'prolog': '#6a9955',
      'doctype': '#6a9955',
      'cdata': '#6a9955',
      'punctuation': '#d4d4d4',
      'property': '#9cdcfe',
      'tag': '#4ec9b0',
      'boolean': '#569cd6',
      'number': '#b5cea8',
      'constant': '#9cdcfe',
      'symbol': '#b5cea8',
      'deleted': '#f44747',
      'selector': '#d7ba7d',
      'attr-name': '#9cdcfe',
      'string': '#ce9178',
      'char': '#ce9178',
      'builtin': '#4ec9b0',
      'inserted': '#b5cea8',
      'operator': '#d4d4d4',
      'entity': '#d4d4d4',
      'url': '#ce9178',
      'atrule': '#569cd6',
      'attr-value': '#ce9178',
      'keyword': '#569cd6',
      'function': '#dcdcaa',
      'class-name': '#4ec9b0',
      'regex': '#d16969',
      'important': '#569cd6',
      'variable': '#9cdcfe',
      'namespace': '#4ec9b0',
      'type-hint': '#4ec9b0',
      'return-type': '#4ec9b0',
      'annotation': '#dcdcaa',
      'directive': '#569cd6',
    };

    // Aplica colores inline a cada token para garantizar visibilidad
    // Usa setProperty con 'important' para ganar sobre cualquier regla CSS
    const colorTokens = (container: HTMLElement) => {
      const tokens = container.querySelectorAll<HTMLElement>('.token');
      if (tokens.length === 0) {
        // Si no hay tokens, intentar de nuevo después de un breve delay
        setTimeout(() => colorTokens(container), 50);
        return;
      }
      
      tokens.forEach((token) => {
        // Buscar todas las clases del token que coincidan con nuestros colores
        let colorAplicado = false;
        for (const cls of Array.from(token.classList)) {
          if (cls !== 'token' && TOKEN_COLORS[cls]) {
            token.style.setProperty('color', TOKEN_COLORS[cls], 'important');
            colorAplicado = true;
            break;
          }
        }
        // Si no se encontró tipo específico, usar color por defecto
        if (!colorAplicado) {
          token.style.setProperty('color', '#d4d4d4', 'important');
        }
      });
    };

    // Función para aplicar resaltado
    const applyHighlight = () => {
      const codeText = this.api.readOnly.isReadOnly ? (this.data.code || '') : textarea.value;

      if (!this.api.readOnly.isReadOnly) {
        // En modo edición, mostrar pre cuando hay lenguaje seleccionado
        if (this.language && codeText.trim()) {
          pre.style.display = 'block';
          textarea.style.display = 'none';
        } else {
          pre.style.display = 'none';
          textarea.style.display = 'block';
        }
      }

      if (!codeText.trim() || !this.language) {
        code.textContent = codeText;
        return;
      }

      try {
        // Mapeo de lenguajes a los nombres que Prism usa
        const langMap: Record<string, string> = {
          'csharp': 'csharp',
          'git': 'bash', // Git usa sintaxis similar a bash
          'shell': 'bash',
          'docker': 'dockerfile',
        };
        
        const prismLang = langMap[this.language] || this.language;
        
        // Actualizar la clase del lenguaje en el elemento code
        code.className = `language-${prismLang}`;
        
        // Buscar el lenguaje en Prism
        let lang = Prism.languages[prismLang];
        if (!lang) {
          // Intentar con el nombre original
          lang = Prism.languages[this.language];
        }
        if (!lang) {
          // Fallback a javascript
          lang = Prism.languages.javascript;
        }
        
        const highlighted = Prism.highlight(codeText, lang, prismLang);
        code.innerHTML = highlighted;
        
        // Aplicar colores directamente via inline styles para evitar problemas de CSS cascade
        // Usar múltiples intentos para asegurar que los tokens estén disponibles
        const applyColors = () => {
          const tokens = code.querySelectorAll('.token');
          if (tokens.length > 0) {
            colorTokens(code);
          } else {
            // Si no hay tokens, Prism puede no haber procesado correctamente
            console.warn('No se encontraron tokens para el lenguaje:', prismLang);
            // Intentar de nuevo
            setTimeout(() => {
              const retryHighlighted = Prism.highlight(codeText, lang, prismLang);
              code.innerHTML = retryHighlighted;
              colorTokens(code);
            }, 100);
          }
        };
        
        setTimeout(applyColors, 10);
        requestAnimationFrame(applyColors);
      } catch (e) {
        console.error('Error al resaltar código:', e, 'Lenguaje:', this.language);
        code.textContent = codeText;
      }
    };

    // Función para alternar entre edición y vista
    const toggleEditView = () => {
      if (this.api.readOnly.isReadOnly) return;
      
      if (pre.style.display === 'none') {
        // Cambiar a vista resaltada
        if (this.language && textarea.value.trim()) {
          pre.style.display = 'block';
          textarea.style.display = 'none';
        }
      } else {
        // Cambiar a modo edición
        pre.style.display = 'none';
        textarea.style.display = 'block';
        textarea.focus();
      }
    };

    // Aplicar resaltado inicial
    applyHighlight();

    // Escuchar cambios en el textarea (solo en modo edición)
    if (!this.api.readOnly.isReadOnly) {
      textarea.addEventListener('input', () => {
        applyHighlight();
      });

      // Permitir hacer clic en pre para editar
      pre.addEventListener('click', () => {
        toggleEditView();
      });

      // Permitir hacer clic fuera para mostrar resaltado
      textarea.addEventListener('blur', () => {
        if (this.language && textarea.value.trim()) {
          setTimeout(() => {
            if (document.activeElement !== textarea) {
              applyHighlight();
            }
          }, 200);
        }
      });

      // Escuchar cambios en el selector de lenguaje
      langSelect.addEventListener('change', () => {
        this.language = langSelect.value;
        this.data.language = this.language;
        applyHighlight();
        if (this.language && textarea.value.trim()) {
          textarea.blur();
        }
      });
    } else {
      // En modo lectura, aplicar resaltado si hay lenguaje
      if (this.language) {
        applyHighlight();
      }
      langSelect.disabled = true;
      langSelect.style.opacity = '0.6';
      langSelect.style.cursor = 'not-allowed';
    }

    return wrapper;
  }

  save(blockContent: any) {
    const textarea = blockContent?.querySelector('textarea') || this.textarea;
    const langSelect = blockContent?.querySelector('.code-block-lang-select');
    const savedLanguage = langSelect ? langSelect.value : (this.language || '');
    const savedCode = textarea ? textarea.value : (this.data.code || '');
    
    // Actualizar el estado interno
    this.language = savedLanguage;
    this.data = {
      ...this.data,
      code: savedCode,
      language: savedLanguage,
    };
    
    return {
      code: savedCode,
      language: savedLanguage,
    };
  }

  static get sanitize() {
    return {
      code: {
        br: true,
        span: true,
        class: true,
      },
      pre: {
        class: true,
      },
    };
  }
}
