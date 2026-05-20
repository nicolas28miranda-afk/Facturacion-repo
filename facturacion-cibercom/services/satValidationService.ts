import { apiUrl } from './api';

export interface SatValidationRequest {
  nombre: string;
  rfc: string;
  codigoPostal: string;
  regimenFiscal: string;
}

export interface SatValidationResponse {
  valido: boolean;
  mensaje?: string;
  timestamp?: string;
  errores?: string[];
  datosValidados?: {
    nombre?: string;
    rfc?: string;
    codigoPostal?: string;
    regimenFiscal?: string;
    tipoPersona?: string;
  };
}

class SatValidationService {
  /**
   * Valida RFC y datos fiscales con el SAT usando Finkok
   * El backend requiere: nombre, rfc, codigoPostal, regimenFiscal
   */
  public async validarDatosSat(request: SatValidationRequest): Promise<SatValidationResponse> {
    try {
      const response = await fetch(apiUrl('/sat/validar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // El backend puede retornar 200 con valido=false o 400
      const data: SatValidationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error al validar con SAT:', error);
      return {
        valido: false,
        mensaje: 'Error de conexión con el servicio de validación SAT',
        errores: [error instanceof Error ? error.message : 'Error desconocido'],
      };
    }
  }

  /**
   * Valida solo el RFC con el SAT (requiere datos mínimos)
   */
  public async validarRFC(
    rfc: string, 
    nombre: string = 'Validación RFC',
    codigoPostal: string = '00000',
    regimenFiscal: string = '601'
  ): Promise<SatValidationResponse> {
    return this.validarDatosSat({
      nombre,
      rfc: rfc.toUpperCase().trim(),
      codigoPostal,
      regimenFiscal,
    });
  }

  /**
   * Obtiene los regímenes fiscales disponibles
   */
  public async obtenerRegimenesFiscales(): Promise<string[]> {
    try {
      const response = await fetch(apiUrl('/sat/regimenes'));
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error al obtener regímenes fiscales:', error);
      return [];
    }
  }
}

export const satValidationService = new SatValidationService();

