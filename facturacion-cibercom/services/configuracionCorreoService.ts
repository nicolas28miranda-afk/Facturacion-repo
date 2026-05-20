// Servicio para el manejo de configuración de correos electrónicos
import formatoCorreoService from './formatoCorreoService';
import { apiUrl } from './api';

export interface ConfiguracionMensaje {
  asunto: string;
  mensaje: string;
  mensajePersonalizado?: string;
  esPersonalizado: boolean;
}

export interface ConfiguracionMensajeRequest {
  asunto: string;
  mensaje: string;
  esPersonalizado: boolean;
  formatoCorreo?: any;
}

export interface ConfiguracionMensajeResponse {
  exitoso: boolean;
  mensaje?: string;
  configuracion?: ConfiguracionMensaje;
}

class ConfiguracionCorreoService {
  private baseUrl = apiUrl('/correo');

  /**
   * Obtiene la configuración de mensaje actual desde la base de datos
   */
  async obtenerConfiguracionMensaje(): Promise<ConfiguracionMensajeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/configuracion-mensajes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Obtener el mensaje predeterminado (base) siempre
      const mensajePredeterminado = await this.obtenerMensajePredeterminado();
      
      // Si hay configuración personalizada, usarla; si no, usar la predeterminada
      let configuracion: ConfiguracionMensaje;
      
      if (data.mensajesPersonalizados && data.mensajesPersonalizados.length > 0) {
        // Usar el primer mensaje personalizado
        const personalizado = data.mensajesPersonalizados[0];
        configuracion = {
          asunto: personalizado.asunto || 'Factura Electrónica - {facturaInfo}',
          mensaje: mensajePredeterminado.mensaje || '', // Mensaje base (protegido)
          mensajePersonalizado: personalizado.mensaje || '', // Solo la parte personalizada
          esPersonalizado: true
        };
      } else {
        configuracion = {
          asunto: mensajePredeterminado.asunto || 'Factura Electrónica - {facturaInfo}',
          mensaje: mensajePredeterminado.mensaje || '',
          mensajePersonalizado: '', // Sin mensaje personalizado
          esPersonalizado: false
        };
      }

