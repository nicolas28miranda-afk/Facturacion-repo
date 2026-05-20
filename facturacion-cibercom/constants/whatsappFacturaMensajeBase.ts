/**
 * Texto estándar del envío por WhatsApp (debe coincidir con el default en WhatsAppService.java).
 * La plantilla hello_world de Meta no se puede personalizar; este texto va en un mensaje type=text después.
 */
export const WHATSAPP_MENSAJE_BASE_FACTURA = `Estimado(a) cliente,

Por este medio le hacemos llegar su factura electrónica.

Agradecemos su preferencia.

Atentamente,
Equipo de Facturación`;

export function construirMensajeWhatsAppFactura(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra ? `${WHATSAPP_MENSAJE_BASE_FACTURA}\n\n${extra}` : WHATSAPP_MENSAJE_BASE_FACTURA;
}

export const WHATSAPP_MENSAJE_BASE_NOTA_CREDITO = `Estimado(a) cliente,

Por este medio le hacemos llegar su nota de crédito electrónica.

Agradecemos su preferencia.

Atentamente,
Equipo de Facturación`;

export function construirMensajeWhatsAppNotaCredito(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra ? `${WHATSAPP_MENSAJE_BASE_NOTA_CREDITO}\n\n${extra}` : WHATSAPP_MENSAJE_BASE_NOTA_CREDITO;
}

export const WHATSAPP_MENSAJE_BASE_COMPLEMENTO_PAGO = `Estimado(a) cliente,

Por este medio le hacemos llegar su complemento de pago electrónico.

Agradecemos su preferencia.

Atentamente,
Equipo de Facturación`;

export function construirMensajeWhatsAppComplementoPago(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra
    ? `${WHATSAPP_MENSAJE_BASE_COMPLEMENTO_PAGO}\n\n${extra}`
    : WHATSAPP_MENSAJE_BASE_COMPLEMENTO_PAGO;
}

export const WHATSAPP_MENSAJE_BASE_RETENCION_PAGO = `Estimado(a) cliente,

Por este medio le hacemos llegar su comprobante de retención de pagos electrónico.

Agradecemos su preferencia.

Atentamente,
Equipo de Facturación`;

export function construirMensajeWhatsAppRetencionPago(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra
    ? `${WHATSAPP_MENSAJE_BASE_RETENCION_PAGO}\n\n${extra}`
    : WHATSAPP_MENSAJE_BASE_RETENCION_PAGO;
}

export const WHATSAPP_MENSAJE_BASE_CARTA_PORTE = `Estimado(a) cliente,

Por este medio le hacemos llegar su carta porte electrónica.

Agradecemos su preferencia.

Atentamente,
Equipo de Facturación`;

export function construirMensajeWhatsAppCartaPorte(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra ? `${WHATSAPP_MENSAJE_BASE_CARTA_PORTE}\n\n${extra}` : WHATSAPP_MENSAJE_BASE_CARTA_PORTE;
}

export const WHATSAPP_MENSAJE_BASE_NOMINA = `Estimado(a) colaborador(a),

Por este medio le hacemos llegar su recibo de nómina electrónico.

Atentamente,
Equipo de Recursos Humanos`;

export function construirMensajeWhatsAppNomina(extraOpcional: string): string {
  const extra = extraOpcional?.trim();
  return extra ? `${WHATSAPP_MENSAJE_BASE_NOMINA}\n\n${extra}` : WHATSAPP_MENSAJE_BASE_NOMINA;
}
