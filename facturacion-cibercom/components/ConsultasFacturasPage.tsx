import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { ALMACEN_OPTIONS, MOTIVO_SUSTITUCION_OPTIONS, TIENDA_OPTIONS } from '../constants';
import { facturaService } from '../services/facturaService';
import { apiUrl, creditNotesUrl, pacUrl } from '../services/api';
import { ticketService } from '../services/ticketService';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';

interface ConsultaFacturasFormData {
  rfcReceptor: string;
  nombreCliente: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  razonSocial: string;
  almacen: string;
  usuario: string;
  serie: string;
  folio: string;
  uuid: string;
  fechaInicio: string;
  fechaFin: string;
  tienda: string;
  te: string;
  tr: string;
  fechaTienda: string;
  codigoFacturacion: string;
  motivoSustitucion: string;
}

interface Factura {
  uuid: string;
  rfcEmisor: string;
  rfcReceptor: string;
  serie: string;
  folio: string;
  fechaEmision: string;
  importe: number;
  estatusFacturacion: string;
  estatusSat: string;
  tienda: string;
  almacen: string;
  usuario: string;
  permiteCancelacion: boolean;
  motivoNoCancelacion?: string;
  tipoFactura?: number | string;
}

interface ConsultaFacturaResponse {
  exitoso: boolean;
  mensaje: string;
  timestamp: string;
  facturas: Factura[];
  totalFacturas: number;
  error?: string;
}

const initialFormData: ConsultaFacturasFormData = {
  rfcReceptor: '',
  nombreCliente: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  razonSocial: '',
  almacen: ALMACEN_OPTIONS[ALMACEN_OPTIONS.length-1]?.value || '',
  usuario: '',
  serie: '',
  folio: '',
  uuid: '',
  fechaInicio: '',
  fechaFin: '',
  tienda: TIENDA_OPTIONS[0]?.value || '',
  te: '',
  tr: '',
  fechaTienda: '',
  codigoFacturacion: '',
  motivoSustitucion: MOTIVO_SUSTITUCION_OPTIONS[0]?.value || '',
};

