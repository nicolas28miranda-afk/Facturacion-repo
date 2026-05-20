import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { TextareaField } from './TextareaField';
import { RadioGroupField } from './RadioGroupField';
import { correoService } from '../services/correoService';
import { clienteCatalogoService } from '../services/clienteCatalogoService';
// import { boletaService } from '../services/boletaService'; // No utilizado directamente
import { facturaService } from '../services/facturaService';
import type { CfdiConsultaResponse } from '../services/facturaService';
import { 
    PAIS_OPTIONS, 
    REGIMEN_FISCAL_OPTIONS, 
    USO_CFDI_OPTIONS, 
    TIENDA_OPTIONS,
    MEDIO_PAGO_OPTIONS,
    FORMA_PAGO_OPTIONS,
    JUSTIFICACION_FUNCIONALIDAD_OPTIONS,
    UNIDAD_MEDIDA_OPTIONS,
    TASA_IVA_OPTIONS,
    TASA_IEPS_OPTIONS,
    EMPRESA_OPTIONS_CONSULTAS,
    TIPO_DOCUMENTO_CAPTURA_LIBRE_OPTIONS
} from '../constants';
import { useTiendasOptions } from '../hooks/useTiendasOptions';
import { useJustificacionesOptions } from '../hooks/useJustificacionesOptions';
import { conceptoService } from '../services/conceptoService';
import { apiUrl, pacUrl, getHeadersWithUsuario } from '../services/api';

interface Concepto {
  sku: string;
  unidadMedida: string;
  descripcion: string;
  valorUnitario: string;
  descuentoConcepto: string;
  tasaIva: string;
  iva: string;
  tasaIeps: string;
  ieps: string;
  tasaIe: string;
  ie: string;
  noPedimento: string;
}

interface CapturaLibreFormData {
  // Datos Fiscales
  rfcIniciales: string;
  rfcFecha: string;
  rfcHomoclave: string;
  correoElectronico: string;
  razonSocial: string;
  nombre: string;
  paterno: string;
  materno: string;
  pais: string;
  noRegistroIdentidadTributaria: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  tiendaBoleta: string;
  terminalBoleta: string;
  numeroBoleta: string;
  justificacion: string;
  tipoDocumento: string;
  uuid: string;
  serie?: string;
  folio?: string;
  emisor: string;
  fechaEmision: string;
  concepto: Concepto;
  medioPago: string;
  formaPago: string;
  descuentoTotal: string;
  subtotal: string;
  ivaTotal: string;
  iepsTotal: string;
  total: string;
  ivaDesglosado: boolean;
  iepsDesglosado: boolean;
  comentarios: string;
}

const initialConceptoData: Concepto = {
  sku: '',
  unidadMedida: UNIDAD_MEDIDA_OPTIONS[0]?.value || '',
  descripcion: '',
  valorUnitario: '',
  descuentoConcepto: '',
  tasaIva: TASA_IVA_OPTIONS[0]?.value || '',
  iva: '',
  tasaIeps: TASA_IEPS_OPTIONS[0]?.value || '',
  ieps: '',
  tasaIe: '0',
  ie: '',
  noPedimento: '',
};

const initialCapturaLibreFormData: CapturaLibreFormData = {
  rfcIniciales: '',
  rfcFecha: '',
  rfcHomoclave: '',
  correoElectronico: '',
  razonSocial: '',
  nombre: '',
  paterno: '',
  materno: '',
  pais: PAIS_OPTIONS[0]?.value || '',
  noRegistroIdentidadTributaria: '',
  domicilioFiscal: '',
  regimenFiscal: REGIMEN_FISCAL_OPTIONS[0]?.value || '',
  usoCfdi: USO_CFDI_OPTIONS[0]?.value || '',
  tiendaBoleta: '',
  terminalBoleta: '',
  numeroBoleta: '',
  justificacion: JUSTIFICACION_FUNCIONALIDAD_OPTIONS[0]?.value || '',
  tipoDocumento: TIPO_DOCUMENTO_CAPTURA_LIBRE_OPTIONS[0]?.value || 'I',
  uuid: '',
  emisor: EMPRESA_OPTIONS_CONSULTAS[0]?.value || 'E001',
  fechaEmision: new Date().toISOString().split('T')[0],
  concepto: initialConceptoData,
  medioPago: MEDIO_PAGO_OPTIONS[0]?.value || '',
  formaPago: FORMA_PAGO_OPTIONS[0]?.value || '',
  descuentoTotal: '',
  subtotal: '',
  ivaTotal: '',
  iepsTotal: '',
  total: '',
  ivaDesglosado: false,
  iepsDesglosado: false,
  comentarios: '',
};

