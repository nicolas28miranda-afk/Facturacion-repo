// Servicio para el manejo de correos electrónicos
export interface EnvioCorreoRequest {
  facturaUuid: string;
  correoReceptor: string;
}

export interface EnvioCorreoDirectaRequest {
  serieFactura: string;
  folioFactura: string;
  uuidFactura: string;
  rfcEmisor: string;
  correoReceptor: string;
}

export interface CorreoResponse {
  success: boolean;
  message: string;
  facturaUuid?: string;
  correoReceptor?: string;
  factura?: string;
  /** true = no se envió por SMTP real (solo respuesta OK del API) */
  simulado?: boolean;
}

export interface ConfiguracionCorreoResponse {
  configuracionCompleta: boolean;
  mensaje: string;
}

export interface EnvioCorreoPdfRequest {
  uuidFactura: string;
  correoReceptor: string;
  asunto: string;
  mensaje: string;
  cuerpo?: string;
  // Nuevo: logo base64 opcional para branding del PDF
  logoBase64?: string;
}

export interface EnvioPdfDirectoRequest {
  pdfBase64: string;
  correoReceptor: string;
  asunto: string;
  mensaje: string;
  nombreAdjunto?: string;
  cuerpo?: string;
  templateVars?: Record<string, string>;
  // Nuevo: XML opcional
  xmlBase64?: string;
  nombreAdjuntoXml?: string;
}

import { apiUrl } from './api';
import { logoService } from './logoService';

class CorreoService {
  private baseUrl = apiUrl('/correo');

  /**
   * Envía correo de factura por UUID
   */
  async enviarCorreoPorUuid(facturaUuid: string, correoReceptor: string): Promise<CorreoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/enviar-factura/${facturaUuid}?correoReceptor=${encodeURIComponent(correoReceptor)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al enviar correo por UUID:', error);
      throw error;
    }
  }

  /**
   * Envía correo de factura con datos directos
   */
  async enviarCorreoDirecto(request: EnvioCorreoDirectaRequest): Promise<CorreoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/enviar-factura-directa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al enviar correo directo:', error);
      throw error;
    }
  }

  /**
   * Verifica la configuración de correo
   */
  async verificarConfiguracion(): Promise<ConfiguracionCorreoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verificar-configuracion`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al verificar configuración de correo:', error);
      throw error;
    }
  }

  /**
   * Valida formato de email
   */
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Envía correo con PDF adjunto
   */
  async enviarCorreoConPdfAdjunto(request: EnvioCorreoPdfRequest): Promise<CorreoResponse> {
    try {
      // El logo para el PDF lo resuelve el backend desde disco (Configuración → Mensajes de Correo).
      // No adjuntar logoBase64 enorme en el JSON: puede romper el envío SMTP.
      const requestData = {
        ...request,
        cuerpo: request.mensaje,
        mensaje: request.mensaje,
      };
      
      console.log('Enviando solicitud de correo con PDF:', JSON.stringify({ ...requestData, mensaje: '[omitted]', cuerpo: '[omitted]' }, null, 2));
      
      const response = await fetch(`${this.baseUrl}/enviar-con-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json().catch(() => ({} as CorreoResponse));

      if (!response.ok) {
        const msg =
          (data && typeof data.message === 'string' && data.message) ||
          `Error HTTP: ${response.status}`;
        return { success: false, message: msg };
      }

      return data as CorreoResponse;
    } catch (error) {
      console.error('Error al enviar correo con PDF adjunto:', error);
      throw error;
    }
  }
  /**
   * Envía PDF directo por correo (sin UUID)
   */
  async enviarPdfDirecto(request: EnvioPdfDirectoRequest): Promise<CorreoResponse> {
    try {
      const requestData = {
        ...request,
        cuerpo: request.mensaje,
        templateVars: request.templateVars || {},
        xmlBase64: request.xmlBase64 || undefined,
        nombreAdjuntoXml: request.nombreAdjuntoXml || undefined,
      };
      console.log('Enviando solicitud de correo con PDF directo:', JSON.stringify({ ...requestData, mensaje: '[omitted]', cuerpo: '[omitted]' }, null, 2));
      const response = await fetch(`${this.baseUrl}/enviar-pdf-directo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al enviar PDF directo:', error);
      throw error;
    }
  }
}

export const correoService = new CorreoService();