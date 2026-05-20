import { apiUrl, getHeadersWithUsuario } from './api';

export interface NominaFormPayload {
  logoBase64?: string;
  rfcEmisor: string;
  rfcReceptor: string;
  nombre: string;
  curp?: string;
  periodoPago?: string;
  fechaPago: string; // YYYY-MM-DD
  percepciones?: string; // decimal string
  deducciones?: string; // decimal string
  total?: string; // decimal string
  tipoNomina: string; // O/E
  usoCfdi: string; // CN01
  correoElectronico: string;
  domicilioFiscalReceptor?: string; // Código postal del receptor
  // CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal
  numSeguridadSocial?: string;
  fechaInicioRelLaboral?: string; // YYYY-MM-DD
  antiguedad?: string; // Formato PnYnMnDn (ej: P1Y2M15D)
  riesgoPuesto?: string; // Clave de riesgo del puesto
  salarioDiarioIntegrado?: string; // decimal string
}

export interface NominaSaveResponse {
  ok: boolean;
  message?: string;
  uuidFactura?: string;
  idFactura?: number;
  idFacturaNomina?: number;
  errors?: string[];
}

export interface NominaHistorialRecord {
  id: number;
  idEmpleado: string;
  fecha: string; // YYYY-MM-DD
  estado: string;
  uuid?: string;
  total?: string;
  percepciones?: string;
  deducciones?: string;
  tipoNomina?: string;
  folio?: string;
}

export async function guardarNomina(
  form: NominaFormPayload,
  idEmpleado: string,
  fechaNomina: string,
  rfcEmisorFallback?: string
): Promise<NominaSaveResponse> {
  const rfcEmisor = (form.rfcEmisor || rfcEmisorFallback || '').trim();
  const payload = {
    idEmpleado,
    fechaNomina,
    rfcEmisor,
    rfcReceptor: form.rfcReceptor,
    nombre: form.nombre,
    curp: form.curp || '',
    periodoPago: form.periodoPago || '',
    fechaPago: form.fechaPago,
    percepciones: form.percepciones || '0',
    deducciones: form.deducciones || '0',
    total: form.total || '',
    tipoNomina: form.tipoNomina,
    usoCfdi: form.usoCfdi || 'CN01',
    correoElectronico: form.correoElectronico,
    domicilioFiscalReceptor: form.domicilioFiscalReceptor || '',
    // CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal
    numSeguridadSocial: form.numSeguridadSocial || '',
    fechaInicioRelLaboral: form.fechaInicioRelLaboral || '',
    antiguedad: form.antiguedad || '',
    riesgoPuesto: form.riesgoPuesto || '',
    salarioDiarioIntegrado: form.salarioDiarioIntegrado || '',
    usuarioCreacion: 'frontend',
  };

  const resp = await fetch(apiUrl('/nominas/guardar'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({ ok: false, message: 'Respuesta inválida' }));
  return data as NominaSaveResponse;
}

export async function consultarHistorialNominas(
  idEmpleado: string,
  limit = 25
): Promise<NominaHistorialRecord[]> {
  const url = apiUrl(
    `/nominas/historial?idEmpleado=${encodeURIComponent(idEmpleado)}&limit=${limit}`
  );
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json().catch(() => []);
  return data as NominaHistorialRecord[];
}