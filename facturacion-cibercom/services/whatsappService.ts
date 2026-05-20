/**
 * Servicio para envío de facturas por WhatsApp
 */
import { apiUrl } from './api';
import { logoService } from './logoService';

export interface EnvioWhatsAppRequest {
  uuidFactura: string;
  numeroDestino: string;
  mensaje?: string;
  /** Logo de configuración de correo (mismo criterio que envío por email). */
  logoBase64?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  message: string;
  numeroDestino?: string;
}

export interface ConfiguracionWhatsAppResponse {
  configurado: boolean;
  message: string;
}

class WhatsAppService {
  private baseUrl = apiUrl('/whatsapp');

  /**
   * Valida formato de número de teléfono (internacional, solo dígitos)
   * Ejemplo válido: 5215512345678 para México
   */
  validarNumero(numero: string): boolean {
    if (!numero || !numero.trim()) return false;
    const limpio = numero.trim().replace(/[\s+\-()]/g, '');
    return limpio.length >= 10 && /^\d+$/.test(limpio);
  }

  /**
   * Normaliza el número al formato WhatsApp (solo dígitos)
   */
  normalizarNumero(numero: string): string {
    if (!numero || !numero.trim()) return '';
    return numero.trim().replace(/[\s+\-()]/g, '');
  }

  /**
   * Verifica si WhatsApp está configurado en el backend
   */
  async verificarConfiguracion(): Promise<ConfiguracionWhatsAppResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verificar-configuracion`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error al verificar configuración WhatsApp:', error);
      return { configurado: false, message: 'No se pudo verificar la configuración' };
    }
  }

  /**
   * Envía factura (PDF + XML) por WhatsApp
   */
  async enviarFactura(request: EnvioWhatsAppRequest): Promise<WhatsAppResponse> {
    try {
      const numeroNormalizado = this.normalizarNumero(request.numeroDestino);
      const storedLogo = logoService.obtenerLogo();
      const logoBase64 =
        request.logoBase64?.trim() ||
        (await logoService.obtenerLogoActivoBackend()) ||
        storedLogo ||
        '';
      const response = await fetch(`${this.baseUrl}/enviar-factura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuidFactura: request.uuidFactura,
          numeroDestino: numeroNormalizado,
          mensaje: request.mensaje || '',
          logoBase64: logoBase64 || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Error HTTP: ${response.status}`,
        };
      }

      return {
        success: data.success ?? false,
        message: data.message || (data.success ? 'Factura enviada por WhatsApp' : 'Error al enviar'),
        numeroDestino: data.numeroDestino,
      };
    } catch (error) {
      console.error('Error al enviar factura por WhatsApp:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al enviar por WhatsApp',
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
