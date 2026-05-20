import { apiUrl } from './api';
// Servicio para gestionar el logo de la empresa en los correos electrónicos
export const logoService = {
  // Clave para almacenar el logo en localStorage
  LOGO_STORAGE_KEY: 'facturacion_cibercom_logo',
  
  // Guardar el logo en localStorage
  guardarLogo: (logoBase64: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(logoService.LOGO_STORAGE_KEY, logoBase64);
    }
  },
  
  // Obtener el logo desde localStorage
  obtenerLogo: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(logoService.LOGO_STORAGE_KEY) || '';
    }
    return '';
  },
  
  // Eliminar el logo de localStorage
  eliminarLogo: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(logoService.LOGO_STORAGE_KEY);
    }
  },

  // Persiste el logo en el backend para que el PDF lo use
  guardarLogoBackend: async (logoBase64: string): Promise<boolean> => {
    try {
      const resp = await fetch(apiUrl('/logos/guardar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoBase64 }),
      });
      return resp.ok;
    } catch (e) {
      console.error('Error guardando logo en backend:', e);
      return false;
    }
  },

  // Obtiene el logo activo desde el backend
  obtenerLogoActivoBackend: async (): Promise<string> => {
    try {
      const resp = await fetch(apiUrl('/logos/activo'));
      if (!resp.ok) return '';
      const data = await resp.json().catch(() => null);
      const val = (data && (data.logoBase64 || (data.logo as string))) || '';
      return val.trim();
    } catch (e) {
      console.error('Error obteniendo logo activo del backend:', e);
      return '';
    }
  }
};