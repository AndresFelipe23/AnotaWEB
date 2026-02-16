import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import iziToast from 'izitoast';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CrearCarpetaRequest,
  CrearNotaRequest,
  ActualizarNotaRequest,
  MoverNotaRequest,
  CrearNotaRapidaRequest,
  ActualizarNotaRapidaRequest,
  CrearTareaRequest,
  ActualizarTareaRequest,
  CarpetaArbol,
  Nota,
  NotaResumen,
  NotaRapida,
  Tarea,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7251';

// Debug: verificar que la URL se está leyendo correctamente
if (import.meta.env.DEV) {
  console.log('🔧 API_URL:', API_URL);
  console.log('🔧 VITE_API_URL desde env:', import.meta.env.VITE_API_URL);
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores globalmente
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            // Token inválido o expirado - solo este error se muestra globalmente
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
            iziToast.error({
              title: 'Sesión expirada',
              message: 'Por favor, inicia sesión nuevamente',
            });
          }
          // Los demás errores (400, 500, etc.) se manejan en los componentes
          // para evitar mensajes duplicados
        } else if (error.request) {
          // Solo mostrar error de conexión si no hay respuesta del servidor
          iziToast.error({
            title: 'Error de conexión',
            message: 'No se pudo conectar con el servidor',
          });
        }
        return Promise.reject(error);
      }
    );
  }

  // ============ AUTH ============
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/api/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/api/auth/logout');
  }

  // ============ CARPETAS ============
  async obtenerArbolCarpetas(): Promise<CarpetaArbol[]> {
    const response = await this.api.get<CarpetaArbol[]>('/api/carpetas/arbol');
    return response.data;
  }

  async crearCarpeta(data: CrearCarpetaRequest): Promise<{ id: string }> {
    const response = await this.api.post<{ id: string }>('/api/carpetas', data);
    return response.data;
  }

  async eliminarCarpeta(id: string): Promise<void> {
    await this.api.delete(`/api/carpetas/${id}`);
  }

  // ============ NOTAS ============
  async obtenerNotas(carpetaId?: string): Promise<NotaResumen[]> {
    const params = carpetaId ? { carpetaId } : {};
    const response = await this.api.get<NotaResumen[]>('/api/notas', { params });
    return response.data;
  }

  async obtenerNotaPorId(id: string): Promise<Nota> {
    const response = await this.api.get<Nota>(`/api/notas/${id}`);
    return response.data;
  }

  async crearNota(data: CrearNotaRequest): Promise<{ id: string }> {
    const response = await this.api.post<{ id: string }>('/api/notas', data);
    return response.data;
  }

  async actualizarNota(id: string, data: ActualizarNotaRequest): Promise<void> {
    await this.api.put(`/api/notas/${id}`, data);
  }

  async moverNota(id: string, data: MoverNotaRequest): Promise<void> {
    await this.api.put(`/api/notas/${id}/mover`, data);
  }

  async alternarFavorito(id: string): Promise<void> {
    await this.api.put(`/api/notas/${id}/favorito`);
  }

  async archivarNota(id: string): Promise<void> {
    await this.api.put(`/api/notas/${id}/archivar`);
  }

  // ============ NOTAS RÁPIDAS ============
  async obtenerNotasRapidas(): Promise<NotaRapida[]> {
    const response = await this.api.get<NotaRapida[]>('/api/NotasRapidas');
    return response.data;
  }

  async crearNotaRapida(data: CrearNotaRapidaRequest): Promise<{ id: string }> {
    const response = await this.api.post<{ id: string }>('/api/NotasRapidas', data);
    return response.data;
  }

  async actualizarNotaRapida(id: string, data: ActualizarNotaRapidaRequest): Promise<void> {
    await this.api.put(`/api/NotasRapidas/${id}`, data);
  }

  async archivarNotaRapida(id: string): Promise<void> {
    await this.api.put(`/api/NotasRapidas/${id}/archivar`);
  }

  async eliminarNotaRapida(id: string): Promise<void> {
    await this.api.delete(`/api/NotasRapidas/${id}`);
  }

  async convertirANota(id: string): Promise<{ notaId: string }> {
    const response = await this.api.post<{ notaId: string }>(`/api/NotasRapidas/${id}/convertir`);
    return response.data;
  }

  // ============ TAREAS ============
  async obtenerTareasPendientes(): Promise<Tarea[]> {
    const response = await this.api.get<Tarea[]>('/api/tareas/pendientes');
    return response.data;
  }

  async crearTarea(data: CrearTareaRequest): Promise<{ id: string }> {
    const response = await this.api.post<{ id: string }>('/api/tareas', data);
    return response.data;
  }

  async actualizarTarea(id: string, data: ActualizarTareaRequest): Promise<void> {
    await this.api.put(`/api/tareas/${id}`, data);
  }

  async alternarEstadoTarea(id: string): Promise<void> {
    await this.api.put(`/api/tareas/${id}/completar`);
  }

  async eliminarTarea(id: string): Promise<void> {
    await this.api.delete(`/api/tareas/${id}`);
  }
}

export const apiService = new ApiService();
