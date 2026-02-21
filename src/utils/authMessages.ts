/**
 * Mensajes seguros para errores de autenticación.
 * No revelamos si un correo existe, si la contraseña falló, ni detalles del servidor.
 */

const DEFAULT_LOGIN = 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.';
const DEFAULT_REGISTER = 'No se pudo completar el registro. Revisa los datos e inténtalo de nuevo.';
const NETWORK_ERROR = 'No se pudo conectar. Revisa tu conexión e inténtalo más tarde.';
const SERVER_ERROR = 'Algo ha fallado. Inténtalo de nuevo en unos minutos.';

function getBackendMessage(error: unknown): string | undefined {
  const err = error as { response?: { data?: { message?: string }; status?: number } };
  return err?.response?.data?.message;
}

function getStatus(error: unknown): number | undefined {
  const err = error as { response?: { status?: number } };
  return err?.response?.status;
}

function isNetworkError(error: unknown): boolean {
  const err = error as { message?: string; code?: string };
  return err?.message === 'Network Error' || err?.code === 'ERR_NETWORK';
}

/** Mensaje seguro para errores de login. No distingue entre "correo no existe" y "contraseña incorrecta". */
export function getLoginErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return NETWORK_ERROR;
  const status = getStatus(error);
  if (status === 401) return DEFAULT_LOGIN;
  if (status === 400) return 'Revisa el formato del correo y la contraseña e inténtalo de nuevo.';
  if (status && status >= 500) return SERVER_ERROR;
  return DEFAULT_LOGIN;
}

/** Mensaje seguro para errores de registro. Solo revelamos "correo en uso" cuando el backend lo indica. */
export function getRegisterErrorMessage(error: unknown): string {
  if (isNetworkError(error)) return NETWORK_ERROR;
  const status = getStatus(error);
  const msg = (getBackendMessage(error) || '').toLowerCase();
  if (status === 400 && (msg.includes('correo') && (msg.includes('registrado') || msg.includes('uso')))) {
    return 'Este correo ya está en uso. Inicia sesión o usa otro correo.';
  }
  if (status === 400) return 'Revisa los datos del formulario e inténtalo de nuevo.';
  if (status && status >= 500) return SERVER_ERROR;
  return DEFAULT_REGISTER;
}
