import { apiUrl } from './api';

export interface Justificacion {
  id: number;
  descripcion: string;
}

export interface JustificacionListResponse {
  success: boolean;
  message: string;
  data: Justificacion[];
  total: number;
}

class JustificacionService {
  private baseUrl = apiUrl('/justificaciones');

  async listar(): Promise<Justificacion[]> {
    const resp = await fetch(this.baseUrl);
    const json = (await resp.json()) as JustificacionListResponse;
    if (json.success) {
      return json.data || [];
    }
    throw new Error(json.message || 'Error al obtener justificaciones');
  }
}

export const justificacionService = new JustificacionService();