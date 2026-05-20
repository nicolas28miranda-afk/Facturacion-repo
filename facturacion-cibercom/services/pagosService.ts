import { apiUrl, getHeadersWithUsuario } from './api';

export interface PagoFacturaLookupResponse {
  success: boolean;
  message?: string;
  facturaId?: number;
  uuid?: string;
}

export interface PagoDetallePayload {
  fechaPago: string;
  formaPago: string;
  moneda: string;
  monto: number;
  uuid?: string;
}

export interface PagoComplementoPayload {
  facturaUuid: string;
  facturaId?: number;
  usuarioRegistro?: string | null;
  correoReceptor: string;
  pagos: PagoDetallePayload[];
}

export interface PagoComplementoResponse {
  success: boolean;
  message?: string;
  facturaId?: number;
  pagosInsertados?: number;
  errors?: string[];
  uuidComplemento?: string;
  xmlTimbrado?: string;
  serieComplemento?: string | null;
  folioComplemento?: string | null;
  fechaTimbrado?: string | null;
  totalPagado?: string | number | null;
  correoReceptor?: string | null;
  rfcReceptor?: string | null;
  rfcEmisor?: string | null;
}

export interface PagoComplementoEnvioPayload {
  uuidComplemento: string;
  facturaUuid: string;
  correoReceptor: string;
  serieComplemento?: string | null;
  folioComplemento?: string | null;
  fechaTimbrado?: string | null;
  rfcReceptor?: string | null;
  rfcEmisor?: string | null;
  nombreReceptor?: string | null;
  nombreEmisor?: string | null;
  metodoCfdi?: string | null;
  formaCfdi?: string | null;
  totalPagado?: string | number | null;
  moneda?: string | null;
  pagos: PagoDetallePayload[];
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Respuesta inesperada del servidor.');
  }
}

const buscarFacturaPorUuid = async (uuid: string): Promise<PagoFacturaLookupResponse> => {
  const response = await fetch(apiUrl(`/pagos/factura/${encodeURIComponent(uuid)}`));
  if (!response.ok) {
    const data = await handleJsonResponse<PagoFacturaLookupResponse>(response).catch(() => ({
      success: false,
      message: 'No se pudo consultar la factura por UUID.',
    }));
    throw new Error(data.message || 'No se pudo consultar la factura por UUID.');
  }
  return handleJsonResponse<PagoFacturaLookupResponse>(response);
};

const registrarComplemento = async (
  payload: PagoComplementoPayload,
): Promise<PagoComplementoResponse> => {
  const response = await fetch(apiUrl('/pagos/complemento'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify(payload),
  });

  const data = await handleJsonResponse<PagoComplementoResponse>(response).catch(() => ({
    success: false,
    message: 'No se pudo registrar el complemento de pagos.',
  }));

  if (!response.ok) {
    const errorData = data as PagoComplementoResponse;
    return {
      success: false,
      message: errorData.message || 'No se pudo registrar el complemento de pagos.',
      facturaId: errorData.facturaId,
      pagosInsertados: errorData.pagosInsertados,
      errors: errorData.errors,
    };
  }

  return data;
};

const enviarComplementoPorCorreo = async (
  payload: PagoComplementoEnvioPayload,
): Promise<PagoComplementoResponse> => {
  const response = await fetch(apiUrl('/pagos/complemento/enviar-correo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await handleJsonResponse<PagoComplementoResponse>(response).catch(() => ({
    success: false,
    message: 'No se pudo enviar el complemento por correo.',
  }));

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'No se pudo enviar el complemento por correo.');
  }

  return data;
};

export const pagosService = {
  buscarFacturaPorUuid,
  registrarComplemento,
  enviarComplementoPorCorreo,
};

