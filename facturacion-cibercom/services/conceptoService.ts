import { apiUrl } from './api';

export interface AgregarConceptoRequest {
  uuidFactura?: string;
  idFactura?: number;
  skuClaveSat?: string;
  descripcion?: string;
  unidadMedida?: string;
  valorUnitario?: number;
  cantidad?: number; // opcional, default 1 en BD
  descuento?: number;
  tasaIva?: number; // en porcentaje ej. 16
  iva?: number;
  tasaIeps?: number; // en porcentaje ej. 26.5
  ieps?: number;
  noPedimento?: string;
}

export interface AgregarConceptoResponse {
  success: boolean;
  message: string;
  idConcepto?: number;
  idFactura?: number;
}

class ConceptoService {
  // baseUrl ya no se usa, se usa apiUrl() directamente
  // private baseUrl = 'http://174.136.25.157:8080/facturacion-backend-0.0.1-SNAPSHOT/api';

  async agregarConcepto(req: AgregarConceptoRequest): Promise<AgregarConceptoResponse> {
    const url = apiUrl('/conceptos');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uuidFactura: req.uuidFactura,
        idFactura: req.idFactura,
        skuClaveSat: req.skuClaveSat,
        descripcion: req.descripcion,
        unidadMedida: req.unidadMedida,
        valorUnitario: req.valorUnitario,
        cantidad: req.cantidad,
        descuento: req.descuento,
        tasaIva: req.tasaIva,
        iva: req.iva,
        tasaIeps: req.tasaIeps,
        ieps: req.ieps,
        noPedimento: req.noPedimento,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, message: text || 'Error al agregar concepto' };
    }
    const json = await resp.json();
    return json as AgregarConceptoResponse;
  }
}

export const conceptoService = new ConceptoService();