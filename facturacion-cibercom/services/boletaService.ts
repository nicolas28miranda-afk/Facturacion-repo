import { apiUrl } from './api';

export interface Boleta {
  idBoleta?: number;
  tienda: string;
  terminal?: string;
  numeroBoleta: string;
  fechaEmision?: string; // ISO string
  montoTotal?: number;
  estatus?: string;
}

export interface BoletaResponse {
  success: boolean;
  message: string;
  data?: Boleta;
  error?: string;
}

class BoletaService {
  private baseUrl = apiUrl('/boletas');

  async crearBoleta(boleta: Boleta): Promise<BoletaResponse> {
    const resp = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boleta),
    });
    const data = await resp.json();
    return data as BoletaResponse;
  }
}

export const boletaService = new BoletaService();