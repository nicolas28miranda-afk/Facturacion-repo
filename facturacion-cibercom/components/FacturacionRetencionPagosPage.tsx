import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { ComprobanteAccionesBar } from './ComprobanteAccionesBar';
import { RfcAutocomplete } from './RfcAutocomplete';
import { AltaClienteModal, ClienteFormData } from './AltaClienteModal';
import { useEmpresa } from '../context/EmpresaContext';
import { retencionesService } from '../services/retencionesService';
import { apiUrl, getHeadersWithUsuario } from '../services/api';
import { ClienteDatos } from '../services/clienteCatalogoService';
import { EnviarWhatsAppModal } from './EnviarWhatsAppModal';
import {
  WHATSAPP_MENSAJE_BASE_RETENCION_PAGO,
  construirMensajeWhatsAppRetencionPago,
} from '../constants/whatsappFacturaMensajeBase';

// Mapeo de claves de retención según catRetenciones.xsd.xml (01-28)
const CLAVES_RETENCION = [
  { value: '01', label: '01 - Pagos a residentes en el extranjero' },
  { value: '02', label: '02 - Dividendos o utilidades distribuidas' },
  { value: '03', label: '03 - Intereses' },
  { value: '04', label: '04 - Regalías' },
  { value: '05', label: '05 - Arrendamiento' },
  { value: '06', label: '06 - Enajenación de acciones' },
  { value: '07', label: '07 - Enajenación de bienes' },
  { value: '08', label: '08 - Servicios profesionales' },
  { value: '09', label: '09 - Sueldos y salarios' },
  { value: '10', label: '10 - Otros ingresos' },
  { value: '11', label: '11 - Premios' },
  { value: '12', label: '12 - Fideicomisos' },
  { value: '13', label: '13 - Planes de retiro' },
  { value: '14', label: '14 - IVA - Retención de IVA (requiere complemento SectorFinanciero)' },
  { value: '15', label: '15 - Intereses (requiere complemento Intereses)' },
  { value: '16', label: '16 - Fideicomisos (requiere complemento FideicomisoNoEmpresarial)' },
  { value: '17', label: '17 - Remanente distribuible' },
  { value: '18', label: '18 - Planes de retiro (requiere complemento PlanesDeRetiro11)' },
  { value: '19', label: '19 - Enajenación de acciones (requiere complemento EnajenacionDeAcciones)' },
  { value: '20', label: '20 - Otros ingresos' },
  { value: '21', label: '21 - Otros ingresos' },
  { value: '22', label: '22 - Otros ingresos' },
  { value: '23', label: '23 - Arrendamiento (requiere complemento ArrendamientoEnFideicomiso)' },
  { value: '24', label: '24 - Enajenación de bienes' },
  { value: '25', label: '25 - ISR Servicios profesionales (puede requerir PlataformasTecnologicas10)' },
  { value: '26', label: '26 - ISR Regalías' },
  { value: '27', label: '27 - Servicios mediante plataformas tecnológicas (requiere complemento PlataformasTecnologicas10)' },
  { value: '28', label: '28 - Dividendos o utilidades distribuidas (requiere complemento Dividendos)' },
];

// Catálogo c_TipoPagoRet según catRetenciones.xsd.xml
const TIPO_PAGO_RET_OPTIONS = [
  { value: '01', label: '01 - Definitivo' },
  { value: '02', label: '02 - Provisional' },
  { value: '03', label: '03 - A cuenta de definitivo' },
  { value: '04', label: '04 - A cuenta de provisional' },
];

// Catálogo c_Periodo (meses 01-12)
const MESES_OPTIONS = [
  { value: '01', label: '01 - Enero' },
  { value: '02', label: '02 - Febrero' },
  { value: '03', label: '03 - Marzo' },
  { value: '04', label: '04 - Abril' },
  { value: '05', label: '05 - Mayo' },
  { value: '06', label: '06 - Junio' },
  { value: '07', label: '07 - Julio' },
  { value: '08', label: '08 - Agosto' },
  { value: '09', label: '09 - Septiembre' },
  { value: '10', label: '10 - Octubre' },
  { value: '11', label: '11 - Noviembre' },
  { value: '12', label: '12 - Diciembre' },
];

// Catálogo c_Ejercicio (años válidos)
const ANIOS_OPTIONS = Array.from({ length: 9 }, (_, i) => {
  const anio = 2019 + i;
  return { value: String(anio), label: String(anio) };
});

// Catálogo c_Impuesto
const IMPUESTO_OPTIONS = [
  { value: '001', label: '001 - ISR' },
  { value: '002', label: '002 - IVA' },
  { value: '003', label: '003 - IEPS' },
];

type RetencionFormData = {
  // Datos del Emisor (según XSD)
  rfcEmisor: string;
  nombreEmisor: string;
  regimenFiscalEmisor: string;
  
  // Datos del Receptor (según XSD)
  nacionalidadReceptor: 'Nacional' | 'Extranjero';
  rfcReceptor: string;
  razonSocial: string; // Para persona moral
  nombre: string; // Para persona física
  paterno: string;
  materno: string;
  curpReceptor: string; // Opcional
  domicilioFiscalReceptor: string; // CRÍTICO: Código postal (5 dígitos) - requerido para Nacional
  numRegIdTribReceptor: string; // Para Extranjero
  
  // Datos del Período (según XSD)
  mesIni: string;
  mesFin: string;
  ejercicio: string;
  
  // Datos de la Retención (según XSD)
  cveRetenc: string; // Clave de retención (01-28)
  descRetenc: string; // Descripción de la retención
  folioInt: string; // Folio interno (opcional)
  
  // Totales (según XSD)
  montoTotOperacion: string;
  montoTotGrav: string;
  montoTotExent: string;
  montoTotRet: string;
  
  // ImpRetenidos (puede haber múltiples)
  impRetenidos: Array<{
    baseRet: string;
    impuestoRet: string; // 001=ISR, 002=IVA, 003=IEPS
    montoRet: string;
    tipoPagoRet: string; // 01-04
  }>;
  
  // Información adicional
  fechaPago: string;
  concepto: string;
  correoReceptor: string;
  telefono: string;
  usuarioRegistro: string;
};

