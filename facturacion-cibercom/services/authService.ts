import { apiUrl } from './api';
import { DUMMY_CREDENTIALS } from '../constants';
import type { LoginResponse, UsuarioLogin } from '../types';

/** Usuario mock para modo demo (sin backend). */
const DEMO_USUARIO: UsuarioLogin = {
  noUsuario: DUMMY_CREDENTIALS.username,
  nombreEmpleado: 'Usuario demo (Cibercom)',
  nombrePerfil: 'Demo',
  idPerfil: 1,
  estatusUsuario: 'A',
  idDfi: 1,
  idEstacionamiento: null,
  modificaUbicacion: null,
};

function isDummyCredentials(username: string, password: string): boolean {
  return username === DUMMY_CREDENTIALS.username && password === DUMMY_CREDENTIALS.password;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  let response: Response | null = null;
  try {
    const debugLogin = typeof window !== 'undefined' && (
      window.localStorage?.getItem('cibercom.debugLogin') === 'true' ||
      new URLSearchParams(window.location.search).get('debug') === '1'
    );
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (debugLogin) headers['X-Debug-Login'] = 'true';
    response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        usuario: username,
        password,
      }),
    });
  } catch (error) {
    // Sin conexión al backend: si usó credenciales demo, permitir entrar en modo demo
    if (isDummyCredentials(username, password)) {
      return { success: true, message: 'Modo demo (sin conexión al servidor)', usuario: DEMO_USUARIO };
    }
    throw new Error('No se pudo conectar con el servidor de autenticación.');
  }

  let data: LoginResponse | null = null;
  try {
    data = (await response.json()) as LoginResponse;
  } catch (error) {
    if (!response.ok) {
      if (response.status >= 500 && isDummyCredentials(username, password)) {
        return { success: true, message: 'Modo demo (servidor no disponible)', usuario: DEMO_USUARIO };
      }
      throw new Error('Respuesta inválida del servidor de autenticación.');
    }
  }

  if (!response.ok) {
    // Error 5xx (ej. 500): si usó credenciales demo, permitir modo demo
    if (response.status >= 500 && isDummyCredentials(username, password)) {
      return { success: true, message: 'Modo demo (servidor con errores)', usuario: DEMO_USUARIO };
    }
    const message =
      data?.message ||
      (response.status === 401
        ? 'Usuario o contraseña incorrectos.'
        : `Error de autenticación (${response.status}).`);
    throw new Error(message);
  }

  if (!data?.success) {
    throw new Error(data?.message || 'Usuario o contraseña incorrectos.');
  }

  return data;
}

