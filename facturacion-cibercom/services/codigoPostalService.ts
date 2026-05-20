import { apiUrl } from './api';

export interface CodigoPostalData {
  codigoPostal: string;
  estado: string;
  municipio: string;
  colonias: string[];
}

class CodigoPostalService {
  /**
   * Obtiene los datos de un código postal
   */
  public async obtenerDatosCP(codigoPostal: string): Promise<CodigoPostalData | null> {
    if (!codigoPostal || codigoPostal.length !== 5) {
      console.warn('Código postal inválido:', codigoPostal);
      return null;
    }

    try {
      const url = apiUrl(`/codigos-postales/${codigoPostal}`);
      console.log('Consultando código postal en:', url);
      
      const response = await fetch(url);
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error(`Error HTTP ${response.status}: ${response.statusText}`);
        const errorText = await response.text().catch(() => '');
        console.error('Detalles del error:', errorText);
        return null;
      }

      const data = await response.json();
      console.log('Datos recibidos del backend:', data);
      
      // Verificar que los datos tengan el formato esperado
      const resultado: CodigoPostalData = {
        codigoPostal: data.codigoPostal || codigoPostal,
        estado: data.estado || '',
        municipio: data.municipio || '',
        colonias: Array.isArray(data.colonias) ? data.colonias : [],
      };
      
      console.log('Datos procesados:', resultado);
      return resultado;
    } catch (error) {
      console.error('Error al obtener datos del código postal:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      return null;
    }
  }
}

export const codigoPostalService = new CodigoPostalService();

