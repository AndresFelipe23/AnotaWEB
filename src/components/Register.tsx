import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoSvg from '../assets/logo.svg';

interface RegisterProps {
  onToggleMode: () => void;
}

export const Register = (_props: RegisterProps) => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        nombre,
        apellido: apellido || undefined,
        correo,
        password,
      });
      navigate('/');
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 overflow-hidden">
            <img src={logoSvg} alt="Anota logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Crea tu cuenta</h1>
          <p className="text-gray-600 text-sm">Únete a Anota y comienza a organizar tus ideas</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-black mb-2">Registro</h2>
            <p className="text-sm text-gray-600">Completa tus datos para comenzar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-black mb-2">
                Nombre <span className="text-gray-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white text-black placeholder-gray-400"
                placeholder="Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-black mb-2">
                Apellido
              </label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white text-black placeholder-gray-400"
                placeholder="Pérez (opcional)"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-black mb-2">
                Correo electrónico <span className="text-gray-500">*</span>
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white text-black placeholder-gray-400"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Contraseña <span className="text-gray-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white text-black placeholder-gray-400"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                Confirmar contraseña <span className="text-gray-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white text-black placeholder-gray-400 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-gray-400 focus:ring-gray-500'
                    : 'border-gray-300 focus:ring-black'
                }`}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-gray-600">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || password.length < 6}
              className="w-full py-3 px-4 bg-black text-white font-medium rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-black hover:text-gray-800 transition-colors underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Al registrarte, aceptas nuestros términos de servicio y política de privacidad
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-medium text-gray-600 hover:text-black underline underline-offset-2"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};
