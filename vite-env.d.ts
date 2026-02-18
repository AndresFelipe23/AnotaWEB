/// <reference types="vite/client" />

declare module '@editorjs/checklist';
declare module '@editorjs/marker';
declare module '@editorjs/link';

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