export const FacturacionRetencionPagosPage: React.FC = () => {
  const { empresaInfo } = useEmpresa();
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | null>(null);
  const tipoPersonaAnteriorRef = useRef<'fisica' | 'moral' | null>(null);

  const [formData, setFormData] = useState<RetencionFormData>({
    rfcEmisor: empresaInfo.rfc || '',
    nombreEmisor: empresaInfo.nombre || '',
    regimenFiscalEmisor: '601', // Por defecto: General de Ley Personas Morales
    
    nacionalidadReceptor: 'Nacional',
    rfcReceptor: '',
    razonSocial: '',
    nombre: '',
    paterno: '',
    materno: '',
    curpReceptor: '',
    domicilioFiscalReceptor: '', // CRÍTICO: Debe ser un código postal válido del catálogo c_CodigoPostal
    numRegIdTribReceptor: '',
    
    mesIni: '',
    mesFin: '',
    ejercicio: String(new Date().getFullYear()),
    
    cveRetenc: '',
    descRetenc: '',
    folioInt: '',
    
    montoTotOperacion: '',
    montoTotGrav: '',
    montoTotExent: '0.00',
    montoTotRet: '',
    
    impRetenidos: [{
      baseRet: '',
      impuestoRet: '001', // ISR por defecto
      montoRet: '',
      tipoPagoRet: '01', // Definitivo por defecto
    }],
    
    fechaPago: new Date().toISOString().split('T')[0],
    concepto: '',
    correoReceptor: '',
    telefono: '',
    usuarioRegistro: '',
  });

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uuidRetencionGuardado, setUuidRetencionGuardado] = useState<string | null>(null);
  const [retencionSerieFolio, setRetencionSerieFolio] = useState<{ serie: string; folio: string }>({
    serie: '',
    folio: '',
  });
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
  const [mostrarAltaCliente, setMostrarAltaCliente] = useState(false);

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
    // Parsear domicilio fiscal para extraer código postal
    const domicilioParseado = parsearDomicilioFiscal(cliente.domicilioFiscal);
    
    setFormData(prev => ({
      ...prev,
      rfcReceptor: cliente.rfc,
      razonSocial: cliente.razonSocial || prev.razonSocial,
      nombre: cliente.nombre || prev.nombre,
      paterno: cliente.paterno || prev.paterno,
      materno: cliente.materno || prev.materno,
      correoReceptor: cliente.correoElectronico || prev.correoReceptor,
      // Usar el código postal parseado del domicilio fiscal
      domicilioFiscalReceptor: domicilioParseado.codigoPostal || prev.domicilioFiscalReceptor,
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

      // Actualizar formulario con los datos del cliente
      setFormData(prev => ({
        ...prev,
        rfcReceptor: clienteData.rfc,
        razonSocial: clienteData.razonSocial,
        nombre: clienteData.nombre || prev.nombre,
        paterno: clienteData.apellidoPaterno || prev.paterno,
        materno: clienteData.apellidoMaterno || prev.materno,
        correoReceptor: clienteData.correoElectronico,
        telefono: clienteData.telefono || prev.telefono,
        domicilioFiscalReceptor: clienteData.codigoPostal,
      }));

      setMostrarAltaCliente(false);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      throw error;
    }
  };

  // Detectar tipo de persona según RFC
  useEffect(() => {
    const rfc = formData.rfcReceptor.trim().toUpperCase();
    let nuevoTipo: 'fisica' | 'moral' | null = null;
    
    if (rfc && rfc.length >= 12) {
      if (rfc.length === 12) {
        nuevoTipo = 'moral';
      } else if (rfc.length === 13) {
        nuevoTipo = 'fisica';
      }
    }
    
    if (nuevoTipo !== tipoPersonaAnteriorRef.current) {
      tipoPersonaAnteriorRef.current = nuevoTipo;
      setTipoPersona(nuevoTipo);
      
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
  }, [formData.rfcReceptor]);

  // Actualizar datos del emisor desde empresaInfo
  useEffect(() => {
    if (empresaInfo.rfc) {
      setFormData((prev) => ({
        ...prev,
        rfcEmisor: empresaInfo.rfc,
        nombreEmisor: empresaInfo.nombre || prev.nombreEmisor,
      }));
    }
  }, [empresaInfo]);

  // Obtener usuario del localStorage
  useEffect(() => {
    const storedUser =
      localStorage.getItem('session.idUsuario') ||
      localStorage.getItem('username') ||
      '';
    if (storedUser) {
      setFormData((prev) => ({
        ...prev,
        usuarioRegistro: storedUser,
      }));
    }
  }, []);

  // Calcular montos automáticamente
  useEffect(() => {
    const montoOperacion = parseFloat(formData.montoTotOperacion || '0');
    const montoExent = parseFloat(formData.montoTotExent || '0');
    
    // Calcular monto gravado automáticamente: Monto Operación - Monto Exento
    const nuevoMontoGrav = Math.max(0, montoOperacion - montoExent);
    
    // Calcular total retenido desde impRetenidos
    const totalRetenido = formData.impRetenidos.reduce((sum, imp) => {
      return sum + parseFloat(imp.montoRet || '0');
    }, 0);
    
    // Actualizar montos solo si hay cambios
    setFormData(prev => {
      const cambios: Partial<RetencionFormData> = {};
      
      if (prev.montoTotGrav !== nuevoMontoGrav.toFixed(2)) {
        cambios.montoTotGrav = nuevoMontoGrav.toFixed(2);
      }
      
      if (prev.montoTotRet !== totalRetenido.toFixed(2)) {
        cambios.montoTotRet = totalRetenido.toFixed(2);
      }
      
      return Object.keys(cambios).length > 0 ? { ...prev, ...cambios } : prev;
    });
  }, [formData.montoTotOperacion, formData.montoTotExent, formData.impRetenidos]);

  const handleFormChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [],
  );

  // Obtener tasa de retención según el tipo de impuesto y clave de retención
  const obtenerTasaRetencion = useCallback((impuestoRet: string, cveRetenc: string): number => {
    // Tasas comunes de retención en México
    if (impuestoRet === '001') { // ISR
      // Tasas de ISR según tipo de retención
      const tasasISR: Record<string, number> = {
        '08': 0.10,  // Servicios profesionales: 10%
        '25': 0.10,  // ISR Servicios profesionales: 10%
        '27': 0.10,  // Servicios mediante plataformas tecnológicas: 10%
        '05': 0.10,  // Arrendamiento: 10%
        '23': 0.10,  // Arrendamiento en fideicomiso: 10%
        '02': 0.10,  // Dividendos: 10%
        '28': 0.10,  // Dividendos: 10%
        '03': 0.20,  // Intereses: 20% (puede variar)
        '15': 0.20,  // Intereses: 20%
        '04': 0.25,  // Regalías: 25%
        '26': 0.25,  // ISR Regalías: 25%
        '09': 0.00,  // Sueldos: variable según tabla
      };
      return tasasISR[cveRetenc] || 0.10; // Por defecto 10%
    } else if (impuestoRet === '002') { // IVA
      // IVA típicamente se retiene al 10.67% o 16% según el caso
      // Para retención de IVA, comúnmente es 10.67% cuando el proveedor no está acreditado
      return 0.1067; // 10.67%
    } else if (impuestoRet === '003') { // IEPS
      // IEPS varía según el producto, por defecto 0%
      return 0.00;
    }
    return 0.00;
  }, []);

  const handleImpRetenidoChange = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => {
      const nuevosImpRetenidos = [...prev.impRetenidos];
      const impActual = nuevosImpRetenidos[index];
      
      // Si cambia la base de retención o el tipo de impuesto, calcular automáticamente el monto
      if (field === 'baseRet' || field === 'impuestoRet') {
        const baseRet = field === 'baseRet' ? parseFloat(value || '0') : parseFloat(impActual.baseRet || '0');
        const impuestoRet = field === 'impuestoRet' ? value : impActual.impuestoRet;
        
        if (baseRet > 0 && impuestoRet) {
          const tasa = obtenerTasaRetencion(impuestoRet, prev.cveRetenc || '08');
          const montoCalculado = baseRet * tasa;
          
          nuevosImpRetenidos[index] = {
            ...impActual,
            [field]: value,
            baseRet: field === 'baseRet' ? value : impActual.baseRet,
            impuestoRet: field === 'impuestoRet' ? value : impActual.impuestoRet,
            montoRet: montoCalculado.toFixed(2),
          };
        } else {
          nuevosImpRetenidos[index] = {
            ...impActual,
            [field]: value,
          };
        }
      } else {
        nuevosImpRetenidos[index] = {
          ...impActual,
          [field]: value,
        };
      }
      
      return {
        ...prev,
        impRetenidos: nuevosImpRetenidos,
      };
    });
  }, [obtenerTasaRetencion]);

  const agregarImpRetenido = useCallback(() => {
    setFormData(prev => {
      const baseRet = prev.montoTotOperacion || '';
      const impuestoRet = '001';
      const tasa = obtenerTasaRetencion(impuestoRet, prev.cveRetenc || '08');
      const montoCalculado = parseFloat(baseRet || '0') * tasa;
      
      return {
        ...prev,
        impRetenidos: [
          ...prev.impRetenidos,
          {
            baseRet: baseRet,
            impuestoRet: impuestoRet,
            montoRet: montoCalculado > 0 ? montoCalculado.toFixed(2) : '',
            tipoPagoRet: '01',
          },
        ],
      };
    });
  }, [obtenerTasaRetencion]);

  const eliminarImpRetenido = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      impRetenidos: prev.impRetenidos.filter((_, i) => i !== index),
    }));
  }, []);

  const validarFormulario = useCallback((): string[] => {
    const errores: string[] = [];

    // Validar Emisor
    if (!formData.rfcEmisor?.trim()) {
      errores.push('RFC del emisor es obligatorio');
    } else if (formData.rfcEmisor.trim().length < 12 || formData.rfcEmisor.trim().length > 13) {
      errores.push('RFC del emisor debe tener 12 o 13 caracteres');
    }
    
    if (!formData.nombreEmisor?.trim()) {
      errores.push('Nombre del emisor es obligatorio');
    }
    
    if (!formData.regimenFiscalEmisor?.trim()) {
      errores.push('Régimen fiscal del emisor es obligatorio');
    }

    // Validar Receptor
    if (!formData.rfcReceptor?.trim()) {
      errores.push('RFC del receptor es obligatorio');
    } else if (formData.rfcReceptor.trim().length < 12 || formData.rfcReceptor.trim().length > 13) {
      errores.push('RFC del receptor debe tener 12 o 13 caracteres');
    }
    
    if (formData.nacionalidadReceptor === 'Nacional') {
      // CRÍTICO: DomicilioFiscalR es requerido y debe ser un código postal válido (5 dígitos)
      if (!formData.domicilioFiscalReceptor?.trim()) {
        errores.push('Código postal del receptor es obligatorio (DomicilioFiscalR)');
      } else {
        const cp = formData.domicilioFiscalReceptor.trim().replace(/\D/g, '');
        if (cp.length !== 5) {
          errores.push('El código postal del receptor debe tener exactamente 5 dígitos');
        } else if (!/^[0-9]{5}$/.test(cp)) {
          errores.push('El código postal del receptor debe contener solo números');
        }
      }
      
      if (tipoPersona === 'moral') {
        if (!formData.razonSocial?.trim()) {
          errores.push('Razón social es obligatoria para persona moral');
        }
      } else if (tipoPersona === 'fisica') {
        if (!formData.nombre?.trim()) {
          errores.push('Nombre es obligatorio para persona física');
        }
        if (!formData.paterno?.trim()) {
          errores.push('Apellido paterno es obligatorio para persona física');
        }
      } else {
        errores.push('El RFC del receptor debe tener 12 caracteres (moral) o 13 caracteres (física)');
      }
    } else if (formData.nacionalidadReceptor === 'Extranjero') {
      if (!formData.razonSocial?.trim()) {
        errores.push('Nombre o razón social es obligatorio para receptor extranjero');
      }
    }

    // Validar Período
    if (!formData.mesIni?.trim()) {
      errores.push('Mes inicial del período es obligatorio');
    }
    if (!formData.mesFin?.trim()) {
      errores.push('Mes final del período es obligatorio');
    }
    if (!formData.ejercicio?.trim()) {
      errores.push('Ejercicio (año) es obligatorio');
    }

    // Validar Retención
    if (!formData.cveRetenc?.trim()) {
      errores.push('Clave de retención (CveRetenc) es obligatoria');
    } else {
      const clave = parseInt(formData.cveRetenc);
      if (isNaN(clave) || clave < 1 || clave > 28) {
        errores.push('La clave de retención debe estar entre 01 y 28');
      }
    }

    // Validar Totales
    const montoOperacion = parseFloat(formData.montoTotOperacion || '0');
    if (montoOperacion <= 0) {
      errores.push('El monto total de la operación debe ser mayor a cero');
    }
    
    const montoGrav = parseFloat(formData.montoTotGrav || '0');
    const montoExent = parseFloat(formData.montoTotExent || '0');
    if (montoGrav + montoExent !== montoOperacion) {
      errores.push('La suma de monto gravado y monto exento debe igualar el monto total de la operación');
    }
    
    const montoRet = parseFloat(formData.montoTotRet || '0');
    if (montoRet <= 0) {
      errores.push('El monto total retenido debe ser mayor a cero');
    }

    // Validar ImpRetenidos
    if (formData.impRetenidos.length === 0) {
      errores.push('Debe haber al menos un impuesto retenido');
    }
    
    formData.impRetenidos.forEach((imp, index) => {
      const montoRet = parseFloat(imp.montoRet || '0');
      if (montoRet <= 0) {
        errores.push(`El monto retenido del impuesto ${index + 1} debe ser mayor a cero`);
      }
      if (!imp.impuestoRet?.trim()) {
        errores.push(`El tipo de impuesto del impuesto ${index + 1} es obligatorio`);
      }
      if (!imp.tipoPagoRet?.trim()) {
        errores.push(`El tipo de pago ret del impuesto ${index + 1} es obligatorio`);
      }
      
      // CRÍTICO: Validación Reten20135 - TipoPagoRet debe ser válido según ImpuestoRet
      // IVA (002): SOLO puede usar TipoPagoRet="01" (Definitivo)
      // ISR (001): Puede usar 01, 02, 03 o 04
      if (imp.impuestoRet === '002' && imp.tipoPagoRet !== '01') {
        errores.push(`El impuesto ${index + 1}: Para IVA (002), el Tipo de Pago Ret debe ser "01" (Definitivo). El IVA siempre es definitivo.`);
      }
      if (imp.impuestoRet === '001' && !['01', '02', '03', '04'].includes(imp.tipoPagoRet)) {
        errores.push(`El impuesto ${index + 1}: Para ISR (001), el Tipo de Pago Ret debe ser 01, 02, 03 o 04`);
      }
    });

    // Validar información adicional
    if (!formData.fechaPago?.trim()) {
      errores.push('Fecha de pago es obligatoria');
    }
    
    if (!formData.correoReceptor?.trim()) {
      errores.push('Correo del receptor es obligatorio');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correoReceptor.trim())) {
        errores.push('El correo del receptor no tiene un formato válido');
      }
    }

    return errores;
  }, [formData, tipoPersona]);

  const resetAlerts = useCallback(() => {
    setErrorMessages([]);
    setSuccessMessage(null);
  }, []);

  const handleVistaPrevia = useCallback(async () => {
    resetAlerts();
    const errores = validarFormulario();
    if (errores.length > 0) {
      setErrorMessages(errores);
      alert('Por favor corrija los errores antes de ver la vista previa:\n' + errores.join('\n'));
      return;
    }

    try {
      // Construir payload similar al que se envía al guardar
      const tipoPersona = formData.rfcReceptor.trim().length === 12 ? 'moral' : 'fisica';
      
      // Calcular ISR e IVA retenidos desde impRetenidos
      let isrRetenido = 0;
      let ivaRetenido = 0;
      
      formData.impRetenidos.forEach(imp => {
        const monto = parseFloat(imp.montoRet || '0');
        if (imp.impuestoRet === '001') {
          isrRetenido += monto;
        } else if (imp.impuestoRet === '002') {
          ivaRetenido += monto;
        }
      });
      
      // Mapear clave de retención a tipo de retención
      const tipoRetencionMap: Record<string, string> = {
        '01': 'OTROS',
        '02': 'DIVIDENDOS',
        '03': 'INTERESES',
        '04': 'ISR_REGALIAS',
        '05': 'ISR_ARRENDAMIENTO',
        '06': 'ENAJENACION_ACCIONES',
        '07': 'ISR_ENAJENACION',
        '08': 'ISR_SERVICIOS',
        '09': 'ISR_SUELDOS',
        '10': 'OTROS',
        '11': 'OTROS',
        '12': 'FIDEICOMISOS',
        '13': 'PLANES_RETIRO',
        '14': 'IVA',
        '15': 'INTERESES',
        '16': 'FIDEICOMISOS',
        '17': 'REMANENTE',
        '18': 'PLANES_RETIRO',
        '19': 'ENAJENACION_ACCIONES',
        '20': 'OTROS',
        '21': 'OTROS',
        '22': 'OTROS',
        '23': 'ISR_ARRENDAMIENTO',
        '24': 'ISR_ENAJENACION',
        '25': 'ISR_SERVICIOS',
        '26': 'ISR_REGALIAS',
        '27': 'ISR_SERVICIOS',
        '28': 'DIVIDENDOS',
      };
      
      const tipoRetencion = tipoRetencionMap[formData.cveRetenc] || 'OTROS';
      
      const payload: any = {
        rfcEmisor: formData.rfcEmisor.trim(),
        nombreEmisor: formData.nombreEmisor.trim(),
        rfcReceptor: formData.rfcReceptor.trim(),
        razonSocial: tipoPersona === 'moral' ? formData.razonSocial.trim() : undefined,
        nombre: tipoPersona === 'fisica' ? formData.nombre.trim() : undefined,
        paterno: tipoPersona === 'fisica' ? formData.paterno.trim() : undefined,
        materno: tipoPersona === 'fisica' ? formData.materno.trim() : undefined,
        tipoPersona: tipoPersona,
        tipoRetencion: tipoRetencion,
        cveRetenc: formData.cveRetenc.trim(),
        montoBase: parseFloat(formData.montoTotOperacion || '0'),
        montoTotGravado: parseFloat(formData.montoTotGrav || '0'),
        montoTotExento: parseFloat(formData.montoTotExent || '0'),
        isrRetenido: isrRetenido,
        ivaRetenido: ivaRetenido,
        montoRetenido: parseFloat(formData.montoTotRet || '0'),
        periodoMes: formData.mesIni.trim(),
        periodoAnio: formData.ejercicio.trim(),
        fechaPago: formData.fechaPago.trim(),
        concepto: formData.concepto.trim() || formData.descRetenc.trim(),
        correoReceptor: formData.correoReceptor.trim(),
        codigoPostalReceptor: formData.domicilioFiscalReceptor.trim(),
        impRetenidos: formData.impRetenidos.map(imp => ({
          baseRet: imp.baseRet || '0',
          impuestoRet: imp.impuestoRet || '001',
          montoRet: imp.montoRet || '0',
          tipoPagoRet: imp.tipoPagoRet || '01',
        })),
      };

      const response = await fetch(apiUrl('/retenciones/preview-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error en vista previa:', error);
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMessages([`Error al generar vista previa: ${mensaje}`]);
      alert(`Error al generar vista previa: ${mensaje}`);
    }
  }, [formData, validarFormulario, resetAlerts]);

  const handleLimpiarFormulario = useCallback(() => {
    resetAlerts();
    setFormData({
      rfcEmisor: empresaInfo.rfc || '',
      nombreEmisor: empresaInfo.nombre || '',
      regimenFiscalEmisor: '601',
      
      nacionalidadReceptor: 'Nacional',
      rfcReceptor: '',
      razonSocial: '',
      nombre: '',
      paterno: '',
      materno: '',
      curpReceptor: '',
      domicilioFiscalReceptor: '',
      numRegIdTribReceptor: '',
      
      mesIni: '',
      mesFin: '',
      ejercicio: String(new Date().getFullYear()),
      
      cveRetenc: '',
      descRetenc: '',
      folioInt: '',
      
      montoTotOperacion: '',
      montoTotGrav: '',
      montoTotExent: '0.00',
      montoTotRet: '',
      
      impRetenidos: [{
        baseRet: '',
        impuestoRet: '001',
        montoRet: '',
        tipoPagoRet: '01',
      }],
      
      fechaPago: new Date().toISOString().split('T')[0],
      concepto: '',
      correoReceptor: '',
      telefono: '',
      usuarioRegistro: formData.usuarioRegistro,
    });
    setTipoPersona(null);
    tipoPersonaAnteriorRef.current = null;
    setUuidRetencionGuardado(null);
    setRetencionSerieFolio({ serie: '', folio: '' });
  }, [formData.usuarioRegistro, empresaInfo, resetAlerts]);

  const handleGuardar = useCallback(async () => {
    resetAlerts();
    const errores = validarFormulario();
    if (errores.length > 0) {
      setErrorMessages(errores);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Normalizar código postal (solo 5 dígitos)
      const cpNormalizado = formData.domicilioFiscalReceptor.trim().replace(/\D/g, '').padStart(5, '0').substring(0, 5);
      
      // Construir tipo de retención basado en la clave
      const tipoRetencionMap: Record<string, string> = {
        '01': 'OTROS',
        '02': 'DIVIDENDOS',
        '03': 'INTERESES',
        '04': 'ISR_REGALIAS',
        '05': 'ISR_ARRENDAMIENTO',
        '06': 'ENAJENACION_ACCIONES',
        '07': 'ISR_ENAJENACION',
        '08': 'ISR_SERVICIOS',
        '09': 'ISR_SUELDOS',
        '10': 'OTROS',
        '11': 'OTROS',
        '12': 'FIDEICOMISOS',
        '13': 'PLANES_RETIRO',
        '14': 'IVA',
        '15': 'INTERESES',
        '16': 'FIDEICOMISOS',
        '17': 'REMANENTE',
        '18': 'PLANES_RETIRO',
        '19': 'ENAJENACION_ACCIONES',
        '20': 'OTROS',
        '21': 'OTROS',
        '22': 'OTROS',
        '23': 'ISR_ARRENDAMIENTO',
        '24': 'ISR_ENAJENACION',
        '25': 'ISR_SERVICIOS',
        '26': 'ISR_REGALIAS',
        '27': 'ISR_SUELDOS', // Nota: Esta clave requiere complemento PlataformasTecnologicas10
        '28': 'DIVIDENDOS',
      };
      
      const tipoRetencion = tipoRetencionMap[formData.cveRetenc] || 'OTROS';
      
      // Calcular ISR e IVA retenidos desde impRetenidos
      let isrRetenido = 0;
      let ivaRetenido = 0;
      
      formData.impRetenidos.forEach(imp => {
        const monto = parseFloat(imp.montoRet || '0');
        if (imp.impuestoRet === '001') {
          isrRetenido += monto;
        } else if (imp.impuestoRet === '002') {
          ivaRetenido += monto;
        }
      });
      
      const montoRetenido = parseFloat(formData.montoTotRet || '0');
      
      const payload = {
        rfcEmisor: formData.rfcEmisor.trim(),
        nombreEmisor: formData.nombreEmisor.trim(),
        rfcReceptor: formData.rfcReceptor.trim(),
        razonSocial: tipoPersona === 'moral' ? formData.razonSocial.trim() : undefined,
        nombre: tipoPersona === 'fisica' ? formData.nombre.trim() : undefined,
        paterno: tipoPersona === 'fisica' ? formData.paterno.trim() : undefined,
        materno: tipoPersona === 'fisica' ? formData.materno.trim() : undefined,
        tipoPersona: tipoPersona || 'moral',
        tipoRetencion: tipoRetencion,
        cveRetenc: formData.cveRetenc.trim(), // CRÍTICO: Enviar la clave de retención directamente del formulario
        montoBase: parseFloat(formData.montoTotOperacion),
        isrRetenido: isrRetenido,
        ivaRetenido: ivaRetenido,
        montoRetenido: montoRetenido,
        periodoMes: formData.mesIni.trim(),
        periodoAnio: formData.ejercicio.trim(),
        fechaPago: formData.fechaPago.trim(),
        concepto: formData.concepto.trim() || formData.descRetenc.trim(),
        correoReceptor: formData.correoReceptor.trim(),
        usuarioRegistro: formData.usuarioRegistro?.trim() || undefined,
        // CRÍTICO: Incluir código postal del receptor
        codigoPostalReceptor: cpNormalizado,
      };

      const resultado = await retencionesService.registrarRetencion(payload as any);
      
      if (resultado.success) {
        const mensajeBase = resultado.message || 'Retención registrada correctamente.';
        const mensajeUuid =
          resultado.uuidRetencion && resultado.uuidRetencion.trim().length > 0
            ? `${mensajeBase} (UUID: ${resultado.uuidRetencion})`
            : mensajeBase;
        setSuccessMessage(mensajeUuid);
        
        const uuidRetencion = resultado.uuidRetencion?.trim() || '';
        setUuidRetencionGuardado(uuidRetencion || null);
        setRetencionSerieFolio({
          serie: resultado.serieRetencion?.trim() || '',
          folio: resultado.folioRetencion?.trim() || '',
        });

        if (uuidRetencion) {
          window.alert(`Retención de pagos timbrada exitosamente\nUUID: ${uuidRetencion}`);
        } else {
          window.alert('Retención de pagos timbrada exitosamente');
        }

        // Preguntar si desea enviar por correo
        const deseaEnviar = window.confirm('¿Deseas enviar el PDF de la retención al correo registrado?');
        if (deseaEnviar && uuidRetencion) {
          try {
            await retencionesService.enviarRetencionPorCorreo({
              uuidRetencion: uuidRetencion,
              correoReceptor: formData.correoReceptor.trim(),
              rfcReceptor: resultado.rfcReceptor || formData.rfcReceptor.trim(),
              rfcEmisor: resultado.rfcEmisor || formData.rfcEmisor.trim(),
              nombreReceptor: tipoPersona === 'moral' ? formData.razonSocial.trim() : 
                             `${formData.nombre.trim()} ${formData.paterno.trim()} ${formData.materno.trim()}`.trim(),
              nombreEmisor: formData.nombreEmisor.trim(),
              serieRetencion: resultado.serieRetencion || undefined,
              folioRetencion: resultado.folioRetencion || undefined,
              fechaTimbrado: resultado.fechaTimbrado || undefined,
              tipoRetencion: tipoRetencion,
              montoRetenido: resultado.montoRetenido || montoRetenido,
              baseRetencion: resultado.baseRetencion || parseFloat(formData.montoTotOperacion),
            });
            window.alert(`Retención enviada exitosamente al correo: ${formData.correoReceptor.trim()}`);
            setSuccessMessage(`Retención enviada por correo a ${formData.correoReceptor.trim()}`);
          } catch (error) {
            const mensajeError = error instanceof Error ? error.message : 'Error al enviar por correo.';
            setErrorMessages([mensajeError]);
            window.alert(mensajeError);
          }
        }
      } else {
        const erroresBackend = resultado.errors || [];
        const mensajeError = resultado.message || 'Error al registrar la retención.';
        setErrorMessages([mensajeError, ...erroresBackend]);
        window.alert(`${mensajeError}\n${erroresBackend.join('\n')}`);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la retención de pagos.';
      setErrorMessages([message]);
      window.alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, tipoPersona, resetAlerts, validarFormulario]);

  const handleDescargarXmlRetencion = useCallback(async () => {
    if (!uuidRetencionGuardado) {
      window.alert('Primero debes guardar la retención.');
      return;
    }
    try {
      await facturaService.generarYDescargarXML(uuidRetencionGuardado);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Error al descargar XML');
    }
  }, [uuidRetencionGuardado]);

  const handleDescargarPdfRetencion = useCallback(async () => {
    if (!uuidRetencionGuardado) {
      window.alert('Primero debes guardar la retención.');
      return;
    }
    try {
      await facturaService.generarYDescargarPDF(uuidRetencionGuardado);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Error al descargar PDF');
    }
  }, [uuidRetencionGuardado]);

  const handleEnviarCorreoRetencion = useCallback(async () => {
    if (!uuidRetencionGuardado) {
      window.alert('Primero debes guardar la retención.');
      return;
    }
    if (!formData.correoReceptor?.trim()) {
      window.alert('El correo del receptor es obligatorio.');
      return;
    }
    try {
      await retencionesService.enviarRetencionPorCorreo({
        uuidRetencion: uuidRetencionGuardado,
        correoReceptor: formData.correoReceptor.trim(),
        rfcReceptor: formData.rfcReceptor.trim(),
        rfcEmisor: formData.rfcEmisor.trim(),
        nombreReceptor:
          tipoPersona === 'moral'
            ? formData.razonSocial.trim()
            : `${formData.nombre.trim()} ${formData.paterno.trim()} ${formData.materno.trim()}`.trim(),
        nombreEmisor: formData.nombreEmisor.trim(),
        tipoRetencion: formData.cveRetenc,
      });
      window.alert(`Retención enviada al correo: ${formData.correoReceptor.trim()}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Error al enviar por correo');
    }
  }, [uuidRetencionGuardado, formData, tipoPersona]);

  const abrirModalWhatsApp = useCallback(() => {
    if (!uuidRetencionGuardado) {
      window.alert('Primero debes guardar y timbrar la retención para enviarla por WhatsApp.');
      return;
    }
    const { serie, folio } = retencionSerieFolio;
    const facturaInfo =
      serie && folio
        ? `Retención de pagos ${serie}-${folio}`
        : `Retención de pagos (UUID ${uuidRetencionGuardado})`;
    setModalWhatsApp({
      isOpen: true,
      facturaUuid: uuidRetencionGuardado,
      facturaInfo,
      telefonoInicial: (formData.telefono || '').trim(),
    });
  }, [uuidRetencionGuardado, retencionSerieFolio, formData.telefono]);

  const cerrarModalWhatsApp = useCallback(() => {
    setModalWhatsApp({
      isOpen: false,
      facturaUuid: '',
      facturaInfo: '',
      telefonoInicial: '',
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Retención de Pagos
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          CFDI de Retenciones e Información de Pagos 2.0 según Anexo 20 del SAT
        </p>
      </div>

      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Datos del Emisor - Ocultos, se toman del sistema por defecto */}

      <Card id="guia-ret-datos-receptor" title="Datos del Receptor">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Nacionalidad del Receptor"
            name="nacionalidadReceptor"
            value={formData.nacionalidadReceptor}
            onChange={handleFormChange}
            options={[
              { value: 'Nacional', label: 'Nacional' },
              { value: 'Extranjero', label: 'Extranjero' },
            ]}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RFC del Receptor *
            </label>
            <RfcAutocomplete
              value={formData.rfcReceptor}
              onChange={(rfc) => setFormData(prev => ({ ...prev, rfcReceptor: rfc }))}
              onSelect={handleClienteSelect}
              onNotFound={handleRfcNotFound}
              required
            />
          </div>
        </div>

        {formData.nacionalidadReceptor === 'Nacional' && (
          <>
            {tipoPersona === 'moral' && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="Razón Social"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleFormChange}
                  placeholder="Ej. Empresa Ejemplo S.A. de C.V."
                  required
                />
                <FormField
                  label="CURP (Opcional)"
                  name="curpReceptor"
                  value={formData.curpReceptor}
                  onChange={handleFormChange}
                  placeholder="Ej. ABC123456HDFGHI01"
                />
              </div>
            )}
            
            {tipoPersona === 'fisica' && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  placeholder="Ej. Juan"
                  required
                />
                <FormField
                  label="Apellido Paterno"
                  name="paterno"
                  value={formData.paterno}
                  onChange={handleFormChange}
                  placeholder="Ej. Pérez"
                  required
                />
                <FormField
                  label="Apellido Materno"
                  name="materno"
                  value={formData.materno}
                  onChange={handleFormChange}
                  placeholder="Ej. García"
                />
                <FormField
                  label="CURP (Opcional)"
                  name="curpReceptor"
                  value={formData.curpReceptor}
                  onChange={handleFormChange}
                  placeholder="Ej. ABC123456HDFGHI01"
                />
              </div>
            )}
            
            <div className="mt-4">
              <FormField
                label="Código Postal del Receptor (DomicilioFiscalR) *"
                name="domicilioFiscalReceptor"
                value={formData.domicilioFiscalReceptor}
                onChange={handleFormChange}
                placeholder="Ej. 58000 (5 dígitos)"
                required
                maxLength={5}
              />
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                CRÍTICO: Debe ser un código postal válido del catálogo c_CodigoPostal del SAT (5 dígitos numéricos)
              </p>
            </div>
          </>
        )}

        {formData.nacionalidadReceptor === 'Extranjero' && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Nombre o Razón Social"
              name="razonSocial"
              value={formData.razonSocial}
              onChange={handleFormChange}
              placeholder="Nombre completo o razón social"
              required
            />
            <FormField
              label="Número de Registro de Identificación Fiscal"
              name="numRegIdTribReceptor"
              value={formData.numRegIdTribReceptor}
              onChange={handleFormChange}
              placeholder="Opcional"
            />
          </div>
        )}

        {!tipoPersona && formData.rfcReceptor.trim().length > 0 && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Ingresa un RFC válido (12 caracteres para persona moral, 13 para persona física)
          </p>
        )}
      </Card>

      <Card id="guia-ret-periodo" title="Período">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField
            label="Mes Inicial"
            name="mesIni"
            value={formData.mesIni}
            onChange={handleFormChange}
            options={MESES_OPTIONS}
            required
          />
          <SelectField
            label="Mes Final"
            name="mesFin"
            value={formData.mesFin}
            onChange={handleFormChange}
            options={MESES_OPTIONS}
            required
          />
          <SelectField
            label="Ejercicio (Año)"
            name="ejercicio"
            value={formData.ejercicio}
            onChange={handleFormChange}
            options={ANIOS_OPTIONS}
            required
          />
        </div>
      </Card>

      <Card id="guia-ret-info-retencion" title="Información de la Retención">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Clave de Retención (CveRetenc)"
            name="cveRetenc"
            value={formData.cveRetenc}
            onChange={handleFormChange}
            options={CLAVES_RETENCION}
            required
          />
          <FormField
            label="Descripción de la Retención (DescRetenc)"
            name="descRetenc"
            value={formData.descRetenc}
            onChange={handleFormChange}
            placeholder="Descripción opcional de la retención"
            maxLength={100}
          />
        </div>
        <div className="mt-4">
          <FormField
            label="Folio Interno (Opcional)"
            name="folioInt"
            value={formData.folioInt}
            onChange={handleFormChange}
            placeholder="Folio interno del contribuyente"
            maxLength={20}
          />
        </div>
        <div className="mt-4">
          <FormField
            label="Concepto"
            name="concepto"
            value={formData.concepto}
            onChange={handleFormChange}
            placeholder="Descripción del pago o servicio"
            required
          />
        </div>
        <div className="mt-4">
          <FormField
            label="Fecha de Pago"
            name="fechaPago"
            type="date"
            value={formData.fechaPago}
            onChange={handleFormChange}
            required
          />
        </div>
      </Card>

      <Card id="guia-ret-totales" title="Totales">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Monto Total de la Operación *"
            name="montoTotOperacion"
            type="number"
            step="0.01"
            min="0"
            value={formData.montoTotOperacion}
            onChange={handleFormChange}
            placeholder="0.00"
            required
          />
          <div className="flex items-end">
            <div className="w-full rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Monto Total Gravado (Calculado)
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${parseFloat(formData.montoTotGrav || '0').toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <FormField
            label="Monto Total Exento"
            name="montoTotExent"
            type="number"
            step="0.01"
            min="0"
            value={formData.montoTotExent}
            onChange={handleFormChange}
            placeholder="0.00"
            required
          />
          <div className="flex items-end">
            <div className="w-full rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300">
                Monto Total Retenido (Calculado)
              </label>
              <p className="mt-1 text-lg font-semibold text-blue-900 dark:text-blue-100">
                ${parseFloat(formData.montoTotRet || '0').toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          * El monto total gravado se calcula automáticamente como: Monto Total Operación - Monto Total Exento
          <br />
          El monto total retenido se calcula automáticamente desde la suma de los impuestos retenidos
        </p>
      </Card>

      <Card id="guia-ret-impuestos" title="Impuestos Retenidos">
        {formData.impRetenidos.map((imp, index) => (
          <div key={index} className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Impuesto Retenido {index + 1}
              </h4>
              {formData.impRetenidos.length > 1 && (
                <Button
                  variant="neutral"
                  onClick={() => eliminarImpRetenido(index)}
                  className="text-xs"
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                label="Base de Retención *"
                name={`baseRet_${index}`}
                type="number"
                step="0.01"
                min="0"
                value={imp.baseRet}
                onChange={(e) => handleImpRetenidoChange(index, 'baseRet', e.target.value)}
                placeholder="0.00"
                required
              />
              <SelectField
                label="Impuesto Retenido *"
                name={`impuestoRet_${index}`}
                value={imp.impuestoRet}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleImpRetenidoChange(index, 'impuestoRet', e.target.value)}
                options={IMPUESTO_OPTIONS}
                required
              />
              <div>
                <FormField
                  label="Monto Retenido (Calculado automáticamente)"
                  name={`montoRet_${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={imp.montoRet}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImpRetenidoChange(index, 'montoRet', e.target.value)}
                  placeholder="0.00"
                  required
                />
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  Se calcula automáticamente según la base y tipo de impuesto
                </p>
              </div>
              <SelectField
                label="Tipo de Pago Ret *"
                name={`tipoPagoRet_${index}`}
                value={imp.tipoPagoRet}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleImpRetenidoChange(index, 'tipoPagoRet', e.target.value)}
                options={TIPO_PAGO_RET_OPTIONS}
                required
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              * El monto retenido se calcula automáticamente según la base de retención y el tipo de impuesto seleccionado.
              <br />
              Tasas aplicadas: ISR (10-25% según tipo), IVA (10.67%), IEPS (variable). Puede ajustarse manualmente si es necesario.
            </p>
          </div>
        ))}
        <Button variant="secondary" onClick={agregarImpRetenido} className="mt-2">
          + Agregar Impuesto Retenido
        </Button>
      </Card>

      <Card id="guia-ret-info-adicional" title="Información Adicional">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Correo del Receptor"
            name="correoReceptor"
            type="email"
            value={formData.correoReceptor}
            onChange={handleFormChange}
            placeholder="ejemplo@dominio.com"
            required
          />
          <FormField
            label="Teléfono para WhatsApp"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleFormChange}
            placeholder="527331565237"
          />
          <FormField
            label="Usuario que Registra"
            name="usuarioRegistro"
            value={formData.usuarioRegistro}
            onChange={handleFormChange}
            placeholder="Usuario del sistema"
            disabled
          />
        </div>
      </Card>

      <ComprobanteAccionesBar
        id="guia-ret-generar"
        className="mt-4"
        onCancel={handleLimpiarFormulario}
        cancelLabel="Limpiar formulario"
        onVistaPrevia={handleVistaPrevia}
        vistaPreviaDisabled={isSubmitting}
        onGenerar={handleGuardar}
        generarLabel={isSubmitting ? 'Emitiendo…' : 'Emitir retención de pagos'}
        generarDisabled={isSubmitting}
        tieneUuid={Boolean(uuidRetencionGuardado)}
        postEmisionHint="Después de emitir la retención"
        onDescargarXml={() => void handleDescargarXmlRetencion()}
        onDescargarPdf={() => void handleDescargarPdfRetencion()}
        onEnviarCorreo={() => void handleEnviarCorreoRetencion()}
        onEnviarWhatsApp={abrirModalWhatsApp}
        correoDisabled={!formData.correoReceptor?.trim()}
        correoTitle={!formData.correoReceptor?.trim() ? 'Capture el correo del receptor' : undefined}
      />

      {/* Modal de Alta de Cliente */}
      <AltaClienteModal
        isOpen={mostrarAltaCliente}
        onClose={() => setMostrarAltaCliente(false)}
        onSave={handleGuardarCliente}
        rfcInicial={formData.rfcReceptor}
      />

      <EnviarWhatsAppModal
        isOpen={modalWhatsApp.isOpen}
        onClose={cerrarModalWhatsApp}
        facturaUuid={modalWhatsApp.facturaUuid}
        facturaInfo={modalWhatsApp.facturaInfo}
        telefonoInicial={modalWhatsApp.telefonoInicial}
        tituloModal="Enviar Retención de Pagos por WhatsApp"
        etiquetaDocumento="Retención de pagos"
        mensajeBase={WHATSAPP_MENSAJE_BASE_RETENCION_PAGO}
        construirMensaje={construirMensajeWhatsAppRetencionPago}
        notaArchivos="Se enviarán el PDF y el XML de la retención de pagos al número indicado."
      />
    </div>
  );
};

export default FacturacionRetencionPagosPage;
