import { apiUrl, pacUrl, API_BASE_URL, getHeadersWithUsuario } from './api';
import { logoService } from './logoService';

// Interfaz para los datos de factura para PDF
export interface FacturaData {
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  serie: string;
  folio: string;
  fechaEmision: string;
  importe: number;
  subtotal: number;
  iva: number;
  ieps?: number;
  conceptos: ConceptoFactura[];
  metodoPago: string;
  formaPago: string;
  usoCFDI: string;
  xmlTimbrado?: string;
  selloDigital?: string;
  selloCFD?: string;
  noCertificado?: string;
  cadenaOriginal?: string;
  estatusFacturacion: string;
  estatusSat: string;
}

// Interfaz para la respuesta del backend
export interface FacturaCompleta {
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  serie: string;
  folio: string;
  fechaEmision: string;
  importe: number;
  subtotal: number;
  iva: number;
  ieps?: number;
  conceptos: ConceptoFactura[];
  metodoPago: string;
  formaPago: string;
  usoCFDI: string;
  xmlContent?: string;
  selloDigital?: string;
  selloCFD?: string;
  noCertificado?: string;
  cadenaOriginal?: string;
  estatusFacturacion: string;
  estatusSat: string;
}

export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  importe: number;
}

export interface FacturaResponse {
  exitoso: boolean;
  mensaje: string;
  factura?: FacturaCompleta;
  error?: string;
}

export interface LogosResponse {
  exitoso: boolean;
  logoUrl: string;
  logoBase64?: string;
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  error?: string;
}

export interface CfdiConsultaBasicos {
  serie?: string;
  folio?: string;
  subtotal?: number;
  descuento?: number;
  iva?: number;
  ieps?: number;
  total?: number;
  metodoPago?: string;
  formaPago?: string;
  usoCfdi?: string;
  // Nuevos campos para desglose de IVA e IEPS
  iva16?: number;
  iva8?: number;
  iva0?: number;
  ivaExento?: number;
  ieps26?: number;
  ieps160?: number;
  ieps8?: number;
  ieps30?: number;
  ieps304?: number;
  ieps7?: number;
  ieps53?: number;
  ieps25?: number;
  ieps6?: number;
  ieps50?: number;
  ieps9?: number;
  ieps3?: number;
  ieps43?: number;
}

export interface CfdiConsultaRelacionados {
  tipoRelacion?: string;
  uuids?: string[];
  uuidOriginal?: string;
}

export interface CfdiConsultaPago {
  formaDePagoP?: string;
  fechaPago?: string;
  monedaP?: string;
  monto?: number;
  idDocumento?: string;
  serieDR?: string;
  folioDR?: string;
  monedaDR?: string;
  metodoDePagoDR?: string;
  numParcialidad?: string;
  impSaldoAnt?: number;
  impPagado?: number;
  impSaldoInsoluto?: number;
}

export interface CfdiConsultaResponse {
  exitoso: boolean;
  mensaje: string;
  uuid: string;
  estado: string;
  rfcReceptor?: string;
  basicos?: CfdiConsultaBasicos;
  relacionados?: CfdiConsultaRelacionados;
  pago?: CfdiConsultaPago;
}

// DTO de consulta de intereses
export interface InteresesDto {
  cuenta: string;
  fechaIni: string; // yyyy-MM-dd
  fechaFin: string; // yyyy-MM-dd
}

// Respuesta de consulta de intereses
export interface ConsultaInteresesResponse {
  exitoso: boolean;
  codigoRespuesta: string; // "00", "SOF" o "ERR"
  mensaje: string;
  financiero: number;
  financieroIva: number;
  moratorio: number;
  moratorioIva: number;
}

// Solicitud para emitir factura de intereses
export interface EmitirInteresesRequest {
  idUsuario: string;
  idTienda: string;
  codigoTienda?: string;
  cuenta: string;
  periodo: string; // yyyyMM
  // Datos fiscales del receptor y del formulario
  correoElectronico?: string;
  razonSocial?: string;
  nombre?: string;
  paterno?: string;
  materno?: string;
  pais?: string;
  receptor: {
    rfc: string;
    usoCfdi: string;
    regimenFiscal: string;
    domicilioFiscal: string;
  };
  importes: {
    interesFinanciero: number;
    interesMoratorio: number;
    ivaInteresFinanciero: number;
    ivaInteresMoratorio: number;
  };
  tipo?: 'INTERESES';
  idTiendaEmisora?: string; // opcional, si reglas del concepto lo indican
  formaPago?: string;
  medioPago?: string;
}

