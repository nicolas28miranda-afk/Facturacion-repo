import { CustomColors } from '../types';

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
  selloDigital?: string;
  selloCFD?: string;
  noCertificado?: string;
  cadenaOriginal?: string;
}

export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  importe: number;
}

export interface LogoConfig {
  logoUrl: string;
  logoBase64?: string;
  customColors: CustomColors;
}

export interface NotaCreditoData extends FacturaData {
  referenciaFactura?: string;
  motivo?: string;
}

// Tipos para resumen de Facturación Global (reporte PDF)
export interface FacturaGlobalTicketDetalle {
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  precioUnitario?: number;
  subtotal?: number;
  ivaImporte?: number;
  total?: number;
}

export interface FacturaGlobalTicket {
  idTicket: number;
  fecha?: string;
  folio?: number;
  formaPago?: string;
  total?: number;
  detalles?: FacturaGlobalTicketDetalle[];
}

export interface FacturaGlobalFactura {
  uuid: string;
  serie?: string;
  folio?: string | number;
  fechaEmision?: string;
  importe?: number;
  estatusFacturacion?: string;
  estatusSat?: string;
  tienda?: string;
  tickets?: FacturaGlobalTicket[];
}

export interface GlobalResumenStats {
  totalFacturas?: number;
  totalTickets?: number;
  totalCartaPorte?: number;
}

export interface GlobalResumenMeta {
  periodoLabel: string;
  fecha: string;
  tiendaLabel: string;
}

