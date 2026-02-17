# AnotaWEB

Aplicación web frontend para **Anota**, una plataforma de notas, tareas y carpetas con autenticación JWT.

## Stack tecnológico

- **React 19** + **TypeScript**
- **Vite 7** (build y dev server)
- **React Router 7**
- **TailwindCSS 4**
- **Editor.js** – editor de bloques para notas
- **axios** – cliente HTTP
- **iziToast** – notificaciones
- **GSAP** – animaciones

## Estructura del proyecto

```
src/
├── components/          # Componentes React
│   ├── BlockEditor.tsx  # Editor de bloques (Editor.js)
│   ├── DashboardPage.tsx
│   ├── NotasPage.tsx    # Notas completas con carpetas
│   ├── NotasRapidasPage.tsx
│   ├── TareasPage.tsx
│   ├── CarpetasPage.tsx
│   ├── Login.tsx / Register.tsx
│   ├── LandingPage.tsx
│   └── ...
├── contexts/
│   └── AuthContext.tsx  # Autenticación y sesión
├── services/
│   └── api.ts           # Cliente API (axios)
├── types/
│   └── api.ts           # Tipos TypeScript
└── main.tsx
```

## Desarrollo

### Requisitos

- **Bun** o **Node.js** 18+
- API backend (NotasApi) en ejecución

### Instalación

```bash
bun install
# o
npm install
```

### Variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:5246
```

Para producción, usa `.env.production`:

```env
VITE_API_URL=https://anotaweb.work
```

### Ejecutar en desarrollo

```bash
bun run dev
# o
npm run dev
```

La app se abre en `http://localhost:5173`.

### Build de producción

```bash
bun run build
# o
npm run build
```

El resultado se genera en `dist/`.

### Vista previa del build

```bash
bun run preview
# o
npm run preview
```

## Despliegue

- **Dominio:** anota.click  
- **API:** anotaweb.work  

El build (`dist/`) puede desplegarse en cualquier hosting estático (Vercel, Netlify, S3, etc.) o en el mismo servidor donde corre la API.

## Funcionalidades principales

- Inicio de sesión y registro
- **Notas completas** con editor de bloques (párrafos, listas, tablas, código, imágenes)
- **Notas rápidas** para capturar ideas rápido
- **Carpetas** para organizar notas
- **Tareas** con prioridad y fechas de vencimiento
- **Dashboard** con resumen de tareas pendientes
- Soporte para favoritos y archivado

## Integración con la API

Ver [README_API.md](./README_API.md) para configuración del cliente API, endpoints y uso de `apiService` y `AuthContext`.
