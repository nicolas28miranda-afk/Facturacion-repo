import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { EnviarCorreoModal } from './EnviarCorreoModal';
import { RfcAutocomplete } from './RfcAutocomplete';
import { AltaClienteModal, ClienteFormData } from './AltaClienteModal';
import { SeleccionarProductoServicioModal } from './SeleccionarProductoServicioModal';
import { useEmpresa } from '../context/EmpresaContext';
import { correoService } from '../services/correoService';
// import { configuracionCorreoService } from '../services/configuracionCorreoService'; // No utilizado
import { facturaService } from '../services/facturaService';
import { ticketService, Ticket, TicketSearchFilters } from '../services/ticketService';
import { ClienteDatos } from '../services/clienteCatalogoService';
import { codigoPostalService } from '../services/codigoPostalService';
import {
  PAIS_OPTIONS,
  REGIMEN_FISCAL_OPTIONS,
  USO_CFDI_OPTIONS,
  TIENDA_OPTIONS,
  MEDIO_PAGO_OPTIONS,
  FORMA_PAGO_OPTIONS,
  MOTIVO_REFACTURA_OPTIONS
} from '../constants';
import { apiUrl, pacUrl, getHeadersWithUsuario } from '../services/api';

interface FormData {
  rfc: string;
  correoElectronico: string;
  razonSocial: string;
  nombre: string;
  paterno: string;
  materno: string;
  pais: string;
  codigoPostal: string;
  estado: string;
  municipio: string;
  colonia: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  noRegistroIdentidadTributaria: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  codigoFacturacion: string;
  tienda: string;
  fecha: string;
  terminal: string;
  boleta: string;
  medioPago: string;
  formaPago: string;
  iepsDesglosado: boolean;
  declaraIeps: boolean;
  telefono: string;
  uuid: string;
  modoDetalle: 'automatico' | 'manual';
  uuidCfdiRelacionado: string;
  tipoRelacion: string;
}

interface Factura {
  uuid: string;
  codigoFacturacion: string;
  tienda: string;
  fechaFactura: string;
  terminal: string;
  boleta: string;
  razonSocial: string;
  rfc: string;
  total: number;
  estado: string;
  medioPago: string;
  formaPago: string;
  fechaGeneracion?: string;
  fechaTimbrado?: string;
  subtotal?: number;
  iva?: number;
  ieps?: number;
}

const initialFormData: FormData = {
  rfc: '',
  correoElectronico: '',
  razonSocial: '',
  nombre: '',
  paterno: '',
  materno: '',
  pais: PAIS_OPTIONS[0].value,
  codigoPostal: '',
  estado: '',
  municipio: '',
  colonia: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  noRegistroIdentidadTributaria: '',
  domicilioFiscal: '',
  regimenFiscal: REGIMEN_FISCAL_OPTIONS[0].value,
  usoCfdi: USO_CFDI_OPTIONS[0].value,
  codigoFacturacion: '',
  tienda: TIENDA_OPTIONS[0].value,
  fecha: new Date().toISOString().split('T')[0],
  terminal: '',
  boleta: '',
  medioPago: MEDIO_PAGO_OPTIONS[0].value,
  formaPago: FORMA_PAGO_OPTIONS[0].value,
  iepsDesglosado: false,
  declaraIeps: false,
  telefono: '',
  uuid: '',
  modoDetalle: 'manual',
  uuidCfdiRelacionado: '',
  tipoRelacion: '',
};

