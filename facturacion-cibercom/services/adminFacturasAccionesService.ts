import { apiUrl } from './api';

export interface UsuarioCatalogoItem {
  usuarioId: string;
  noUsuario: string;
  nombreEmpleado: string;
  estatusUsuario?: string;
}

export interface ResumenUsuarioItem {
  usuarioId: string;
  noUsuario: string;
  nombreEmpleado: string;
  totalComprobantes: number;
  totalImporte: number;
  facturasArticulos: number;
  notasCredito: number;
  nominas: number;
  cartasPorte: number;
  complementosPago: number;
  retenciones: number;
  otros: number;
  ultimaEmision?: string;
}

export interface ComprobanteAdminItem {
  uuid: string;
  serie?: string;
  folio?: string;
  tipoFactura?: number;
  modulo: string;
  receptorRazonSocial?: string;
  receptorRfc?: string;
  total?: number;
  fecha?: string;
  estatusFacturacion?: string;
  estatusSat?: string;
  usuarioId: string;
  noUsuario?: string;
  nombreUsuario?: string;
  uuidOrigen?: string;
}

export interface AdminFacturasAccionesResponse {
  exitoso: boolean;
  mensaje: string;
  usuariosCatalogo: UsuarioCatalogoItem[];
  resumenUsuarios: ResumenUsuarioItem[];
  comprobantes: ComprobanteAdminItem[];
}

export interface AdminFacturasAccionesFiltros {
  usuario?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tipoFactura?: number;
  estatus?: string;
}

export async function consultarAdminFacturasAcciones(
  filtros: AdminFacturasAccionesFiltros = {}
): Promise<AdminFacturasAccionesResponse> {
  const params = new URLSearchParams();
  if (filtros.usuario) params.append('usuario', filtros.usuario);
  if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
  if (filtros.tipoFactura != null) params.append('tipoFactura', String(filtros.tipoFactura));
  if (filtros.estatus) params.append('estatus', filtros.estatus);

  const qs = params.toString();
  const url = apiUrl(`/admin/facturas-acciones${qs ? `?${qs}` : ''}`);
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new Error(`Error HTTP ${response.status}: ${txt || response.statusText}`);
  }
  return response.json() as Promise<AdminFacturasAccionesResponse>;
}

export const TIPOS_FACTURA_FILTRO = [
  { value: '', label: 'Todos los tipos' },
  { value: '1', label: 'Factura artículos' },
  { value: '2', label: 'Egreso / Nota crédito' },
  { value: '3', label: 'Carta porte' },
  { value: '4', label: 'Nómina' },
  { value: '5', label: 'Complemento de pago' },
  { value: '6', label: 'Retención de pagos' },
];
