# Configuración de la API - AnotaWEB

## 📋 Pasos de Configuración

### 1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_API_URL=https://localhost:7251
```

**Nota:** Si tu API corre en otro puerto, ajusta la URL según corresponda.

### 2. Estructura de Archivos Creada

```
src/
├── types/
│   └── api.ts              # Tipos TypeScript para todos los DTOs de la API
├── services/
│   └── api.ts              # Cliente HTTP con axios (apiService)
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación con React Context
└── components/
    └── Login.tsx           # Componente de ejemplo para login
```

## 🚀 Uso del Servicio API

### Ejemplo: Usar el servicio directamente

```typescript
import { apiService } from './services/api';

// Obtener árbol de carpetas
const carpetas = await apiService.obtenerArbolCarpetas();

// Crear una nota
const nuevaNota = await apiService.crearNota({
  titulo: 'Mi primera nota',
  resumen: 'Esta es una nota de prueba',
  carpetaId: 'carpeta-id-opcional'
});

// Obtener tareas pendientes
const tareas = await apiService.obtenerTareasPendientes();
```

### Ejemplo: Usar el contexto de autenticación

```typescript
import { useAuth } from './contexts/AuthContext';

function MiComponente() {
  const { usuario, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }

  return (
    <div>
      <p>Hola, {usuario?.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

## 🔐 Características Implementadas

✅ **Cliente HTTP con axios**
- Interceptor automático para agregar token JWT
- Manejo global de errores con iziToast
- Redirección automática al login si el token expira

✅ **Contexto de Autenticación**
- Manejo de sesión con localStorage
- Estados de carga y autenticación
- Métodos para login, register y logout

✅ **Tipos TypeScript**
- Todos los DTOs de la API tipados
- Autocompletado en el IDE
- Validación de tipos en tiempo de compilación

✅ **Notificaciones**
- Integración con iziToast
- Mensajes de éxito y error automáticos

## 📡 Endpoints Disponibles

### Autenticación
- `apiService.login(credentials)` - Iniciar sesión
- `apiService.register(data)` - Registrar usuario
- `apiService.logout()` - Cerrar sesión

### Carpetas
- `apiService.obtenerArbolCarpetas()` - Obtener árbol completo
- `apiService.crearCarpeta(data)` - Crear carpeta
- `apiService.eliminarCarpeta(id)` - Eliminar carpeta

### Notas
- `apiService.obtenerNotas(carpetaId?)` - Listar notas
- `apiService.obtenerNotaPorId(id)` - Obtener nota completa
- `apiService.crearNota(data)` - Crear nota
- `apiService.actualizarNota(id, data)` - Actualizar nota
- `apiService.moverNota(id, data)` - Mover nota
- `apiService.alternarFavorito(id)` - Alternar favorito
- `apiService.archivarNota(id)` - Archivar nota

### Notas Rápidas
- `apiService.obtenerNotasRapidas()` - Obtener todas
- `apiService.crearNotaRapida(data)` - Crear nota rápida
- `apiService.actualizarNotaRapida(id, data)` - Actualizar
- `apiService.archivarNotaRapida(id)` - Archivar
- `apiService.convertirANota(id)` - Convertir a nota completa

### Tareas
- `apiService.obtenerTareasPendientes()` - Obtener pendientes
- `apiService.crearTarea(data)` - Crear tarea
- `apiService.actualizarTarea(id, data)` - Actualizar tarea
- `apiService.alternarEstadoTarea(id)` - Completar/Pendiente
- `apiService.eliminarTarea(id)` - Eliminar tarea

## ⚠️ Importante

1. **CORS**: Asegúrate de que tu API backend tenga configurado CORS para permitir peticiones desde `http://localhost:5173` (puerto por defecto de Vite).

2. **Certificado SSL**: Si usas `https://localhost:7251`, es posible que necesites aceptar el certificado autofirmado en tu navegador.

3. **Token JWT**: El token se guarda automáticamente en `localStorage` y se incluye en todas las peticiones protegidas.

## 🎨 Estilos

El proyecto ya tiene configurado:
- ✅ TailwindCSS v4
- ✅ iziToast para notificaciones

Los estilos de iziToast se importan automáticamente en `main.tsx`.
