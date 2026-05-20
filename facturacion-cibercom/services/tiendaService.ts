// Servicio para la gestión de tiendas
import { apiUrl } from './api';
export interface Tienda {
  idTienda?: number;
  codigoTienda: string;
  nombreTienda: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  telefono?: string;
  email?: string;
  gerente?: string;
  region?: string;
  zona?: string;
  tipoTienda?: string;
  estadoTienda?: string;
  fechaApertura?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  usuarioCreacion?: string;
  usuarioModificacion?: string;
  observaciones?: string;
}

export interface TiendaResponse {
  success: boolean;
  message: string;
  data?: Tienda | Tienda[];
  total?: number;
  error?: string;
}

export interface EstadisticasTiendas {
  totalTiendas: number;
  tiendasActivas: number;
  tiendasInactivas: number;
  tiendasSuspendidas: number;
  regiones: string[];
  zonas: string[];
  tiposTienda: string[];
}

export interface FiltrosTienda {
  estadoTienda?: string;
  region?: string;
  zona?: string;
  tipoTienda?: string;
  busqueda?: string;
}

class TiendaService {
  private baseUrl = apiUrl('/tiendas');

  /**
   * Crear una nueva tienda
   */
  async crearTienda(tienda: Tienda): Promise<TiendaResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tienda),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear tienda:', error);
      return {
        success: false,
        message: 'Error de conexión al crear la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar una tienda existente
   */
  async actualizarTienda(id: number, tienda: Tienda): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tienda),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al actualizar tienda:', error);
      return {
        success: false,
        message: 'Error de conexión al actualizar la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Listar tiendas con filtros opcionales
   */
  async listarTiendas(filtros?: FiltrosTienda): Promise<TiendaResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filtros) {
        if (filtros.estadoTienda) params.append('estadoTienda', filtros.estadoTienda);
        if (filtros.region) params.append('region', filtros.region);
        if (filtros.zona) params.append('zona', filtros.zona);
        if (filtros.tipoTienda) params.append('tipoTienda', filtros.tipoTienda);
        if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      }

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;
      const response = await fetch(url);

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al listar tiendas:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener las tiendas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener una tienda por ID
   */
  async obtenerTiendaPorId(id: number): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener tienda:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener una tienda por código
   */
  async obtenerTiendaPorCodigo(codigo: string): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/codigo/${codigo}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener tienda por código:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar una tienda (soft delete)
   */
  async eliminarTienda(id: number, usuarioModificacion?: string): Promise<TiendaResponse> {
    try {
      const url = usuarioModificacion ? `${this.baseUrl}/${id}?usuarioModificacion=${encodeURIComponent(usuarioModificacion)}` : `${this.baseUrl}/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar tienda:', error);
      return {
        success: false,
        message: 'Error de conexión al eliminar la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar una tienda permanentemente
   */
  async eliminarTiendaPermanente(id: number): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/permanente`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar tienda permanentemente:', error);
      return {
        success: false,
        message: 'Error de conexión al eliminar la tienda',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener estadísticas de tiendas
   */
  async obtenerEstadisticas(): Promise<{ success: boolean; data?: EstadisticasTiendas; message: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/estadisticas`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener las estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener tiendas activas
   */
  async obtenerTiendasActivas(): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/activas`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener tiendas activas:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener las tiendas activas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<TiendaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar salud del servicio de tiendas:', error);
      return {
        success: false,
        message: 'Error de conexión al verificar salud del servicio de tiendas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export const tiendaService = new TiendaService();