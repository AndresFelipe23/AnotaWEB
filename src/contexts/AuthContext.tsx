import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { LoginRequest, RegisterRequest, UsuarioInfo } from '../types/api';
import iziToast from 'izitoast';

interface AuthContextType {
  usuario: UsuarioInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage al iniciar
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (token && usuarioStr) {
      try {
        setUsuario(JSON.parse(usuarioStr));
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiService.login(credentials);
      localStorage.setItem('token', response.token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));
      setUsuario(response.usuario);
      iziToast.success({
        title: '¡Bienvenido!',
        message: `Hola, ${response.usuario.nombre}`,
      });
    } catch (error: any) {
      iziToast.error({
        title: 'Error de inicio de sesión',
        message: error.response?.data?.message || 'Credenciales inválidas',
      });
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiService.register(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));
      setUsuario(response.usuario);
      iziToast.success({
        title: '¡Registro exitoso!',
        message: `Bienvenido, ${response.usuario.nombre}`,
      });
    } catch (error: any) {
      iziToast.error({
        title: 'Error de registro',
        message: error.response?.data?.message || 'Error al registrar usuario',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
      iziToast.info({
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión correctamente',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
