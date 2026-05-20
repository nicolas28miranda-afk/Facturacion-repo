import { apiUrl, getHeadersWithUsuario } from './api';

export interface EmpleadoNomina {
  idEmpleado: number;
  noEmpleado?: string;
  noUsuario?: string;
  nombreEmpleado: string;
  correo?: string;
  telefono?: string;
  codigoPostal?: string;
  numSeguridadSocial?: string;
  salarioDiarioIntegrado?: number;
  periodicidadPago?: string;
  salarioBase?: number;
  rfc?: string;
  curp?: string;
  fechaAlta?: string;
}

export interface EmpleadoAltaPayload {
  noEmpleado?: string;
  rfc: string;
  curp?: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  correoElectronico?: string;
  telefono?: string;
  codigoPostal?: string;
  numSeguridadSocial?: string;
  salarioDiarioIntegrado?: string;
  periodicidadPago?: string;
  salarioBase?: string;
  fechaIngreso?: string;
}

export function parseNombreCompleto(nombreCompleto: string): {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
} {
  const parts = (nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { nombre: 'SIN NOMBRE', apellidoPaterno: '.' };
  }
  if (parts.length === 1) {
    return { nombre: parts[0], apellidoPaterno: '.' };
  }
  if (parts.length === 2) {
    return { nombre: parts[0], apellidoPaterno: parts[1] };
  }
  return {
    nombre: parts[0],
    apellidoPaterno: parts[1],
    apellidoMaterno: parts.slice(2).join(' '),
  };
}

export async function buscarEmpleadoParaNomina(criterio: string): Promise<EmpleadoNomina | null> {
  const q = criterio.trim();
  if (!q) return null;

  // Siempre por criterio: el backend resuelve NO_EMPLEADO, RFC o ID_EMPLEADO
  const response = await fetch(apiUrl(`/empleados?criterio=${encodeURIComponent(q)}`), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Error al buscar empleado: ${response.statusText}`);
  }
  return (await response.json()) as EmpleadoNomina;
}

/** Busca por No. Empleado / criterio y, si no hay resultado, por RFC. */
export async function resolverEmpleadoEnCatalogo(
  noEmpleado: string,
  rfc: string
): Promise<EmpleadoNomina | null> {
  const id = (noEmpleado || '').trim();
  const rfcTrim = (rfc || '').trim();
  if (id) {
    const porId = await buscarEmpleadoParaNomina(id);
    if (porId) return porId;
  }
  if (rfcTrim) {
    return buscarEmpleadoParaNomina(rfcTrim);
  }
  return null;
}

export async function guardarEmpleadoCatalogo(
  payload: EmpleadoAltaPayload
): Promise<EmpleadoNomina> {
  const response = await fetch(apiUrl('/empleados'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      (data && (data.mensaje || data.message || data.error)) ||
      `Error al guardar empleado (${response.status})`;
    throw new Error(msg);
  }
  return data as EmpleadoNomina;
}