// Respuesta al emitir factura de intereses
export interface EmitirInteresesResponse {
  exitoso: boolean;
  mensaje: string;
  serie?: string;
  folio?: string;
  uuid?: string;
  fechaEmision?: string;
  error?: string;
  errorCode?: 'DUPLICADO' | 'FOLIOS' | 'DATOS_FISCALES';
}

// Respuesta de búsqueda de receptor por RFC
export interface BuscarReceptorResponse {
  encontrado: boolean;
  completoCFDI40: boolean;
  idReceptor?: string;
  receptor: {
    rfc: string;
    razonSocial?: string;
    nombre?: string;
    paterno?: string;
    materno?: string;
    pais?: string;
    domicilioFiscal?: string; // Debe incluir CP
    regimenFiscal?: string;
    usoCfdi?: string;
  };
  faltantes?: string[]; // Campos faltantes requeridos por CFDI 4.0
}

// Servicio para manejar las operaciones con facturas
export class FacturaService {
  private static instance: FacturaService;
  private baseUrl = API_BASE_URL;
  
  // Normaliza UUID al formato esperado por PAC (lowercase y con guiones si viene en 32 chars)
  private normalizarUuidParaPac(uuid: string): string {
    const clean = String(uuid || '').trim();
    if (clean.length === 32) {
      const guionado = `${clean.substring(0,8)}-${clean.substring(8,12)}-${clean.substring(12,16)}-${clean.substring(16,20)}-${clean.substring(20)}`;
      return guionado.toLowerCase();
    }
    return clean.toLowerCase();
  }
  
  public static getInstance(): FacturaService {
    if (!FacturaService.instance) {
      FacturaService.instance = new FacturaService();
    }
    return FacturaService.instance;
  }

