// Centraliza URLs base para los servicios del backend
// Usa variables de entorno VITE_API_BASE_URL y VITE_PAC_BASE_URL con valores por defecto
// Si no está definida, detecta automáticamente si estamos en desarrollo local
function getDefaultApiBaseUrl(): string {
  // Si hay una variable de entorno, úsala
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Detectar si estamos en localhost (desarrollo)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  if (isLocalhost) {
    // En desarrollo local, el backend no usa context-path
    return 'http://localhost:8080/api';
  }
  
  // En producción, detectar automáticamente el context-path desde la URL actual
  // Si el frontend está servido desde el mismo servidor, usar rutas relativas
  const currentPath = window.location.pathname;
  // Detectar el context-path del backend (ej: /facturacion-backend)
  // Si estamos en /facturacion-backend/, el context-path es /facturacion-backend
  let contextPath = '';
  if (currentPath.startsWith('/facturacion-backend')) {
    contextPath = '/facturacion-backend';
  } else {
    // Si no se detecta, usar el valor por defecto
    contextPath = '/facturacion-backend';
  }
  
  // Construir URL usando el mismo protocolo, host y puerto de la página actual
  const baseUrl = `${window.location.protocol}//${window.location.host}${contextPath}/api`;
  return baseUrl;
}

export const API_BASE_URL: string = getDefaultApiBaseUrl().replace(/\/+$/,'');

function getDefaultPacBaseUrl(): string {
  // Si hay una variable de entorno, úsala
  const envUrl = (import.meta as any)?.env?.VITE_PAC_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Detectar si estamos en localhost (desarrollo)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  if (isLocalhost) {
    // CDP local: puerto 8081 + context-path /cib-ms-cdp (ver application.yml del microservicio)
    return 'http://localhost:8081/cib-ms-cdp/api';
  }
  
  // En producción, usar el mismo servidor con el context-path del servicio PAC
  const baseUrl = `${window.location.protocol}//${window.location.host}/cib-ms-cdp/api`;
  return baseUrl;
}

export const PAC_BASE_URL: string = getDefaultPacBaseUrl().replace(/\/+$/,'');

// Construye rutas asegurando que no haya dobles slashes
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

/** Base del backend sin sufijo /api (mismo host que VITE_API_BASE_URL). */
export function backendRootUrl(): string {
  return API_BASE_URL.replace(/\/api\/?$/i, '');
}

/**
 * Endpoints de notas de crédito viven en /credit-notes (sin prefijo /api).
 * Ej.: creditNotesUrl('/guardar') → http://localhost:8080/credit-notes/guardar
 */
export function creditNotesUrl(path: string): string {
  const override = (import.meta as any)?.env?.VITE_CREDIT_NOTES_BASE_URL as string | undefined;
  const base = override?.trim()
    ? override.trim().replace(/\/+$/, '')
    : backendRootUrl();
  const segment = path.startsWith('/') ? path : `/${path}`;
  const fullPath = segment.startsWith('/credit-notes')
    ? segment
    : `/credit-notes${segment}`;
  return `${base}${fullPath}`;
}

// Obtiene el ID del usuario desde la sesión
// IMPORTANTE: Usa el idUsuario guardado en el perfil al hacer login
// Este ID se establece al hacer login: idDfi si está disponible, sino idPerfil
// NUNCA usar noUsuario como ID, aunque sea numérico
function getUsuarioId(): string {
  try {
    // PRIMERO: Intentar obtener idUsuario del perfil (establecido al hacer login)
    // Este es el ID que se determinó al hacer login: idDfi o idPerfil
    const perfilRaw = window.localStorage.getItem('perfil');
    if (perfilRaw) {
      try {
        const perfil = JSON.parse(perfilRaw);
        
        if (perfil?.idUsuario != null && perfil.idUsuario !== undefined && /^\d+$/.test(String(perfil.idUsuario))) {
          return String(perfil.idUsuario);
        }
        
        if (perfil?.idDfi != null && perfil.idDfi !== undefined && /^\d+$/.test(String(perfil.idDfi))) {
          return String(perfil.idDfi);
        }
        
        if (perfil?.idPerfil != null && perfil.idPerfil !== undefined && /^\d+$/.test(String(perfil.idPerfil))) {
          return String(perfil.idPerfil);
        }
        
        console.warn('No se encontró ID numérico válido en el perfil. Perfil:', perfil);
      } catch (error) {
        console.error('Error al parsear perfil:', error);
      }
    } else {
      console.warn('No se encontró perfil en localStorage');
    }
    
    // SEGUNDO: Intentar obtener de session.idUsuario (debe contener el ID real establecido al hacer login)
    const idUsuario = window.localStorage.getItem('session.idUsuario');
    if (idUsuario && /^\d+$/.test(idUsuario)) {
      // Verificar que no sea el noUsuario (aunque sea numérico)
      const perfilRaw2 = window.localStorage.getItem('perfil');
      if (perfilRaw2) {
        try {
          const perfil = JSON.parse(perfilRaw2);
          if (perfil?.noUsuario && String(perfil.noUsuario) === idUsuario) {
            console.warn('session.idUsuario contiene noUsuario, no se usará. Buscando ID real...');
            if (perfil?.idPerfil != null && /^\d+$/.test(String(perfil.idPerfil))) {
              return String(perfil.idPerfil);
            }
            return "0";
          }
        } catch {}
      }
      return idUsuario;
    }
    
    console.error('No se encontró ID numérico válido del usuario');
    return "0";
  } catch (error) {
    console.error('Error en getUsuarioId():', error);
    return "0";
  }
}

// Crea headers con el usuario incluido
export function getHeadersWithUsuario(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  const usuarioId = getUsuarioId();
  if (usuarioId && usuarioId !== "0") {
    headers['X-Usuario'] = usuarioId;
  }
  
  return headers;
}

// URL builder para el PAC (simulador o servicio externo)
export function pacUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PAC_BASE_URL}${p}`;
}