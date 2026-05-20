import { apiUrl } from './api';

export interface EstadisticasRapidas {
  facturasHoy: number;
  facturasMes: number;
  facturasAnio: number;
  ingresosHoy: number;
  ingresosMes: number;
  ingresosAnio: number;
}

export interface DatoGrafico {
  mes: string;
  facturas: number;
  boletas: number;
  notas: number;
  tickets: number;
}

export interface FacturaResumen {
  uuid: string;
  serie: string;
  folio: string;
  receptorRazonSocial: string;
  total: number;
  fechaFactura: string;
}

export interface DashboardEstadisticasResponse {
  exitoso: boolean;
  mensaje: string;
  estadisticasRapidas?: EstadisticasRapidas;
  datosGrafico?: DatoGrafico[];
  ultimasFacturas?: FacturaResumen[];
}

export class DashboardService {
  private static instance: DashboardService;
  private baseUrl = apiUrl('/dashboard');

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  public async obtenerEstadisticas(): Promise<DashboardEstadisticasResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/estadisticas`);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data as DashboardEstadisticasResponse;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      return {
        exitoso: false,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  public async consultarFacturasSustituidas(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<FacturaSustituidaResponse> {
    try {
      let url = `${this.baseUrl}/facturas-sustituidas`;
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data as FacturaSustituidaResponse;
    } catch (error) {
      console.error('Error consultando facturas sustituidas:', error);
      return {
        exitoso: false,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        facturas: [],
      };
    }
  }

  public async consultarFacturasPorUsuario(
    usuario?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<FacturasPorUsuarioResponse> {
    try {
      let url = `${this.baseUrl}/facturas-por-usuario`;
      const params = new URLSearchParams();
      if (usuario) params.append('usuario', usuario);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data as FacturasPorUsuarioResponse;
    } catch (error) {
      console.error('Error consultando facturas por usuario:', error);
      return {
        exitoso: false,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        usuarios: [],
      };
    }
  }
}

// Interfaces para facturas sustituidas
export interface FacturaSustituida {
  uuid: string;
  uuidOrig: string;
  serie: string;
  folio: string;
  receptorRazonSocial: string;
  receptorRfc: string;
  total: number;
  fechaFactura: string;
  serieOrig?: string;
  folioOrig?: string;
}

export interface FacturaSustituidaResponse {
  exitoso: boolean;
  mensaje: string;
  facturas: FacturaSustituida[];
}

// Interfaces para facturas por usuario
export interface DocumentoFacturacion {
  uuid: string;
  tipo: string; // "FACTURA", "NOTA_CREDITO"
  serie: string;
  folio: string;
  receptorRazonSocial: string;
  receptorRfc: string;
  total: number;
  fechaFactura: string;
  estatusFacturacion?: string;
  estatusSat?: string;
}

export interface UsuarioFacturas {
  usuario: string;
  nombreUsuario: string;
  totalFacturas: number;
  totalNotasCredito: number;
  totalImporte: number;
  documentos: DocumentoFacturacion[];
}

export interface FacturasPorUsuarioResponse {
  exitoso: boolean;
  mensaje: string;
  usuarios: UsuarioFacturas[];
}

export const dashboardService = DashboardService.getInstance();

