import { apiUrl, getHeadersWithUsuario } from './api';

export interface RetencionPayload {
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  razonSocial?: string;
  nombre?: string;
  paterno?: string;
  materno?: string;
  tipoPersona: 'moral' | 'fisica';
  tipoRetencion: string;
  montoBase: number;
  isrRetenido: number;
  ivaRetenido: number;
  montoRetenido: number;
  periodoMes: string;
  periodoAnio: string;
  fechaPago: string;
  concepto: string;
  correoReceptor: string;
  usuarioRegistro?: string | null;
  codigoPostalReceptor?: string; // CRÍTICO: Código postal del receptor (DomicilioFiscalR) - 5 dígitos
}

export interface RetencionResponse {
  success: boolean;
  message?: string;
  idRetencion?: number;
  facturaId?: number;
  errors?: string[];
  uuidRetencion?: string;
  xmlTimbrado?: string;
  serieRetencion?: string | null;
  folioRetencion?: string | null;
  fechaTimbrado?: string | null;
  correoReceptor?: string | null;
  rfcReceptor?: string | null;
  rfcEmisor?: string | null;
  montoRetenido?: number | null;
  baseRetencion?: number | null;
}

export interface RetencionEnvioPayload {
  uuidRetencion: string;
  correoReceptor: string;
  rfcReceptor?: string | null;
  rfcEmisor?: string | null;
  nombreReceptor?: string | null;
  nombreEmisor?: string | null;
  serieRetencion?: string | null;
  folioRetencion?: string | null;
  fechaTimbrado?: string | null;
  tipoRetencion?: string | null;
  montoRetenido?: string | number | null;
  baseRetencion?: string | number | null;
}

const handleJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorJson.errors?.join(', ') || 'Error en la solicitud');
    } catch {
      throw new Error(errorText || `Error HTTP: ${response.status}`);
    }
  }
  return response.json();
};

const registrarRetencion = async (payload: RetencionPayload): Promise<RetencionResponse> => {
  const response = await fetch(apiUrl('/retenciones/registrar'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify(payload),
  });

  const data = await handleJsonResponse<RetencionResponse>(response).catch(() => ({
    success: false,
    message: 'No se pudo registrar la retención.',
  }));

  if (!response.ok || !data.success) {
    const errorData = data as RetencionResponse;
    throw new Error(errorData.message || errorData.errors?.join(', ') || 'No se pudo registrar la retención.');
  }

  return data;
};

const enviarRetencionPorCorreo = async (
  payload: RetencionEnvioPayload,
): Promise<RetencionResponse> => {
  const response = await fetch(apiUrl('/retenciones/enviar-correo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await handleJsonResponse<RetencionResponse>(response).catch(() => ({
    success: false,
    message: 'No se pudo enviar la retención por correo.',
  }));

  if (!response.ok || !data.success) {
    const errorData = data as RetencionResponse;
    throw new Error(errorData.message || errorData.errors?.join(', ') || 'No se pudo enviar la retención por correo.');
  }

  return data;
};

export const retencionesService = {
  registrarRetencion,
  enviarRetencionPorCorreo,
};