      return {
        exitoso: true,
        configuracion
      };
    } catch (error) {
      console.error('Error al obtener configuración de correo:', error);
      
      // Retornar configuración predeterminada en caso de error
      return {
        exitoso: true,
        configuracion: {
          asunto: 'Factura Electrónica - {facturaInfo}',
          mensaje: 'Se ha generado su factura electrónica.\n\nGracias por su preferencia.',
          esPersonalizado: false
        }
      };
    }
  }

  /**
   * Obtiene el mensaje predeterminado desde el backend
   */
  async obtenerMensajePredeterminado(): Promise<ConfiguracionMensaje> {
    try {
      const response = await fetch(`${this.baseUrl}/mensaje/completo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return {
        asunto: data.asunto || 'Factura Electrónica - {facturaInfo}',
        mensaje: data.mensaje || '',
        esPersonalizado: false
      };
    } catch (error) {
      console.error('Error al obtener mensaje predeterminado:', error);
      // Retornar mensaje predeterminado hardcodeado más amigable
      return {
        asunto: 'Factura Electrónica',
        mensaje: 'Estimado cliente,\n\nSe ha generado su factura electrónica.\n\nTenga un buen día\n\nDatos de la factura\nSerie:\tEJEMPLO\nFolio:\tEJEMPLO\nUUID:\tEJEMPLO\nRFC Receptor:\tEJEMPLO\n\nGracias por su preferencia.\n\nAtentamente,\nEquipo de Facturación Cibercom',
        esPersonalizado: false
      };
    }
  }

  /**
   * Guarda la configuración de mensaje
   */
  async guardarConfiguracionMensaje(configuracion: ConfiguracionMensajeRequest): Promise<ConfiguracionMensajeResponse> {
    try {
      // Preparar los datos en el formato que espera el backend
      const requestData: any = {
        mensajeSeleccionado: configuracion.esPersonalizado ? 'personalizado' : 'completo',
        mensajesPersonalizados: configuracion.esPersonalizado ? [{
          id: 'personalizado',
          nombre: 'Mensaje Personalizado',
          asunto: configuracion.asunto,
          mensaje: configuracion.mensaje
        }] : []
      };
      if (configuracion.formatoCorreo) {
        requestData.formatoCorreo = configuracion.formatoCorreo;
      }

      const response = await fetch(`${this.baseUrl}/configuracion-mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return {
        exitoso: true,
        mensaje: data.mensaje || 'Configuración guardada correctamente'
      };
    } catch (error) {
      console.error('Error al guardar configuración de correo:', error);
      return {
        exitoso: false,
        mensaje: 'Error al guardar la configuración'
      };
    }
  }

  /**
   * Restaura el mensaje predeterminado
   */
  async restaurarMensajePredeterminado(): Promise<ConfiguracionMensajeResponse> {
    try {
      // Limpiar configuraciones personalizadas
      const requestData = {
        mensajeSeleccionado: 'completo',
        mensajesPersonalizados: []
      };

      const response = await fetch(`${this.baseUrl}/configuracion-mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      // Obtener el mensaje predeterminado
      const mensajePredeterminado = await this.obtenerMensajePredeterminado();

      return {
        exitoso: true,
        mensaje: 'Mensaje predeterminado restaurado correctamente',
        configuracion: mensajePredeterminado
      };
    } catch (error) {
      console.error('Error al restaurar mensaje predeterminado:', error);
      return {
        exitoso: false,
        mensaje: 'Error al restaurar el mensaje predeterminado'
      };
    }
  }

  /**
   * Procesa un mensaje reemplazando las variables con los valores reales
   */
  procesarMensaje(plantilla: string, variables: {
    facturaInfo?: string;
    serie?: string;
    folio?: string;
    uuid?: string;
    rfcEmisor?: string;
    rfcReceptor?: string;
  }): string {
    let mensaje = plantilla;
    
    if (variables.facturaInfo) {
      mensaje = mensaje.replace(/{facturaInfo}/g, variables.facturaInfo);
    }
    if (variables.serie) {
      mensaje = mensaje.replace(/{serie}/g, variables.serie);
    }
    if (variables.folio) {
      mensaje = mensaje.replace(/{folio}/g, variables.folio);
    }
    if (variables.uuid) {
      mensaje = mensaje.replace(/{uuid}/g, variables.uuid);
    }
    if (variables.rfcEmisor) {
      mensaje = mensaje.replace(/{rfcEmisor}/g, variables.rfcEmisor);
    }
    if (variables.rfcReceptor) {
      mensaje = mensaje.replace(/{rfcReceptor}/g, variables.rfcReceptor);
    }
    
    return mensaje;
  }

  /**
   * Procesa un mensaje con formato HTML aplicado
   */
  async procesarMensajeConFormato(plantilla: string, variables: {
    facturaInfo?: string;
    serie?: string;
    folio?: string;
    uuid?: string;
    rfcEmisor?: string;
    rfcReceptor?: string;
  }): Promise<string> {
    // Primero procesar las variables
    const mensajeProcesado = this.procesarMensaje(plantilla, variables);
    
    try {
      // Obtener configuración de formato
      const formatoResponse = await formatoCorreoService.obtenerConfiguracionActiva();
      
      // Aplicar formato HTML si hay configuración
      if (formatoResponse.exitoso && formatoResponse.configuracion) {
        const mensajeConFormato = formatoCorreoService.aplicarFormatoHTML(mensajeProcesado, formatoResponse.configuracion);
        return mensajeConFormato;
      }
      
      // Si no hay configuración, devolver mensaje sin formato especial
      return mensajeProcesado.replace(/\n/g, '<br>');
    } catch (error) {
      console.error('Error al aplicar formato al mensaje:', error);
      // Si hay error, devolver mensaje sin formato
      return mensajeProcesado.replace(/\n/g, '<br>');
    }
  }

  /**
   * Obtiene el mensaje configurado para envío de correos
   */
  async obtenerMensajeParaEnvio(): Promise<ConfiguracionMensaje | null> {
    try {
      const config = await this.obtenerConfiguracionMensaje();
      return config.exitoso && config.configuracion ? config.configuracion : null;
    } catch (error) {
      console.error('Error al obtener mensaje para envío:', error);
      return null;
    }
  }
}

export const configuracionCorreoService = new ConfiguracionCorreoService();