  /**
   * Busca receptor por RFC en el backend. Si el endpoint no existe, simula resultados.
   */
  public async buscarReceptorPorRFC(params: { rfc: string; idTienda: string; correoElectronico: string }): Promise<BuscarReceptorResponse> {
    const payload = {
      rfc: params.rfc?.toUpperCase(),
      idTienda: params.idTienda,
      correoElectronico: params.correoElectronico,
    };
    try {
      const resp = await fetch(`${this.baseUrl}/receptor/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        // Si el servidor responde 404, simular "no encontrado"
        if (resp.status === 404) {
          return { encontrado: false, completoCFDI40: false, receptor: { rfc: payload.rfc }, faltantes: [] };
        }
        // Cualquier otro error: lanzar para fallback
        throw new Error(data?.mensaje || `Error HTTP ${resp.status}`);
      }
      // Se asume que el backend devuelve estructura compatible o cercana
      return {
        encontrado: Boolean(data?.encontrado ?? true),
        completoCFDI40: Boolean(data?.completoCFDI40 ?? true),
        idReceptor: data?.idReceptor || `${payload.rfc}-ID`,
        receptor: {
          rfc: payload.rfc,
          razonSocial: data?.razonSocial || data?.receptor?.razonSocial,
          nombre: data?.nombre || data?.receptor?.nombre,
          paterno: data?.paterno || data?.receptor?.paterno,
          materno: data?.materno || data?.receptor?.materno,
          pais: data?.pais || data?.receptor?.pais || 'MEX',
          domicilioFiscal: data?.domicilioFiscal || data?.receptor?.domicilioFiscal,
          regimenFiscal: data?.regimenFiscal || data?.receptor?.regimenFiscal,
          usoCfdi: data?.usoCfdi || data?.receptor?.usoCfdi || 'G03',
        },
        faltantes: data?.faltantes || [],
      };
    } catch (error) {
      // Fallback simulado: si RFC parece válido, regresar receptor completo/incompleto según regla simple
      const rfcValido = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(payload.rfc || '');
      if (!rfcValido) {
        return { encontrado: false, completoCFDI40: false, receptor: { rfc: payload.rfc || '' }, faltantes: [] };
      }
      // Simular variaciones: si homoclave termina en 0 crea faltantes
      const homoclave = (payload.rfc || '').slice(-3);
      const incompleto = homoclave.includes('0');
      if (incompleto) {
        return {
          encontrado: true,
          completoCFDI40: false,
          idReceptor: `${payload.rfc}-SIM`,
          receptor: {
            rfc: payload.rfc,
            razonSocial: '',
            nombre: '',
            paterno: '',
            materno: '',
            pais: 'MEX',
            domicilioFiscal: '',
            regimenFiscal: '',
            usoCfdi: '',
          },
          faltantes: ['domicilioFiscal', 'razonSocial', 'regimenFiscal'],
        };
      }
      return {
        encontrado: true,
        completoCFDI40: true,
        idReceptor: `${payload.rfc}-SIM`,
        receptor: {
          rfc: payload.rfc,
          razonSocial: `Cliente ${payload.rfc}`,
          nombre: 'Nombre',
          paterno: 'Paterno',
          materno: 'Materno',
          pais: 'MEX',
          domicilioFiscal: 'CP 12345, Calle Simulada 123',
          regimenFiscal: '612',
          usoCfdi: 'G03',
        },
        faltantes: [],
      };
    }
  }

  /**
   * Consulta los intereses para una cuenta y periodo.
   * El backend intentará SOAP y hará fallback si no está disponible.
   */
  public async consultarIntereses(dto: InteresesDto): Promise<ConsultaInteresesResponse> {
    try {
      const resp = await fetch(`${this.baseUrl}/intereses/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data) {
        throw new Error(data?.mensaje || `Error HTTP ${resp.status}`);
      }
      return {
        exitoso: Boolean(data.exitoso ?? true),
        codigoRespuesta: String(data.codigoRespuesta ?? 'SOF'),
        mensaje: String(data.mensaje ?? ''),
        financiero: Number(data.financiero ?? 0),
        financieroIva: Number(data.financieroIva ?? 0),
        moratorio: Number(data.moratorio ?? 0),
        moratorioIva: Number(data.moratorioIva ?? 0),
      };
    } catch (error: any) {
      // Fallback en cliente: valores cero con mensaje
      return {
        exitoso: false,
        codigoRespuesta: 'ERR',
        mensaje: error?.message || 'Error consultando intereses',
        financiero: 0,
        financieroIva: 0,
        moratorio: 0,
        moratorioIva: 0,
      };
    }
  }

