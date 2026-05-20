import React, { useState, useContext, useRef, useEffect } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { ComprobanteAccionesBar } from './ComprobanteAccionesBar';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { RfcAutocomplete } from './RfcAutocomplete';
import { AltaClienteModal, ClienteFormData } from './AltaClienteModal';
import { ThemeContext } from '../App';
import { useEmpresa } from '../context/EmpresaContext';
import { USO_CFDI_OPTIONS, REGIMEN_FISCAL_OPTIONS, PAIS_OPTIONS } from '../constants';
import { pdfService } from '../services/pdfService';
import { facturaService } from '../services/facturaService';
import { correoService } from '../services/correoService';
import { configuracionCorreoService } from '../services/configuracionCorreoService';
import { EnviarWhatsAppModal } from './EnviarWhatsAppModal';
import {
  WHATSAPP_MENSAJE_BASE_NOTA_CREDITO,
  construirMensajeWhatsAppNotaCredito,
} from '../constants/whatsappFacturaMensajeBase';
import { apiUrl, creditNotesUrl, getHeadersWithUsuario } from '../services/api';
import { ClienteDatos } from '../services/clienteCatalogoService';
interface ConceptoForm {
  descripcion: string;
  cantidad: number | '';
  unidad: string;
  precioUnitario: number | '';
}

interface NotaCreditoFormData {
  rfc: string;
  correoElectronico: string;
  telefono: string;
  razonSocial: string;
  nombre: string;
  paterno: string;
  materno: string;
  pais: string;
  noRegistroIdentidadTributaria: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  referenciaFactura: string;
  motivo: string;
  serie: string;
  folio: string;
  metodoPago: string;
  formaPago: string;
}

interface NotaCreditoConceptoData {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  importe: number;
  claveProdServ: string;
}

interface NotaCreditoData {
  uuid?: string;
  serie: string;
  folio: string;
  fechaEmision: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  domicilioFiscalReceptor: string;
  usoCfdi: string;
  regimenFiscal: string;
  formaPago: string;
  metodoPago: string;
  subtotal: number;
  iva: number;
  ivaTasa: number;
  importe: number;
  conceptos: NotaCreditoConceptoData[];
  referenciaFactura?: string;
  motivo?: string;
  lugarExpedicion?: string;
}

interface TimbradoResult {
  ok: boolean;
  uuid?: string;
  serie?: string;
  folio?: string;
  xmlTimbrado?: string;
  message?: string;
  error?: string;
}

const IVA_TASA_DEFAULT = 0.16;
const CLAVE_PROD_SERV_DEFAULT = '84111506';
const DEFAULT_LUGAR_EXPEDICION = '00000';
const CP_REGEX = /\b\d{5}\b/;

const initialFormData: NotaCreditoFormData = {
  rfc: '',
  correoElectronico: '',
  telefono: '',
  razonSocial: '',
  nombre: '',
  paterno: '',
  materno: '',
  pais: PAIS_OPTIONS[0]?.value || '',
  noRegistroIdentidadTributaria: '',
  domicilioFiscal: '',
  regimenFiscal: REGIMEN_FISCAL_OPTIONS[0]?.value || '',
  usoCfdi: USO_CFDI_OPTIONS[0]?.value || '',
  referenciaFactura: '',
  motivo: '',
  serie: 'NC',
  folio: '',
  metodoPago: 'PUE',
  formaPago: '01',
};

const stringToBase64 = (input?: string) => {
  if (!input) return undefined;
  try {
    return btoa(unescape(encodeURIComponent(input)));
  } catch (error) {
    console.warn('No se pudo convertir a Base64', error);
    return undefined;
  }
};