export class PDFService {
  private static instance: PDFService;
  
  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  // Helper para formar la src del logo correctamente
  private getLogoSrc(logoUrl?: string, logoBase64?: string): string {
    if (logoBase64 && logoBase64.trim()) {
      const v = logoBase64.trim();
      // Si ya es un data URI, usarlo tal cual
      if (/^data:image\//i.test(v)) {
        return v;
      }
      // Si no tiene prefijo, asumir SVG (backend retorna SVG por defecto)
      return `data:image/svg+xml;base64,${v}`;
    }
    return logoUrl || (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/') + 'images/cibercom-logo.svg';
  }

  // Cargar script externo de forma dinámica
  private cargarScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src === url);
      if (existing) return resolve();
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      (script as any).referrerPolicy = 'no-referrer';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar script: ${url}`));
      document.head.appendChild(script);
    });
  }

  // Asegurar que hay motor de PDF disponible (html2pdf o fallback html2canvas+jsPDF)
  private async asegurarMotorPDF(): Promise<void> {
    const w = window as any;
    if (typeof w.html2pdf === 'function') return; // ya está

    // 1) Intentar cargar mediante imports locales (preferido)
    try {
      const mod = await import(/* webpackIgnore: true */ 'html2pdf.js');
      w.html2pdf = (mod as any).default || (mod as any);
    } catch {}

    if (typeof w.html2pdf !== 'function') {
      // Fallback local: html2canvas y jsPDF desde paquetes instalados
      try {
        const h2cMod = await import(/* webpackIgnore: true */ 'html2canvas');
        w.html2canvas = (h2cMod as any).default || (h2cMod as any);
      } catch {}
      try {
        const jspdfMod = await import(/* webpackIgnore: true */ 'jspdf');
        const jsPDFCtor = (jspdfMod as any).jsPDF || (jspdfMod as any).default?.jsPDF || (jspdfMod as any).default || (jspdfMod as any);
        if (jsPDFCtor) {
          w.jspdf = { jsPDF: jsPDFCtor };
          w.jsPDF = jsPDFCtor;
        }
      } catch {}
    }

    // 2) Si aún no se tiene el motor, intentar CDN como último recurso
    if (typeof w.html2pdf !== 'function' && !(typeof w.html2canvas === 'function' && (w.jspdf?.jsPDF || w.jsPDF))) {
      try {
        await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      } catch {
        try {
          await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
          await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        } catch {}
      }
    }

    // 3) Validación final
    if (typeof w.html2pdf !== 'function' && !(typeof w.html2canvas === 'function' && (w.jspdf?.jsPDF || w.jsPDF))) {
      throw new Error('Motor de PDF no disponible (html2pdf/jsPDF/html2canvas)');
    }
  }

  /**
   * Genera un PDF de la factura usando HTML y CSS
   */
  public async generarPDFFactura(
    facturaData: FacturaData, 
    logoConfig: LogoConfig
  ): Promise<Blob> {
    try {
      // Crear el HTML de la factura
      const htmlContent = this.generarHTMLFactura(facturaData, logoConfig);
      
      // Usar html2pdf para generar el PDF
      const pdf = await this.convertirHTMLaPDF(htmlContent);
      
      return pdf;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('Error al generar el PDF de la factura');
    }
  }

  /**
   * Genera el HTML de la factura con estilos
   */
  private generarHTMLFactura(facturaData: FacturaData, logoConfig: LogoConfig): string {
    const { customColors, logoUrl, logoBase64 } = logoConfig;
    const logoSrc = this.getLogoSrc(logoUrl, logoBase64);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura ${facturaData.serie}-${facturaData.folio}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          
          .factura-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid ${customColors.primary};
            padding-bottom: 20px;
          }
          
          .logo-section {
            flex: 1;
          }
          
          .logo {
            max-width: 200px;
            max-height: 80px;
            object-fit: contain;
          }
          
          .factura-info {
            flex: 1;
            text-align: right;
          }
          
          .factura-titulo {
            font-size: 24px;
            font-weight: bold;
            color: ${customColors.primary};
            margin-bottom: 10px;
          }
          
          .factura-numero {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .emisor-receptor {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .emisor, .receptor {
            flex: 1;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          
          .emisor {
            margin-right: 15px;
            background-color: ${customColors.secondary}20;
          }
          
          .receptor {
            margin-left: 15px;
            background-color: ${customColors.accent}20;
          }
          
          .seccion-titulo {
            font-weight: bold;
            font-size: 14px;
            color: ${customColors.primary};
            margin-bottom: 10px;
            border-bottom: 1px solid ${customColors.primary};
            padding-bottom: 5px;
          }
          
          .conceptos-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .conceptos-table th {
            background-color: ${customColors.primary};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
          }
          
          .conceptos-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
          }
          
          .conceptos-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .totales {
            float: right;
            width: 300px;
            margin-bottom: 30px;
          }
          
          .totales-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .totales-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
          }
          
          .totales-table .label {
            background-color: ${customColors.secondary};
            color: white;
            font-weight: bold;
            text-align: right;
          }
          
          .totales-table .total-final {
            background-color: ${customColors.primary};
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .sellos {
            clear: both;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          
          .sello {
            margin-bottom: 15px;
            word-break: break-all;
            font-size: 10px;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 3px;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          @media print {
            body {
              margin: 0;
            }
            
            .factura-container {
              max-width: none;
              margin: 0;
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="factura-container">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <img src="${logoSrc}" alt="Logo" class="logo" />
            </div>
            <div class="factura-info">
              <div class="factura-titulo">FACTURA</div>
              <div class="factura-numero">${facturaData.serie}-${facturaData.folio}</div>
              <div><strong>UUID:</strong> ${facturaData.uuid}</div>
              <div><strong>Fecha:</strong> ${new Date(facturaData.fechaEmision).toLocaleDateString('es-MX')}</div>
            </div>
          </div>
          
          <!-- Emisor y Receptor -->
          <div class="emisor-receptor">
            <div class="emisor">
              <div class="seccion-titulo">EMISOR</div>
              <div><strong>Nombre:</strong> ${facturaData.nombreEmisor}</div>
              <div><strong>RFC:</strong> ${facturaData.rfcEmisor}</div>
            </div>
            <div class="receptor">
              <div class="seccion-titulo">RECEPTOR</div>
              <div><strong>Nombre:</strong> ${facturaData.nombreReceptor}</div>
              <div><strong>RFC:</strong> ${facturaData.rfcReceptor}</div>
            </div>
          </div>
          
          <!-- Conceptos -->
          <table class="conceptos-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="text-center">Cantidad</th>
                <th class="text-center">Unidad</th>
                <th class="text-right">Precio Unitario</th>
                <th class="text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${facturaData.conceptos.map(concepto => `
                <tr>
                  <td>${concepto.descripcion}</td>
                  <td class="text-center">${concepto.cantidad}</td>
                  <td class="text-center">${concepto.unidad}</td>
                  <td class="text-right">$${concepto.precioUnitario.toFixed(2)}</td>
                  <td class="text-right">$${concepto.importe.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totales -->
          <div class="totales">
            <table class="totales-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="text-right">$${facturaData.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">IVA:</td>
                <td class="text-right">$${facturaData.iva.toFixed(2)}</td>
              </tr>
              ${facturaData.ieps ? `
                <tr>
                  <td class="label">IEPS:</td>
                  <td class="text-right">$${facturaData.ieps.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td class="label total-final">Total:</td>
                <td class="text-right total-final">$${facturaData.importe.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <!-- Información de pago -->
          <div style="clear: both; margin-top: 20px;">
            <div><strong>Método de Pago:</strong> ${facturaData.metodoPago}</div>
            <div><strong>Forma de Pago:</strong> ${facturaData.formaPago}</div>
            <div><strong>Uso CFDI:</strong> ${facturaData.usoCFDI}</div>
          </div>
          
          <!-- Sellos digitales -->
          ${facturaData.selloDigital || facturaData.selloCFD ? `
            <div class="sellos">
              <div class="seccion-titulo">SELLOS DIGITALES</div>
              ${facturaData.selloCFD ? `
                <div class="sello">
                  <strong>Sello CFD:</strong><br>
                  ${facturaData.selloCFD}
                </div>
              ` : ''}
              ${facturaData.selloDigital ? `
                <div class="sello">
                  <strong>Sello SAT:</strong><br>
                  ${facturaData.selloDigital}
                </div>
              ` : ''}
              ${facturaData.noCertificado ? `
                <div><strong>No. Certificado:</strong> ${facturaData.noCertificado}</div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convierte HTML a PDF usando html2pdf
   */
  private async convertirHTMLaPDF(htmlContent: string, filename: string = 'factura.pdf'): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      // Asegurar que el motor de PDF esté disponible
      try {
        await this.asegurarMotorPDF();
      } catch (err) {
        return reject(err);
      }
      // Crear un elemento temporal para el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      try {
        // Configuración para html2pdf
        const options = {
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const html2pdf = (window as any).html2pdf;
        // Preferir el flujo oficial: toPdf().get('pdf').output('blob')
        if (typeof html2pdf === 'function') {
          html2pdf()
            .from(tempDiv)
            .set(options)
            .toPdf()
            .get('pdf')
            .then((pdf: any) => {
              const blob: Blob = pdf.output('blob');
              document.body.removeChild(tempDiv);
              resolve(blob);
            })
            .catch((error: any) => {
              document.body.removeChild(tempDiv);
              reject(error);
            });
          return;
        }

        // Fallback robusto: usar html2canvas + jsPDF si están disponibles
        const html2canvas = (window as any).html2canvas;
        const jsPDFCtor = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (typeof html2canvas === 'function' && typeof jsPDFCtor === 'function') {
          html2canvas(tempDiv, options.html2canvas)
            .then((canvas: HTMLCanvasElement) => {
              const imgData = canvas.toDataURL('image/jpeg', 0.98);
              const pdf = new jsPDFCtor(options.jsPDF);
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
              const blob: Blob = pdf.output('blob');
              document.body.removeChild(tempDiv);
              resolve(blob);
            })
            .catch((error: any) => {
              document.body.removeChild(tempDiv);
              reject(error);
            });
          return;
        }

        // Último recurso: rechazar explícitamente para evitar abrir impresión
        document.body.removeChild(tempDiv);
        reject(new Error('Motor de PDF no disponible (html2pdf/jsPDF/html2canvas)'));
      } catch (error) {
        document.body.removeChild(tempDiv);
        reject(error);
      }
    });
  }

  /**
   * Descarga un archivo PDF
   */
  public descargarPDF(pdfBlob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Crea un archivo ZIP con XML y PDF
   */
  public async crearZipFactura(
    facturaData: FacturaData,
    xmlContent: string,
    logoConfig: LogoConfig
  ): Promise<Blob> {
    try {
      // Generar PDF
      const pdfBlob = await this.generarPDFFactura(facturaData, logoConfig);
      
      // Crear ZIP usando JSZip si está disponible
      if (typeof (window as any).JSZip !== 'undefined') {
        const zip = new (window as any).JSZip();
        
        // Agregar XML al ZIP
        zip.file(`${facturaData.serie}-${facturaData.folio}.xml`, xmlContent);
        
        // Agregar PDF al ZIP
        zip.file(`${facturaData.serie}-${facturaData.folio}.pdf`, pdfBlob);
        
        // Generar ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
      } else {
        throw new Error('JSZip no está disponible');
      }
    } catch (error) {
      console.error('Error creando ZIP:', error);
      throw new Error('Error al crear el archivo ZIP');
    }
  }

  /**
   * Descarga un archivo ZIP
   */
  public descargarZip(zipBlob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Genera un PDF de Nota de Crédito usando HTML y CSS
   */
  public async generarPDFNotaCredito(
    notaData: NotaCreditoData,
    logoConfig: LogoConfig
  ): Promise<Blob> {
    try {
      const htmlContent = this.generarHTMLNotaCredito(notaData, logoConfig);
      const pdf = await this.convertirHTMLaPDF(htmlContent, 'nota_credito.pdf');
      return pdf;
    } catch (error) {
      console.error('Error generando PDF de Nota de Crédito:', error);
      throw new Error('Error al generar el PDF de la nota de crédito');
    }
  }

  /**
   * Genera el HTML de la Nota de Crédito con estilos
   */
  private generarHTMLNotaCredito(notaData: NotaCreditoData, logoConfig: LogoConfig): string {
    const { customColors, logoUrl, logoBase64 } = logoConfig;
    const logoSrc = this.getLogoSrc(logoUrl, logoBase64);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota de Crédito ${notaData.serie}-${notaData.folio}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
          .factura-container { max-width: 800px; margin: 0 auto; padding: 20px; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid ${customColors.primary}; padding-bottom: 20px; }
          .logo-section { flex: 1; }
          .logo { max-width: 200px; max-height: 80px; object-fit: contain; }
          .factura-info { flex: 1; text-align: right; }
          .factura-titulo { font-size: 24px; font-weight: bold; color: ${customColors.primary}; margin-bottom: 10px; }
          .factura-numero { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .emisor-receptor { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .emisor, .receptor { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .emisor { margin-right: 15px; background-color: ${customColors.secondary}20; }
          .receptor { margin-left: 15px; background-color: ${customColors.accent}20; }
          .seccion-titulo { font-weight: bold; font-size: 14px; color: ${customColors.primary}; margin-bottom: 10px; border-bottom: 1px solid ${customColors.primary}; padding-bottom: 5px; }
          .referencias { margin-bottom: 20px; padding: 10px; border: 1px dashed ${customColors.primary}; border-radius: 5px; background-color: #f8fafc; }
          .conceptos-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .conceptos-table th { background-color: ${customColors.primary}; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
          .conceptos-table td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
          .conceptos-table tr:nth-child(even) { background-color: #f9f9f9; }
          .totales { float: right; width: 300px; margin-bottom: 30px; }
          .totales-table { width: 100%; border-collapse: collapse; }
          .totales-table td { padding: 8px 12px; border: 1px solid #ddd; }
          .totales-table .label { background-color: ${customColors.secondary}; color: white; font-weight: bold; text-align: right; }
          .totales-table .total-final { background-color: ${customColors.primary}; color: white; font-weight: bold; font-size: 14px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="factura-container">
          <div class="header">
            <div class="logo-section">
              <img src="${logoSrc}" alt="Logo" class="logo" />
            </div>
            <div class="factura-info">
              <div class="factura-titulo">NOTA DE CRÉDITO</div>
              <div class="factura-numero">${notaData.serie}-${notaData.folio}</div>
              <div><strong>UUID:</strong> ${notaData.uuid || ''}</div>
              <div><strong>Fecha:</strong> ${new Date(notaData.fechaEmision).toLocaleDateString('es-MX')}</div>
              <div><strong>Tipo Comprobante:</strong> E</div>
            </div>
          </div>

          <div class="emisor-receptor">
            <div class="emisor">
              <div class="seccion-titulo">EMISOR</div>
              <div><strong>Nombre:</strong> ${notaData.nombreEmisor}</div>
              <div><strong>RFC:</strong> ${notaData.rfcEmisor}</div>
            </div>
            <div class="receptor">
              <div class="seccion-titulo">RECEPTOR</div>
              <div><strong>Nombre:</strong> ${notaData.nombreReceptor}</div>
              <div><strong>RFC:</strong> ${notaData.rfcReceptor}</div>
            </div>
          </div>

          <div class="referencias">
            ${notaData.referenciaFactura ? `<div><strong>Factura original:</strong> ${notaData.referenciaFactura}</div>` : ''}
            ${notaData.motivo ? `<div><strong>Motivo:</strong> ${notaData.motivo}</div>` : ''}
          </div>

          <table class="conceptos-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="text-center">Cantidad</th>
                <th class="text-center">Unidad</th>
                <th class="text-right">Precio Unitario</th>
                <th class="text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${notaData.conceptos.map(concepto => `
                <tr>
                  <td>${concepto.descripcion}</td>
                  <td class="text-center">${concepto.cantidad}</td>
                  <td class="text-center">${concepto.unidad}</td>
                  <td class="text-right">$${concepto.precioUnitario.toFixed(2)}</td>
                  <td class="text-right">$${concepto.importe.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totales">
            <table class="totales-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="text-right">$${notaData.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">IVA:</td>
                <td class="text-right">$${notaData.iva.toFixed(2)}</td>
              </tr>
              ${notaData.ieps ? `
                <tr>
                  <td class="label">IEPS:</td>
                  <td class="text-right">$${notaData.ieps.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td class="label total-final">Total:</td>
                <td class="text-right total-final">$${notaData.importe.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="clear: both; margin-top: 20px;">
            <div><strong>Método de Pago:</strong> ${notaData.metodoPago}</div>
            <div><strong>Forma de Pago:</strong> ${notaData.formaPago}</div>
            <div><strong>Uso CFDI:</strong> ${notaData.usoCFDI}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera un PDF de resumen de Facturación Global con facturas, tickets y detalles.
   */
  public async generarPDFResumenGlobal(
    facturasAgregadas: FacturaGlobalFactura[],
    stats: GlobalResumenStats,
    meta: GlobalResumenMeta,
    logoConfig: LogoConfig
  ): Promise<Blob> {
    try {
      const html = this.generarHTMLResumenGlobal(facturasAgregadas, stats, meta, logoConfig);
      const filename = `Resumen_Global_${meta.fecha}.pdf`;
      return await this.convertirHTMLaPDF(html, filename);
    } catch (error) {
      console.error('Error generando PDF de resumen global:', error);
      throw new Error('Error al generar el PDF de resumen global');
    }
  }

  /**
   * Construye el HTML del resumen global
   */
  private generarHTMLResumenGlobal(
    facturasAgregadas: FacturaGlobalFactura[],
    stats: GlobalResumenStats,
    meta: GlobalResumenMeta,
    logoConfig: LogoConfig
  ): string {
    const { customColors, logoUrl, logoBase64 } = logoConfig;
    const logoSrc = this.getLogoSrc(logoUrl, logoBase64);

    const fmtCurrency = (n: number | undefined) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n ?? 0));

    const facturasHtml = facturasAgregadas.map((f) => {
      const header = `
        <div class="agg-header">
          <div>
            <div class="agg-line"><b>Factura:</b> ${f.serie ? `${f.serie}-${f.folio ?? ''}` : (f.folio ?? '')}</div>
            <div class="agg-line"><b>UUID:</b> ${f.uuid}</div>
            <div class="agg-line"><b>Fecha:</b> ${f.fechaEmision ?? ''}</div>
            <div class="agg-line"><b>Estatus:</b> ${f.estatusFacturacion ?? ''}${f.estatusSat ? ` (${f.estatusSat})` : ''}</div>
          </div>
          <div class="agg-right">
            <div class="agg-line"><b>Tienda:</b> ${f.tienda ?? ''}</div>
            <div class="agg-total">${fmtCurrency(f.importe)}</div>
          </div>
        </div>
      `;

      const ticketsTable = Array.isArray(f.tickets) && f.tickets.length > 0 ? `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Forma Pago</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${f.tickets!.map(t => `
                <tr>
                  <td>${t.idTicket}</td>
                  <td>${t.folio ?? ''}</td>
                  <td>${t.fecha ?? ''}</td>
                  <td>${t.formaPago ?? ''}</td>
                  <td class="text-right">${fmtCurrency(t.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="no-data">Sin tickets vinculados.</div>';

      const detallesHtml = Array.isArray(f.tickets) ? f.tickets!.map(t => {
        if (!Array.isArray(t.detalles) || t.detalles.length === 0) return '';
        return `
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-center">Unidad</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Subtotal</th>
                  <th class="text-right">IVA</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${t.detalles!.map(d => `
                  <tr>
                    <td>${d.descripcion ?? ''}</td>
                    <td class="text-center">${d.cantidad ?? ''}</td>
                    <td class="text-center">${d.unidad ?? ''}</td>
                    <td class="text-right">${fmtCurrency(d.precioUnitario)}</td>
                    <td class="text-right">${fmtCurrency(d.subtotal)}</td>
                    <td class="text-right">${fmtCurrency(d.ivaImporte)}</td>
                    <td class="text-right">${fmtCurrency(d.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('') : '';

      const allDetalles = Array.isArray(f.tickets)
        ? f.tickets.flatMap(t => Array.isArray(t.detalles) ? t.detalles : [])
        : [];
      const subtotalSum = allDetalles.reduce((acc, d) => acc + (Number(d?.subtotal) || 0), 0);
      const ivaSum = allDetalles.reduce((acc, d) => acc + (Number(d?.ivaImporte) || 0), 0);
      const totalSum = allDetalles.reduce((acc, d) => acc + (Number(d?.total) || 0), 0);
      const totalesBoxHtml = allDetalles.length > 0 ? `
        <div class="totales-box">
          <div>Subtotal: <span class="label">${fmtCurrency(subtotalSum)}</span></div>
          <div>IVA: <span class="label">${fmtCurrency(ivaSum)}</span></div>
          <div class="total">TOTAL: ${fmtCurrency(totalSum)}</div>
        </div>
      ` : '';

      return `
        <div class="agg-card">
          ${header}
          ${ticketsTable}
          ${detallesHtml}
          ${totalesBoxHtml}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumen Facturación Global</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 20px; background: #fff; }

          /* Banner superior tipo factura */
          .banner { display: flex; justify-content: space-between; align-items: center; background-color: ${customColors.primary}; color: #fff; padding: 16px; border-radius: 6px; }
          .banner-title { font-size: 18px; font-weight: bold; }
          .banner-meta { font-size: 12px; opacity: 0.95; }
          .logo img { max-height: 64px; object-fit: contain; background: #fff0; }

          /* Línea separadora */
          .separator { height: 3px; background-color: ${customColors.primary}; margin: 14px 0 10px; border-radius: 2px; }

          /* Stats alineadas como en la factura */
          .stats { display: flex; gap: 16px; margin-bottom: 12px; color: #111; }
          .stats b { color: #000; }

          /* Tarjeta por factura agregada */
          .agg-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          .agg-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
          .agg-right { text-align: right; }
          .agg-line { margin-bottom: 4px; }
          .agg-total { font-weight: bold; font-size: 14px; color: #000; }

          /* Tablas estilo "Conceptos" */
          .table-wrap { overflow-x: auto; margin-top: 8px; }
          table.table { width: 100%; border-collapse: collapse; }
          table.table thead tr { background-color: ${customColors.primary}; color: #fff; }
          table.table th { padding: 8px 6px; text-align: left; font-weight: bold; }
          table.table td { padding: 8px 6px; border-bottom: 1px solid #ddd; }
          table.table tr:nth-child(even) { background-color: #f9f9f9; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .no-data { margin-top: 8px; color: #777; }

          /* Caja de totales similar a factura */
          .totales-box { float: right; width: 280px; border: 2px solid ${customColors.primary}; border-radius: 6px; padding: 10px; margin-top: 6px; }
          .totales-box .label { font-weight: bold; }
          .totales-box .total { color: ${customColors.primary}; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="banner">
            <div>
              <div class="banner-title">Resumen Facturación Global</div>
              <div class="banner-meta">${meta.periodoLabel} · Fecha ${meta.fecha}${meta.tiendaLabel ? ` · Tienda ${meta.tiendaLabel}` : ''}</div>
            </div>
            <div class="logo"><img src="${logoSrc}" alt="Logo" /></div>
          </div>
          <div class="separator"></div>

          ${(typeof stats.totalFacturas === 'number' || typeof stats.totalTickets === 'number' || typeof stats.totalCartaPorte === 'number') ? `
            <div class="stats">
              <div>Facturas: <b>${stats.totalFacturas ?? '-'}</b></div>
              <div>Tickets: <b>${stats.totalTickets ?? '-'}</b></div>
              <div>Carta Porte: <b>${stats.totalCartaPorte ?? '-'}</b></div>
            </div>
          ` : ''}

          ${facturasHtml}
        </div>
      </body>
      </html>
    `;
  }
}

// Exportar instancia singleton
export const pdfService = PDFService.getInstance();