  /**
   * Obtiene los datos completos de una factura por UUID
   */
  public async obtenerFacturaPorUUID(uuid: string): Promise<FacturaCompleta> {
    try {
      let response = await fetch(apiUrl(`/factura/timbrado/status/${uuid}`));
      // Fallback al PAC simulador si no está disponible en backend principal
      if (!response.ok) {
        const uuidPac = this.normalizarUuidParaPac(uuid);
        const pacResp = await fetch(pacUrl(`/descargar-xml/${encodeURIComponent(uuidPac)}`));
        if (!pacResp.ok) {
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        response = pacResp;
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      // Camino 1: JSON (backend principal)
      if (contentType.includes('application/json') || contentType.includes('text/json')) {
        const data = await response.json();
        if (!data.exitoso || !data.datosFactura) {
          throw new Error(data.mensaje || 'No se encontró la factura');
        }
        const factura = data.datosFactura;
        return {
          uuid: data.uuid || uuid,
          rfcEmisor: factura.rfcEmisor || 'EEM123456789',
          nombreEmisor: factura.nombreEmisor || 'Empresa Ejemplo',
          rfcReceptor: factura.rfcReceptor || 'XEXX010101000',
          nombreReceptor: factura.nombreReceptor || 'Cliente Ejemplo',
          serie: factura.serie,
          folio: factura.folio,
          fechaEmision: factura.fechaTimbrado || factura.fechaEmision,
          importe: factura.total,
          subtotal: factura.subtotal,
          iva: factura.iva ?? 0,
          ieps: factura.ieps ?? 0,
          conceptos: Array.isArray(factura.conceptos) ? factura.conceptos.map((c: any) => ({
            descripcion: c.descripcion,
            cantidad: c.cantidad ?? 1,
            unidad: c.unidad || c.claveUnidad || 'H87',
            precioUnitario: c.valorUnitario ?? c.precioUnitario ?? factura.subtotal,
            importe: c.importe ?? factura.subtotal,
          })) : [],
          metodoPago: factura.metodoPago || 'PUE',
          formaPago: factura.formaPago || '01',
          usoCFDI: factura.usoCFDI || factura.usoCfdi || 'G03',
          xmlContent: data.xmlTimbrado || factura.xmlTimbrado,
          selloDigital: factura.selloDigital,
          selloCFD: factura.selloDigital,
          noCertificado: factura.certificado,
          cadenaOriginal: factura.cadenaOriginal,
          estatusFacturacion: factura.estatusFacturacion || 'Vigente',
          estatusSat: factura.estatusSat || 'Vigente',
        };
      }

      // Camino 2: XML CFDI (PAC/simulador u otros)
      const text = await response.text();
      if (!text || !text.trim().startsWith('<')) {
        throw new Error('Respuesta no JSON y no XML válida');
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');
      const comprobante = xml.getElementsByTagName('cfdi:Comprobante')[0] || xml.getElementsByTagName('Comprobante')[0];
      if (!comprobante) {
        throw new Error('XML CFDI inválido: no se encontró Comprobante');
      }

      const serie = comprobante.getAttribute('Serie') || '';
      const folio = comprobante.getAttribute('Folio') || '';
      const fecha = comprobante.getAttribute('Fecha') || '';
      const total = parseFloat(comprobante.getAttribute('Total') || '0');
      const subtotal = parseFloat(comprobante.getAttribute('SubTotal') || '0');

      // Impuestos
      let iva = 0;
      let ieps = 0;
      const traslados = xml.getElementsByTagName('cfdi:Traslado').length
        ? Array.from(xml.getElementsByTagName('cfdi:Traslado'))
        : Array.from(xml.getElementsByTagName('Traslado'));
      traslados.forEach((n: Element) => {
        const impuesto = n.getAttribute('Impuesto');
        const importe = parseFloat(n.getAttribute('Importe') || '0');
        if (impuesto === '002') iva += importe;
        if (impuesto === '003') ieps += importe;
      });

      const receptor = xml.getElementsByTagName('cfdi:Receptor')[0] || xml.getElementsByTagName('Receptor')[0];
      const emisor = xml.getElementsByTagName('cfdi:Emisor')[0] || xml.getElementsByTagName('Emisor')[0];
      const rfcReceptor = receptor?.getAttribute('Rfc') || '';
      const nombreReceptor = receptor?.getAttribute('Nombre') || '';
      const usoCFDI = receptor?.getAttribute('UsoCFDI') || '';
      const rfcEmisor = emisor?.getAttribute('Rfc') || '';
      const nombreEmisor = emisor?.getAttribute('Nombre') || '';

      const conceptosNodes = xml.getElementsByTagName('cfdi:Concepto').length
        ? Array.from(xml.getElementsByTagName('cfdi:Concepto'))
        : Array.from(xml.getElementsByTagName('Concepto'));
      const conceptos = conceptosNodes.map((node: Element) => {
        const descripcion = node.getAttribute('Descripcion') || '';
        const cantidad = parseFloat(node.getAttribute('Cantidad') || '1');
        const unidad = node.getAttribute('Unidad') || node.getAttribute('ClaveUnidad') || 'H87';
        const precioUnitario = parseFloat(node.getAttribute('ValorUnitario') || '0');
        const importe = parseFloat(node.getAttribute('Importe') || '0');
        return { descripcion, cantidad, unidad, precioUnitario, importe };
      });

      return {
        uuid,
        rfcEmisor: rfcEmisor || 'EEM123456789',
        nombreEmisor: nombreEmisor || 'Empresa Ejemplo',
        rfcReceptor: rfcReceptor || 'XEXX010101000',
        nombreReceptor: nombreReceptor || 'Cliente Ejemplo',
        serie,
        folio,
        fechaEmision: fecha,
        importe: total,
        subtotal,
        iva,
        ieps,
        conceptos,
        metodoPago: comprobante.getAttribute('MetodoPago') || 'PUE',
        formaPago: comprobante.getAttribute('FormaPago') || '01',
        usoCFDI: usoCFDI || 'G03',
        estatusFacturacion: 'Vigente',
        estatusSat: 'Vigente',
      };
    } catch (error) {
      console.error('Error obteniendo factura:', error);
      throw new Error(`Error al obtener la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene múltiples facturas por sus UUIDs
   */
  public async obtenerFacturasPorUUIDs(uuids: string[]): Promise<FacturaCompleta[]> {
    try {
      const promises = uuids.map(uuid => this.obtenerFacturaPorUUID(uuid));
      const facturas = await Promise.all(promises);
      return facturas;
    } catch (error) {
      console.error('Error obteniendo facturas:', error);
      throw new Error(`Error al obtener las facturas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene la configuración de logos y colores del backend
   * y sobrepone el logo guardado en localStorage si existe.
   */
  public async obtenerConfiguracionLogos(): Promise<LogosResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/logos/configuracion`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Preferir logo guardado por el usuario (puede ser data URI)
      const savedLogo = typeof window !== 'undefined' ? (logoService.obtenerLogo() || '') : '';
      const effectiveLogoBase64 = savedLogo.trim() ? savedLogo : (data.logoBase64 || undefined);
      
      return {
        exitoso: true,
        logoUrl: data.logoUrl || (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/') + 'images/cibercom-logo.svg',
        logoBase64: effectiveLogoBase64,
        customColors: data.customColors || {
          primary: '#2E86AB',
          secondary: '#1E4A5F',
          accent: '#0F2A3A'
        }
      };
    } catch (error) {
      console.error('Error obteniendo configuración de logos:', error);
      const savedLogo = typeof window !== 'undefined' ? (logoService.obtenerLogo() || '') : '';
      return {
        exitoso: false,
        logoUrl: (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/') + 'images/cibercom-logo.svg',
        logoBase64: savedLogo.trim() ? savedLogo : undefined,
        customColors: {
          primary: '#2E86AB',
          secondary: '#1E4A5F',
          accent: '#0F2A3A'
        },
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Convierte FacturaCompleta a FacturaData para el backend (pac-simulator-back)
   */
  public convertirAFacturaData(factura: FacturaCompleta): any {
    return {
      uuid: factura.uuid,
      serie: factura.serie,
      folio: factura.folio,
      fechaEmision: factura.fechaEmision,
      rfcEmisor: factura.rfcEmisor,
      nombreEmisor: factura.nombreEmisor,
      rfcReceptor: factura.rfcReceptor,
      nombreReceptor: factura.nombreReceptor,
      subtotal: factura.subtotal,
      iva: factura.iva,
      total: factura.importe,
      moneda: "MXN",
      metodoPago: factura.metodoPago,
      formaPago: factura.formaPago,
      usoCfdi: factura.usoCFDI,
      tipoComprobante: "I",
      lugarExpedicion: "12345",
      xmlTimbrado: factura.xmlContent || "<?xml version='1.0' encoding='UTF-8'?><cfdi:Comprobante></cfdi:Comprobante>",
      cadenaOriginal: factura.cadenaOriginal || `||1.1|${factura.uuid}|${factura.fechaEmision}||`,
      selloDigital: factura.selloDigital || "ABC123DEF456",
      certificado: factura.noCertificado || "MIIE",
      folioFiscal: factura.uuid,
      fechaTimbrado: factura.fechaEmision,
      conceptos: factura.conceptos.map(concepto => ({
        claveProdServ: "01010101",
        noIdentificacion: "PROD001",
        cantidad: concepto.cantidad,
        claveUnidad: "H87",
        unidad: concepto.unidad,
        descripcion: concepto.descripcion,
        valorUnitario: concepto.precioUnitario,
        importe: concepto.importe,
        descuento: 0.0,
        impuestos: [{
          tipo: "Traslado",
          impuesto: "002",
          tipoFactor: "Tasa",
          tasaOCuota: 0.16,
          base: concepto.importe,
          importe: concepto.importe * 0.16
        }]
      }))
    };
  }

  /**
   * Genera y descarga el PDF de una factura usando UUID
   * (Usa datos reales del backend y colores del formato de correo activo)
   */
  public async generarYDescargarPDF(uuid: string): Promise<void> {
    try {
      // Intentar obtener datos de la factura para nombrar el archivo.
      // Si falla (p.ej. 404 en timbrado/status), continuar con nombre por defecto.
      let fallbackFilename = `Factura_${uuid}.pdf`;
      try {
        const factura = await this.obtenerFacturaPorUUID(uuid);
        const serie = (factura.serie || '').trim();
        const folio = (factura.folio || '').trim();
        if (serie || folio) {
          fallbackFilename = `Factura_${serie}-${folio}.pdf`;
        }
      } catch (e) {
        console.warn('No se pudo obtener datos de la factura para el nombre del archivo. Usando nombre por defecto.', e);
      }

      // Descargar PDF desde el backend usando el endpoint que construye logo y colores
      const response = await fetch(apiUrl(`/factura/descargar-pdf/${uuid}`));

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(`Error al descargar PDF (HTTP ${response.status}) ${txt}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Usar filename del header si viene; sino, Serie-Folio
      const header = response.headers.get('content-disposition') || '';
      let filename = fallbackFilename;
      const match = header.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = match[1];
      }
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw new Error(`Error al descargar el PDF: ${error instanceof Error ? (error as Error).message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera y descarga el ZIP con XML y PDF de una factura
   */
  public async generarYDescargarZIP(uuid: string): Promise<void> {
    try {
      // Obtener datos de la factura
      const factura = await this.obtenerFacturaPorUUID(uuid);
      
      // Obtener configuración de logos
      const logoConfig = await this.obtenerConfiguracionLogos();
      
      if (!logoConfig.exitoso) {
        throw new Error('Error al obtener la configuración de logos');
      }
      
      // Convertir a formato para PDF
      const facturaData = this.convertirAFacturaData(factura);
      
      // Generar ZIP en el PAC (configurable vía VITE_PAC_BASE_URL)
      const response = await fetch(pacUrl('/generar-zip'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facturas: [{
            facturaData: facturaData
          }],
          logoConfig: logoConfig
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar ZIP en el servidor');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${factura.serie}-${factura.folio}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error generando ZIP:', error);
      throw new Error(`Error al generar el ZIP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera y descarga el XML de una factura
   */
  public async generarYDescargarXML(uuid: string): Promise<void> {
    try {
      // Intento principal: backend real
      let response = await fetch(apiUrl(`/factura/timbrado/status/${uuid}`));
      // Fallback si backend devuelve error (p. ej. 404 -> XML no disponible en Oracle)
      if (!response.ok) {
        const uuidPac = this.normalizarUuidParaPac(uuid);
        response = await fetch(pacUrl(`/descargar-xml/${encodeURIComponent(uuidPac)}`));
      }
      if (!response.ok) {
        throw new Error(`XML no disponible (HTTP ${response.status})`);
      }
      const xmlBlob = await response.blob();
      if (xmlBlob.size === 0) {
        throw new Error('El XML no está disponible para esta factura');
      }
      const url = window.URL.createObjectURL(xmlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FACTURA_${uuid}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando XML:', error);
      throw new Error(`Error al descargar el XML: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera y descarga múltiples facturas en un ZIP
   */
  public async generarYDescargarZIPMultiple(uuids: string[]): Promise<void> {
    try {
      if (uuids.length === 0) {
        throw new Error('No se han seleccionado facturas');
      }
      
      // Obtener todas las facturas
      const facturas = await this.obtenerFacturasPorUUIDs(uuids);
      
      // Obtener configuración de logos
      const logoConfig = await this.obtenerConfiguracionLogos();
      
      if (!logoConfig.exitoso) {
        throw new Error('Error al obtener la configuración de logos');
      }
      
      // Generar ZIP en el PAC (configurable vía VITE_PAC_BASE_URL)
      const response = await fetch(pacUrl('/generar-zip'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facturas: facturas.map(factura => ({
            facturaData: this.convertirAFacturaData(factura)
          })),
          logoConfig: logoConfig
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar ZIP en el servidor');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facturas_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error generando ZIP múltiple:', error);
      throw new Error(`Error al generar el ZIP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Emite una factura de intereses cumpliendo reglas de periodo, duplicado y folios.
   * Implementa llamada al backend y fallback seguro.
   */
  public async emitirFacturaIntereses(request: EmitirInteresesRequest): Promise<EmitirInteresesResponse> {
    try {
      // Validación mínima de receptor
      if (!request?.receptor?.rfc || !request?.receptor?.usoCfdi || !request?.receptor?.regimenFiscal || !request?.receptor?.domicilioFiscal) {
        return { exitoso: false, mensaje: 'Datos fiscales incompletos', error: 'Datos fiscales incompletos', errorCode: 'DATOS_FISCALES' };
      }

      // Construir payload para FacturaFrontendRequest del backend
      const frontendPayload: any = {
        rfc: request.receptor.rfc,
        correoElectronico: request.correoElectronico || 'cliente@example.com',
        razonSocial: request.razonSocial || request.receptor.rfc,
        nombre: request.nombre || '',
        paterno: request.paterno || '',
        materno: request.materno || '',
        pais: request.pais || 'MEX',
        noRegistroIdentidadTributaria: '',
        domicilioFiscal: request.receptor.domicilioFiscal,
        regimenFiscal: request.receptor.regimenFiscal,
        usoCfdi: request.receptor.usoCfdi,
        codigoFacturacion: `FAC-INTERESES-${(request.cuenta || '').replace(/\s+/g,'')}`,
        tienda: request.codigoTienda || request.idTienda,
        fecha: new Date().toISOString().slice(0, 10),
        terminal: 'TERM-INT',
        boleta: `INT-${(request.cuenta || '').replace(/\s+/g,'')}`,
        medioPago: request.medioPago || 'PUE',
        formaPago: request.formaPago || '01',
        iepsDesglosado: false,
        guardarEnMongo: true
      };

      const resp = await fetch(`${this.baseUrl}/factura/generar/frontend`, {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(frontendPayload)
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        return {
          exitoso: false,
          mensaje: data?.mensaje || 'Fallo al emitir en backend',
          error: data?.mensaje || 'Error en emisión'
        };
      }

      const serie = data?.datosFactura?.serie || 'INT';
      const folio = data?.datosFactura?.folio ? String(data.datosFactura.folio) : undefined;
      const uuid = data?.uuid || data?.datosFactura?.uuid;
      const fechaEmision = new Date().toISOString();

      return {
        exitoso: true,
        mensaje: data?.mensaje || 'Factura de intereses emitida',
        serie,
        folio,
        uuid,
        fechaEmision
      };
    } catch (error) {
      console.error('Error emitiendo intereses contra backend real:', error);
      return { exitoso: false, mensaje: 'Error al emitir intereses', error: (error as Error).message };
    }
  }
  /**
   * Consulta CFDI por UUID y valida RFC receptor, devolviendo datos por tipo
   */
  public async consultarCfdiPorUUID(params: { uuid: string; rfcReceptor?: string; tipo: 'I' | 'E' | 'P' }): Promise<CfdiConsultaResponse> {
    const { uuid, rfcReceptor, tipo } = params;
    const url = apiUrl(`/factura/consultar-uuid?uuid=${encodeURIComponent(uuid)}${rfcReceptor ? `&rfcReceptor=${encodeURIComponent(rfcReceptor.toUpperCase())}` : ''}&tipo=${encodeURIComponent(tipo)}`);
    const resp = await fetch(url);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      throw new Error(data?.mensaje || `Error HTTP ${resp.status}`);
    }
    return data as CfdiConsultaResponse;
  }
}

export const facturaService = FacturaService.getInstance();