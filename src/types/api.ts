// Auth Types
export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido?: string;
  correo: string;
  password: string;
}

export interface UsuarioInfo {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  fotoPerfilUrl?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  usuario: UsuarioInfo;
}

// Carpetas Types
export interface CarpetaArbol {
  id: string;
  nombre: string;
  icono?: string;
  colorHex?: string;
  nivel: number;
  rutaString: string;
  orden: number;
}

export interface CrearCarpetaRequest {
  nombre: string;
  icono?: string;
  colorHex?: string;
  carpetaPadreId?: string;
}

// Notas Types
export interface NotaResumen {
  id: string;
  carpetaId?: string | null;
  titulo: string;
  resumen?: string;
  icono?: string;
  imagenPortadaUrl?: string;
  esFavorita: boolean;
  esPublica: boolean;
  fechaActualizacion: string;
}

export interface Etiqueta {
  id: string;
  usuarioId: string;
  nombre: string;
  colorHex?: string;
  fechaCreacion: string;
}

export interface Nota {
  id: string;
  usuarioId: string;
  carpetaId?: string;
  titulo: string;
  etiquetas?: Etiqueta[];
  resumen?: string;
  icono?: string;
  imagenPortadaUrl?: string;
  contenidoBloques?: string;
  esFavorita: boolean;
  esArchivada: boolean;
  esPublica: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearNotaRequest {
  titulo: string;
  resumen?: string;
  icono?: string;
  contenidoBloques?: string;
  carpetaId?: string;
}

export interface ActualizarNotaRequest {
  titulo: string;
  resumen?: string;
  icono?: string;
  imagenPortadaUrl?: string;
  contenidoBloques?: string;
}

export interface MoverNotaRequest {
  carpetaId?: string;
}

// Notas Rápidas Types
export interface NotaRapida {
  id: string;
  usuarioId: string;
  contenido: string;
  colorHex?: string;
  esArchivada: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearNotaRapidaRequest {
  contenido: string;
  colorHex?: string;
}

export interface ActualizarNotaRapidaRequest {
  contenido: string;
  colorHex?: string;
}

// Tareas Types
export interface Tarea {
  id: string;
  usuarioId: string;
  notaVinculadaId?: string;
  tituloNotaVinculada?: string;
  descripcion: string;
  estaCompletada: boolean;
  prioridad: number;
  orden: number;
  fechaVencimiento?: string;
  fechaCreacion: string;
  fechaCompletada?: string;
}

export interface CrearTareaRequest {
  descripcion: string;
  notaVinculadaId?: string;
  prioridad?: number;
  fechaVencimiento?: string;
}

export interface ActualizarTareaRequest {
  descripcion: string;
  prioridad: number;
  fechaVencimiento?: string;
}

// Google Tasks Integration
export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  taskListId: string;
  taskListTitle: string;
}

// Pizarras (Excalidraw)
export interface Pizarra {
  id: string;
  usuarioId: string;
  notaId?: string | null;
  titulo: string;
  descripcion?: string | null;
  sceneJson: string;
  esArchivada: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearPizarraRequest {
  titulo: string;
  descripcion?: string;
  sceneJson: string;
  notaId?: string;
}

export interface ActualizarPizarraRequest {
  titulo: string;
  descripcion?: string;
  sceneJson: string;
  notaId?: string | null;
  esArchivada?: boolean;
}