export const NotasCreditoPage: React.FC = () => {
  const { empresaInfo } = useEmpresa();
  const { customColors, logoUrl } = useContext(ThemeContext);

  const [formData, setFormData] = useState<NotaCreditoFormData>(initialFormData);
  const [concepto, setConcepto] = useState<ConceptoForm>({
    descripcion: 'DEVOLUCION_MERCANCIA',
    cantidad: 1,
    unidad: 'E48',
    precioUnitario: 0,
  });
  const [descripcionLibre, setDescripcionLibre] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'rfc' | 'correoElectronico' | 'razonSocial' | 'domicilioFiscal' | 'regimenFiscal' | 'usoCfdi', string>>>({});
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [uuidNcActivo, setUuidNcActivo] = useState('');
  const [modalWhatsApp, setModalWhatsApp] = useState<{
    isOpen: boolean;
    facturaUuid: string;
    facturaInfo: string;
    telefonoInicial: string;
  }>({
    isOpen: false,
    facturaUuid: '',
    facturaInfo: '',
    telefonoInicial: '',
  });
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | null>(null);
  const tipoPersonaAnteriorRef = useRef<'fisica' | 'moral' | null>(null);
  const [mostrarAltaCliente, setMostrarAltaCliente] = useState(false);

  // Funciones para determinar el tipo de persona según el RFC
  const esPersonaMoral = (rfc: string): boolean => {
    return rfc.length === 12;
  };

  const esPersonaFisica = (rfc: string): boolean => {
    return rfc.length === 13;
  };

  // Función auxiliar para parsear el domicilio fiscal
  const parsearDomicilioFiscal = (domicilioFiscal: string | undefined) => {
    if (!domicilioFiscal) {
      return { codigoPostal: '', calle: '', numeroExterior: '', numeroInterior: '', colonia: '', municipio: '', estado: '' };
    }
    
    const resultado: any = {
      codigoPostal: '',
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      municipio: '',
      estado: '',
    };

    // Extraer código postal (formato: "C.P. 12345" o "CP 12345")
    const cpMatch = domicilioFiscal.match(/(?:C\.?P\.?\s*)?(\d{5})(?:\s|$|,)/i);
    if (cpMatch) {
      resultado.codigoPostal = cpMatch[1];
    }

    // Dividir por comas para extraer partes
    const partes = domicilioFiscal.split(',').map(p => p.trim());
    
    if (partes.length > 0) {
      // La primera parte generalmente contiene: Calle NumExt Int. NumInt
      const primeraParte = partes[0];
      // Intentar extraer número exterior e interior
      const numExtMatch = primeraParte.match(/(\d+[A-Za-z]?|MZ\s*\d+|LT\s*\d+|EDIF\s*\w+)/i);
      if (numExtMatch) {
        resultado.numeroExterior = numExtMatch[1];
        const antesNumExt = primeraParte.substring(0, numExtMatch.index).trim();
        resultado.calle = antesNumExt;
      } else {
        resultado.calle = primeraParte;
      }
      
      // Buscar "Int." para número interior
      const numIntMatch = primeraParte.match(/Int\.\s*(\S+)/i);
      if (numIntMatch) {
        resultado.numeroInterior = numIntMatch[1];
      }
    }

    // Buscar colonia, municipio, estado antes del código postal
    let encontradoCP = false;
    for (let i = 1; i < partes.length && !encontradoCP; i++) {
      const parte = partes[i];
      if (parte.match(/C\.?P\.?\s*\d{5}/i)) {
        encontradoCP = true;
        // La parte anterior al CP puede ser el estado
        if (i > 1) {
          resultado.estado = partes[i - 1];
        }
        // La parte anterior al estado puede ser el municipio
        if (i > 2) {
          resultado.municipio = partes[i - 2];
        }
        // La parte anterior al municipio puede ser la colonia
        if (i > 3) {
          resultado.colonia = partes[i - 3];
        }
        break;
      }
    }

    // Si no encontramos el CP pero hay partes, asignar las últimas partes como estado/municipio/colonia
    if (!encontradoCP && partes.length >= 3) {
      resultado.colonia = partes[partes.length - 3] || '';
      resultado.municipio = partes[partes.length - 2] || '';
      resultado.estado = partes[partes.length - 1] || '';
    }

    return resultado;
  };

  // Manejar selección de cliente desde autocompletado
  const handleClienteSelect = async (cliente: ClienteDatos) => {
    const domicilioParseado = parsearDomicilioFiscal(cliente.domicilioFiscal);
    const domicilioNormalizado = [
      domicilioParseado.calle,
      domicilioParseado.numeroExterior,
      domicilioParseado.numeroInterior,
      domicilioParseado.colonia,
      domicilioParseado.municipio,
      domicilioParseado.estado,
      domicilioParseado.codigoPostal,
    ].filter(Boolean).join(', ') || cliente.domicilioFiscal;

    setFormData(prev => ({
      ...prev,
      rfc: cliente.rfc,
      razonSocial: cliente.razonSocial || prev.razonSocial,
      nombre: cliente.nombre || prev.nombre,
      paterno: cliente.paterno || prev.paterno,
      materno: cliente.materno || prev.materno,
      correoElectronico: cliente.correoElectronico || prev.correoElectronico,
      telefono: (cliente as { telefono?: string }).telefono || prev.telefono,
      pais: cliente.pais || prev.pais,
      domicilioFiscal: domicilioNormalizado || prev.domicilioFiscal,
      regimenFiscal: cliente.regimenFiscal || prev.regimenFiscal,
      usoCfdi: cliente.usoCfdi || prev.usoCfdi,
    }));
  };

  // Manejar cuando no se encuentra el RFC
  const handleRfcNotFound = () => {
    setMostrarAltaCliente(true);
  };

  // Guardar cliente desde modal de alta
  const handleGuardarCliente = async (clienteData: ClienteFormData) => {
    try {
      // Construir objeto cliente para el backend
      const clientePayload: any = {
        rfc: clienteData.rfc,
        razon_social: clienteData.razonSocial,
        nombre: clienteData.nombre,
        paterno: clienteData.apellidoPaterno,
        materno: clienteData.apellidoMaterno,
        correo_electronico: clienteData.correoElectronico,
        telefono: clienteData.telefono,
        codigo_postal: clienteData.codigoPostal,
        estado: clienteData.estado,
        municipio: clienteData.municipio,
        colonia: clienteData.colonia,
        calle: clienteData.calle,
        numero_exterior: clienteData.numeroExterior,
        numero_interior: clienteData.numeroInterior,
        pais: clienteData.pais,
        regimen_fiscal: clienteData.regimenFiscal,
        uso_cfdi: clienteData.usoCfdi,
        registro_tributario: clienteData.esExtranjero ? 'EXT' : null,
      };

      // Guardar cliente en el backend usando el endpoint POST /catalogo-clientes
      const response = await fetch(apiUrl('/catalogo-clientes'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(clientePayload),
      });

      const responseData = await response.json();
      
      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || 'Error al guardar cliente');
      }

      // Construir domicilio fiscal
      const partesDomicilio = [
        clienteData.calle,
        clienteData.numeroExterior,
        clienteData.numeroInterior,
        clienteData.colonia,
        clienteData.municipio,
        clienteData.estado,
        clienteData.codigoPostal,
        clienteData.pais,
      ].filter(Boolean);
      const domicilioFiscal = partesDomicilio.join(', ');

      // Actualizar formulario con los datos del cliente
      setFormData(prev => ({
        ...prev,
        rfc: clienteData.rfc,
        razonSocial: clienteData.razonSocial,
        nombre: clienteData.nombre || prev.nombre,
        paterno: clienteData.apellidoPaterno || prev.paterno,
        materno: clienteData.apellidoMaterno || prev.materno,
        correoElectronico: clienteData.correoElectronico,
        telefono: clienteData.telefono || prev.telefono,
        pais: clienteData.pais,
        domicilioFiscal: domicilioFiscal,
        regimenFiscal: clienteData.regimenFiscal,
        usoCfdi: clienteData.usoCfdi,
      }));

      setMostrarAltaCliente(false);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      throw error;
    }
  };

  // Detectar tipo de persona cuando cambia el RFC
  useEffect(() => {
    const rfc = (formData.rfc || '').trim().toUpperCase();
    let nuevoTipo: 'fisica' | 'moral' | null = null;
    
    if (rfc && rfc.length >= 12) {
      if (esPersonaMoral(rfc)) {
        nuevoTipo = 'moral';
      } else if (esPersonaFisica(rfc)) {
        nuevoTipo = 'fisica';
      }
    }
    
    // Solo actualizar si el tipo cambió
    if (nuevoTipo !== tipoPersonaAnteriorRef.current) {
      tipoPersonaAnteriorRef.current = nuevoTipo;
      setTipoPersona(nuevoTipo);
      
      // Limpiar campos según el nuevo tipo
      if (nuevoTipo === 'moral') {
        setFormData(prev => ({
          ...prev,
          nombre: '',
          paterno: '',
          materno: '',
        }));
      } else if (nuevoTipo === 'fisica') {
        setFormData(prev => ({
          ...prev,
          razonSocial: '',
        }));
      }
    }
  }, [formData.rfc]);

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve((dataUrl || '').split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Helper: obtener uuid de nota de crédito desde backend por UUID de factura origen
  // Deshabilitado en Oracle: el endpoint /credit-notes/search usa tablas no disponibles (JPA),
  // provoca ORA-00942. Devolvemos undefined para evitar el 500 y usamos defaults locales.
  const obtenerUuidNotaCredito = async (_uuidFacturaOrigen?: string) => {
    return undefined as undefined | { uuidNc: string; serie?: string; folio?: string };
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMensaje(null);
    setFieldErrors(prev => {
      const next = { ...prev };
      // @ts-ignore
      if (next[name]) delete next[name as keyof typeof next];
      return next;
    });
  };

  const handleConceptoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'descripcionLibre') {
      setDescripcionLibre(value);
    } else {
      setConcepto(prev => ({
        ...prev,
        [name]: (name === 'cantidad' || name === 'precioUnitario')
          ? (value === '' ? '' : Number(value))
          : value,
      } as any));
    }
  };

  const validarCampos = () => {
    const rfcCompleto = (formData.rfc || '').trim().toUpperCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    const errors: any = {};
    const correo = formData.correoElectronico?.trim() || '';
    const razonSocial = formData.razonSocial?.trim() || '';
    const domicilio = formData.domicilioFiscal?.trim() || '';
    const nombre = formData.nombre?.trim() || '';
    const paterno = formData.paterno?.trim() || '';
    const usoCfdi = formData.usoCfdi?.trim() || '';
    const regimenFiscal = formData.regimenFiscal?.trim() || '';

    if (!emailRegex.test(correo)) errors.correoElectronico = 'Email inválido';
    if (!rfcRegex.test(rfcCompleto)) errors.rfc = 'RFC inválido';

    if (tipoPersona !== 'fisica' && !razonSocial) {
      errors.razonSocial = 'Campo requerido';
    }

    if (tipoPersona === 'fisica') {
      if (!nombre) errors.nombre = 'Campo requerido';
      if (!paterno) errors.paterno = 'Campo requerido';
    }

    if (!domicilio) {
      errors.domicilioFiscal = 'Campo requerido';
    } else if (!CP_REGEX.test(domicilio)) {
      errors.domicilioFiscal = 'Incluye un CP válido (5 dígitos)';
    }
    if (!regimenFiscal) errors.regimenFiscal = 'Campo requerido';
    if (!usoCfdi) errors.usoCfdi = 'Campo requerido';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calcularImportes = () => {
    const cantidadNum = typeof concepto.cantidad === 'number' ? concepto.cantidad : 0;
    const precioUnitarioNum = typeof concepto.precioUnitario === 'number' ? concepto.precioUnitario : 0;
    const subtotal = cantidadNum * precioUnitarioNum;
    const iva = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);
    return { subtotal, iva, total };
  };

  const obtenerDescripcionConcepto = () => {
    if (concepto.descripcion === 'OTRO') {
      return descripcionLibre.trim();
    }
    return CONCEPTO_DESC_OPTIONS.find((o) => o.value === concepto.descripcion)?.label || concepto.descripcion;
  };

  const extraerCpDesdeTexto = (valor?: string) => {
    if (!valor) return '';
    const match = valor.match(CP_REGEX);
    if (match) return match[0];
    return valor.trim();
  };

  const prepararNotaCredito = async (): Promise<{ notaData: NotaCreditoData; rfcReceptor: string } | null> => {
    if (!validarCampos()) {
      setMensaje({ tipo: 'error', texto: 'Completa los datos fiscales obligatorios' });
      return null;
    }
    if (concepto.descripcion === 'OTRO' && !descripcionLibre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Especifica la descripción libre del concepto' });
      return null;
    }
    const rfcReceptor = (formData.rfc || '').trim().toUpperCase();
    const { subtotal, iva, total } = calcularImportes();
    const uuidInfo = await obtenerUuidNotaCredito(formData.referenciaFactura);
    const descripcionConcepto = obtenerDescripcionConcepto();
    const cantidad = typeof concepto.cantidad === 'number' ? concepto.cantidad : 0;
    const precioUnitario = typeof concepto.precioUnitario === 'number' ? concepto.precioUnitario : 0;

    const notaData: NotaCreditoData = {
      uuid: uuidInfo?.uuidNc || '',
      serie: formData.serie || uuidInfo?.serie || 'NC',
      folio: formData.folio || uuidInfo?.folio || new Date().getTime().toString().slice(-6),
      fechaEmision: new Date().toISOString(),
      rfcEmisor: empresaInfo.rfc,
      nombreEmisor: empresaInfo.nombre,
      rfcReceptor,
      nombreReceptor: (formData.razonSocial || `${formData.nombre} ${formData.paterno} ${formData.materno}`.trim() || rfcReceptor),
      domicilioFiscalReceptor: formData.domicilioFiscal.trim(),
      usoCfdi: formData.usoCfdi,
      regimenFiscal: formData.regimenFiscal,
      formaPago: formData.formaPago,
      metodoPago: formData.metodoPago,
      subtotal,
      iva,
      ivaTasa: IVA_TASA_DEFAULT,
      importe: total,
      conceptos: [{
        descripcion: descripcionConcepto,
        cantidad,
        unidad: concepto.unidad,
        precioUnitario,
        importe: subtotal,
        claveProdServ: CLAVE_PROD_SERV_DEFAULT,
      }],
      referenciaFactura: formData.referenciaFactura || undefined,
      motivo: formData.motivo || undefined,
      lugarExpedicion: DEFAULT_LUGAR_EXPEDICION,
    };
    return { notaData, rfcReceptor };
  };

  const descargarXmlArchivo = (xmlContent: string, serie: string, folio: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotaCredito_${serie}-${folio}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const obtenerLogoConfigFinal = async () => {
    let logoConfigFinal: any = { logoUrl, customColors };
    try {
      const logosResp = await facturaService.obtenerConfiguracionLogos();
      if ((logosResp as any)?.exitoso) {
        logoConfigFinal = {
          logoUrl: logosResp.logoUrl,
          logoBase64: logosResp.logoBase64,
          customColors: logosResp.customColors,
        };
      }
    } catch {
      // Ignorar y usar fallback actual
    }
    return logoConfigFinal;
  };

  const crearXMLNotaCredito = (notaData: NotaCreditoData) => {
    const fecha = new Date(notaData.fechaEmision).toISOString().split('.')[0];
    const concepto = notaData.conceptos[0];
    const cpReceptor = extraerCpDesdeTexto(notaData.domicilioFiscalReceptor);
    const tieneImpuestos = notaData.iva > 0;
    const tasaIva = (notaData.ivaTasa ?? IVA_TASA_DEFAULT).toFixed(6);
    const objetoImp = tieneImpuestos ? '02' : '01';
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="${notaData.serie}" Folio="${notaData.folio}" Fecha="${fecha}" SubTotal="${notaData.subtotal.toFixed(2)}" Total="${notaData.importe.toFixed(2)}" Moneda="MXN" TipoDeComprobante="E" Exportacion="01" LugarExpedicion="${notaData.lugarExpedicion || DEFAULT_LUGAR_EXPEDICION}" FormaPago="${notaData.formaPago}" MetodoPago="${notaData.metodoPago}">
${notaData.referenciaFactura ? `  <cfdi:CfdiRelacionados TipoRelacion="${notaData.motivo || '01'}">
    <cfdi:CfdiRelacionado UUID="${notaData.referenciaFactura.toUpperCase()}"/>
  </cfdi:CfdiRelacionados>
` : ''}  <cfdi:Emisor Rfc="${notaData.rfcEmisor}" Nombre="${notaData.nombreEmisor}" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${notaData.rfcReceptor}" Nombre="${notaData.nombreReceptor}" DomicilioFiscalReceptor="${cpReceptor}" RegimenFiscalReceptor="${notaData.regimenFiscal}" UsoCFDI="${notaData.usoCfdi}"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="${concepto.claveProdServ}" Cantidad="${concepto.cantidad.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}" ClaveUnidad="${concepto.unidad || 'E48'}" Descripcion="${concepto.descripcion}" ValorUnitario="${concepto.precioUnitario.toFixed(2)}" Importe="${concepto.importe.toFixed(2)}" ObjetoImp="${objetoImp}">
${tieneImpuestos ? `      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${notaData.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${tasaIva}" Importe="${notaData.iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>` : '    </cfdi:Concepto>'}
  </cfdi:Conceptos>
${tieneImpuestos ? `  <cfdi:Impuestos TotalImpuestosTrasladados="${notaData.iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${notaData.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${tasaIva}" Importe="${notaData.iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
` : ''}</cfdi:Comprobante>`;
  };

  // Guardar la nota de crédito en Oracle (FACTURAS y NOTAS_CREDITO) antes de generar/descargar
  const guardarNotaCreditoEnBD = async (notaData: NotaCreditoData, rfcReceptor: string): Promise<TimbradoResult> => {
    try {
      const xmlContent = crearXMLNotaCredito(notaData);
      const conceptoPrincipal = notaData.conceptos[0];
      const payload: Record<string, any> = {
        uuidFacturaOrig: notaData.referenciaFactura || undefined,
        serieFacturaOrig: undefined,
        folioFacturaOrig: undefined,
        uuidNc: notaData.uuid || undefined,
        serieNc: notaData.serie,
        folioNc: notaData.folio,
        fechaEmision: notaData.fechaEmision,
        usoCfdi: notaData.usoCfdi,
        regimenFiscal: notaData.regimenFiscal,
        motivo: notaData.motivo || undefined,
        concepto: conceptoPrincipal?.descripcion || 'Nota de crédito',
        cantidad: conceptoPrincipal?.cantidad || 1,
        unidad: conceptoPrincipal?.unidad || 'E48',
        precioUnitario: conceptoPrincipal?.precioUnitario || 0,
        subtotal: notaData.subtotal,
        ivaImporte: notaData.iva,
        ivaPorcentaje: notaData.ivaTasa,
        iepsImporte: 0,
        iepsPorcentaje: undefined,
        total: notaData.importe,
        xmlContent,
        rfcEmisor: notaData.rfcEmisor,
        rfcReceptor,
        formaPago: notaData.formaPago,
        metodoPago: notaData.metodoPago,
        nombreReceptor: notaData.nombreReceptor,
        domicilioFiscalReceptor: notaData.domicilioFiscalReceptor,
      };

      const resp = await fetch(creditNotesUrl('/guardar'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        const errs = (data?.errors || []) as string[];
        const msg = errs.length ? errs.join(' | ') : (data?.message || 'No se pudo guardar la nota de crédito');
        throw new Error(msg);
      }
      if (data?.uuidNc) {
        payload.uuidNc = data.uuidNc;
        notaData.uuid = data.uuidNc;
      }

      const respTimbrar = await fetch(creditNotesUrl('/timbrar'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload),
      });
      const dataTimbrar = await respTimbrar.json();
      if (!respTimbrar.ok || !dataTimbrar?.ok) {
        const msg = dataTimbrar?.message || 'Guardado correcto, pero el PAC rechazó el timbrado';
        throw new Error(msg);
      }
      const result: TimbradoResult = {
        ok: true,
        uuid: dataTimbrar.uuid || payload.uuidNc,
        serie: dataTimbrar.serie || notaData.serie,
        folio: dataTimbrar.folio || notaData.folio,
        xmlTimbrado: dataTimbrar.xmlTimbrado || xmlContent,
        message: dataTimbrar.message,
      };
      notaData.uuid = result.uuid || notaData.uuid;
      notaData.serie = result.serie || notaData.serie;
      notaData.folio = result.folio || notaData.folio;
      if (result.uuid) {
        setUuidNcActivo(result.uuid);
      }
      return result;
    } catch (error: any) {
      console.warn('Fallo guardando NOTA_CREDITO:', error);
      const isNetwork =
        error instanceof TypeError &&
        (error.message === 'Failed to fetch' || error.message?.includes('fetch'));
      const msg = isNetwork
        ? `No se pudo conectar al backend (${creditNotesUrl('/guardar')}). Verifique que el servidor esté en ejecución y que VITE_API_BASE_URL apunte al host correcto.`
        : error?.message || 'Error al guardar la nota de crédito';
      return { ok: false, error: msg };
    }
  };

  const enviarNotaPorCorreo = async (
    notaData: NotaCreditoData,
    rfcReceptor: string,
    timbrado?: TimbradoResult,
    manageState = true
  ) => {
    try {
      if (manageState) {
        setEnviandoCorreo(true);
      }
      if (timbrado?.uuid) {
        notaData.uuid = timbrado.uuid;
      }
      if (timbrado?.serie) {
        notaData.serie = timbrado.serie;
      }
      if (timbrado?.folio) {
        notaData.folio = timbrado.folio;
      }
      const logoConfigFinal = await obtenerLogoConfigFinal();
      const facturaData = convertirANotaDataParaPDF(notaData as any);
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify({ facturaData, logoConfig: logoConfigFinal })
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF en el servidor');
      }

      const pdfBlob = await response.blob();
      const pdfBase64 = await blobToBase64(pdfBlob);

      const configMensaje = await configuracionCorreoService.obtenerMensajeParaEnvio();
      const facturaInfo = `${notaData.serie}-${notaData.folio}`;
      let asunto = (configMensaje?.asunto || 'Nota de Crédito - {facturaInfo}');
      asunto = configuracionCorreoService.procesarMensaje(asunto, {
        facturaInfo,
        serie: notaData.serie,
        folio: notaData.folio,
        uuid: notaData.uuid || '',
        rfcEmisor: notaData.rfcEmisor,
        rfcReceptor
      });

      const templateVars = {
        facturaInfo,
        serie: notaData.serie,
        folio: notaData.folio,
        uuid: notaData.uuid || '',
        rfcEmisor: notaData.rfcEmisor,
        rfcReceptor
      } as Record<string, string>;

      const mensajeBase = configMensaje?.mensajePersonalizado || configMensaje?.mensaje || 'Se ha generado su nota de crédito.\n\nGracias por su preferencia.';

      const xmlFirmado = timbrado?.xmlTimbrado || crearXMLNotaCredito(notaData);
      const xmlBase64 = stringToBase64(xmlFirmado);

      const correoResp = await correoService.enviarPdfDirecto({
        pdfBase64,
        correoReceptor: formData.correoElectronico,
        asunto,
        mensaje: mensajeBase,
        nombreAdjunto: `NotaCredito_${notaData.serie}-${notaData.folio}.pdf`,
        templateVars,
        xmlBase64,
        nombreAdjuntoXml: xmlBase64 ? `NotaCredito_${notaData.serie}-${notaData.folio}.xml` : undefined
      });

      if (correoResp.success) {
        setMensaje({ tipo: 'success', texto: correoResp.message || 'Correo enviado exitosamente' });
        alert(`PDF de nota de crédito enviado exitosamente al correo: ${formData.correoElectronico}`);
        return true;
      } else {
        setMensaje({ tipo: 'error', texto: correoResp.message || 'Error al enviar el correo' });
        return false;
      }
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al enviar el correo' });
      return false;
    } finally {
      if (manageState) {
        setEnviandoCorreo(false);
      }
    }
  };

  // Guardar únicamente en BD, sin generar PDF/XML
  const handleGuardarFactura = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;

    try {
      setGenerando(true);
      const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
      if (timbrado.ok) {
        setMensaje({ tipo: 'success', texto: 'Nota de crédito guardada y timbrada correctamente con Finkok demo' });
        alert(`Factura emitida y timbrada exitosamente\nUUID: ${timbrado.uuid || 'SIN-UUID'}`);
        if (window.confirm('¿Desea enviar la factura al correo?')) {
          await enviarNotaPorCorreo(notaData, rfcReceptor, timbrado);
        }
      } else {
        setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo guardar la nota de crédito' });
      }
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al guardar la nota de crédito' });
    } finally {
      setGenerando(false);
    }
  };
  const convertirANotaDataParaPDF = (notaData: any) => {
    return {
      uuid: notaData.uuid,
      serie: notaData.serie,
      folio: notaData.folio,
      fechaEmision: notaData.fechaEmision,
      rfcEmisor: notaData.rfcEmisor,
      nombreEmisor: notaData.nombreEmisor,
      rfcReceptor: notaData.rfcReceptor,
      nombreReceptor: notaData.nombreReceptor,
      subtotal: notaData.subtotal,
      iva: notaData.iva,
      total: notaData.importe,
      moneda: 'MXN',
      metodoPago: notaData.metodoPago,
      formaPago: notaData.formaPago,
      usoCfdi: notaData.usoCfdi || notaData.usoCFDI,
      tipoComprobante: 'E',
      lugarExpedicion: '12345',
      xmlTimbrado: crearXMLNotaCredito(notaData),
      cadenaOriginal: `||1.1|${notaData.uuid || 'SIN-UUID'}|${notaData.fechaEmision}||`,
      selloDigital: 'ABC123DEF456',
      certificado: 'MIIE',
      folioFiscal: notaData.uuid || '',
      fechaTimbrado: notaData.fechaEmision,
      conceptos: notaData.conceptos.map((concepto: any) => ({
        claveProdServ: concepto.claveProdServ || CLAVE_PROD_SERV_DEFAULT,
        noIdentificacion: 'NC001',
        cantidad: concepto.cantidad,
        claveUnidad: concepto.unidad || 'E48',
        unidad: concepto.unidad,
        descripcion: concepto.descripcion,
        valorUnitario: concepto.precioUnitario,
        importe: concepto.importe,
        descuento: 0.0,
        impuestos: [{
          tipo: 'Traslado',
          impuesto: '002',
          tipoFactor: 'Tasa',
          tasaOCuota: 0.16,
          base: concepto.importe,
          importe: +(concepto.importe * 0.16).toFixed(2)
        }]
      }))
    };
  };

  const handleDescargarPDFyXML = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;

    try {
      setGenerando(true);
      const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
      if (!timbrado.ok) {
        setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo timbrar la nota de crédito' });
        return;
      }

      const logoConfigFinal = await obtenerLogoConfigFinal();
      const facturaData = convertirANotaDataParaPDF(notaData as any);
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify({ facturaData, logoConfig: logoConfigFinal })
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF en el servidor');
      }

      const pdfBlob = await response.blob();
      pdfService.descargarPDF(pdfBlob, `NotaCredito_${notaData.serie}-${notaData.folio}.pdf`);
      descargarXmlArchivo(timbrado.xmlTimbrado || crearXMLNotaCredito(notaData), notaData.serie, notaData.folio);
      setMensaje({ tipo: 'success', texto: 'PDF y XML descargados correctamente' });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al descargar PDF/XML' });
    } finally {
      setGenerando(false);
    }
  };

  // Descargas individuales: XML y PDF para Nota de Crédito
  const handleDescargarXML = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;
  
    try {
      setGenerando(true);
      const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
      if (!timbrado.ok) {
        setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo timbrar la nota de crédito' });
        return;
      }
      descargarXmlArchivo(timbrado.xmlTimbrado || crearXMLNotaCredito(notaData), notaData.serie, notaData.folio);
      setMensaje({ tipo: 'success', texto: 'XML descargado correctamente' });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al descargar XML' });
    } finally {
      setGenerando(false);
    }
  };

  const handleVistaPrevia = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData } = prepared;

    try {
      const logoConfigFinal = await obtenerLogoConfigFinal();
      const facturaData = convertirANotaDataParaPDF(notaData as any);
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify({ facturaData, logoConfig: logoConfigFinal })
      });
      if (!response.ok) throw new Error('Error al generar PDF en el servidor');
      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al generar vista previa' });
    }
  };

  const handleDescargarPDF = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;
  
    try {
      setGenerando(true);
      const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
      if (!timbrado.ok) {
        setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo timbrar la nota de crédito' });
        return;
      }
      const logoConfigFinal = await obtenerLogoConfigFinal();
      const facturaData = convertirANotaDataParaPDF(notaData as any);
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify({ facturaData, logoConfig: logoConfigFinal })
      });
      if (!response.ok) throw new Error('Error al generar PDF en el servidor');
      const pdfBlob = await response.blob();
      pdfService.descargarPDF(pdfBlob, `NotaCredito_${notaData.serie}-${notaData.folio}.pdf`);
      setMensaje({ tipo: 'success', texto: 'PDF descargado correctamente' });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al descargar PDF' });
    } finally {
      setGenerando(false);
    }
  };

  const handleEnviarCorreo = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;

    try {
      setEnviandoCorreo(true);
      const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
      if (!timbrado.ok) {
        setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo timbrar la nota de crédito' });
        return;
      }
      await enviarNotaPorCorreo(notaData, rfcReceptor, timbrado, false);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e?.message || 'Error al enviar el correo' });
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const abrirModalWhatsApp = (uuid: string, serie: string, folio: string) => {
    const facturaInfo = `Nota de crédito ${serie}-${folio}`;
    setModalWhatsApp({
      isOpen: true,
      facturaUuid: uuid,
      facturaInfo,
      telefonoInicial: (formData.telefono || '').trim(),
    });
  };

  const cerrarModalWhatsApp = () => {
    setModalWhatsApp({
      isOpen: false,
      facturaUuid: '',
      facturaInfo: '',
      telefonoInicial: '',
    });
  };

  const handleEnviarWhatsApp = async () => {
    setMensaje(null);
    const prepared = await prepararNotaCredito();
    if (!prepared) return;
    const { notaData, rfcReceptor } = prepared;

    let uuid = (uuidNcActivo || notaData.uuid || '').trim();
    let serie = notaData.serie;
    let folio = notaData.folio;

    if (!uuid) {
      try {
        setEnviandoWhatsApp(true);
        const timbrado = await guardarNotaCreditoEnBD(notaData, rfcReceptor);
        if (!timbrado.ok) {
          setMensaje({ tipo: 'error', texto: timbrado.error || 'No se pudo timbrar la nota de crédito' });
          return;
        }
        uuid = (timbrado.uuid || '').trim();
        serie = timbrado.serie || serie;
        folio = timbrado.folio || folio;
        if (!uuid) {
          alert('No se obtuvo UUID al timbrar. No se puede enviar por WhatsApp.');
          return;
        }
      } catch (e: unknown) {
        setMensaje({
          tipo: 'error',
          texto: e instanceof Error ? e.message : 'Error al preparar la nota de crédito',
        });
        return;
      } finally {
        setEnviandoWhatsApp(false);
      }
    }

    abrirModalWhatsApp(uuid, serie, folio);
  };

  return (
    <>
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Card id="guia-nc-datos-fiscales">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Datos fiscales:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RFC *
            </label>
            <RfcAutocomplete
              value={formData.rfc}
              onChange={(rfc) => setFormData(prev => ({ ...prev, rfc }))}
              onSelect={handleClienteSelect}
              onNotFound={handleRfcNotFound}
              required
            />
            {fieldErrors.rfc && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.rfc}</p>
            )}
          </div>
        </div>
      </Card>

      <Card id="guia-nc-datos-completos">
        <DatosFiscalesSection
          formData={{
            rfcIniciales: '',
            rfcFecha: '',
            rfcHomoclave: '',
            correoElectronico: formData.correoElectronico,
            razonSocial: formData.razonSocial,
            nombre: formData.nombre,
            paterno: formData.paterno,
            materno: formData.materno,
            pais: formData.pais,
            noRegistroIdentidadTributaria: formData.noRegistroIdentidadTributaria,
            domicilioFiscal: formData.domicilioFiscal,
            regimenFiscal: formData.regimenFiscal,
            usoCfdi: formData.usoCfdi,
          }}
          handleChange={handleChange}
          isRFCRequired={false}
          isRazonSocialRequired={true}
          isDomicilioFiscalRequired={true}
          isRegimenFiscalRequired={true}
          isUsoCfdiRequired={true}
          isCorreoElectronicoRequired={true}
          fieldErrors={fieldErrors}
          mostrarRazonSocial={tipoPersona === 'moral' || tipoPersona === null}
          mostrarNombreCompleto={tipoPersona === 'fisica' || tipoPersona === null}
          ocultarRFC={true}
        />
        <div className="mt-4 max-w-md">
          <FormField
            name="telefono"
            label="Teléfono para WhatsApp"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="527331565237"
          />
        </div>
      </Card>

      {/* Modal de Alta de Cliente */}
      <AltaClienteModal
        isOpen={mostrarAltaCliente}
        onClose={() => setMostrarAltaCliente(false)}
        onSave={handleGuardarCliente}
        rfcInicial={formData.rfc}
      />

      <Card id="guia-nc-detalles">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detalles de la Nota de crédito</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          <FormField label="Referencia factura:" name="referenciaFactura" value={formData.referenciaFactura} onChange={handleChange} />
          <SelectField label="Motivo de la nota de crédito:" name="motivo" value={formData.motivo} onChange={handleChange} options={MOTIVO_NC_OPTIONS} />
          <FormField label="Serie:" name="serie" value={formData.serie} onChange={handleChange} />
          <FormField label="Folio:" name="folio" value={formData.folio} onChange={handleChange} />
          <SelectField label="Uso CFDI:" name="usoCfdi" value={formData.usoCfdi} onChange={handleChange} options={USO_CFDI_OPTIONS} />
          <SelectField label="Régimen Fiscal:" name="regimenFiscal" value={formData.regimenFiscal} onChange={handleChange} options={REGIMEN_FISCAL_OPTIONS} />
        </div>
      </Card>

      <Card id="guia-nc-concepto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Concepto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          <SelectField label="Concepto / descripción:" name="descripcion" value={concepto.descripcion} onChange={handleConceptoChange} options={CONCEPTO_DESC_OPTIONS} />
          {concepto.descripcion === 'OTRO' && (
            <FormField label="Descripción libre:" name="descripcionLibre" value={descripcionLibre} onChange={handleConceptoChange} />
          )}
          <FormField label="Cantidad:" name="cantidad" type="number" value={concepto.cantidad} onChange={handleConceptoChange} />
          <FormField label="Unidad:" name="unidad" value={concepto.unidad} onChange={handleConceptoChange} />
          <FormField label="Precio Unitario:" name="precioUnitario" type="number" value={concepto.precioUnitario} onChange={handleConceptoChange} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Los importes se calcularán automáticamente para el PDF de vista previa.
        </p>
      </Card>

      <ComprobanteAccionesBar
        id="guia-nc-generar"
        className="mt-4"
        showCancel={false}
        onVistaPrevia={() => void handleVistaPrevia()}
        vistaPreviaDisabled={generando || enviandoCorreo}
        onGenerar={() => void handleGuardarFactura()}
        generarLabel={generando ? 'Emitiendo…' : 'Emitir nota de crédito'}
        generarDisabled={generando || enviandoCorreo}
        tieneUuid={Boolean((uuidNcActivo || '').trim())}
        postEmisionHint="Después de emitir la nota de crédito"
        onDescargarXml={() => void handleDescargarXML()}
        onDescargarPdf={() => void handleDescargarPDF()}
        onEnviarCorreo={() => void handleEnviarCorreo()}
        onEnviarWhatsApp={() => void handleEnviarWhatsApp()}
        xmlDisabled={generando}
        pdfDisabled={generando}
        correoDisabled={generando || enviandoCorreo || enviandoWhatsApp}
        whatsappDisabled={generando || enviandoCorreo || enviandoWhatsApp}
        extraRow2={
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDescargarPDFyXML()}
            disabled={generando}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            Descargar PDF y XML
          </Button>
        }
      />

      {mensaje && (
        <div
          className={
            mensaje.tipo === 'success'
              ? 'mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-800'
              : 'mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800'
          }
        >
          <p className="font-semibold mb-1">
            {mensaje.tipo === 'success' ? 'Operación exitosa' : 'Error en operación'}
          </p>
          <p className="text-sm">{mensaje.texto}</p>
        </div>
      )}
    </form>

    <EnviarWhatsAppModal
      isOpen={modalWhatsApp.isOpen}
      onClose={cerrarModalWhatsApp}
      facturaUuid={modalWhatsApp.facturaUuid}
      facturaInfo={modalWhatsApp.facturaInfo}
      telefonoInicial={modalWhatsApp.telefonoInicial}
      tituloModal="Enviar Nota de Crédito por WhatsApp"
      etiquetaDocumento="Nota de crédito"
      mensajeBase={WHATSAPP_MENSAJE_BASE_NOTA_CREDITO}
      construirMensaje={construirMensajeWhatsAppNotaCredito}
      notaArchivos="Se enviarán el PDF y el XML de la nota de crédito al número indicado."
    />
    </>
  );
};

// Opciones SAT para Motivo de Nota de Crédito (CFDI 4.0)
const MOTIVO_NC_OPTIONS = [
  { value: '01', label: '01 – Devolución de mercancías' },
  { value: '02', label: '02 – Descuento sobre factura' },
  { value: '03', label: '03 – Bonificación' },
  { value: '04', label: '04 – Disminución en el valor de la operación' },
  { value: '05', label: '05 – Cancelación por error en factura' },
];

// Opciones de concepto/descrición estándar para Nota de Crédito
const CONCEPTO_DESC_OPTIONS = [
  { value: 'DEVOLUCION_MERCANCIA', label: 'Devolución de mercancías' },
  { value: 'DESCUENTO_ERROR_PRECIO', label: 'Descuento aplicado por error en el precio unitario' },
  { value: 'BONIFICACION', label: 'Bonificación' },
  { value: 'DISMINUCION_VALOR', label: 'Disminución en el valor de la operación' },
  { value: 'CANCELACION_SERVICIO', label: 'Cancelación de servicio no realizado' },
  { value: 'AJUSTE_IVA_INCORRECTO', label: 'Ajuste por factura emitida con IVA incorrecto' },
  { value: 'OTRO', label: 'Otro (texto libre)' },
];