export const ConsultasFacturasPage: React.FC = () => {
  const [formData, setFormData] = useState<ConsultaFacturasFormData>(initialFormData);
  const [resultados, setResultados] = useState<Factura[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfilUsuario] = useState<string>('OPERADOR');
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<Set<string>>(new Set());
  const [descargandoPDF, setDescargandoPDF] = useState<string | null>(null);
  const [descargandoZIP, setDescargandoZIP] = useState(false);
  const [descargandoXML, setDescargandoXML] = useState<string | null>(null);
  const [relacionesPorUuid, setRelacionesPorUuid] = useState<Record<string, {
    tickets: number;
    detalles: number;
    cartaPorte: boolean;
    notasCredito: number;
    loading?: boolean;
    error?: string;
  }>>({});
  
  // Limpiar el intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Estado del modal de cancelación
  const [cancelModal, setCancelModal] = useState<{ open: boolean; uuid: string | null; motivo: string; loading: boolean; error?: string; uuidSustituto?: string }>(
    { open: false, uuid: null, motivo: '02', loading: false, uuidSustituto: '' }
  );

  // Funciones para manejar selección de facturas
  const toggleSeleccionFactura = (uuid: string) => {
    const nuevasSeleccionadas = new Set(facturasSeleccionadas);
    if (nuevasSeleccionadas.has(uuid)) {
      nuevasSeleccionadas.delete(uuid);
    } else {
      nuevasSeleccionadas.add(uuid);
    }
    setFacturasSeleccionadas(nuevasSeleccionadas);
  };

  const seleccionarTodasFacturas = () => {
    if (facturasSeleccionadas.size === resultados.length) {
      setFacturasSeleccionadas(new Set());
    } else {
      setFacturasSeleccionadas(new Set(resultados.map(f => f.uuid)));
    }
  };

  // Funciones para descargas
  const descargarPDFFactura = async (uuid: string) => {
    try {
      setDescargandoPDF(uuid);
      await facturaService.generarYDescargarPDF(uuid);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert(`Error al descargar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDescargandoPDF(null);
    }
  };

  const descargarZIPFactura = async (uuid: string) => {
    try {
      setDescargandoPDF(uuid);
      await facturaService.generarYDescargarZIP(uuid);
    } catch (error) {
      console.error('Error descargando ZIP:', error);
      alert(`Error al descargar ZIP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDescargandoPDF(null);
    }
  };

  const descargarXMLFactura = async (uuid: string) => {
    try {
      setDescargandoXML(uuid);
      await facturaService.generarYDescargarXML(uuid);
    } catch (error) {
      console.error('Error descargando XML:', error);
      alert(`Error al descargar XML: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDescargandoXML(null);
    }
  };

  const descargarZIPSeleccionadas = async () => {
    if (facturasSeleccionadas.size === 0) {
      alert('Por favor selecciona al menos una factura');
      return;
    }

    try {
      setDescargandoZIP(true);
      const uuidsSeleccionados = Array.from(facturasSeleccionadas);
      await facturaService.generarYDescargarZIPMultiple(uuidsSeleccionados);
    } catch (error) {
      console.error('Error descargando ZIP múltiple:', error);
      alert(`Error al descargar ZIP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDescargandoZIP(false);
    }
  };

  const openCancelModal = (factura: Factura) => {
    setCancelModal({ open: true, uuid: factura.uuid, motivo: '02', loading: false, uuidSustituto: '' });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, uuid: null, motivo: '02', loading: false });
    // Iniciar el refresh automático después de cerrar el modal
    startAutoRefresh();
  };
  
  // Función para refrescar los datos de facturas (UUID únicamente)
  const refreshFacturas = async () => {
    if (!mostrarResultados || !formData) return;
    
    setActualizando(true);
    try {
      const requestData = {
        uuid: formData.uuid.trim(),
        perfilUsuario: perfilUsuario,
      };

      const response = await fetch(apiUrl('/consulta-facturas/buscar'), {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(requestData)
      });

      const data: ConsultaFacturaResponse = await response.json();
      if (data.exitoso) {
        // Log de diagnóstico: verificar las claves reales que llegan del backend
        try {
          const first = (data.facturas || [])[0];
          if (first) {
            // Evitar logs ruidosos si ya se registró antes
            console.debug('[ConsultaFacturas] refreshFacturas primer registro:', first);
            console.debug('[ConsultaFacturas] claves recibidas:', Object.keys(first || {}));
          }
        } catch {}
        setResultados(data.facturas || []);
      }
    } catch (err) {
      console.error('Error al refrescar facturas:', err);
    } finally {
      setActualizando(false);
    }
  };
  
  // Iniciar el intervalo de actualización automática
  const startAutoRefresh = () => {
    // Limpiar cualquier intervalo existente
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Crear un nuevo intervalo que refresca cada 5 segundos
    const interval = setInterval(refreshFacturas, 5000);
    setRefreshInterval(interval);
    
    // Detener el intervalo después de 30 segundos (6 actualizaciones)
    setTimeout(() => {
      clearInterval(interval);
      setRefreshInterval(null);
    }, 30000);
  };

  const consultarEstatusPac = async (uuid: string): Promise<string | null> => {
    try {
      const resp = await fetch(pacUrl(`/pac/status/${uuid}`));
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.status || null;
    } catch {
      return null;
    }
  };

  const iniciarPollingPac = (uuid: string) => {
    const interval = setInterval(async () => {
      const status = await consultarEstatusPac(uuid);
      if (!status || status === 'EN_PROCESO') return;
      // Resuelto
      setResultados(prev => prev.map(f => {
        if (f.uuid !== uuid) return f;
        if (status === 'CANCELADA') {
          return { ...f, estatusFacturacion: '2', estatusSat: 'Cancelada', permiteCancelacion: false };
        }
        // RECHAZADA u otro
        return { ...f, estatusFacturacion: f.estatusFacturacion, estatusSat: f.estatusSat, permiteCancelacion: true };
      }));
      clearInterval(interval);
    }, 3000);
  };

  // Carga relaciones para una factura específica
  const cargarRelacionesParaFactura = async (factura: Factura) => {
    const uuid = factura.uuid;
    // Marcar loading
    setRelacionesPorUuid(prev => ({
      ...prev,
      [uuid]: { ...(prev[uuid] || { tickets: 0, detalles: 0, cartaPorte: false, notasCredito: 0 }), loading: true, error: undefined },
    }));

    try {
      // 1) Notas de crédito relacionadas por UUID origen
      let notasCredito = 0;
      try {
        const resp = await fetch(creditNotesUrl(`/search?uuidFacturaOrigen=${encodeURIComponent(uuid)}`));
        const data = await resp.json().catch(() => null);
        if (resp.ok) {
          const lista = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.resultados) ? data.resultados : []));
          notasCredito = Array.isArray(lista) ? lista.length : 0;
        } else {
          // Fallback con otro nombre de parámetro si el primero no está soportado
          const resp2 = await fetch(creditNotesUrl(`/search?uuidFactura=${encodeURIComponent(uuid)}`));
          const data2 = await resp2.json().catch(() => null);
          const lista2 = Array.isArray(data2) ? data2 : (Array.isArray(data2?.data) ? data2.data : (Array.isArray(data2?.resultados) ? data2.resultados : []));
          notasCredito = Array.isArray(lista2) ? lista2.length : 0;
        }
      } catch (_) {
        notasCredito = 0;
      }

      // 2) Tickets y Detalles: preferir búsqueda por ID_FACTURA (resuelto por UUID)
      let tickets = 0;
      let detalles = 0;
      try {
        // Intentar resolver ID_FACTURA por UUID
        let idFactura: number | undefined = undefined;
        try {
          const idResp = await fetch(apiUrl(`/factura/id-factura/${encodeURIComponent(uuid)}`));
          const idData = await idResp.json().catch(() => null);
          const idVal = idData?.idFactura ?? idData?.data?.idFactura;
          const parsedId = parseInt(String(idVal), 10);
          if (!isNaN(parsedId) && parsedId > 0) idFactura = parsedId;
        } catch { /* noop */ }

        if (idFactura && idFactura > 0) {
          const encontrados = await ticketService.buscarTicketsPorIdFactura(idFactura);
          tickets = Array.isArray(encontrados) ? encontrados.length : 0;
          const detallesArr = await ticketService.buscarDetallesPorIdFactura(idFactura);
          detalles = Array.isArray(detallesArr) ? detallesArr.length : 0;
        } else {
          // Fallback: columnas Oracle (tienda/terminal/boleta) para buscar tickets
          const colResp = await fetch(apiUrl(`/factura/oracle/columns/${encodeURIComponent(uuid)}`));
          const colData = await colResp.json().catch(() => null);
          let codigoTienda: string | undefined = colData?.tienda || colData?.tiendaOrigen || factura.tienda;
          let terminalId: number | undefined = undefined;
          let folio: number | undefined = undefined;
          // Terminal puede venir como string o número
          const t = colData?.terminal || colData?.terminalBol || colData?.tr || colData?.terminalId;
          if (t !== undefined && t !== null) {
            const parsed = parseInt(String(t), 10);
            terminalId = isNaN(parsed) ? undefined : parsed;
          }
          const b = colData?.boleta || colData?.boletaBol || colData?.folio || factura.folio;
          if (b !== undefined && b !== null) {
            const parsedB = parseInt(String(b), 10);
            folio = isNaN(parsedB) ? undefined : parsedB;
          }

          const fecha = (() => {
            try {
              return new Date(factura.fechaEmision).toISOString().split('T')[0];
            } catch { return undefined; }
          })();

          const encontrados = await ticketService.buscarTickets({ codigoTienda, terminalId, folio, fecha });
          tickets = Array.isArray(encontrados) ? encontrados.length : 0;

          // Para evitar demasiadas llamadas, contamos detalles de hasta 3 tickets
          const maxDetallesTickets = (encontrados || []).slice(0, 3);
          for (const tk of maxDetallesTickets) {
            if (!tk?.idTicket) continue;
            try {
              const detResp = await fetch(apiUrl(`/tickets/${encodeURIComponent(String(tk.idTicket))}/detalles`));
              const detData = await detResp.json().catch(() => null);
              const arr = Array.isArray(detData) ? detData : (Array.isArray(detData?.data) ? detData.data : (Array.isArray(detData?.detalles) ? detData.detalles : []));
              detalles += Array.isArray(arr) ? arr.length : 0;
            } catch (_) {
              // Ignorar errores por ticket individual
            }
          }
        }
      } catch (_) {
        tickets = 0; detalles = 0;
      }

      // 3) Carta Porte: detectar por TIPO_FACTURA o complementos en XML del CFDI
      let cartaPorte = false;
      // Primero verificar si TIPO_FACTURA es 3 o "T" (Carta Porte)
      const tipoFactura = factura.tipoFactura;
      if (tipoFactura !== undefined && tipoFactura !== null) {
        const tipoStr = String(tipoFactura).trim().toUpperCase();
        cartaPorte = tipoStr === '3' || tipoStr === 'T';
      }
      
      // Si no se detectó por tipo, buscar en XML
      if (!cartaPorte) {
        try {
          const datosFactura = await facturaService.obtenerFacturaPorUUID(uuid);
          const xml = datosFactura?.xmlContent || '';
          if (xml && typeof xml === 'string') {
            const hasCp = /CartaPorte/i.test(xml) || /cartaporte/i.test(xml) || /cce20:ComplementoCartaPorte/i.test(xml);
            cartaPorte = !!hasCp;
          } else {
            // Si no hay xml en backend principal, intentar PAC
            const cfdi = await facturaService.consultarCfdiPorUUID({ uuid, tipo: 'I' });
            // No expone XML, pero si basicos/relacionados. Como heurística: si tipoRelacion indica CP o existen uuids relacionados de tipo transporte
            const tipoRel = (cfdi?.relacionados?.tipoRelacion || '').toUpperCase();
            cartaPorte = tipoRel.includes('CARTA') || tipoRel.includes('CP');
          }
        } catch (_) {
          cartaPorte = false;
        }
      }

      setRelacionesPorUuid(prev => ({
        ...prev,
        [uuid]: { tickets, detalles, cartaPorte, notasCredito, loading: false }
      }));
    } catch (err) {
      setRelacionesPorUuid(prev => ({
        ...prev,
        [uuid]: { ...(prev[uuid] || { tickets: 0, detalles: 0, cartaPorte: false, notasCredito: 0 }), loading: false, error: 'Error cargando relaciones' }
      }));
    }
  };

  // Disparar carga de relaciones cada vez que cambian los resultados
  useEffect(() => {
    if (!mostrarResultados || resultados.length === 0) return;
    const uuidsPendientes = resultados.map(f => f.uuid).filter(uuid => !relacionesPorUuid[uuid] || relacionesPorUuid[uuid].loading === undefined);
    uuidsPendientes.forEach(uuid => {
      const f = resultados.find(x => x.uuid === uuid);
      if (f) cargarRelacionesParaFactura(f);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultados, mostrarResultados]);

  const submitCancel = async () => {
    if (!cancelModal.uuid) return;
    try {
      setCancelModal(prev => ({ ...prev, loading: true, error: undefined }));
      if (cancelModal.motivo === '01' && !(cancelModal.uuidSustituto || '').trim()) {
        setCancelModal(prev => ({ ...prev, error: 'Motivo 01 requiere UUID sustituto', loading: false }));
        return;
      }
      const payload: any = {
        uuid: cancelModal.uuid,
        motivo: cancelModal.motivo,
        usuario: formData.usuario || 'operador',
        perfilUsuario,
      };
      if (cancelModal.motivo === '01') {
        payload.uuidSustituto = (cancelModal.uuidSustituto || '').trim();
      }
      const resp = await fetch(apiUrl('/consulta-facturas/cancelar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.exitoso) {
        // Consultar estado en PAC para decidir si es inmediata o en proceso
        const uuid = cancelModal.uuid;
        const status = await consultarEstatusPac(uuid);
        if (status === 'CANCELADA') {
          setResultados(prev => prev.map(f =>
            f.uuid === uuid
              ? { ...f, estatusFacturacion: 'Cancelada', estatusSat: 'Cancelada', permiteCancelacion: false }
              : f
          ));
          closeCancelModal();
        } else {
          // EN_PROCESO o desconocido: marcar en proceso y comenzar polling
          // Marcar estado en proceso usando código/descripcion coherentes
          setResultados(prev => prev.map(f =>
            f.uuid === uuid
              ? { ...f, estatusFacturacion: '1', estatusSat: 'En proceso de cancelación', permiteCancelacion: false }
              : f
          ));
          closeCancelModal();
          iniciarPollingPac(uuid);
        }
      } else {
        setCancelModal(prev => ({ ...prev, error: data.mensaje || 'No se pudo cancelar', loading: false }));
      }
    } catch (e) {
      console.error('Error al cancelar:', e);
      setCancelModal(prev => ({ ...prev, error: 'Error de conexión al cancelar', loading: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };
  
  const validarFormulario = (): { valido: boolean; mensaje?: string } => {
    if (!formData.uuid.trim()) {
      return { valido: false, mensaje: "Ingrese un UUID para realizar la consulta" };
    }
    return { valido: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validacion = validarFormulario();
    if (!validacion.valido) { setError(validacion.mensaje || 'Error de validación'); return; }

    setCargando(true);
    setError(null);

    try {
      const requestData = {
        uuid: formData.uuid.trim(),
        perfilUsuario: perfilUsuario,
      };

      const response = await fetch(apiUrl('/consulta-facturas/buscar'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData)
      });

      const data: ConsultaFacturaResponse = await response.json();
      if (data.exitoso) {
        // Log de diagnóstico: verificar las claves reales que llegan del backend
        try {
          const first = (data.facturas || [])[0];
          if (first) {
            console.debug('[ConsultaFacturas] handleSubmit primer registro:', first);
            console.debug('[ConsultaFacturas] claves recibidas:', Object.keys(first || {}));
          }
        } catch {}
        setResultados(data.facturas || []);
        setMostrarResultados(true);
        setError(null);
      } else {
        setError(data.mensaje || 'Error en la consulta');
        setResultados([]);
        setMostrarResultados(false);
      }
    } catch (err) {
      console.error('Error al consultar facturas:', err);
      setError('Error de conexión con el servidor');
      setResultados([]);
      setMostrarResultados(false);
    } finally {
      setCargando(false);
    }
  };

  const formatearMoneda = (valor: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

  const formatearFecha = (fecha: string) => {
    try { return new Date(fecha).toLocaleDateString('es-MX'); } catch { return fecha; }
  };

  // Catálogo de estados de factura (mapea código -> descripción)
  const ESTADO_FACTURA_CATALOGO: Record<string, string> = {
    '66': 'POR TIMBRAR',
    '0': 'EMITIDA',
    '1': 'EN PROCESO DE CANCELACION',
    '2': 'CANCELADA EN SAT',
    '3': 'DE PASO',
    '4': 'EN PROCESO DE EMISION',
    '99': 'FACTURA TEMPORAL',
    '67': 'EN ESPERA DE CANCELACION BOLETA QUE SUSTITUYE',
  };

  // Normaliza strings (quita espacios extra y pone mayúsculas uniformes para comparación)
  const normalize = (s?: string) => (s || '').toString().trim();

  // Normalizador de descripciones: quita acentos, une espacios y estandariza
  const normalizeDesc = (s?: string) => {
    const raw = (s || '').toString().trim().toUpperCase();
    // Reemplazar acentos comunes y separadores
    const sinAcentos = raw
      .replace(/[ÁÀÂÄ]/g, 'A')
      .replace(/[ÉÈÊË]/g, 'E')
      .replace(/[ÍÌÎÏ]/g, 'I')
      .replace(/[ÓÒÔÖ]/g, 'O')
      .replace(/[ÚÙÛÜ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return sinAcentos;
  };

  // Construye "código - descripción" para estatus de facturación
  const formatFacturaEstatus = (estatusFacturacion?: string, fallbackDesc?: string) => {
    const raw = normalize(estatusFacturacion);
    const descFallback = normalize(fallbackDesc);

    // 1) Si viene código exacto conocido
    if (raw && ESTADO_FACTURA_CATALOGO[raw]) {
      return `${raw} - ${ESTADO_FACTURA_CATALOGO[raw]}`;
    }

    // 2) Si viene código con formatos raros (ej. "4.0", "04", " 4 ")
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (digitsOnly && ESTADO_FACTURA_CATALOGO[digitsOnly]) {
      return `${digitsOnly} - ${ESTADO_FACTURA_CATALOGO[digitsOnly]}`;
    }

    // 3) Si viene descripción, intentar mapear variantes comunes
    const descNorm = normalizeDesc(raw);
    const descMap: Record<string, string> = {
      'POR TIMBRAR': '66',
      'EMITIDA': '0',
      'ACTIVA': '0',
      'VIGENTE': '0',
      'EN PROCESO DE CANCELACION': '1',
      'CANCELADA EN SAT': '2',
      'DE PASO': '3',
      'EN PROCESO DE EMISION': '4',
      'EN PROCESO EMISION': '4',
      'FACTURA TEMPORAL': '99',
      'EN ESPERA DE CANCELACION BOLETA QUE SUSTITUYE': '67',
    };
    const mappedCode = descMap[descNorm];
    if (mappedCode && ESTADO_FACTURA_CATALOGO[mappedCode]) {
      return `${mappedCode} - ${ESTADO_FACTURA_CATALOGO[mappedCode]}`;
    }

    // 4) Intento inverso estricto contra catálogo (por si ya viene igual)
    const strictEntry = Object.entries(ESTADO_FACTURA_CATALOGO)
      .find(([, d]) => normalizeDesc(d) === descNorm);
    if (strictEntry) {
      const [code, desc] = strictEntry;
      return `${code} - ${desc}`;
    }

    // 5) Último recurso: combinar raw con fallback (por ejemplo, SAT trae la descripción)
    if (raw && descFallback) return `${raw} - ${descFallback}`;
    return raw || descFallback || '-';
  };

  // Determina si la factura debería permitir cancelación desde UI
  const permiteCancelarUI = (f: Factura) => {
    // Si backend ya lo permite, respetar
    if (f.permiteCancelacion) return true;

    // Normalizaciones para comparar distintas variantes
    const efRaw = normalize(f.estatusFacturacion);
    const esRaw = normalize(f.estatusSat);
    const efNorm = normalizeDesc(efRaw);
    const esNorm = normalizeDesc(esRaw);
    const efDigits = efRaw.replace(/[^0-9]/g, '');
    const esDigits = esRaw.replace(/[^0-9]/g, '');

    const contienePermitidos = (s: string) => {
      const n = normalizeDesc(s);
      return ['EMITIDA', 'ACTIVA', 'VIGENTE'].some(t => n.includes(t));
    };

    const efPermite = contienePermitidos(efNorm) || efDigits === '0';
    const esPermite = contienePermitidos(esNorm) || esDigits === '0';

    // No permitir si está en proceso de cancelación ya
    const enProcesoCancel = efNorm.includes('EN PROCESO DE CANCELACION') || esNorm.includes('EN PROCESO DE CANCELACION');
    if (enProcesoCancel) return false;

    // Permitir si ambos estatus indican emitida/activa/vigente
    return efPermite && esPermite;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">--Ingresa los datos para consulta (por grupo):--</h3>
        {error && (<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          <FormField label="RFC Receptor:" name="rfcReceptor" value={formData.rfcReceptor} onChange={handleChange} />
          <FormField label="Nombre del Cliente:" name="nombreCliente" value={formData.nombreCliente} onChange={handleChange} />
          <FormField label="Apellido Paterno:" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} />
          <FormField label="Apellido Materno:" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} />
          <FormField label="Razón Social:" name="razonSocial" value={formData.razonSocial} onChange={handleChange} />
          <SelectField label="Almacén:" name="almacen" value={formData.almacen} onChange={handleChange} options={ALMACEN_OPTIONS} />
          <FormField label="Usuario:" name="usuario" value={formData.usuario} onChange={handleChange} />
          <FormField label="Serie:" name="serie" value={formData.serie} onChange={handleChange} />
          <FormField label="Folio:" name="folio" value={formData.folio} onChange={handleChange} />
          <FormField label="UUID:" name="uuid" value={formData.uuid} onChange={handleChange} />
          <FormField label="Fecha Inicio:" name="fechaInicio" type="date" value={formData.fechaInicio} onChange={handleChange} />
          <FormField label="Fecha Fin:" name="fechaFin" type="date" value={formData.fechaFin} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-2 mt-4 items-end">
          <SelectField label="Tienda:" name="tienda" value={formData.tienda} onChange={handleChange} options={TIENDA_OPTIONS} className="lg:col-span-1"/>
          <FormField label="TE:" name="te" value={formData.te} onChange={handleChange} className="lg:col-span-1"/>
          <FormField label="TR:" name="tr" value={formData.tr} onChange={handleChange} className="lg:col-span-1"/>
          <FormField label="Fecha:" name="fechaTienda" type="date" value={formData.fechaTienda} onChange={handleChange} className="lg:col-span-1"/>
          <FormField label="Código de facturación:" name="codigoFacturacion" value={formData.codigoFacturacion} onChange={handleChange} className="lg:col-span-1"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-4">
          <SelectField label="Motivo Sustitución:" name="motivoSustitucion" value={formData.motivoSustitucion} onChange={handleChange} options={MOTIVO_SUSTITUCION_OPTIONS} />
        </div>
        <div className="mt-6 flex justify-start">
          <Button type="submit" variant="primary" disabled={cargando}>{cargando ? 'Buscando...' : 'Buscar'}</Button>
        </div>
      </Card>

      {!mostrarResultados ? (
        <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">Los resultados de la búsqueda de facturas aparecerán aquí.</div>
      ) : (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Resultados de la búsqueda</h3>
          {resultados.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No se encontraron facturas que coincidan con los criterios de búsqueda.</div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="primary" 
                    onClick={descargarZIPSeleccionadas}
                    disabled={facturasSeleccionadas.size === 0 || descargandoZIP}
                    className="flex items-center space-x-2"
                  >
                    {descargandoZIP ? (
                      <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    <span>{descargandoZIP ? 'Generando...' : `Descargar ZIP (${facturasSeleccionadas.size})`}</span>
                  </Button>
                  {facturasSeleccionadas.size > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {facturasSeleccionadas.size} factura(s) seleccionada(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        <input
                          type="checkbox"
                          checked={resultados.length > 0 && facturasSeleccionadas.size === resultados.length}
                          onChange={seleccionarTodasFacturas}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">UUID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">RFC Emisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">RFC Receptor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Serie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Folio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Emisión</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Importe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus Facturación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus SAT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tienda</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Almacén</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tickets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Detalles</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Carta Porte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Notas Crédito</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {resultados.map((factura, index) => (
                      <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        facturasSeleccionadas.has(factura.uuid) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={facturasSeleccionadas.has(factura.uuid)}
                            onChange={() => toggleSeleccionFactura(factura.uuid)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={factura.uuid}>{factura.uuid}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.rfcEmisor}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.rfcReceptor}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.serie}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.folio}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearFecha(factura.fechaEmision)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(factura.importe)}</td>
                        {/* Estatus Facturación: mostrar "código - descripción" y soportar claves alternativas */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {(() => {
                            // Soportar posibles claves en distintas convenciones (camelCase y MAYÚSCULAS)
                            const f: any = factura as any;
                            const estatusValue: string = (
                              f?.estatusFacturacion ??
                              f?.estatusFactura ??
                              f?.estado ??
                              f?.ESTATUS_FACTURACION ??
                              f?.ESTATUS_FACTURA ??
                              f?.ESTADO ??
                              ''
                            );
                            const satValue: string = f?.estatusSat ?? f?.ESTATUS_SAT ?? f?.STATUS_SAT ?? '';
                            return formatFacturaEstatus(estatusValue, satValue);
                          })()}
                        </td>
                        {/* Estatus SAT: mostrar descripción tal cual */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {normalize(factura.estatusSat) || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.tienda}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{factura.almacen}</td>
                        {/* Tickets */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {relacionesPorUuid[factura.uuid]?.loading ? (
                            <span className="inline-flex items-center text-blue-600"><span className="mr-1 h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"/>Cargando</span>
                          ) : (
                            relacionesPorUuid[factura.uuid]?.tickets ?? '-'
                          )}
                        </td>
                        {/* Detalles */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {relacionesPorUuid[factura.uuid]?.loading ? (
                            <span className="inline-flex items-center text-blue-600"><span className="mr-1 h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"/>Cargando</span>
                          ) : (
                            relacionesPorUuid[factura.uuid]?.detalles ?? '-'
                          )}
                        </td>
                        {/* Carta Porte */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {relacionesPorUuid[factura.uuid]?.loading ? (
                            <span className="inline-flex items-center text-blue-600"><span className="mr-1 h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"/>Cargando</span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${relacionesPorUuid[factura.uuid]?.cartaPorte ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                              {relacionesPorUuid[factura.uuid]?.cartaPorte ? 'Sí' : 'No'}
                            </span>
                          )}
                        </td>
                        {/* Notas de crédito */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {relacionesPorUuid[factura.uuid]?.loading ? (
                            <span className="inline-flex items-center text-blue-600"><span className="mr-1 h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"/>Cargando</span>
                          ) : (
                            relacionesPorUuid[factura.uuid]?.notasCredito ?? '-'
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <div className="flex items-center space-x-2">
                            {/* Botón PDF */}
                            <button
                              onClick={() => descargarPDFFactura(factura.uuid)}
                              disabled={descargandoPDF === factura.uuid}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                              title="Descargar PDF"
                            >
                              {descargandoPDF === factura.uuid ? (
                                <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                              ) : (
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              )}
                            </button>
                            
                            {/* Botón ZIP */}
                            <button
                              onClick={() => descargarZIPFactura(factura.uuid)}
                              disabled={descargandoPDF === factura.uuid}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                              title="Descargar ZIP (XML + PDF)"
                            >
                              {descargandoPDF === factura.uuid ? (
                                <div className="h-4 w-4 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                              ) : (
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              )}
                            </button>
                            
                            {/* Botón XML */}
                            <button
                              onClick={() => descargarXMLFactura(factura.uuid)}
                              disabled={descargandoXML === factura.uuid}
                              className="p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                              title="Descargar XML"
                            >
                              {descargandoXML === factura.uuid ? (
                                <div className="h-4 w-4 rounded-full border-2 border-orange-600 border-t-transparent animate-spin" />
                              ) : (
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              )}
                            </button>
                            
                            {/* Botón Cancelar */}
                            {permiteCancelarUI(factura) ? (
                              <Button variant="secondary" size="sm" onClick={() => openCancelModal(factura)}>Cancelar</Button>
                            ) : (
                              <span className="text-xs text-gray-500 cursor-help" title={factura.motivoNoCancelacion || 'No permite cancelación'}>No cancelable</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Mostrando {resultados.length} facturas</div>
                {actualizando && (
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                    <div className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    Actualizando datos...
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Confirmar cancelación</h3>
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div><span className="font-medium">UUID:</span> {cancelModal.uuid}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 dark:text-gray-100"
                  value={cancelModal.motivo}
                  onChange={(e) => setCancelModal(prev => ({ ...prev, motivo: e.target.value }))}
                >
                  <option value="01">01 - Comprobante emitido con errores con relación</option>
                  <option value="02">02 - Comprobante emitido con errores sin relación</option>
                  <option value="03">03 - No se llevó a cabo la operación</option>
                  <option value="04">04 - Operación nominativa relacionada en factura global</option>
                </select>
              </div>
              {cancelModal.motivo === '01' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">UUID sustituto</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 dark:text-gray-100"
                    placeholder="Ingrese UUID del comprobante sustituto"
                    value={cancelModal.uuidSustituto || ''}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, uuidSustituto: e.target.value }))}
                  />
                </div>
              )}
              {cancelModal.error && (<div className="text-sm text-red-600 dark:text-red-400">{cancelModal.error}</div>)}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="neutral" onClick={closeCancelModal} disabled={cancelModal.loading}>Cerrar</Button>
              <Button variant="secondary" onClick={submitCancel} disabled={cancelModal.loading}>{cancelModal.loading ? 'Cancelando...' : 'Confirmar cancelación'}</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}