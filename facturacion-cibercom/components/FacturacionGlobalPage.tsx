import React, { useState } from 'react';
import { apiUrl } from '../services/api';
import { pdfService } from '../services/pdfService';
import { facturaService } from '../services/facturaService';
import { correoService } from '../services/correoService';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { TIENDA_OPTIONS, TIPO_FACTURA_OPTIONS, ESTATUS_FACTURA_OPTIONS } from '../constants';

// Toast y Modal genéricos
const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => (
  <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white transition-all ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    role="alert">
    <div className="flex items-center space-x-2">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200 font-bold">×</button>
    </div>
  </div>
);

const Modal: React.FC<{ open: boolean; title: string; children: React.ReactNode; onClose: () => void; onConfirm?: () => void; confirmText?: string; loading?: boolean; }> = ({ open, title, children, onClose, onConfirm, confirmText = 'Confirmar', loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
        <div className="mb-6 text-gray-700 dark:text-gray-200">{children}</div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="neutral" onClick={onClose} disabled={loading}>Cancelar</Button>
          {onConfirm && (
            <Button type="button" variant="primary" onClick={onConfirm} disabled={loading}>
              {loading ? 'Procesando...' : confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


interface FacturaGlobalFormData {
  fecha: string;
  periodo: 'DIA' | 'SEMANA' | 'MES';
  tienda: string;
  tipoFactura: string;
  estatus: string;
}

interface FacturaResult {
  id: number;
  tipo: 'FACTURA' | 'TICKET' | 'CARTA_PORTE';
  folio: string;
  fecha: string;
  tienda: string;
  total: number;
  estatus: string;
}

// Datos de ejemplo que se mostrarán en la tabla - no utilizado
// const DUMMY_RESULTS: FacturaResult[] = [];

const initialFacturaGlobalFormData: FacturaGlobalFormData = {
  fecha: '',
  periodo: 'DIA',
  tienda: 'Todas',
  tipoFactura: '',
  estatus: '',
};

// --- Tipos para estructura agregada devuelta por backend ---
interface TicketDetalle {
  idDetalle: number;
  idTicket?: number;
  productoId?: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  precioUnitario?: number;
  descuento?: number;
  subtotal?: number;
  ivaPorcentaje?: number;
  ivaImporte?: number;
  iepsPorcentaje?: number;
  iepsImporte?: number;
  total?: number;
}

interface TicketAgregado {
  idTicket: number;
  fecha?: string;
  folio?: number;
  total?: number;
  formaPago?: string;
  detalles?: TicketDetalle[];
}

interface FacturaAgregada {
  uuid: string;
  serie?: string;
  folio?: string | number;
  fechaEmision?: string;
  importe?: number;
  estatusFacturacion?: string;
  estatusSat?: string;
  tienda?: string;
  tickets?: TicketAgregado[];
}


interface SearchResultsTableProps {
  results: FacturaResult[];
}

const SearchResultsTable: React.FC<SearchResultsTableProps & {
  onPdf: (factura: FacturaResult) => void;
  onXml: (factura: FacturaResult) => void;
  onCancelar: (factura: FacturaResult) => void;
  onPreview: (factura: FacturaResult) => void;
  onEnviarCorreo: (factura: FacturaResult) => void;
}> = ({ results, onPdf, onXml, onCancelar, onPreview, onEnviarCorreo }) => {
  // Funciones no utilizadas - comentadas para evitar error de TypeScript
  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  // };
  
  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case 'Timbrada':
  //       return 'bg-green-100 text-green-800';
  //     case 'Cancelada':
  //       return 'bg-red-100 text-red-800';
  //     case 'Pendiente':
  //       return 'bg-yellow-100 text-yellow-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Tipo', 'Folio/Boleta', 'Fecha', 'Tienda', 'Acciones'].map(header => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((factura) => (
              <tr key={factura.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{factura.tipo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{factura.folio}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{factura.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{factura.tienda}</td>
                {/* Columnas Total y Estatus removidas */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" onClick={() => onPreview(factura)}>Vista previa</button>
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" onClick={() => onPdf(factura)}>PDF</button>
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" onClick={() => onXml(factura)}>XML</button>
                  <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200" onClick={() => onEnviarCorreo(factura)}>Enviar Gmail</button>
                  {factura.estatus === 'Timbrada' && <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" onClick={() => onCancelar(factura)}>Cancelar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA (ACTUALIZADO) ---

export const FacturacionGlobalPage: React.FC = () => {
  const [formData, setFormData] = useState<FacturaGlobalFormData>(initialFacturaGlobalFormData);
  // Nuevo estado para guardar los resultados de la búsqueda
  const [searchResults, setSearchResults] = useState<FacturaResult[]>([]);
  // Estructura agregada por factura
  const [aggregatedFacturas, setAggregatedFacturas] = useState<FacturaAgregada[]>([]);
  const [stats, setStats] = useState<{ totalFacturas?: number; totalTickets?: number; totalCartaPorte?: number }>({});
  // Estado para vista previa en modal
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [_previewLoading, setPreviewLoading] = useState<boolean>(false);
  // Estados para feedback visual y modales
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; factura?: FacturaResult; loading?: boolean } | null>(null);
  const [correoModal, setCorreoModal] = useState<{ open: boolean; factura?: FacturaResult } | null>(null);
  const [correoDestino, setCorreoDestino] = useState<string>('');
  const [correoEnviando, setCorreoEnviando] = useState<boolean>(false);
  const [facturasExpandidas, setFacturasExpandidas] = useState<Set<string>>(new Set());
  const [guardandoFacturaGlobal, setGuardandoFacturaGlobal] = useState<boolean>(false);
  const [facturasGlobalesGuardadas, setFacturasGlobalesGuardadas] = useState<Set<string>>(new Set());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        periodo: formData.periodo,
        fecha: formData.fecha,
        codigoTienda: formData.tienda,
      };
      const resp = await fetch(apiUrl('/factura/global/consulta'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      // Tomar facturas agregadas para construir un único resultado "Factura global"
      // Parsear facturas agregadas si están presentes
      const agregadas: FacturaAgregada[] = Array.isArray(data?.facturasAgregadas) ? data.facturasAgregadas : [];
      setAggregatedFacturas(agregadas);
      setStats({
        totalFacturas: typeof data?.totalFacturas === 'number' ? data.totalFacturas : undefined,
        totalTickets: typeof data?.totalTickets === 'number' ? data.totalTickets : undefined,
        totalCartaPorte: typeof data?.totalCartaPorte === 'number' ? data.totalCartaPorte : undefined,
      });
      // Calcular total global (suma de importes de facturas agregadas)
      const totalGlobal = agregadas.reduce((acc, f) => acc + Number(f?.importe ?? 0), 0);
      const periodLabel = (() => {
        const fecha = formData.fecha;
        if (formData.periodo === 'DIA') return `día ${fecha}`;
        if (formData.periodo === 'SEMANA') {
          // ISO week number
          const d = new Date(fecha + 'T00:00:00');
          // Thursday in current week
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
          const week1 = new Date(d.getFullYear(), 0, 4);
          const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
          return `semana ${week}`;
        }
        // MES
        const d = new Date(fecha + 'T00:00:00');
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return `mes ${meses[d.getMonth()]} ${d.getFullYear()}`;
      })();
      const singleRow: FacturaResult = {
        id: 0,
        tipo: 'FACTURA' as 'FACTURA' | 'TICKET' | 'CARTA_PORTE',
        folio: `Facturación de ${periodLabel}`,
        fecha: formData.fecha,
        tienda: formData.tienda,
        total: totalGlobal,
        estatus: 'Pendiente',
      };
      setSearchResults([singleRow]);
      setToast({ message: 'Consulta lista: 1 resultado de factura global', type: 'success' });
    } catch (err) {
      console.error('Error en consulta factura global:', err);
      setToast({ message: 'Error al ejecutar consulta global.', type: 'error' });
      setSearchResults([]);
      setAggregatedFacturas([]);
      setStats({});
    }
  };

  const handleExcel = () => {
    console.log('Exportar a Excel:', formData);
    setToast({ message: 'Exportando a Excel (simulado).', type: 'success' });
  };

  // Vista previa: consulta el mismo endpoint y muestra las facturas agregadas en modal
  const handleVistaPrevia = async () => {
    try {
      setPreviewLoading(true);
      const payload = {
        periodo: formData.periodo,
        fecha: formData.fecha,
        codigoTienda: (formData.tienda === 'Todas' || !formData.tienda) ? undefined : formData.tienda,
      };
      const resp = await fetch(apiUrl('/factura/global/consulta'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const agregadas: FacturaAgregada[] = Array.isArray(data?.facturasAgregadas) ? data.facturasAgregadas : [];
      setAggregatedFacturas(agregadas);
      setStats({
        totalFacturas: typeof data?.totalFacturas === 'number' ? data.totalFacturas : undefined,
        totalTickets: typeof data?.totalTickets === 'number' ? data.totalTickets : undefined,
        totalCartaPorte: typeof data?.totalCartaPorte === 'number' ? data.totalCartaPorte : undefined,
      });
      setPreviewOpen(true);
      setToast({ message: `Vista previa lista: ${agregadas.length} facturas agregadas`, type: 'success' });
    } catch (err) {
      console.error('Error en vista previa de factura global:', err);
      setToast({ message: 'Error al preparar vista previa.', type: 'error' });
      setAggregatedFacturas([]);
      setStats({});
    } finally {
      setPreviewLoading(false);
    }
  };

  // Helpers y flujo de envío por correo
  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handleEnviarCorreo = (factura: FacturaResult) => {
    setCorreoDestino('');
    setCorreoModal({ open: true, factura });
  };

  const generarXMLResumenGlobal = async () => {
    let agregadas = aggregatedFacturas;
    if (!Array.isArray(agregadas) || agregadas.length === 0) {
      const payload = {
        periodo: formData.periodo,
        fecha: formData.fecha,
        codigoTienda: (formData.tienda === 'Todas' || !formData.tienda) ? undefined : formData.tienda,
      };
      const resp = await fetch(apiUrl('/factura/global/consulta'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      agregadas = Array.isArray(data?.facturasAgregadas) ? data.facturasAgregadas : [];
    }
    const conceptos = (agregadas || []).map((f: any) => {
      const totalFactura = Array.isArray(f?.tickets)
        ? f.tickets.reduce((acc: number, t: any) => acc + (Number(t?.total) || 0), 0)
        : (Number(f?.importe) || 0);
      const serieFolio = f?.serie ? `${f.serie}-${f?.folio ?? ''}` : `${f?.folio ?? ''}`;
      const descripcion = `Factura ${serieFolio}${f?.tienda ? ` · Tienda ${f.tienda}` : ''}${f?.fechaEmision ? ` · ${f.fechaEmision}` : ''}`;
      return { descripcion, importe: totalFactura };
    });
    const subtotal = conceptos.reduce((acc: number, c: any) => acc + (Number(c?.importe) || 0), 0);
    const iva = 0;
    const total = subtotal + iva;
    const fechaActual = new Date().toISOString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<cfdi:Comprobante xmlns:cfdi=\"http://www.sat.gob.mx/cfd/4\" Version=\"4.0\" Fecha=\"${fechaActual}\" Serie=\"RG\" Folio=\"${formData.periodo}_${formData.fecha}\" SubTotal=\"${subtotal.toFixed(2)}\" Total=\"${total.toFixed(2)}\" TipoDeComprobante=\"I\" Moneda=\"MXN\" MetodoPago=\"PUE\" FormaPago=\"99\" LugarExpedicion=\"00000\">\n` +
      `  <cfdi:Emisor Rfc=\"XAXX010101000\" Nombre=\"Resumen Facturación Global\" RegimenFiscal=\"601\"/>\n` +
      `  <cfdi:Receptor Rfc=\"XAXX010101000\" Nombre=\"${formData.tienda === 'Todas' ? 'Todas las tiendas' : `Tienda ${formData.tienda}`}\" DomicilioFiscalReceptor=\"00000\" RegimenFiscalReceptor=\"601\" UsoCFDI=\"G03\"/>\n` +
      `  <cfdi:Conceptos>\n`;
    for (const c of conceptos) {
      xml += `    <cfdi:Concepto ClaveProdServ=\"01010101\" Cantidad=\"1\" ClaveUnidad=\"ACT\" Descripcion=\"${c.descripcion}\" ValorUnitario=\"${Number(c.importe).toFixed(2)}\" Importe=\"${Number(c.importe).toFixed(2)}\"/>\n`;
    }
    xml += `  </cfdi:Conceptos>\n` +
      `</cfdi:Comprobante>`;
    return xml;
  };

  const handleConfirmEnviarCorreo = async () => {
    if (!correoModal?.open) return;
    try {
      if (!correoService.validarEmail(correoDestino)) {
        setToast({ message: 'Correo inválido. Verifica el formato.', type: 'error' });
        return;
      }
      setCorreoEnviando(true);
      // Ensamblar conceptos y facturaData para PDF
      let agregadas = aggregatedFacturas;
      if (!Array.isArray(agregadas) || agregadas.length === 0) {
        const payload = {
          periodo: formData.periodo,
          fecha: formData.fecha,
          codigoTienda: (formData.tienda === 'Todas' || !formData.tienda) ? undefined : formData.tienda,
        };
        const resp = await fetch(apiUrl('/factura/global/consulta'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        agregadas = Array.isArray(data?.facturasAgregadas) ? data.facturasAgregadas : [];
      }
      const conceptos = (agregadas || []).map((f: any) => {
        const totalFactura = Array.isArray(f?.tickets)
          ? f.tickets.reduce((acc: number, t: any) => acc + (Number(t?.total) || 0), 0)
          : (Number(f?.importe) || 0);
        const serieFolio = f?.serie ? `${f.serie}-${f?.folio ?? ''}` : `${f?.folio ?? ''}`;
        const descripcion = `Factura ${serieFolio}${f?.tienda ? ` · Tienda ${f.tienda}` : ''}${f?.fechaEmision ? ` · ${f.fechaEmision}` : ''}`;
        return { descripcion, cantidad: 1, unidad: 'Factura', precioUnitario: totalFactura, importe: totalFactura };
      });
      const totalGlobal = conceptos.reduce((acc: number, c: any) => acc + (Number(c?.importe) || 0), 0);
      const logoConfig = await facturaService.obtenerConfiguracionLogos();
      const facturaData = {
        uuid: `RESUMEN-GLOBAL-${formData.periodo}-${formData.fecha}`,
        rfcEmisor: 'N/A', nombreEmisor: 'Resumen Facturación Global', rfcReceptor: 'N/A',
        nombreReceptor: formData.tienda === 'Todas' ? 'Todas las tiendas' : `Tienda ${formData.tienda}`,
        serie: 'RG', folio: `${formData.periodo}_${formData.fecha}`, fechaEmision: new Date().toISOString(),
        importe: totalGlobal, subtotal: totalGlobal, iva: 0, conceptos,
        metodoPago: 'PUE', formaPago: '99', usoCFDI: 'G03',
      };
      const respPdf = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaData, logoConfig: { logoUrl: logoConfig.logoUrl, logoBase64: logoConfig.logoBase64, customColors: logoConfig.customColors } }),
      });
      if (!respPdf.ok) {
        const txt = await respPdf.text().catch(() => '');
        throw new Error(`Error al generar PDF (HTTP ${respPdf.status}) ${txt}`);
      }
      const pdfBlob = await respPdf.blob();
      const pdfBase64 = await blobToBase64(pdfBlob);
      const xmlString = await generarXMLResumenGlobal();
      const xmlBlob = new Blob([xmlString], { type: 'application/xml' });
      const xmlBase64 = await blobToBase64(xmlBlob);
      const asunto = `Resumen Global RG-${formData.periodo}_${formData.fecha}`;
      const mensaje = `Estimado(a),\n\nSe adjunta su resumen de facturación global.\n\nGracias.`;
      const correoResp = await correoService.enviarPdfDirecto({
        pdfBase64, correoReceptor: correoDestino, asunto, mensaje,
        nombreAdjunto: `Resumen_Global_${formData.periodo}_${formData.fecha}.pdf`,
        xmlBase64, nombreAdjuntoXml: `Resumen_Global_${formData.periodo}_${formData.fecha}.xml`,
      });
      if (correoResp?.success) {
        setToast({ message: 'Correo enviado exitosamente.', type: 'success' });
        setCorreoModal(null);
      } else {
        setToast({ message: correoResp?.message || 'No se pudo enviar el correo.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Error enviando correo:', err);
      setToast({ message: err?.message || 'Error al enviar correo con adjuntos.', type: 'error' });
    } finally {
      setCorreoEnviando(false);
    }
  };

  // Acciones de la tabla
  const handlePdf = async (factura: FacturaResult) => {
    try {
      // Si no tenemos datos agregados cargados, consultar para asegurar contenido actualizado
      let agregadas = aggregatedFacturas;
      if (!Array.isArray(agregadas) || agregadas.length === 0) {
        const payload = {
          periodo: formData.periodo,
          fecha: formData.fecha,
          codigoTienda: (formData.tienda === 'Todas' || !formData.tienda) ? undefined : formData.tienda,
        };
        const resp = await fetch(apiUrl('/factura/global/consulta'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        agregadas = Array.isArray(data?.facturasAgregadas) ? data.facturasAgregadas : [];
      }

      // Construir etiqueta de periodo similar al flujo de consulta - no utilizado
      // const _periodLabel = (() => {
      //   const fecha = formData.fecha;
      //   if (formData.periodo === 'DIA') return `día ${fecha}`;
      //   if (formData.periodo === 'SEMANA') {
      //     const d = new Date(fecha + 'T00:00:00');
      //     d.setHours(0, 0, 0, 0);
      //     d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
      //     const week1 = new Date(d.getFullYear(), 0, 4);
      //     const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      //     return `semana ${week}`;
      //   }
      //   const d = new Date(fecha + 'T00:00:00');
      //   const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      //   return `mes ${meses[d.getMonth()]} ${d.getFullYear()}`;
      // })();

      const logoConfig = await facturaService.obtenerConfiguracionLogos();
      // Variables no utilizadas - comentadas para evitar error de TypeScript
      // const statsForPdf = {
      //   totalFacturas: stats.totalFacturas,
      //   totalTickets: stats.totalTickets,
      //   totalCartaPorte: stats.totalCartaPorte,
      // };
      // const metaForPdf = {
      //   periodoLabel: `Periodo: ${periodLabel}`,
      //   fecha: formData.fecha,
      //   tiendaLabel: formData.tienda,
      // };

      // Reutilizar el generador del backend (iText) para evitar PDFs en blanco
      // Mapear cada factura agregada a un concepto resumido
      const conceptos = (agregadas || []).map((f: any) => {
        const totalFactura = Array.isArray(f?.tickets)
          ? f.tickets.reduce((acc: number, t: any) => acc + (Number(t?.total) || 0), 0)
          : (Number(f?.importe) || 0);
        const serieFolio = f?.serie ? `${f.serie}-${f?.folio ?? ''}` : `${f?.folio ?? ''}`;
        const descripcion = `Factura ${serieFolio}${f?.tienda ? ` · Tienda ${f.tienda}` : ''}${f?.fechaEmision ? ` · ${f.fechaEmision}` : ''}`;
        return {
          descripcion,
          cantidad: 1,
          unidad: 'Factura',
          precioUnitario: totalFactura,
          importe: totalFactura,
        };
      });

      const totalGlobal = conceptos.reduce((acc: number, c: any) => acc + (Number(c?.importe) || 0), 0);

      const facturaData = {
        uuid: `RESUMEN-GLOBAL-${formData.periodo}-${formData.fecha}`,
        rfcEmisor: 'N/A',
        nombreEmisor: 'Resumen Facturación Global',
        rfcReceptor: 'N/A',
        nombreReceptor: formData.tienda === 'Todas' ? 'Todas las tiendas' : `Tienda ${formData.tienda}`,
        serie: 'RG',
        folio: `${formData.periodo}_${formData.fecha}`,
        fechaEmision: new Date().toISOString(),
        importe: totalGlobal,
        subtotal: totalGlobal,
        iva: 0,
        conceptos,
        metodoPago: 'PUE',
        formaPago: '99',
        usoCFDI: 'G03',
      };

      const respPdf = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaData,
          logoConfig: {
            logoUrl: logoConfig.logoUrl,
            logoBase64: logoConfig.logoBase64,
            customColors: logoConfig.customColors,
          },
        }),
      });
      if (!respPdf.ok) {
        const txt = await respPdf.text().catch(() => '');
        throw new Error(`Error al generar PDF (HTTP ${respPdf.status}) ${txt}`);
      }
      const pdfBlob = await respPdf.blob();
      const filename = `Resumen_Global_${formData.periodo}_${formData.fecha}.pdf`;
      pdfService.descargarPDF(pdfBlob, filename);
      setToast({ message: `PDF generado: ${factura.folio}`, type: 'success' });
    } catch (error: any) {
      console.error('Error generando PDF de resumen global:', error);
      setToast({ message: error?.message || 'Error al generar PDF de resumen global.', type: 'error' });
    }
  };
  const handleXml = async (_factura: FacturaResult) => {
    try {
      const xmlString = await generarXMLResumenGlobal();
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `Resumen_Global_${formData.periodo}_${formData.fecha}.xml`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: `XML descargado: ${filename}`, type: 'success' });
    } catch (error: any) {
      console.error('Error generando/descargando XML de resumen global:', error);
      setToast({ message: error?.message || 'Error al generar XML de resumen global.', type: 'error' });
    }
  };
  const handleCancelar = (factura: FacturaResult) => {
    setModal({ open: true, factura });
  };

  const toggleExpandirFactura = (uuid: string) => {
    setFacturasExpandidas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(uuid)) {
        nuevo.delete(uuid);
      } else {
        nuevo.add(uuid);
      }
      return nuevo;
    });
  };

  const handleDescargarPDFFactura = async (uuid: string, serieFolio: string) => {
    try {
      await facturaService.generarYDescargarPDF(uuid);
      setToast({ message: `PDF descargado: ${serieFolio}`, type: 'success' });
    } catch (error: any) {
      console.error('Error descargando PDF de factura:', error);
      setToast({ 
        message: error?.message || 'Error al descargar el PDF de la factura.', 
        type: 'error' 
      });
    }
  };

  const handleDescargarXMLFactura = async (uuid: string) => {
    try {
      await facturaService.generarYDescargarXML(uuid);
      setToast({ message: 'XML descargado exitosamente', type: 'success' });
    } catch (error: any) {
      console.error('Error descargando XML de factura:', error);
      setToast({ 
        message: error?.message || 'Error al descargar el XML de la factura.', 
        type: 'error' 
      });
    }
  };

  const handleGuardarFacturaGlobal = async () => {
    if (aggregatedFacturas.length === 0) {
      setToast({ message: 'No hay facturas para guardar como factura global.', type: 'error' });
      return;
    }

    try {
      setGuardandoFacturaGlobal(true);

      // Calcular total global
      const totalGlobal = aggregatedFacturas.reduce((acc, f) => acc + Number(f?.importe ?? 0), 0);
      
      // Construir etiqueta de periodo
      const periodLabel = (() => {
        const fecha = formData.fecha;
        if (formData.periodo === 'DIA') return `día ${fecha}`;
        if (formData.periodo === 'SEMANA') {
          const d = new Date(fecha + 'T00:00:00');
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
          const week1 = new Date(d.getFullYear(), 0, 4);
          const week = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
          return `semana ${week}`;
        }
        const d = new Date(fecha + 'T00:00:00');
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return `mes ${meses[d.getMonth()]} ${d.getFullYear()}`;
      })();

      // Recopilar UUIDs de facturas hijas
      const facturasHijasUuid = aggregatedFacturas.map(f => f.uuid).filter(Boolean);

      // Preparar datos para enviar al backend
      const facturaGlobalData = {
        periodo: formData.periodo,
        fecha: formData.fecha,
        codigoTienda: formData.tienda === 'Todas' || !formData.tienda ? null : formData.tienda,
        serie: 'RG', // Serie para Resumen Global
        folio: `${formData.periodo}_${formData.fecha}`,
        importe: totalGlobal,
        subtotal: totalGlobal,
        facturasHijasUuid: facturasHijasUuid,
        totalFacturas: stats.totalFacturas || 0,
        totalTickets: stats.totalTickets || 0,
        totalCartaPorte: stats.totalCartaPorte || 0,
        descripcion: `Facturación Global - ${periodLabel}`,
      };

      const response = await fetch(apiUrl('/factura/global/guardar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaGlobalData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al guardar factura global: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Marcar todas las facturas como guardadas usando el UUID de la factura global o un identificador único
        const facturaGlobalId = result.idFacturaGlobal || result.uuid || 'global-' + Date.now();
        setFacturasGlobalesGuardadas((prev) => {
          const nuevo = new Set(prev);
          nuevo.add(facturaGlobalId);
          return nuevo;
        });
        
        setToast({ 
          message: `Factura global guardada exitosamente. ID: ${result.idFacturaGlobal || facturaGlobalId}`, 
          type: 'success' 
        });
      } else {
        throw new Error(result.message || 'Error al guardar factura global');
      }
    } catch (error: any) {
      console.error('Error guardando factura global:', error);
      setToast({ 
        message: error?.message || 'Error al guardar la factura global. Por favor intenta nuevamente.', 
        type: 'error' 
      });
    } finally {
      setGuardandoFacturaGlobal(false);
    }
  };
  const handleConfirmCancelar = async () => {
    if (!modal?.factura) return;
    setModal({ ...modal, loading: true });
    // Simula proceso de cancelación
    setTimeout(() => {
      setSearchResults((prev) => prev.map(f => f.id === modal.factura!.id ? { ...f, estatus: 'Cancelada' } : f));
      setModal(null);
      setToast({ message: `Factura ${modal.factura!.folio} cancelada exitosamente.`, type: 'success' });
    }, 1200);
  };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">--Especificar búsqueda--</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-end">
          <FormField label="Fecha:" name="fecha" type="date" value={formData.fecha} onChange={handleChange} />
          <SelectField label="Periodo:" name="periodo" value={formData.periodo} onChange={handleChange} options={[{ value: 'DIA', label: 'Día' }, { value: 'SEMANA', label: 'Semana' }, { value: 'MES', label: 'Mes' }]} />
          <SelectField label="Tienda:" name="tienda" value={formData.tienda} onChange={handleChange} options={TIENDA_OPTIONS} />
          <SelectField label="Tipo de Factura:" name="tipoFactura" value={formData.tipoFactura} onChange={handleChange} options={TIPO_FACTURA_OPTIONS} />
          <SelectField label="Estatus:" name="estatus" value={formData.estatus} onChange={handleChange} options={ESTATUS_FACTURA_OPTIONS} />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
            <Button type="submit" variant="primary">
                Consultar
            </Button>
            <Button type="button" onClick={handleExcel} variant="secondary">
                Excel
            </Button>
        </div>
      </Card>

      {/* Renderizado condicional: muestra la tabla si hay resultados, si no, el mensaje */}
      {searchResults.length > 0 ? (
        <SearchResultsTable
          results={searchResults}
          onPdf={handlePdf}
          onXml={handleXml}
          onCancelar={handleCancelar}
          onPreview={handleVistaPrevia}
          onEnviarCorreo={handleEnviarCorreo}
        />
      ) : (
        <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            Los resultados de la búsqueda aparecerán aquí.
        </div>
      )}

      {/* Tabla de facturas individuales del periodo */}
      {aggregatedFacturas.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Facturas del Periodo Seleccionado
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: {aggregatedFacturas.length} factura(s)
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleGuardarFacturaGlobal}
                disabled={guardandoFacturaGlobal || facturasGlobalesGuardadas.size > 0}
              >
                {guardandoFacturaGlobal 
                  ? 'Guardando...' 
                  : facturasGlobalesGuardadas.size > 0 
                    ? '✓ Factura Global Guardada' 
                    : 'Guardar Factura Global'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Serie-Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    UUID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Emisión
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estatus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {aggregatedFacturas.map((factura, idx) => {
                  const estaExpandida = facturasExpandidas.has(factura.uuid);
                  const totalTickets = Array.isArray(factura.tickets) ? factura.tickets.length : 0;
                  const serieFolio = factura.serie ? `${factura.serie}-${factura.folio ?? ''}` : `${factura.folio ?? ''}`;
                  const estatusDisplay = factura.estatusFacturacion || '';
                  const estatusSatDisplay = factura.estatusSat ? ` (${factura.estatusSat})` : '';
                  
                  return (
                    <React.Fragment key={`factura-${factura.uuid}-${idx}`}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleExpandirFactura(factura.uuid)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium text-sm"
                          >
                            {estaExpandida ? '▼ Ocultar' : '▶ Ver Detalles'}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {serieFolio}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                          <span className="truncate block max-w-xs" title={factura.uuid}>
                            {factura.uuid}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {factura.fechaEmision ? new Date(factura.fechaEmision).toLocaleDateString('es-MX') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {factura.tienda || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            estatusDisplay === 'Timbrada' || estatusDisplay === 'TIMBRADA' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : estatusDisplay === 'Cancelada' || estatusDisplay === 'CANCELADA'
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          }`}>
                            {estatusDisplay}{estatusSatDisplay}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(factura.importe ?? 0))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {totalTickets}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleDescargarPDFFactura(factura.uuid, serieFolio)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            title="Descargar PDF"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleDescargarXMLFactura(factura.uuid)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            title="Descargar XML"
                          >
                            XML
                          </button>
                        </td>
                      </tr>
                      {/* Fila expandible con detalles de tickets */}
                      {estaExpandida && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-gray-50 dark:bg-gray-800">
                            <div className="space-y-4">
                              {Array.isArray(factura.tickets) && factura.tickets.length > 0 ? (
                                <>
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Tickets asociados ({factura.tickets.length}):
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 rounded-md">
                                      <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            ID Ticket
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Folio
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Fecha
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Forma Pago
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Total
                                          </th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                            Detalles
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {factura.tickets.map((ticket, tIdx) => (
                                          <React.Fragment key={`ticket-${ticket.idTicket}-${tIdx}`}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                                {ticket.idTicket}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ticket.folio ?? '-'}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ticket.fecha ? new Date(ticket.fecha).toLocaleDateString('es-MX') : '-'}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ticket.formaPago ?? '-'}
                                              </td>
                                              <td className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(ticket.total ?? 0))}
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {Array.isArray(ticket.detalles) ? `${ticket.detalles.length} producto(s)` : '0 productos'}
                                              </td>
                                            </tr>
                                            {/* Detalles del ticket */}
                                            {Array.isArray(ticket.detalles) && ticket.detalles.length > 0 && (
                                              <tr>
                                                <td colSpan={6} className="px-3 py-2 bg-gray-50 dark:bg-gray-700">
                                                  <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                                      <thead className="bg-gray-200 dark:bg-gray-600">
                                                        <tr>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Descripción
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Cant.
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Unidad
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Precio Unit.
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Subtotal
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            IVA
                                                          </th>
                                                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            Total
                                                          </th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                                                        {ticket.detalles.map((detalle, dIdx) => (
                                                          <tr key={`detalle-${detalle.idDetalle}-${dIdx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
                                                              {detalle.descripcion ?? '-'}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                                              {detalle.cantidad ?? '-'}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                                              {detalle.unidad ?? '-'}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(detalle.precioUnitario ?? 0))}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(detalle.subtotal ?? 0))}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(detalle.ivaImporte ?? 0))}
                                                            </td>
                                                            <td className="px-2 py-1 text-xs font-semibold text-gray-900 dark:text-white">
                                                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(detalle.total ?? 0))}
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                  No hay tickets asociados a esta factura.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de confirmación de cancelación */}
      <Modal
        open={!!modal?.open}
        title="Confirmar cancelación"
        onClose={() => setModal(null)}
        onConfirm={handleConfirmCancelar}
        confirmText="Cancelar factura"
        loading={modal?.loading}
      >
        {modal?.factura && (
          <>¿Estás seguro que deseas cancelar la factura <b>{modal.factura.folio}</b>? Esta acción no se puede deshacer.</>
        )}
      </Modal>

      {/* Modal para enviar correo con PDF y XML del resumen global */}
      <Modal
        open={!!correoModal?.open}
        title="Enviar resumen global por correo"
        onClose={() => setCorreoModal(null)}
        onConfirm={handleConfirmEnviarCorreo}
        confirmText="Enviar"
        loading={correoEnviando}
      >
        <div className="space-y-3">
          <FormField
            label="Correo electrónico del destinatario"
            name="correoDestino"
            type="email"
            value={correoDestino}
            onChange={(e) => setCorreoDestino(e.target.value)}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Se enviarán adjuntos: PDF y XML del resumen de facturación global generado con los filtros actuales.
          </div>
        </div>
      </Modal>

      {/* Se removió el panel inline de "Facturas agregadas" para simplificar la vista.
          La información detallada de facturas y tickets seguirá disponible en el modal de vista previa. */}

      {/* Modal de Vista Previa: muestra facturas agregadas con sus tickets */}
      <Modal
        open={previewOpen}
        title="Vista previa - Facturación global"
        onClose={() => setPreviewOpen(false)}
      >
        {typeof stats.totalFacturas === 'number' || typeof stats.totalTickets === 'number' || typeof stats.totalCartaPorte === 'number' ? (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            <span className="mr-4">Facturas: <b>{stats.totalFacturas ?? '-'}</b></span>
            <span className="mr-4">Tickets: <b>{stats.totalTickets ?? '-'}</b></span>
            <span>Carta Porte: <b>{stats.totalCartaPorte ?? '-'}</b></span>
          </div>
        ) : null}
        {aggregatedFacturas.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-400 dark:text-gray-500">
            No hay facturas con estructura agregada para mostrar.
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {aggregatedFacturas.map((f, idx) => (
              <div key={`preview-${f.uuid}-${idx}`} className="border rounded-md p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-700 dark:text-gray-200"><b>Factura:</b> {f.serie ? `${f.serie}-${f.folio ?? ''}` : (f.folio ?? '')}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200"><b>UUID:</b> {f.uuid}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200"><b>Fecha:</b> {f.fechaEmision ?? ''}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200"><b>Estatus:</b> {f.estatusFacturacion ?? ''} {f.estatusSat ? `(${f.estatusSat})` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-700 dark:text-gray-200"><b>Tienda:</b> {f.tienda ?? ''}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(f.importe ?? 0))}</div>
                  </div>
                </div>
                {Array.isArray(f.tickets) && f.tickets.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {['Ticket', 'Folio', 'Fecha', 'Forma Pago', 'Total'].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {f.tickets.map((t, tIdx) => (
                          <tr key={`preview-${f.uuid}-t-${tIdx}`} className="align-top">
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{t.idTicket}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{t.folio ?? ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{t.fecha ?? ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{t.formaPago ?? ''}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(t.total ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Sin tickets vinculados.</div>
                )}
                {Array.isArray(f.tickets) && f.tickets.map((t, tIdx) => (
                  <div key={`preview-${f.uuid}-td-${tIdx}`} className="mt-3">
                    {Array.isArray(t.detalles) && t.detalles.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              {['Descripción', 'Cantidad', 'Unidad', 'Precio', 'Subtotal', 'IVA', 'Total'].map(h => (
                                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {t.detalles!.map((d, dIdx) => (
                              <tr key={`preview-${t.idTicket}-d-${dIdx}`}>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{d.descripcion ?? ''}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{d.cantidad ?? ''}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{d.unidad ?? ''}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(d.precioUnitario ?? 0))}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(d.subtotal ?? 0))}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(d.ivaImporte ?? 0))}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(d.total ?? 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Sin detalles para el ticket {t.idTicket}.</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Toast de feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
};