export const RefacturaPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [timbradoStatus, setTimbradoStatus] = useState<string | null>(null);
  const [timbradoIntervalId, setTimbradoIntervalId] = useState<number | null>(null);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargandoTickets, setCargandoTickets] = useState(false);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(5);
  const [modalCorreo, setModalCorreo] = useState<{
    isOpen: boolean;
    facturaUuid: string;
    facturaInfo: string;
    correoInicial: string;
    rfcReceptor: string;
  }>({
    isOpen: false,
    facturaUuid: '',
    facturaInfo: '',
    correoInicial: '',
    rfcReceptor: ''
  });
  const { empresaInfo } = useEmpresa();
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | null>(null);
  const tipoPersonaAnteriorRef = useRef<'fisica' | 'moral' | null>(null);
  const [mostrarAltaCliente, setMostrarAltaCliente] = useState(false);
  const [colonias, setColonias] = useState<string[]>([]);
  const [cargandoCP, setCargandoCP] = useState(false);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [productosAgregados, setProductosAgregados] = useState<Array<{
    id: number;
    claveProdServ: string;
    cantidad: number;
    unidad: string;
    claveUnidad?: string;
    descripcion: string;
    objetoImpuesto: string;
    valorUnitario: number;
    importe: number;
    tasaIVA: number;
  }>>([]);

  // Funciones para determinar el tipo de persona según el RFC
  const esPersonaMoral = (rfc: string): boolean => {
    return rfc.length === 12;
  };

  const esPersonaFisica = (rfc: string): boolean => {
    return rfc.length === 13;
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

  // Función auxiliar para parsear el domicilio fiscal
  // Formato esperado: "Calle NumExt Int. NumInt, Colonia, Municipio, Estado, C.P. 12345, País"
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
    // Parsear domicilio fiscal para extraer campos individuales
    const domicilioParseado = parsearDomicilioFiscal(cliente.domicilioFiscal);
    
    setFormData(prev => ({
      ...prev,
      rfc: cliente.rfc,
      razonSocial: cliente.razonSocial || prev.razonSocial,
      nombre: cliente.nombre || prev.nombre,
      paterno: cliente.paterno || prev.paterno,
      materno: cliente.materno || prev.materno,
      correoElectronico: cliente.correoElectronico || prev.correoElectronico,
      pais: cliente.pais || prev.pais,
      domicilioFiscal: cliente.domicilioFiscal || prev.domicilioFiscal,
      regimenFiscal: cliente.regimenFiscal || prev.regimenFiscal,
      usoCfdi: cliente.usoCfdi || prev.usoCfdi,
      // Campos de dirección parseados
      codigoPostal: domicilioParseado.codigoPostal || prev.codigoPostal,
      calle: domicilioParseado.calle || prev.calle,
      numeroExterior: domicilioParseado.numeroExterior || prev.numeroExterior,
      numeroInterior: domicilioParseado.numeroInterior || prev.numeroInterior,
      colonia: domicilioParseado.colonia || prev.colonia,
      municipio: domicilioParseado.municipio || prev.municipio,
      estado: domicilioParseado.estado || prev.estado,
    }));

    // Si se pudo parsear un código postal, cargar los datos del CP
    if (domicilioParseado.codigoPostal && domicilioParseado.codigoPostal.length === 5) {
      await cargarDatosCP(domicilioParseado.codigoPostal);
      // Si el estado/municipio no se parsearon bien, usar los datos del CP
      if (!domicilioParseado.estado || !domicilioParseado.municipio) {
        const datosCP = await codigoPostalService.obtenerDatosCP(domicilioParseado.codigoPostal);
        if (datosCP) {
          setFormData(prev => ({
            ...prev,
            estado: prev.estado || datosCP.estado,
            municipio: prev.municipio || datosCP.municipio,
            colonia: prev.colonia || datosCP.colonias[0] || '',
          }));
          setColonias(datosCP.colonias || []);
        }
      }
    }
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
        rfc: clienteData.rfc,
        razonSocial: clienteData.razonSocial,
        nombre: clienteData.nombre || prev.nombre,
        paterno: clienteData.apellidoPaterno || prev.paterno,
        materno: clienteData.apellidoMaterno || prev.materno,
        correoElectronico: clienteData.correoElectronico,
        telefono: clienteData.telefono || prev.telefono,
        codigoPostal: clienteData.codigoPostal,
        estado: clienteData.estado,
        municipio: clienteData.municipio,
        colonia: clienteData.colonia,
        calle: clienteData.calle,
        numeroExterior: clienteData.numeroExterior,
        numeroInterior: clienteData.numeroInterior,
        pais: clienteData.pais,
        regimenFiscal: clienteData.regimenFiscal,
        usoCfdi: clienteData.usoCfdi,
        declaraIeps: clienteData.declaraIeps,
      }));

      setMostrarAltaCliente(false);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      throw error;
    }
  };

  // Cargar datos de código postal
  const cargarDatosCP = async (cp: string) => {
    if (!cp || cp.length !== 5) {
      setColonias([]);
      setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
      return;
    }

    setCargandoCP(true);
    try {
      console.log('Buscando datos para código postal:', cp);
      const data = await codigoPostalService.obtenerDatosCP(cp);
      console.log('Datos recibidos del servicio:', data);
      
      if (data) {
        setFormData(prev => {
          const nuevoEstado = {
            ...prev,
            estado: data.estado || prev.estado || '',
            municipio: data.municipio || prev.municipio || '',
            colonia: prev.colonia || '', // Mantener colonia si ya estaba seleccionada
          };
          console.log('Actualizando formulario con:', { estado: nuevoEstado.estado, municipio: nuevoEstado.municipio });
          return nuevoEstado;
        });
        setColonias(data.colonias || []);
        console.log('Colonias cargadas:', data.colonias?.length || 0);
      } else {
        console.warn('No se recibieron datos del código postal');
        setColonias([]);
        setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
      }
    } catch (error) {
      console.error('Error al cargar código postal:', error);
      setColonias([]);
      setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
    } finally {
      setCargandoCP(false);
    }
  };

  // Manejar cambio de código postal
  const handleCodigoPostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData(prev => ({ ...prev, codigoPostal: cp }));
    
    if (cp.length === 5) {
      cargarDatosCP(cp);
    } else {
      setColonias([]);
      setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
    }
  };

  const formatearFechaConMilisegundos = (fecha: string | null): string => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      let milisegundos = '000';
      if (fecha.includes('.')) {
        const milisegundosPart = fecha.split('.')[1];
        if (milisegundosPart && milisegundosPart.length >= 3) {
          milisegundos = milisegundosPart.substring(0, 3);
        }
      } else {
        milisegundos = date.getMilliseconds().toString().padStart(3, '0');
      }
      
      const fechaFormateada = date.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return `${fechaFormateada}.${milisegundos}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'N/A';
    }
  };

  const cargarFacturas = useCallback(async () => {
    setCargandoFacturas(true);
    try {
      const response = await fetch(apiUrl('/factura/consultar-por-empresa'));
      const data = await response.json();

      if (data.exitoso && data.facturas) {
        const facturasFormateadas = data.facturas.map((factura: any) => ({
          ...factura,
          fechaFactura: formatearFechaConMilisegundos(
            factura.fechaFactura || factura.fechaGeneracion || factura.fechaTimbrado || factura.fechaEmision
          ),
          fechaGeneracion: formatearFechaConMilisegundos(factura.fechaGeneracion),
          fechaTimbrado: formatearFechaConMilisegundos(factura.fechaTimbrado),
          codigoFacturacion: factura.codigoFacturacion
            || `${factura.serie || ''}${factura.folio || ''}`.trim()
            || factura.uuid,
          total: typeof factura.total === 'number'
            ? factura.total
            : (typeof factura.importe === 'number' ? factura.importe : 0),
          estado: factura.estado || factura.estatusFacturacion || 'DESCONOCIDO',
          rfc: factura.rfc || factura.rfcReceptor || factura.rfcEmisor || '',
          razonSocial: factura.razonSocial || factura.nombreCliente || '',
          fechaOriginal: factura.fechaFactura || factura.fechaGeneracion || factura.fechaTimbrado || factura.fechaEmision
        }));
        
        const uuids = facturasFormateadas.map((f: any) => f.uuid);
        const uuidsUnicos = [...new Set(uuids)];
        
        let facturasFinales = facturasFormateadas;
        
        if (uuids.length !== uuidsUnicos.length) {
          facturasFinales = facturasFormateadas.filter((factura: any, index: number, self: any[]) => 
            index === self.findIndex((f: any) => f.uuid === factura.uuid)
          );
        }
        
        facturasFinales.sort((a: any, b: any) => {
          const fechaA = a.fechaOriginal;
          const fechaB = b.fechaOriginal;
          
          if (!fechaA && !fechaB) return 0;
          if (!fechaA) return 1;
          if (!fechaB) return -1;
          
          const dateA = new Date(fechaA);
          const dateB = new Date(fechaB);
          
          return dateB.getTime() - dateA.getTime();
        });
        
        setFacturas(facturasFinales);
        setMostrarTabla(true);
        setPaginaActual(1);
      } else {
        console.error('Error al cargar facturas:', data.error);
        setFacturas([]);
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      setFacturas([]);
    } finally {
      setCargandoFacturas(false);
    }
  }, []);

  // Cargar facturas sólo bajo demanda desde el botón; evitar carga automática al montar

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que en modo manual haya productos agregados
    if (formData.modoDetalle === 'manual' && productosAgregados.length === 0) {
      alert('Por favor agregue al menos un producto o servicio antes de generar la factura.');
      return;
    }
    
    try {
      // Construir domicilio fiscal a partir de los campos de dirección
      const partesDomicilio = [
        formData.calle,
        formData.numeroExterior,
        formData.numeroInterior,
        formData.colonia,
        formData.municipio,
        formData.estado,
        formData.codigoPostal,
        formData.pais,
      ].filter(Boolean);
      const domicilioFiscal = partesDomicilio.join(', ') || formData.domicilioFiscal;

      // Transformar los datos del frontend al formato que espera el backend (FacturaFrontendRequest)
      // Solo incluir campos que existen en el DTO del backend
      const facturaRequest: any = {
        rfc: formData.rfc,
        correoElectronico: formData.correoElectronico,
        razonSocial: formData.razonSocial,
        nombre: formData.nombre,
        paterno: formData.paterno,
        materno: formData.materno,
        pais: formData.pais,
        noRegistroIdentidadTributaria: formData.noRegistroIdentidadTributaria,
        domicilioFiscal: domicilioFiscal,
        regimenFiscal: formData.regimenFiscal,
        usoCfdi: formData.usoCfdi,
        codigoFacturacion: formData.codigoFacturacion,
        tienda: formData.tienda,
        fecha: formData.fecha,
        terminal: formData.terminal,
        boleta: formData.boleta,
        medioPago: formData.medioPago,
        formaPago: formData.formaPago,
        iepsDesglosado: formData.iepsDesglosado,
        guardarEnMongo: false, // Desactivado porque el servidor usa Oracle, no MongoDB
        uuidCfdiRelacionado: formData.uuidCfdiRelacionado || null,
        tipoRelacion: formData.tipoRelacion || null,
        tipoDocumento: 'Refactura', // Para título y UUID relacionado en PDF (vista previa y correo)
        // Campos eliminados porque no existen en FacturaFrontendRequest:
        // codigoPostal, estado, municipio, colonia, calle, numeroExterior, numeroInterior
        // declaraIeps, telefono, modoDetalle
      };

      // Si es modo manual, agregar los conceptos del catálogo
      if (formData.modoDetalle === 'manual' && productosAgregados.length > 0) {
        facturaRequest.conceptos = productosAgregados.map(producto => ({
          descripcion: producto.descripcion,
          cantidad: producto.cantidad,
          unidad: producto.unidad,
          precioUnitario: producto.valorUnitario,
          importe: producto.importe,
          claveProdServ: producto.claveProdServ,
          claveUnidad: producto.claveUnidad || producto.unidad, // Usar claveUnidad del catálogo si existe
          objetoImp: producto.objetoImpuesto || '02', // El DTO usa objetoImp, no objetoImpuesto
          tasaIva: producto.tasaIVA / 100, // Convertir porcentaje a decimal (ej: 16 -> 0.16)
        }));
      }


      const response = await fetch(apiUrl('/factura/generar/frontend'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(facturaRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      const uuid = data.uuid || data.datos?.folioFiscal || data.datosFactura?.uuid;

      if (data.exitoso) {
        alert(`${data.mensaje}\nUUID: ${uuid}\nFactura guardada en base de datos`);
        // Persistir el UUID en el formulario para acciones rápidas
        setFormData(prev => ({ ...prev, uuid: uuid || prev.uuid }));
        if (uuid) {
          setTimbradoStatus('4 - EN PROCESO DE EMISION');
          iniciarPollingTimbrado(uuid);
        }
        
        // Confirmación antes de enviar por correo
        if (formData.correoElectronico && formData.correoElectronico.trim()) {
          const confirmar = window.confirm('¿Desea enviar los archivos al correo del receptor?');
          if (confirmar) {
            await enviarCorreoDirectoConUuid(uuid);
          }
        }
        
        cargarFacturas();
      } else {
        alert(`${data.mensaje}\nErrores: ${data.errores || data.error}`);
      }
    } catch (error) {
      console.error('Error en el envío:', error);
      alert(`Hubo un error al enviar el formulario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  // Limpieza de intervalos al desmontar
  useEffect(() => {
    return () => {
      if (timbradoIntervalId) {
        window.clearInterval(timbradoIntervalId);
      }
    };
  }, [timbradoIntervalId]);

  const handleCancel = () => {
    setFormData(initialFormData);
    alert('Formulario reiniciado');
  };

  // Función no utilizada - comentada para evitar error de TypeScript
  // const handleAgregarBoleta = () => {
  //   alert(`Boleta agregada: Código ${formData.codigoFacturacion}, Tienda ${formData.tienda}, Fecha ${formData.fecha}`);
  // };

  const handleBuscarTicket = async () => {
    try {
      setCargandoTickets(true);
      
      // En modo automático, buscar solo por folio usando el campo codigoFacturacion
      const codigoIngresado = formData.codigoFacturacion?.trim();
      
      if (!codigoIngresado) {
        alert('Por favor ingrese un folio para buscar.');
        return;
      }
      
      const folioNumerico = Number(codigoIngresado);
      
      if (isNaN(folioNumerico) || folioNumerico <= 0) {
        alert('El folio debe ser un número válido.');
        return;
      }
      
      console.log('Buscando ticket con folio:', folioNumerico);
      
      // En modo automático, buscar SOLO por folio sin otros filtros
      const filtros: TicketSearchFilters = {
        // codigoTienda: formData.tienda || undefined, // Comentado: no usar filtro de tienda
        // terminalId: formData.terminal ? Number(formData.terminal) : undefined, // Comentado: no usar filtro de terminal
        // fecha: formData.fecha || undefined, // Comentado: no usar filtro de fecha
        folio: folioNumerico,
      };
      
      console.log('Filtros enviados al backend:', filtros);
      
      const resultados = await ticketService.buscarTickets(filtros);
      
      console.log('Resultados recibidos:', resultados);
      
      setTickets(resultados);
      // Mostrar tabla solo si hay múltiples resultados
      setMostrarTabla(resultados && resultados.length > 1);
      
      if (!resultados || resultados.length === 0) {
        alert(`No se encontraron tickets con el folio ${folioNumerico}. Verifica que el folio exista en la base de datos.`);
        setTicketSeleccionado(null);
      } else {
        if (resultados.length === 1) {
          setTicketSeleccionado(resultados[0]);
          rellenarFormularioConTicket(resultados[0]);
        } else {
          setTicketSeleccionado(null);
        }
      }
    } catch (error) {
      console.error('Error al consultar tickets:', error);
      const mensajeError = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al consultar tickets: ${mensajeError}. Revisa la consola para más detalles.`);
    } finally {
      setCargandoTickets(false);
    }
  };

  // Rellena las secciones del formulario usando los datos del ticket encontrado
  const rellenarFormularioConTicket = (t: Ticket) => {
    setFormData(prev => ({
      ...prev,
      tienda: t.codigoTienda ?? prev.tienda,
      fecha: t.fecha ?? prev.fecha,
      terminal: t.terminalId != null ? String(t.terminalId) : prev.terminal,
      boleta: t.folio != null ? String(t.folio) : prev.boleta,
      // El backend devuelve formaPago tipo SAT (01, 03, 28...). Lo mapeamos a Medio de Pago.
      medioPago: t.formaPago ?? prev.medioPago,
      // Suponemos PUE por defecto si no hay valor explícito
      formaPago: prev.formaPago || 'PUE',
    }));
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'TIMBRADA':
      case 'VIGENTE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'GENERADA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const descargarXml = async (uuid: string, _codigoFacturacion: string) => {
    try {
      await facturaService.generarYDescargarXML(uuid);
    } catch (error) {
      console.error('Error al descargar XML:', error);
      alert('Error al descargar el XML. Intenta nuevamente.');
    }
  };

  const descargarPdf = async (uuid: string) => {
    try {
      await facturaService.generarYDescargarPDF(uuid);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert(`Error al descargar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Enviar correo directo (sin modal) usando el email del formulario
  const enviarCorreoDirectoConUuid = async (uuid: string) => {
    const correo = (formData.correoElectronico || '').trim();
    if (!correo || !correoService.validarEmail(correo)) {
      alert('Ingresa un correo electrónico válido en el formulario.');
      return;
    }

    let serieFactura = '';
    let folioFactura = '';
    try {
      const facturaCompleta = await facturaService.obtenerFacturaPorUUID(uuid);
      serieFactura = facturaCompleta.serie || '';
      folioFactura = facturaCompleta.folio || '';
    } catch {}

    const asunto = `Factura ${serieFactura || 'A'}${folioFactura || '1'} - ${empresaInfo?.nombre || 'Empresa'}`;
    const mensaje = `Estimado(a) cliente,\n\nSe ha generado su factura electrónica.\n\nGracias por su preferencia.`;

    try {
      const resp = await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: uuid,
        correoReceptor: correo,
        asunto,
        mensaje,
      });
      if (resp.success) {
        alert(`Correo enviado exitosamente a: ${correo}`);
      } else {
        alert(`Error al enviar correo: ${resp.message || 'Desconocido'}`);
      }
    } catch (error) {
      console.error('Error al enviar correo:', error);
      alert(`Error al enviar correo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Acciones rápidas junto a Guardar/Cancelar usando el UUID activo
  const descargarXmlActual = async () => {
    const uuidActivo = (formData.uuid || '').trim();
    if (!uuidActivo) {
      alert('Primero guarda o consulta una factura para obtener el UUID.');
      return;
    }
    await descargarXml(uuidActivo, formData.codigoFacturacion || 'Factura');
  };

  const descargarPdfActual = async () => {
    const uuidActivo = (formData.uuid || '').trim();
    if (!uuidActivo) {
      alert('Primero guarda o consulta una factura para obtener el UUID.');
      return;
    }
    await descargarPdf(uuidActivo);
  };

  const enviarCorreoActual = async () => {
    const uuidActivo = (formData.uuid || '').trim();
    if (!uuidActivo) {
      alert('Primero guarda o consulta una factura para obtener el UUID.');
      return;
    }
    await enviarCorreoDirectoConUuid(uuidActivo);
  };

  const handleVistaPrevia = async () => {
    try {
      // Validar campos básicos
      if (!formData.rfc || !formData.rfc.trim()) {
        alert('Por favor ingrese el RFC del receptor.');
        return;
      }

      // Construir domicilio fiscal a partir de los campos de dirección
      const partesDomicilio = [
        formData.calle,
        formData.numeroExterior,
        formData.numeroInterior,
        formData.colonia,
        formData.municipio,
        formData.estado,
        formData.codigoPostal,
        formData.pais,
      ].filter(Boolean);
      const domicilioFiscal = partesDomicilio.join(', ') || formData.domicilioFiscal;

      // Construir request similar al que se envía al generar
      const facturaRequest: any = {
        rfc: formData.rfc,
        correoElectronico: formData.correoElectronico,
        razonSocial: formData.razonSocial,
        nombre: formData.nombre,
        paterno: formData.paterno,
        materno: formData.materno,
        pais: formData.pais,
        noRegistroIdentidadTributaria: formData.noRegistroIdentidadTributaria,
        domicilioFiscal: domicilioFiscal,
        regimenFiscal: formData.regimenFiscal,
        usoCfdi: formData.usoCfdi,
        codigoFacturacion: formData.codigoFacturacion,
        tienda: formData.tienda,
        fecha: formData.fecha,
        terminal: formData.terminal,
        boleta: formData.boleta,
        medioPago: formData.medioPago,
        formaPago: formData.formaPago,
        iepsDesglosado: formData.iepsDesglosado,
        tipoDocumento: 'Refactura',
        uuidCfdiRelacionado: formData.uuidCfdiRelacionado || null,
        tipoRelacion: formData.tipoRelacion || null,
      };

      // Si es modo manual, agregar los conceptos del catálogo
      if (formData.modoDetalle === 'manual' && productosAgregados.length > 0) {
        facturaRequest.conceptos = productosAgregados.map(producto => ({
          descripcion: producto.descripcion,
          cantidad: producto.cantidad,
          unidad: producto.unidad,
          precioUnitario: producto.valorUnitario,
          importe: producto.importe,
          claveProdServ: producto.claveProdServ,
          claveUnidad: producto.claveUnidad || producto.unidad,
          objetoImp: producto.objetoImpuesto || '02',
          tasaIva: producto.tasaIVA / 100, // Convertir porcentaje a decimal (ej: 16 -> 0.16)
        }));
      }

      const response = await fetch(apiUrl('/factura/preview-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(facturaRequest),
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
      console.error('Error al generar vista previa:', error);
      alert(`Error al generar vista previa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const enviarCorreoPorFactura = async (factura: Factura) => {
    const uuidActivo = (factura.uuid || '').trim();
    if (!uuidActivo) {
      alert('El UUID de la factura es inválido.');
      return;
    }
    await enviarCorreoDirectoConUuid(uuidActivo);
  };

  const cerrarModalCorreo = () => {
    setModalCorreo({
      isOpen: false,
      facturaUuid: '',
      facturaInfo: '',
      correoInicial: '',
      rfcReceptor: ''
    });
  };

  // Funciones de paginación
  const totalPaginas = Math.ceil(facturas.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const facturasPaginadas = facturas.slice(indiceInicio, indiceFin);

  console.log(`�� Paginación - Total facturas: ${facturas.length}, Página actual: ${paginaActual}, Elementos por página: ${elementosPorPagina}`);
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
  };

  const irAPrimeraPagina = () => {
    setPaginaActual(1);
  };

  const irAUltimaPagina = () => {
    setPaginaActual(totalPaginas);
  };

  const irAPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const irAPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  // Manejar selección de producto/servicio desde el modal
  const handleSeleccionarProducto = (producto: {
    id: number;
    claveProdServ: string;
    cantidad: number;
    unidad: string;
    descripcion: string;
    objetoImpuesto: string;
    valorUnitario: number;
    importe: number;
    tasaIVA: number;
  }) => {
    // Agregar el producto a la lista (permitir duplicados si el usuario lo desea)
    setProductosAgregados(prev => [...prev, { ...producto }]);
  };

  // Eliminar producto de la lista
  const handleEliminarProducto = (index: number) => {
    setProductosAgregados(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular totales
  const calcularTotales = () => {
    const subtotal = productosAgregados.reduce((sum, p) => sum + p.importe, 0);
    const iva = productosAgregados.reduce((sum, p) => {
      if (p.tasaIVA > 0) {
        return sum + (p.importe * p.tasaIVA / 100);
      }
      return sum;
    }, 0);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {formData.uuid && (
          <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
            Estado de timbrado: {timbradoStatus || 'Desconocido'}
          </div>
        )}
        <Card>
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
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <CheckboxField
                name="declaraIeps"
                label="Declaro IEPS **"
                checked={formData.declaraIeps}
                onChange={handleChange}
              />
            </div>

            {(tipoPersona === 'moral' || tipoPersona === null) && (
              <FormField name="razonSocial" label="Razón Social *" value={formData.razonSocial} onChange={handleChange} required={tipoPersona === 'moral'} />
            )}
            
            <FormField
              name="codigoPostal"
              label="Código Postal *"
              value={formData.codigoPostal}
              onChange={handleCodigoPostalChange}
              required
              maxLength={5}
            />
            {cargandoCP && (
              <div className="text-sm text-gray-500 flex items-center">Cargando datos...</div>
            )}
            
            <SelectField name="pais" label="País" value={formData.pais} onChange={handleChange} options={PAIS_OPTIONS} />
            <FormField name="estado" label="Estado" value={formData.estado} onChange={handleChange} />
            <FormField name="municipio" label="Municipio/Delegación" value={formData.municipio} onChange={handleChange} />
            <SelectField
              name="colonia"
              label="Colonia"
              value={formData.colonia}
              onChange={handleChange}
              options={colonias.map(c => ({ value: c, label: c }))}
              disabled={colonias.length === 0}
            />
            <FormField name="calle" label="Calle" value={formData.calle} onChange={handleChange} />
            <FormField
              name="numeroExterior"
              label="Número exterior"
              value={formData.numeroExterior}
              onChange={handleChange}
              placeholder="Ej: 123, MZ 5, LT 10"
            />
            <FormField
              name="numeroInterior"
              label="Número interior"
              value={formData.numeroInterior}
              onChange={handleChange}
              placeholder="Ej: EDIF A, DEP 101"
            />
            
            <SelectField name="regimenFiscal" label="Régimen Fiscal *" value={formData.regimenFiscal} onChange={handleChange} options={REGIMEN_FISCAL_OPTIONS} required />
            <SelectField name="usoCfdi" label="Uso CFDI *" value={formData.usoCfdi} onChange={handleChange} options={USO_CFDI_OPTIONS} required />
            
            <div className="text-xs text-gray-500 dark:text-gray-400 md:col-span-2 lg:col-span-3">
              Los campos marcados con: * son obligatorios, **Aplica sólo para vinos y licores.
            </div>
          </div>
        </Card>

        <Card title="Datos de Contacto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="nombre" label="Nombre" value={formData.nombre} onChange={handleChange} />
            <FormField name="paterno" label="Apellido Paterno" value={formData.paterno} onChange={handleChange} />
            <FormField name="materno" label="Apellido Materno" value={formData.materno} onChange={handleChange} />
            <FormField name="correoElectronico" label="Correo Electrónico *" type="email" value={formData.correoElectronico} onChange={handleChange} required />
            <FormField name="telefono" label="Teléfono para WhatsApp" value={formData.telefono} onChange={handleChange} />
          </div>
        </Card>

        {mostrarTabla && tickets.length > 1 && (
          <Card title="Tickets encontrados">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma Pago</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Factura</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((t) => (
                    <tr key={t.idTicket} className="cursor-pointer hover:bg-gray-50" onClick={() => { setTicketSeleccionado(t); rellenarFormularioConTicket(t); }}>
                      <td className="px-4 py-2">{t.codigoTienda}</td>
                      <td className="px-4 py-2">{new Date(t.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{t.terminalId ?? '-'}</td>
                      <td className="px-4 py-2">{t.folio}</td>
                      <td className="px-4 py-2">{t.subtotal?.toFixed(2)}</td>
                      <td className="px-4 py-2">{t.iva?.toFixed(2)}</td>
                      <td className="px-4 py-2">{t.total?.toFixed(2)}</td>
                      <td className="px-4 py-2">{t.formaPago ?? '-'}</td>
                      <td className="px-4 py-2">{t.nombreCliente ?? '-'}</td>
                      <td className="px-4 py-2">{t.rfcCliente ?? '-'}</td>
                      <td className="px-4 py-2">{t.status === 1 ? 'Activo' : 'Cancelado'}</td>
                      <td className="px-4 py-2">{t.idFactura ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card title="Detalle de la Factura">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modo de Captura
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="modoDetalle"
                  value="automatico"
                  checked={formData.modoDetalle === 'automatico'}
                  onChange={() => setFormData(prev => ({ ...prev, modoDetalle: 'automatico' }))}
                  className="mr-2"
                />
                Automático
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="modoDetalle"
                  value="manual"
                  checked={formData.modoDetalle === 'manual'}
                  onChange={() => setFormData(prev => ({ ...prev, modoDetalle: 'manual' }))}
                  className="mr-2"
                />
                Manual
              </label>
            </div>
          </div>

          {formData.modoDetalle === 'automatico' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4">
                <FormField
                  name="codigoFacturacion"
                  label="Código de Facturación o Prefactura"
                  value={formData.codigoFacturacion}
                  onChange={handleChange}
                  placeholder="Ingrese código de facturación o prefactura"
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleBuscarTicket}
                    variant="secondary"
                    disabled={cargandoTickets}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    {cargandoTickets ? 'Buscando…' : 'Buscar'}
                  </Button>
                </div>
              </div>
              {ticketSeleccionado && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ticket encontrado: Tienda {ticketSeleccionado.codigoTienda}, 
                    Folio {ticketSeleccionado.folio}, 
                    Total: ${ticketSeleccionado.total?.toFixed(2)}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Los botones de agregar y eliminar están bloqueados en modo automático.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Productos y Servicios
                </h4>
                <Button
                  type="button"
                  onClick={() => setMostrarModalProductos(true)}
                  variant="primary"
                  className="text-sm w-full sm:w-auto whitespace-nowrap"
                >
                  + Agregar Producto/Servicio
                </Button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Catálogo de artículos: nombre, descripción</p>
                <p>Acceso al catálogo de Clave de Producto o Servicio (Ej: Catálogo del SAT)</p>
              </div>
              
              {/* Tabla de productos agregados */}
              {productosAgregados.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Clave
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Unidad
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Valor Unitario
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            IVA
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Importe
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {productosAgregados.map((producto, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {producto.claveProdServ}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {producto.descripcion}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                              {producto.unidad}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                              {producto.cantidad.toFixed(6)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN'
                              }).format(producto.valorUnitario)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                              {producto.tasaIVA > 0 ? `${producto.tasaIVA}%` : 'Exento'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN'
                              }).format(producto.importe)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <Button
                                type="button"
                                onClick={() => handleEliminarProducto(index)}
                                variant="secondary"
                                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                Eliminar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700 font-semibold">
                        <tr>
                          <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            Subtotal:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(calcularTotales().subtotal)}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            IVA:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(calcularTotales().iva)}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            Total:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-lg text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(calcularTotales().total)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
              
              {productosAgregados.length === 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    No hay productos agregados. Haz clic en "Agregar Producto/Servicio" para comenzar.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {formData.modoDetalle === 'automatico' && ticketSeleccionado && (
          <Card title="Información del Ticket">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma Pago</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Factura</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2">{ticketSeleccionado?.codigoTienda ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado ? new Date(ticketSeleccionado.fecha).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.terminalId ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.folio ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.subtotal != null ? ticketSeleccionado!.subtotal!.toFixed(2) : '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.iva != null ? ticketSeleccionado!.iva!.toFixed(2) : '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.total != null ? ticketSeleccionado!.total!.toFixed(2) : '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.formaPago ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.nombreCliente ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.rfcCliente ?? '-'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.status === 1 ? 'Activo' : 'Cancelado'}</td>
                    <td className="px-4 py-2">{ticketSeleccionado?.idFactura ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card title="Forma de Pago">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField name="medioPago" label="Medio de pago" value={formData.medioPago} onChange={handleChange} options={MEDIO_PAGO_OPTIONS} />
            <SelectField name="formaPago" label="Forma de pago" value={formData.formaPago} onChange={handleChange} options={FORMA_PAGO_OPTIONS} />
          </div>
          <div className="mt-4">
            <CheckboxField
              name="iepsDesglosado"
              label="IEPS desglosado"
              checked={formData.iepsDesglosado}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card title="Relación con CFDI (refactura)">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Si esta factura refactura a otra, captura el UUID del CFDI original y el tipo de relación.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="uuidCfdiRelacionado"
                label="UUID del CFDI a refacturar"
                value={formData.uuidCfdiRelacionado}
                onChange={handleChange}
                placeholder="Ej: A055BE36-AA6D-5F3C-99FE-6A8AD176AD16"
              />
              <SelectField
                name="tipoRelacion"
                label="Tipo de relación"
                value={formData.tipoRelacion}
                onChange={handleChange}
                options={MOTIVO_REFACTURA_OPTIONS}
              />
            </div>
            {formData.uuidCfdiRelacionado && !formData.tipoRelacion && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                Si capturaste un UUID de CFDI relacionado, debes seleccionar el tipo de relación.
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-8">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              type="button" 
              onClick={handleCancel} 
              variant="neutral"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              type="button" 
              onClick={descargarXmlActual} 
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Descargar XML
            </Button>
            <Button 
              type="button" 
              onClick={descargarPdfActual} 
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Descargar PDF
            </Button>
            <Button 
              type="button" 
              onClick={enviarCorreoActual} 
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Enviar por Correo
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              type="button" 
              onClick={handleVistaPrevia}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Vista Previa
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              className="w-full sm:w-auto"
            >
              Generar
            </Button>
          </div>
        </div>
      </form>

      {/* Tabla de Facturas Guardadas - OCULTA */}
      {false && (
      <Card title="Facturas Guardadas en Base de Datos" className="mt-6">
        <div className="mb-4">
          <Button 
            onClick={cargarFacturas} 
            disabled={cargandoFacturas}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            {cargandoFacturas ? 'Consultando...' : 'Consultar Facturas'}
          </Button>
        </div>

        {cargandoFacturas ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Consultando facturas en base de datos...</p>
            <p className="text-sm text-gray-500 mt-1">Esto puede tomar unos segundos</p>
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No se encontraron facturas</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No hay facturas guardadas en la base de datos.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Verifica que existan facturas en la base de datos configurada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Código Fact.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Fact.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Terminal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Boleta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    RFC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Medio Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Forma Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descargar XML
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enviar Correo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {facturasPaginadas.map((factura) => (
                  <tr key={factura.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {factura.codigoFacturacion}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.tienda}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.fechaFactura}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.terminal}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.boleta}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.razonSocial}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.rfc}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 font-semibold">
                      {formatearMoneda(factura.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorEstado(factura.estado)}`}>
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.medioPago}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {factura.formaPago}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        onClick={() => descargarXml(factura.uuid, factura.codigoFacturacion)}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Descargar XML
                      </Button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        onClick={() => descargarPdf(factura.uuid)}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Descargar PDF
                      </Button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        onClick={() => enviarCorreoPorFactura(factura)}
                        variant="primary"
                        className="text-xs px-2 py-1"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Enviar Correo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Controles de Paginación */}
        {facturas.length > 0 && totalPaginas > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <span>
                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, facturas.length)} de {facturas.length} facturas
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botón Primera Página */}
              <Button
                onClick={irAPrimeraPagina}
                disabled={paginaActual === 1}
                variant="secondary"
                className="px-3 py-1 text-xs"
              >
                Primera
              </Button>
              
              {/* Botón Página Anterior */}
              <Button
                onClick={irAPaginaAnterior}
                disabled={paginaActual === 1}
                variant="secondary"
                className="px-3 py-1 text-xs"
              >
                Anterior
              </Button>
              
              {/* Números de Página */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let numeroPagina;
                  if (totalPaginas <= 5) {
                    numeroPagina = i + 1;
                  } else if (paginaActual <= 3) {
                    numeroPagina = i + 1;
                  } else if (paginaActual >= totalPaginas - 2) {
                    numeroPagina = totalPaginas - 4 + i;
                  } else {
                    numeroPagina = paginaActual - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={numeroPagina}
                      onClick={() => cambiarPagina(numeroPagina)}
                      variant={paginaActual === numeroPagina ? "primary" : "secondary"}
                      className="px-3 py-1 text-xs min-w-[2rem]"
                    >
                      {numeroPagina}
                    </Button>
                  );
                })}
              </div>
              
              {/* Botón Página Siguiente */}
              <Button
                onClick={irAPaginaSiguiente}
                disabled={paginaActual === totalPaginas}
                variant="secondary"
                className="px-3 py-1 text-xs"
              >
                Siguiente
              </Button>
              
              {/* Botón Última Página */}
              <Button
                onClick={irAUltimaPagina}
                disabled={paginaActual === totalPaginas}
                variant="secondary"
                className="px-3 py-1 text-xs"
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </Card>
      )}

      {/* Modal de Envío de Correo */}
      <EnviarCorreoModal
        isOpen={modalCorreo.isOpen}
        onClose={cerrarModalCorreo}
        facturaUuid={modalCorreo.facturaUuid}
        facturaInfo={modalCorreo.facturaInfo}
        correoInicial={modalCorreo.correoInicial}
        rfcReceptor={modalCorreo.rfcReceptor}
      />

      {/* Modal de Alta de Cliente */}
      <AltaClienteModal
        isOpen={mostrarAltaCliente}
        onClose={() => setMostrarAltaCliente(false)}
        onSave={handleGuardarCliente}
        rfcInicial={formData.rfc}
      />

      {/* Modal de Selección de Productos/Servicios */}
      <SeleccionarProductoServicioModal
        isOpen={mostrarModalProductos}
        onClose={() => setMostrarModalProductos(false)}
        onSelect={handleSeleccionarProducto}
      />
    </div>
  );
};

// Dentro de handleSubmit, reemplazar envío automático por la confirmación
// ... existing code ...