export const FacturacionCapturaLibrePage: React.FC = () => {
  const [formData, setFormData] = useState<CapturaLibreFormData>(initialCapturaLibreFormData);
  const { options: tiendasOpts, loading: tiendasLoading, error: tiendasError } = useTiendasOptions();
  const { options: justificacionesOpts, loading: justLoading, error: justError } = useJustificacionesOptions();
  const [_consultaCfdi, setConsultaCfdi] = useState<CfdiConsultaResponse | null>(null);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timbradoStatus, setTimbradoStatus] = useState<string | null>(null);
  const [timbradoIntervalId, setTimbradoIntervalId] = useState<number | null>(null);
  const [guardandoBD, setGuardandoBD] = useState<boolean>(false);
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | null>(null);
  const tipoPersonaAnteriorRef = useRef<'fisica' | 'moral' | null>(null);

  useEffect(() => {
    if (!formData.tiendaBoleta && tiendasOpts.length > 0) {
      setFormData(prev => ({ ...prev, tiendaBoleta: String(tiendasOpts[0].value) }));
    }
  }, [tiendasOpts]);

  useEffect(() => {
    if (justificacionesOpts.length > 0) {
      const exists = justificacionesOpts.some(o => String(o.value) === String(formData.justificacion));
      if (!exists) {
        setFormData(prev => ({ ...prev, justificacion: String(justificacionesOpts[0].value) }));
      }
    }
  }, [justificacionesOpts]);

  // Funciones para determinar el tipo de persona según el RFC
  const esPersonaMoral = (rfc: string): boolean => {
    return rfc.length === 12;
  };

  const esPersonaFisica = (rfc: string): boolean => {
    return rfc.length === 13;
  };

  // Detectar tipo de persona cuando cambia el RFC
  useEffect(() => {
    const rfc = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
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
  }, [formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name.startsWith('concepto.')) {
        const conceptoField = name.split('.')[1] as keyof Concepto;
        setFormData(prev => ({
            ...prev,
            concepto: {
                ...prev.concepto,
                [conceptoField]: value,
            },
        }));
        return;
    }

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRfcSearch = async () => {
    const rfc = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
    if (!rfc || rfc.length < 12) {
      alert('RFC incompleto. Verifica Iniciales, Fecha y Homoclave.');
      return;
    }
    const resp = await clienteCatalogoService.buscarClientePorRFC(rfc);
    if (!resp.encontrado || !resp.cliente) {
      alert(`No se encontró cliente para RFC: ${rfc}`);
      return;
    }
    const c = resp.cliente;
    setFormData(prev => ({
      ...prev,
      razonSocial: c.razonSocial || prev.razonSocial,
      nombre: c.nombre || prev.nombre,
      paterno: c.paterno || prev.paterno,
      materno: c.materno || prev.materno,
      pais: c.pais || prev.pais,
      domicilioFiscal: c.domicilioFiscal || prev.domicilioFiscal,
      regimenFiscal: c.regimenFiscal || prev.regimenFiscal,
      usoCfdi: c.usoCfdi || prev.usoCfdi,
      correoElectronico: prev.correoElectronico // se mantiene manual
    }));
    alert('Datos fiscales del cliente cargados desde catálogo de clientes.');
  };

  const handleAgregarBoleta = async () => {
    const rfc = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
    // Payload no utilizado actualmente - funcionalidad pendiente de implementar
    void rfc; // Evitar error de variable no utilizada
    try {
      // TODO: Implementar buscarBoleta en boletaService
      // const resp = await boletaService.buscarBoleta(payload);
      const resp = { ok: false, error: 'Funcionalidad no implementada' } as any;
      if (!resp.ok) {
        alert(resp.error || 'No se pudo agregar boleta');
        return;
      }
      setFormData(prev => ({
        ...prev,
        serie: resp.serie || prev.serie,
        folio: resp.folio || prev.folio,
        uuid: resp.uuid || prev.uuid,
      }));
      alert('Boleta agregada exitosamente');
    } catch (e: any) {
      alert(e?.message || 'Error al agregar boleta');
    }
  };

  const handleConsultarFactura = async () => {
    try {
      setConsultaError(null);
      setConsultaCfdi(null);
      const uuid = (formData.uuid || '').trim();
      if (!uuid) {
        alert('Ingresa un UUID para consultar.');
        return;
      }
      const tipo = (formData.tipoDocumento || 'I') as 'I' | 'E' | 'P';
      const rfcFromForm = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
      // Permitir consulta sólo con UUID; RFC es opcional
      const resp = await facturaService.consultarCfdiPorUUID({ uuid, rfcReceptor: rfcFromForm || undefined, tipo });
      if (!resp.exitoso) {
        setConsultaError(resp.mensaje || 'No se pudo consultar CFDI');
        return;
      }
      setConsultaCfdi(resp);
      // Prefill UI según tipo
      const basicos = resp.basicos || {};
      const fechaISO = (basicos as any).fechaEmision ? String((basicos as any).fechaEmision) : '';
      const fechaYYYYMMDD = fechaISO ? (fechaISO.includes('T') ? fechaISO.split('T')[0] : fechaISO) : '';
      if (tipo === 'I' || tipo === 'E') {
        setFormData(prev => ({
          ...prev,
          serie: basicos.serie || prev.serie,
          folio: basicos.folio || prev.folio,
          medioPago: normalizeFormaPagoCode(basicos.formaPago) || prev.medioPago,
          formaPago: normalizeMetodoPago(basicos.metodoPago) || prev.formaPago,
          usoCfdi: normalizeUsoCfdi(basicos.usoCfdi) || prev.usoCfdi,
          fechaEmision: fechaYYYYMMDD || prev.fechaEmision,
          descuentoTotal: basicos.descuento != null ? String(basicos.descuento) : prev.descuentoTotal,
          subtotal: basicos.subtotal != null ? String(basicos.subtotal) : prev.subtotal,
          ivaTotal: basicos.iva != null ? String(basicos.iva) : prev.ivaTotal,
          iepsTotal: basicos.ieps != null ? String(basicos.ieps) : prev.iepsTotal,
          total: basicos.total != null ? String(basicos.total) : prev.total,
          ivaDesglosado: prev.ivaDesglosado || [basicos.iva16, basicos.iva8, basicos.iva0, basicos.ivaExento].some(v => v != null),
          iepsDesglosado: prev.iepsDesglosado || [basicos.ieps26, basicos.ieps160, basicos.ieps8, basicos.ieps30, basicos.ieps304, basicos.ieps7, basicos.ieps53, basicos.ieps25, basicos.ieps6, basicos.ieps50, basicos.ieps9, basicos.ieps3, basicos.ieps43].some(v => v != null),
        }));
      } else if (tipo === 'P') {
        setFormData(prev => ({
          ...prev,
          serie: basicos.serie || prev.serie,
          folio: basicos.folio || prev.folio,
          medioPago: normalizeFormaPagoCode(basicos.formaPago) || prev.medioPago,
          formaPago: normalizeMetodoPago(basicos.metodoPago) || prev.formaPago,
          usoCfdi: normalizeUsoCfdi(basicos.usoCfdi) || prev.usoCfdi,
          fechaEmision: fechaYYYYMMDD || prev.fechaEmision,
        }));
      }

      // Llenado silencioso de datos fiscales
      try {
        const rfcConsulta = (resp.rfcReceptor || rfcFromForm || '').toUpperCase();
        // Prefill partes del RFC si vienen completas en la respuesta
        if (rfcConsulta && (rfcConsulta.length === 12 || rfcConsulta.length === 13)) {
          const iniciales = rfcConsulta.length === 12 ? rfcConsulta.substring(0, 3) : rfcConsulta.substring(0, 4);
          const fecha = rfcConsulta.substring(rfcConsulta.length === 12 ? 3 : 4, (rfcConsulta.length === 12 ? 3 : 4) + 6);
          const homoclave = rfcConsulta.substring(rfcConsulta.length - 3);
          setFormData(prev => ({
            ...prev,
            rfcIniciales: prev.rfcIniciales || iniciales,
            rfcFecha: prev.rfcFecha || fecha,
            rfcHomoclave: prev.rfcHomoclave || homoclave,
          }));
        }

        // Intento 1: buscar receptor vía facturaService (con fallback simulado)
        const tiendaId = formData.tiendaBoleta || 'T001';
        const receptorResp = await facturaService.buscarReceptorPorRFC({ rfc: rfcConsulta, idTienda: tiendaId, correoElectronico: formData.correoElectronico || '' });
        if (receptorResp.encontrado && receptorResp.receptor) {
          const r = receptorResp.receptor;
          setFormData(prev => ({
            ...prev,
            razonSocial: r.razonSocial || prev.razonSocial,
            nombre: r.nombre || prev.nombre,
            paterno: r.paterno || prev.paterno,
            materno: r.materno || prev.materno,
            pais: r.pais || prev.pais,
            domicilioFiscal: r.domicilioFiscal || prev.domicilioFiscal,
            regimenFiscal: r.regimenFiscal || prev.regimenFiscal,
            usoCfdi: prev.usoCfdi || r.usoCfdi || prev.usoCfdi,
            correoElectronico: prev.correoElectronico || formData.correoElectronico || prev.correoElectronico,
          }));
        } else {
          // Intento 2: catálogo de clientes, si existe
          const clienteResp = await clienteCatalogoService.buscarClientePorRFC(rfcConsulta);
          if (clienteResp.encontrado && clienteResp.cliente) {
            const c = clienteResp.cliente;
            setFormData(prev => ({
              ...prev,
              razonSocial: c.razonSocial || prev.razonSocial,
              nombre: c.nombre || prev.nombre,
              paterno: c.paterno || prev.paterno,
              materno: c.materno || prev.materno,
              pais: c.pais || prev.pais,
              domicilioFiscal: c.domicilioFiscal || prev.domicilioFiscal,
              regimenFiscal: c.regimenFiscal || prev.regimenFiscal,
              usoCfdi: prev.usoCfdi || c.usoCfdi || prev.usoCfdi,
              correoElectronico: prev.correoElectronico || c.correoElectronico || prev.correoElectronico,
            }));
          }
        }
      } catch (e) {
        console.warn('No se pudo completar datos fiscales desde receptor/catalogo:', e);
      }

      // Intento adicional: obtener factura completa para prellenar Conceptos y respaldar totales
      try {
        const facturaCompleta = await facturaService.obtenerFacturaPorUUID(uuid);
        if (facturaCompleta && Array.isArray(facturaCompleta.conceptos) && facturaCompleta.conceptos.length > 0) {
          const c0: any = facturaCompleta.conceptos[0];
          setFormData(prev => {
            const unidadMap: Record<string, string> = {
              H87: 'H87', KGM: 'KGM', EA: 'EA', ACT: 'ACT', E48: 'E48',
              'Pieza': 'H87', 'Kilogramo': 'KGM', 'Cada uno': 'EA', 'Actividad': 'ACT', 'Unidad de servicio': 'E48'
            };
            const unidadCode = (c0?.claveUnidad && unidadMap[String(c0.claveUnidad)])
              ? unidadMap[String(c0.claveUnidad)]
              : (c0?.unidad && unidadMap[String(c0.unidad)])
                ? unidadMap[String(c0.unidad)]
                : prev.concepto.unidadMedida;
            const valorUnitario = c0?.precioUnitario != null
              ? String(c0.precioUnitario)
              : c0?.valorUnitario != null
                ? String(c0.valorUnitario)
                : prev.concepto.valorUnitario;
            return {
              ...prev,
              concepto: {
                ...prev.concepto,
                descripcion: c0?.descripcion || prev.concepto.descripcion,
                valorUnitario,
                unidadMedida: unidadCode,
              }
            };
          });

          // Totales de respaldo si no se llenaron con la consulta inicial
          setFormData(prev => ({
            ...prev,
            subtotal: prev.subtotal || (facturaCompleta.subtotal != null ? String(facturaCompleta.subtotal) : prev.subtotal),
            ivaTotal: prev.ivaTotal || (facturaCompleta.iva != null ? String(facturaCompleta.iva) : prev.ivaTotal),
            total: prev.total || (facturaCompleta.importe != null ? String(facturaCompleta.importe) : prev.total),
          }));
        }
      } catch (e) {
        console.warn('No se pudo obtener factura completa para prellenar conceptos:', e);
      }
    } catch (e: any) {
      console.error('Error consultando CFDI por UUID:', e);
      setConsultaError(e?.message || 'Error al consultar UUID');
    }
  };
  const handleAgregarConcepto = async () => {
    const uuid = (formData.uuid || '').trim();

    const c = formData.concepto;
    // Validación mínima de campos requeridos para concepto libre
    if (!c.sku || !c.descripcion || !c.unidadMedida || !c.valorUnitario) {
      alert('SKU, Descripción, Unidad y Valor Unitario son obligatorios.');
      return;
    }

    // Convertir tasas del selector a porcentaje (ej. 0.16 -> 16)
    const tasaIva = c.tasaIva === 'EXENTO' ? 0 : Math.round(parseFloat(c.tasaIva || '0') * 100 * 100) / 100;
    const tasaIeps = c.tasaIeps === 'EXENTO' ? 0 : Math.round(parseFloat(c.tasaIeps || '0') * 100 * 100) / 100;

    const valorUnitario = parseFloat(c.valorUnitario || '0');
    const descuento = parseFloat(c.descuentoConcepto || '0');
    const iva = parseFloat(c.iva || '0');
    const ieps = parseFloat(c.ieps || '0');

    try {
      const resp = await conceptoService.agregarConcepto({
        uuidFactura: uuid || undefined,
        skuClaveSat: c.sku,
        descripcion: c.descripcion,
        unidadMedida: c.unidadMedida,
        valorUnitario,
        cantidad: 1,
        descuento,
        tasaIva,
        iva,
        tasaIeps,
        ieps,
        noPedimento: c.noPedimento,
      });

      if (!resp.success) {
        alert(resp.message || 'No fue posible agregar el concepto');
        return;
      }

      alert('Concepto agregado correctamente');
      // Opcional: reiniciar el formulario de concepto
      setFormData(prev => ({
        ...prev,
        concepto: { ...initialConceptoData },
      }));
    } catch (e: any) {
      alert(e?.message || 'Error al agregar concepto');
    }
  };
  const handleFacturar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const rfc = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
    const payload: any = {
      rfc: (rfc || '').toUpperCase(),
      correoElectronico: formData.correoElectronico || '',
      razonSocial: formData.razonSocial || `${formData.nombre} ${formData.paterno} ${formData.materno}`.trim(),
      nombre: formData.nombre || '',
      paterno: formData.paterno || '',
      materno: formData.materno || '',
      pais: formData.pais || 'MEX',
      noRegistroIdentidadTributaria: formData.noRegistroIdentidadTributaria || '',
      domicilioFiscal: formData.domicilioFiscal || '',
      regimenFiscal: formData.regimenFiscal || '',
      usoCfdi: normalizeUsoCfdi(formData.usoCfdi) || 'G03',
      codigoFacturacion: `CAP-LIBRE-${formData.numeroBoleta || 'SINBOLETA'}`,
      tienda: formData.tiendaBoleta || '',
      fecha: formData.fechaEmision || new Date().toISOString().slice(0, 10),
      terminal: formData.terminalBoleta || '',
      boleta: formData.numeroBoleta || '',
      medioPago: formData.medioPago || 'PUE',
      formaPago: formData.formaPago || '01',
      iepsDesglosado: Boolean(formData.iepsDesglosado),
      guardarEnMongo: true
    };

    try {
      const resp = await fetch(apiUrl('/factura/generar/frontend'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        alert(data?.mensaje || 'Error al generar factura');
        return;
      }

      const uuid: string = data?.uuid || data?.datosFactura?.folioFiscal;
      setFormData(prev => ({ ...prev, uuid: uuid || prev.uuid }));
      setSuccessMessage(`Factura generada correctamente. UUID: ${uuid || 'N/A'}`);
      if (uuid) {
        // Mostrar estado en proceso y comenzar polling de timbrado
        setTimbradoStatus('4 - EN PROCESO DE EMISION');
        iniciarPollingTimbrado(uuid);
      }
      alert(`Factura exitosa. UUID: ${uuid || 'N/A'}`);
      const deseaEnviar = window.confirm('¿Desea enviar el PDF al correo del receptor?');
      if (deseaEnviar) {
        const correo = (formData.correoElectronico || '').trim();
        if (!correo) {
          alert('No hay correo del receptor. Ingrésalo y vuelve a intentar.');
        } else if (!correoService.validarEmail(correo)) {
          alert('El formato del correo electrónico no es válido.');
        } else {
          try {
            const asunto = 'Factura Captura Libre';
            const mensaje = `Se adjunta el PDF de su factura. UUID: ${uuid}`;
            const respCorreo = await correoService.enviarCorreoConPdfAdjunto({
              uuidFactura: uuid,
              correoReceptor: correo,
              asunto,
              mensaje,
            });
            if (!respCorreo?.success) {
              alert(respCorreo?.message || 'No fue posible enviar la factura por correo.');
            } else {
              alert(`Factura enviada al correo: ${correo}`);
            }
          } catch (err: any) {
            alert(err?.message || 'Error al enviar la factura por correo');
          }
        }
      }
    } catch (error: any) {
      alert(error?.message || 'Error de red al generar factura');
    }
  };

  // Consulta estado de timbrado en PAC
  const consultarEstatusTimbrado = async (uuid: string): Promise<{ codigo: string; descripcion: string } | null> => {
    try {
      const resp = await fetch(pacUrl(`/pac/stamp/status/${encodeURIComponent(uuid)}`));
      if (!resp.ok) return null;
      const data = await resp.json().catch(() => null);
      const codigo = String(data?.status || data?.codigo || '');
      const descripcion = String(data?.descripcion || data?.statusDescripcion || '');
      if (!codigo) return null;
      return { codigo, descripcion };
    } catch {
      return null;
    }
  };

  // Inicia polling cada 3s hasta EMITIDA (0)
  const iniciarPollingTimbrado = (uuid: string) => {
    if (timbradoIntervalId) {
      window.clearInterval(timbradoIntervalId);
      setTimbradoIntervalId(null);
    }
    const id = window.setInterval(async () => {
      const est = await consultarEstatusTimbrado(uuid);
      if (!est) return;
      if (est.codigo === '0') {
        setTimbradoStatus('0 - EMITIDA');
        window.clearInterval(id);
        setTimbradoIntervalId(null);
      } else if (est.codigo === '4') {
        setTimbradoStatus('4 - EN PROCESO DE EMISION');
      } else if (est.codigo === '2') {
        setTimbradoStatus('2 - CANCELADA EN SAT');
        window.clearInterval(id);
        setTimbradoIntervalId(null);
      } else if (est.codigo === '66') {
        setTimbradoStatus('66 - POR TIMBRAR');
      }
    }, 3000);
    setTimbradoIntervalId(id);
  };

  const handleGuardarEnBD = async () => {
    try {
      setGuardandoBD(true);
      
      // Validaciones básicas
      const rfc = clienteCatalogoService.buildRfc(formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave);
      if (!rfc || rfc.length < 12) {
        alert('RFC completo es requerido (iniciales, fecha y homoclave)');
        return;
      }
      
      if (!formData.correoElectronico?.trim()) {
        alert('Correo electrónico es requerido');
        return;
      }
      
      if (!formData.razonSocial?.trim()) {
        alert('Razón social es requerida');
        return;
      }
      
      if (!formData.domicilioFiscal?.trim()) {
        alert('Domicilio fiscal es requerido');
        return;
      }

      // Preparar datos para enviar al backend
      const facturaLibreData = {
        // Datos fiscales del receptor
        rfc: rfc.toUpperCase(),
        correoElectronico: formData.correoElectronico.trim(),
        razonSocial: formData.razonSocial.trim(),
        nombre: formData.nombre?.trim() || null,
        paterno: formData.paterno?.trim() || null,
        materno: formData.materno?.trim() || null,
        pais: formData.pais || 'MEX',
        noRegistroIdentidadTributaria: formData.noRegistroIdentidadTributaria?.trim() || null,
        domicilioFiscal: formData.domicilioFiscal.trim(),
        regimenFiscal: formData.regimenFiscal,
        usoCfdi: normalizeUsoCfdi(formData.usoCfdi) || 'G03',
        
        // Datos de boleta
        tienda: formData.tiendaBoleta || '',
        terminal: formData.terminalBoleta || '',
        boleta: formData.numeroBoleta || '',
        justificacion: formData.justificacion,
        
        // Datos del documento
        tipoDocumento: formData.tipoDocumento,
        uuid: formData.uuid?.trim() || null,
        emisor: formData.emisor,
        fechaEmision: formData.fechaEmision,
        
        // Datos del concepto
        concepto: {
          sku: formData.concepto.sku,
          unidadMedida: formData.concepto.unidadMedida,
          descripcion: formData.concepto.descripcion,
          valorUnitario: formData.concepto.valorUnitario,
          descuentoConcepto: formData.concepto.descuentoConcepto,
          tasaIva: formData.concepto.tasaIva,
          iva: formData.concepto.iva,
          tasaIeps: formData.concepto.tasaIeps,
          ieps: formData.concepto.ieps,
          tasaIe: formData.concepto.tasaIe,
          ie: formData.concepto.ie,
          noPedimento: formData.concepto.noPedimento,
        },
        
        // Datos de pago y totales
        medioPago: formData.medioPago,
        formaPago: formData.formaPago,
        descuentoTotal: formData.descuentoTotal,
        subtotal: formData.subtotal,
        ivaTotal: formData.ivaTotal,
        iepsTotal: formData.iepsTotal,
        total: formData.total,
        ivaDesglosado: formData.ivaDesglosado,
        iepsDesglosado: formData.iepsDesglosado,
        comentarios: formData.comentarios?.trim() || null,
      };

      // Enviar al backend
      const response = await fetch(apiUrl('/factura-libre/guardar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facturaLibreData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Actualizar el estado con el UUID recibido
      setFormData(prev => ({ ...prev, uuid: result.uuid }));
      
      // Primera alerta de éxito
      alert(`Factura procesada y guardada exitosamente\nUUID: ${result.uuid || 'N/A'}\nFactura guardada en base de datos`);
      
      // Segunda alerta para preguntar sobre envío del PDF
      const enviarPdf = confirm('¿Desea enviar los archivos al correo del receptor?');
      
      if (enviarPdf) {
        // Aquí se puede llamar a la función de envío de correo
        handleEnviarCorreo(result.uuid);
      }
      
    } catch (err) {
      console.error('Error guardando Factura Libre en BD:', err);
      alert(`Error al guardar en base de datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardandoBD(false);
    }
  };

  const handleDescargarPdf = async () => {
    const uuid = (formData.uuid || '').trim();
    if (!uuid) {
      alert('Primero genera la factura para obtener el UUID y descargar el PDF.');
      return;
    }
    try {
      await facturaService.generarYDescargarPDF(uuid);
    } catch (error: any) {
      alert(error?.message || 'Error al descargar PDF');
    }
  };
  const handleDescargarXml = async () => {
    const uuid = (formData.uuid || '').trim();
    if (!uuid) {
      alert('Primero genera la factura para obtener el UUID y descargar el XML.');
      return;
    }
    try {
      await facturaService.generarYDescargarXML(uuid);
    } catch (error: any) {
      alert(error?.message || 'Error al descargar XML');
    }
  };
  const handleEnviarCorreo = async (uuidFromGuardar?: string) => {
    if (!formData.correoElectronico || !formData.correoElectronico.trim()) {
      alert('Por favor ingresa un correo electrónico válido antes de enviar.');
      return;
    }

    if (!correoService.validarEmail(formData.correoElectronico)) {
      alert('El formato del correo electrónico no es válido.');
      return;
    }

    const uuid = uuidFromGuardar || (formData.uuid || '').trim();
    if (!uuid) {
      alert('Primero genera la factura para obtener el UUID y poder enviarla por correo.');
      return;
    }

    try {
      const asunto = 'Factura Captura Libre';
      const mensaje = `Se adjunta el PDF de su factura. UUID: ${uuid}`;
      const resp = await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: uuid,
        correoReceptor: formData.correoElectronico.trim(),
        asunto,
        mensaje,
      });

      if (!resp?.success) {
        alert(resp?.message || 'No fue posible enviar la factura por correo.');
        return;
      }

      alert(`Factura enviada al correo: ${formData.correoElectronico.trim()}`);
    } catch (e: any) {
      alert(e?.message || 'Error al enviar la factura por correo');
    }
  };

  return (
    <form onSubmit={handleFacturar} className="space-y-6">
      {successMessage && (
        <div className="p-3 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
          {successMessage}
        </div>
      )}
      {formData.uuid && (
        <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
          Estado de timbrado: {timbradoStatus || 'Desconocido'}
        </div>
      )}
      <DatosFiscalesSection
        formData={formData}
        handleChange={handleChange}
        onRfcSearchClick={handleRfcSearch}
        mostrarRazonSocial={tipoPersona === 'moral' || tipoPersona === null}
        mostrarNombreCompleto={tipoPersona === 'fisica' || tipoPersona === null}
      />

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Boleta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 items-end">
          <SelectField label="Tienda:" name="tiendaBoleta" value={formData.tiendaBoleta} onChange={handleChange} options={tiendasOpts.length ? tiendasOpts : TIENDA_OPTIONS} className="lg:col-span-1" disabled={tiendasLoading} error={Boolean(tiendasError)} />
          <FormField label="Terminal:" name="terminalBoleta" value={formData.terminalBoleta} onChange={handleChange} className="lg:col-span-1"/>
          <FormField label="Número de Boleta:" name="numeroBoleta" value={formData.numeroBoleta} onChange={handleChange} className="lg:col-span-1"/>
          <Button type="button" onClick={handleAgregarBoleta} variant="primary" className="lg:self-end">Agregar</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Justificación</h3>
        <SelectField label="Justificación para utilizar esta funcionalidad:" name="justificacion" value={formData.justificacion} onChange={handleChange} options={justificacionesOpts.length ? justificacionesOpts : JUSTIFICACION_FUNCIONALIDAD_OPTIONS} disabled={justLoading} error={Boolean(justError)} />
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tipo documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
            <RadioGroupField label="Tipo de Documento:" name="tipoDocumento" options={TIPO_DOCUMENTO_CAPTURA_LIBRE_OPTIONS} selectedValue={formData.tipoDocumento} onChange={handleChange} inline />
            <FormField label="UUID:" name="uuid" value={formData.uuid} onChange={handleChange} placeholder="Ingrese UUID si aplica"/>
        </div>
        <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleConsultarFactura} variant="primary">Consultar Factura</Button>
        </div>
        {consultaError && (
          <div className="mt-3 text-red-600 dark:text-red-400 text-sm">{consultaError}</div>
        )}

      </Card>

      <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
            <SelectField label="Empresa:" name="emisor" value={formData.emisor} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required />
            <FormField label="Fecha de Emisión:" name="fechaEmision" type="date" value={formData.fechaEmision} onChange={handleChange} />
          </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Conceptos (Es necesario agregar al menos uno)</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Nota: Actualmente se permite un solo concepto. La funcionalidad para múltiples conceptos será implementada.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            <FormField label="SKU o Clave SAT:" name="concepto.sku" value={formData.concepto.sku} onChange={handleChange} />
            <SelectField label="Unidad de Medida:" name="concepto.unidadMedida" value={formData.concepto.unidadMedida} onChange={handleChange} options={UNIDAD_MEDIDA_OPTIONS} />
            <FormField label="Descripción:" name="concepto.descripcion" value={formData.concepto.descripcion} onChange={handleChange} />
            <FormField label="Valor Unitario:" name="concepto.valorUnitario" type="number" value={formData.concepto.valorUnitario} onChange={handleChange} />
            <FormField label="Descuento:" name="concepto.descuentoConcepto" type="number" value={formData.concepto.descuentoConcepto} onChange={handleChange} />
            <SelectField label="Tasa IVA:" name="concepto.tasaIva" value={formData.concepto.tasaIva} onChange={handleChange} options={TASA_IVA_OPTIONS} />
            <FormField label="IVA:" name="concepto.iva" type="number" value={formData.concepto.iva} onChange={handleChange} />
            <SelectField label="Tasa IEPS:" name="concepto.tasaIeps" value={formData.concepto.tasaIeps} onChange={handleChange} options={TASA_IEPS_OPTIONS} />
            <FormField label="IEPS:" name="concepto.ieps" type="number" value={formData.concepto.ieps} onChange={handleChange} />
            <SelectField label="Tasa IE:" name="concepto.tasaIe" value={formData.concepto.tasaIe} onChange={handleChange} options={[{value: "0", label: "0%"}]} /> 
            <FormField label="IE:" name="concepto.ie" type="number" value={formData.concepto.ie} onChange={handleChange} />
            <FormField label="No. Pedimento:" name="concepto.noPedimento" value={formData.concepto.noPedimento} onChange={handleChange} />
        </div>
        <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleAgregarConcepto} variant="primary">Agregar Concepto</Button>
        </div>
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Totales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            <SelectField label="Medio de pago:" name="medioPago" value={formData.medioPago} onChange={handleChange} options={MEDIO_PAGO_OPTIONS} />
            <SelectField label="Forma de pago:" name="formaPago" value={formData.formaPago} onChange={handleChange} options={FORMA_PAGO_OPTIONS} />
            <FormField label="Descuento:" name="descuentoTotal" type="number" value={formData.descuentoTotal} onChange={handleChange} />
            <FormField label="Subtotal:" name="subtotal" type="number" value={formData.subtotal} onChange={handleChange} />
            <FormField label="IVA:" name="ivaTotal" type="number" value={formData.ivaTotal} onChange={handleChange} />
            <FormField label="IEPS:" name="iepsTotal" type="number" value={formData.iepsTotal} onChange={handleChange} />
            <FormField label="Total:" name="total" type="number" value={formData.total} onChange={handleChange} />
        </div>
        <div className="mt-4 space-y-2">
            <CheckboxField label="IVA desglosado" name="ivaDesglosado" checked={formData.ivaDesglosado} onChange={handleChange} />
            <CheckboxField label="IEPS desglosado" name="iepsDesglosado" checked={formData.iepsDesglosado} onChange={handleChange} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Si el contribuyente requiere que se desglose el IEPS, deberá mostrar su cédula donde indique sea sujeto</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Comentarios</h3>
        <TextareaField label="" name="comentarios" value={formData.comentarios} onChange={handleChange} rows={3} />
      </Card>

      <div className="flex justify-end space-x-4 mt-8">
        <Button type="button" onClick={handleDescargarXml} variant="secondary">
          Descargar XML
        </Button>
        <Button type="button" onClick={handleDescargarPdf} variant="secondary">
          Descargar PDF
        </Button>
        <Button type="button" onClick={() => handleEnviarCorreo()} variant="secondary">
          Enviar por Correo
        </Button>
        <Button type="button" onClick={handleGuardarEnBD} variant="primary" disabled={guardandoBD}>
          Guardar
        </Button>
        <Button type="submit" variant="primary">
          Facturar
        </Button>
      </div>
    </form>
  );
};


function normalizeUsoCfdi(v?: string): string {
  const s = (v || '').trim().toUpperCase();
  if (!s) return '';
  const map: Record<string, string> = {
    GO1: 'G01',
    GO2: 'G02',
    GO3: 'G03',
    SO1: 'S01',
    CPO1: 'CP01',
  };
  return map[s] || s;
}

function normalizeFormaPagoCode(v?: string): string {
  const s = (v || '').trim();
  const digits = s.replace(/\D+/g, '');
  if (!digits) return '';
  return digits.padStart(2, '0');
}

function normalizeMetodoPago(v?: string): string {
  const s = (v || '').trim().toUpperCase();
  return s;
}

// Funciones no utilizadas - comentadas para evitar error de TypeScript
// function unidadTextoFromCode(code?: string): string {
//   const c = (code || '').toUpperCase();
//   const map: Record<string, string> = {
//     H87: 'Pieza',
//     KGM: 'Kilogramo',
//     EA: 'Cada uno',
//     ACT: 'Actividad',
//     E48: 'Unidad de servicio',
//   };
//   return map[c] || c || 'Unidad';
// }

// function extractPostalCode(text?: string): string | null {
//   const match = (text || '').match(/\b\d{5}\b/);
//   return match ? match[0] : null;
// }
