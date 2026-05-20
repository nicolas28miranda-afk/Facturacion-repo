import React, { useState, useEffect } from 'react';
import { Card } from './Card'; // O ajusta según tu estructura
import { ComprobanteAccionesBar } from './ComprobanteAccionesBar';
import { useEmpresa } from '../context/EmpresaContext';
import { guardarNomina, NominaFormPayload, consultarHistorialNominas, NominaHistorialRecord } from '../services/nominaService';
import { facturaService } from '../services/facturaService';
import { apiUrl, getHeadersWithUsuario } from '../services/api';
import { correoService } from '../services/correoService';
import { EnviarWhatsAppModal } from './EnviarWhatsAppModal';
import {
  WHATSAPP_MENSAJE_BASE_NOMINA,
  construirMensajeWhatsAppNomina,
} from '../constants/whatsappFacturaMensajeBase';
import {
  buscarEmpleadoParaNomina,
  EmpleadoNomina,
  guardarEmpleadoCatalogo,
  parseNombreCompleto,
  resolverEmpleadoEnCatalogo,
} from '../services/empleadoService';
import { calcularDeduccionISR, formatMoney2 } from '../services/isrService';
import { calcularPeriodoLabel } from '../services/periodoPagoService';

interface NominaFormData {
  rfcEmisor: string;
  rfcReceptor: string;
  nombre: string;
  curp: string;
  periodoPago: string;
  periodicidad?: 'QUINCENAL' | 'MENSUAL';
  fechaPago: string;
  total: string;
  deducciones: string;
  percepciones: string;
  tipoNomina: string;
  usoCfdi: string;
  correo: string;
  telefono: string;
  domicilioFiscalReceptor: string;
  // CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal
  numSeguridadSocial: string;
  fechaInicioRelLaboral: string;
  antiguedad: string;
  riesgoPuesto: string;
  salarioDiarioIntegrado: string;
  numDiasPagados?: string; // Para calcular salario diario integrado
}

interface HistoryRecord {
  id: number;
  fecha: string;
  idEmpleado: string;
  estado: string;
  uuid?: string;
  total?: string;
  folio?: string;
  tipoNomina?: string;
}

const initialNominaFormData: NominaFormData = {
  rfcEmisor: '',
  rfcReceptor: '',
  nombre: '',
  curp: '',
  periodoPago: '',
  periodicidad: 'QUINCENAL',
  fechaPago: new Date().toISOString().split('T')[0],
  total: '',
  deducciones: '',
  percepciones: '',
  tipoNomina: '',
  usoCfdi: '',
  correo: '',
  telefono: '',
          domicilioFiscalReceptor: '',
          // CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal
          // Valores por defecto para facilitar el timbrado
          numSeguridadSocial: '12345678901', // Ejemplo: Número de IMSS (11 dígitos)
          fechaInicioRelLaboral: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // Hace 1 año por defecto
          antiguedad: 'P1Y', // Se calculará automáticamente
          riesgoPuesto: '1', // Riesgo mínimo por defecto (1-5 según IMSS)
          salarioDiarioIntegrado: '500.00', // Se calculará automáticamente
          numDiasPagados: '15', // Para quincenal
};

// --- DATOS DUMMY PARA LA DEMOSTRACIÓN ---

// Datos del empleado que se cargarán en el formulario - no utilizado
// const dummyEmployeeData: Partial<NominaFormData> = {
//   rfcEmisor: 'EJE900101M8A', // RFC de la empresa (tomado de la captura)
//   rfcReceptor: 'VECJ880315H1A',
//   nombre: 'JUAN CARLOS PEREZ GOMEZ',
//   curp: 'PEGC880315HDFRZA05',
//   periodoPago: '2024-06-01 al 2024-06-15',
//   fechaPago: '2024-06-30', // Fecha en formato YYYY-MM-DD para el input type="date"
//   percepciones: '10000.00',
//   deducciones: '1500.50',
//   total: '8499.50',
//   tipoNomina: 'O', // 'O' para Ordinaria
//   usoCfdi: 'CN01', // 'CN01' para Nómina
//   correo: 'juan.perez@example.com',
// };

// Historial de facturas para este empleado - no utilizado
// const dummyHistoryData: HistoryRecord[] = [
//   { id: 1, fecha: '2024-05-30', idEmpleado: 'EMP123', estado: 'Timbrada' },
//   { id: 2, fecha: '2024-05-15', idEmpleado: 'EMP123', estado: 'Timbrada' },
//   { id: 3, fecha: '2024-04-30', idEmpleado: 'EMP123', estado: 'Cancelada' },
// ];

const fechaHoyIso = (): string => new Date().toISOString().split('T')[0];

export const FacturacionNominasPage: React.FC = () => {
  const { empresaInfo } = useEmpresa();
  const [searchDate, setSearchDate] = useState(fechaHoyIso);
  const [noEmpleado, setNoEmpleado] = useState('');
  const [formData, setFormData] = useState<NominaFormData>(initialNominaFormData);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Estado para visor PDF
  const [pdfViewerOpen, setPdfViewerOpen] = useState<boolean>(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerLoading, setPdfViewerLoading] = useState<boolean>(false);
  const [uuidNominaActiva, setUuidNominaActiva] = useState<string>('');
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

  const closePdfViewer = () => {
    if (pdfViewerUrl) {
      try { window.URL.revokeObjectURL(pdfViewerUrl); } catch {}
    }
    setPdfViewerUrl(null);
    setPdfViewerOpen(false);
  };

  // Cargar RFC del emisor desde el sistema por defecto
  useEffect(() => {
    if (empresaInfo.rfc) {
      setFormData((prev) => ({
        ...prev,
        rfcEmisor: empresaInfo.rfc,
      }));
    }
  }, [empresaInfo]);

  // Para la demo, pre-llenamos el ID del empleado al cargar el componente
  useEffect(() => {
    setNoEmpleado('EMP123');
  }, []);

  // Calcular automáticamente el periodo de pago cuando cambia periodicidad o fecha de pago
  useEffect(() => {
    const label = calcularPeriodoLabel(formData.periodicidad || 'QUINCENAL', formData.fechaPago);
    setFormData((prev) => ({ ...prev, periodoPago: label }));
  }, [formData.periodicidad, formData.fechaPago]);

  // Función para calcular antigüedad en formato PnYnMnDn basada en fecha de inicio
  const calcularAntiguedad = (fechaInicio: string): string => {
    if (!fechaInicio) return '';
    try {
      const inicio = new Date(fechaInicio);
      const hoy = new Date();
      let años = hoy.getFullYear() - inicio.getFullYear();
      let meses = hoy.getMonth() - inicio.getMonth();
      let días = hoy.getDate() - inicio.getDate();
      
      if (días < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        días += ultimoDiaMesAnterior;
      }
      if (meses < 0) {
        años--;
        meses += 12;
      }
      
      // Formato PnYnMnDn (ej: P1Y2M15D)
      const partes: string[] = [];
      if (años > 0) partes.push(`${años}Y`);
      if (meses > 0) partes.push(`${meses}M`);
      if (días > 0) partes.push(`${días}D`);
      
      return partes.length > 0 ? `P${partes.join('')}` : 'P0D';
    } catch {
      return '';
    }
  };

  // Calcular antigüedad automáticamente cuando cambia la fecha de inicio
  useEffect(() => {
    if (formData.fechaInicioRelLaboral) {
      const antiguedadCalculada = calcularAntiguedad(formData.fechaInicioRelLaboral);
      if (antiguedadCalculada) {
        setFormData((prev) => ({ ...prev, antiguedad: antiguedadCalculada }));
      }
    }
  }, [formData.fechaInicioRelLaboral]);

  // Calcular salario diario integrado basado en percepciones
  useEffect(() => {
    if (formData.percepciones && formData.numDiasPagados) {
      const percepcionesNum = parseFloat(formData.percepciones.replace(/,/g, '')) || 0;
      const diasNum = parseInt(formData.numDiasPagados) || 15; // Default 15 días para quincenal
      const salarioDiario = percepcionesNum / diasNum;
      // Salario diario integrado suele ser ~1.5 veces el salario diario (incluye prestaciones)
      const salarioDiarioIntegrado = salarioDiario * 1.5;
      setFormData((prev) => ({ 
        ...prev, 
        salarioDiarioIntegrado: formatMoney2(salarioDiarioIntegrado) 
      }));
    }
  }, [formData.percepciones, formData.numDiasPagados]);

  const cargarHistorialNomina = async (idEmpleado: string) => {
    const id = (idEmpleado || '').trim();
    if (!id) {
      setHistory([]);
      return;
    }
    try {
      const hist: NominaHistorialRecord[] = await consultarHistorialNominas(id, 25);
      setHistory(
        hist.map((h) => ({
          id: h.id,
          fecha: h.fecha,
          idEmpleado: h.idEmpleado,
          estado: h.estado || '—',
          uuid: h.uuid,
          total: h.total,
          folio: h.folio,
          tipoNomina: h.tipoNomina,
        }))
      );
    } catch (e) {
      console.error('Error consultando historial de nóminas:', e);
      setHistory([]);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const criterio = (noEmpleado || '').trim();
    if (!criterio) {
      alert('Ingresa el No. Empleado para buscar.');
      return;
    }
    try {
      const emp: EmpleadoNomina | null = await buscarEmpleadoParaNomina(criterio);
      if (emp) {
        const idEmpStr = String(emp.idEmpleado);
        setNoEmpleado(emp.noEmpleado || criterio);

        const salario = emp.salarioBase;
        const percep = salario !== undefined && salario !== null ? Number(salario) : undefined;
        const ded = percep !== undefined ? calcularDeduccionISR(Number(percep)) : undefined;
        const totalCalc = percep !== undefined && ded !== undefined ? Math.max(0, Number(percep) - Number(ded)) : undefined;

        const periodicidadForm =
          emp.periodicidadPago === 'MENSUAL' ? 'MENSUAL' : 'QUINCENAL';

        let fechaInicio = '';
        if (emp.fechaAlta) {
          const d = new Date(emp.fechaAlta);
          if (!Number.isNaN(d.getTime())) {
            fechaInicio = d.toISOString().split('T')[0];
          }
        }

        setFormData(prev => ({
          ...prev,
          nombre: emp.nombreEmpleado || prev.nombre,
          correo: emp.correo || prev.correo,
          telefono: emp.telefono || prev.telefono,
          rfcReceptor: emp.rfc || prev.rfcReceptor,
          curp: emp.curp || prev.curp,
          domicilioFiscalReceptor: emp.codigoPostal || prev.domicilioFiscalReceptor || '',
          numSeguridadSocial: emp.numSeguridadSocial || prev.numSeguridadSocial,
          salarioDiarioIntegrado:
            emp.salarioDiarioIntegrado != null
              ? formatMoney2(Number(emp.salarioDiarioIntegrado))
              : prev.salarioDiarioIntegrado,
          fechaInicioRelLaboral: fechaInicio || prev.fechaInicioRelLaboral,
          percepciones: percep !== undefined ? formatMoney2(Number(percep)) : prev.percepciones,
          deducciones: ded !== undefined ? formatMoney2(Number(ded)) : prev.deducciones,
          total: totalCalc !== undefined ? formatMoney2(Number(totalCalc)) : prev.total,
          fechaPago: searchDate || prev.fechaPago,
          tipoNomina: prev.tipoNomina || 'O',
          usoCfdi: prev.usoCfdi || 'CN01',
          periodicidad: periodicidadForm,
        }));
        alert(`Empleado ${emp.noEmpleado || idEmpStr} encontrado. Formulario actualizado.`);
        await cargarHistorialNomina(idEmpStr);
      } else {
        alert(`Empleado con No. "${criterio}" no encontrado en catálogo EMPLEADOS.`);
        setFormData(initialNominaFormData);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error al consultar empleado:', error);
      alert('Error al consultar empleado. Revisa la conexión con el backend.');
    }
  };

  const handleVistaPrevia = async () => {
    try {
      // Validar campos básicos
      if (!formData.rfcReceptor || !formData.rfcReceptor.trim()) {
        alert('Por favor ingrese el RFC del receptor.');
        return;
      }

      const payload: NominaFormPayload = {
        rfcEmisor: (formData.rfcEmisor || empresaInfo.rfc || '').trim(),
        rfcReceptor: formData.rfcReceptor,
        nombre: formData.nombre,
        curp: formData.curp,
        periodoPago: formData.periodoPago,
        fechaPago: formData.fechaPago,
        percepciones: formData.percepciones,
        deducciones: formData.deducciones,
        total: formData.total,
        tipoNomina: formData.tipoNomina,
        usoCfdi: formData.usoCfdi,
        correoElectronico: formData.correo,
        domicilioFiscalReceptor: formData.domicilioFiscalReceptor,
        numSeguridadSocial: formData.numSeguridadSocial,
        fechaInicioRelLaboral: formData.fechaInicioRelLaboral,
        antiguedad: formData.antiguedad,
        riesgoPuesto: formData.riesgoPuesto,
        salarioDiarioIntegrado: formData.salarioDiarioIntegrado,
      };

      const response = await fetch(apiUrl('/nominas/preview-pdf'), {
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
      alert(`Error al generar vista previa: ${mensaje}`);
    }
  };

  const asegurarEmpleadoEnCatalogo = async (): Promise<string | null> => {
    if (!formData.rfcReceptor?.trim()) {
      alert('Capture el RFC del receptor antes de emitir la nómina.');
      return null;
    }
    if (!formData.nombre?.trim()) {
      alert('Capture el nombre del trabajador antes de emitir la nómina.');
      return null;
    }

    const codigoNoEmpleado = (noEmpleado || '').trim();
    if (!codigoNoEmpleado) {
      alert('Capture el No. Empleado antes de emitir la nómina.');
      return null;
    }

    let existente = await resolverEmpleadoEnCatalogo(codigoNoEmpleado, formData.rfcReceptor);
    if (existente?.idEmpleado) {
      if (existente.noEmpleado) {
        setNoEmpleado(existente.noEmpleado);
      }
      return String(existente.idEmpleado);
    }

    const { nombre, apellidoPaterno, apellidoMaterno } = parseNombreCompleto(formData.nombre);

    const deseaGuardar = window.confirm(
      `El trabajador con RFC ${formData.rfcReceptor.trim().toUpperCase()} no está en el catálogo EMPLEADOS.\n\n` +
        `¿Desea registrarlo ahora antes de emitir la nómina?\n\n` +
        `No. Empleado: ${codigoNoEmpleado}`
    );
    if (!deseaGuardar) {
      return null;
    }

    try {
      const guardado = await guardarEmpleadoCatalogo({
        noEmpleado: codigoNoEmpleado,
        rfc: formData.rfcReceptor.trim().toUpperCase(),
        curp: formData.curp?.trim() || undefined,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        correoElectronico: formData.correo?.trim() || undefined,
        telefono: formData.telefono?.trim() || undefined,
        codigoPostal: formData.domicilioFiscalReceptor?.trim() || undefined,
        numSeguridadSocial: formData.numSeguridadSocial?.trim() || undefined,
        salarioDiarioIntegrado: formData.salarioDiarioIntegrado?.replace(/,/g, '') || undefined,
        periodicidadPago: formData.periodicidad || 'QUINCENAL',
        salarioBase: formData.percepciones?.replace(/,/g, '') || undefined,
        fechaIngreso: formData.fechaInicioRelLaboral || undefined,
      });
      const idStr = String(guardado.idEmpleado);
      setNoEmpleado(guardado.noEmpleado || codigoNoEmpleado);
      alert(`Empleado registrado en catálogo (No. ${guardado.noEmpleado || codigoNoEmpleado}).`);
      return idStr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar empleado';
      alert(`No se pudo registrar el empleado:\n${msg}`);
      return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idEmpleadoNomina = await asegurarEmpleadoEnCatalogo();
      if (!idEmpleadoNomina) {
        return;
      }

      const fechaNomina = searchDate.trim() || fechaHoyIso();
      const payload: NominaFormPayload = {
        rfcEmisor: (formData.rfcEmisor || empresaInfo.rfc || '').trim(),
        rfcReceptor: formData.rfcReceptor,
        nombre: formData.nombre,
        curp: formData.curp,
        periodoPago: formData.periodoPago,
        fechaPago: formData.fechaPago,
        percepciones: formData.percepciones,
        deducciones: formData.deducciones,
        total: formData.total,
        tipoNomina: formData.tipoNomina,
        usoCfdi: formData.usoCfdi,
        correoElectronico: formData.correo,
        domicilioFiscalReceptor: formData.domicilioFiscalReceptor,
        numSeguridadSocial: formData.numSeguridadSocial,
        fechaInicioRelLaboral: formData.fechaInicioRelLaboral,
        antiguedad: formData.antiguedad,
        riesgoPuesto: formData.riesgoPuesto,
        salarioDiarioIntegrado: formData.salarioDiarioIntegrado,
      };
      const resp = await guardarNomina(
        payload,
        idEmpleadoNomina,
        fechaNomina,
        empresaInfo.rfc
      );
      if (resp.ok) {
        const uuidObtenido = resp.uuidFactura || '';
        if (uuidObtenido) {
          setUuidNominaActiva(uuidObtenido);
        }
        alert(`Nómina timbrada exitosamente\nUUID: ${uuidObtenido || 'N/A'}`);

        if (idEmpleadoNomina.trim()) {
          await cargarHistorialNomina(idEmpleadoNomina);
        }

        // Preguntar si desea enviar por correo
        if (confirm('¿Desea enviar el PDF de la nómina al correo del receptor?')) {
          await enviarCorreoNomina(uuidObtenido);
        }
      } else {
        const msg = resp.message || 'Error al guardar nómina';
        alert(`Error: ${msg}`);
      }
    } catch (error: any) {
      alert(`Error inesperado al guardar: ${error?.message || error}`);
    }
  };
  
  const handleClear = () => {
    setSearchDate(fechaHoyIso());
    setNoEmpleado('');
    setFormData(initialNominaFormData);
    setHistory([]);
    setUuidNominaActiva('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Si cambia percepciones, recalcular deducciones y total automáticamente usando ISR
    if (name === 'percepciones') {
      const percepNum = Number(value || 0);
      const ded = calcularDeduccionISR(percepNum);
      const totalCalc = Math.max(0, percepNum - ded);
      setFormData((prev) => ({
        ...prev,
        percepciones: value,
        deducciones: formatMoney2(ded),
        total: formatMoney2(totalCalc),
      }));
      return;
    }
    if (name === 'periodicidad' || name === 'fechaPago') {
      // Actualizar y dejar que el useEffect recalcule periodoPago
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const abrirModalWhatsApp = (uuid?: string) => {
    const uuidTarget = (uuid || uuidNominaActiva || '').trim();
    if (!uuidTarget) {
      alert('Primero debes guardar y timbrar la nómina para enviarla por WhatsApp.');
      return;
    }
    const nombre = (formData.nombre || '').trim();
    const periodo = (formData.periodoPago || '').trim();
    const facturaInfo = nombre
      ? `Nómina de ${nombre}${periodo ? ` (${periodo})` : ''}`
      : `Nómina (UUID ${uuidTarget})`;
    setModalWhatsApp({
      isOpen: true,
      facturaUuid: uuidTarget,
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

  const handleDescargarXmlNominaActiva = async () => {
    const uuid = (uuidNominaActiva || '').trim();
    if (!uuid) {
      alert('Primero guarda y timbra la nómina.');
      return;
    }
    try {
      await facturaService.generarYDescargarXML(uuid);
    } catch (error: unknown) {
      alert(`Error al descargar XML: ${error instanceof Error ? error.message : error}`);
    }
  };

  const handleDescargarPdfNominaActiva = async () => {
    const uuid = (uuidNominaActiva || '').trim();
    if (!uuid) {
      alert('Primero guarda y timbra la nómina.');
      return;
    }
    try {
      await facturaService.generarYDescargarPDF(uuid);
    } catch (error: unknown) {
      alert(`Error al descargar PDF: ${error instanceof Error ? error.message : error}`);
    }
  };

  const enviarCorreoNomina = async (uuid: string) => {
    const correo = (formData.correo || '').trim();
    if (!uuid || !uuid.trim()) {
      alert('No hay UUID disponible para esta nómina.');
      return;
    }
    if (!correo) {
      alert('No hay correo del receptor. Ingrésalo en el formulario y vuelve a intentar.');
      return;
    }
    try {
      const asunto = `Recibo de Nómina ${formData.periodoPago ? '- ' + formData.periodoPago : ''}`.trim();
      const mensaje = `Estimado(a),\n\nSe adjunta el PDF de su recibo de nómina.\nUUID: ${uuid}`;
      const resp = await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: uuid,
        correoReceptor: correo,
        asunto,
        mensaje,
      });
      if (resp?.simulado) {
        alert(
          `El servidor no envió el correo real (modo simulado).\n${resp?.message || ''}\n\n` +
            'Revise SMTP en application.yml y que el backend esté reiniciado.'
        );
        return;
      }
      if (resp?.success) {
        alert(`Correo enviado exitosamente a: ${correo}`);
      } else {
        alert(`Error al enviar correo: ${resp?.message || 'Desconocido'}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al enviar correo: ${msg}`);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
      
      {/* Sección de filtros */}
      <Card id="guia-nom-filtro">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filtro de Nómina</h2>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="flex flex-col space-y-1">
            <label className="font-medium text-primary dark:text-secondary">Fecha de Nómina:</label>
            <input
              type="date" // Cambiado a 'date' para consistencia
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="font-medium text-primary dark:text-secondary">No. Empleado (NO_EMPLEADO):</label>
            <input
              type="text"
              value={noEmpleado}
              onChange={(e) => setNoEmpleado(e.target.value)}
              placeholder="Código del trabajador en catálogo"
              className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4 pt-2">
            <button
              type="button"
              className="px-4 py-2 border border-primary dark:border-secondary text-primary dark:text-secondary rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={handleClear}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary dark:bg-secondary text-white rounded-md hover:bg-primary-dark dark:hover:bg-secondary-dark"
            >
              Buscar
            </button>
          </div>
        </form>
      </Card>

      {/* Sección del formulario de facturación */}
      <form onSubmit={handleFormSubmit}>
        <Card id="guia-nom-datos">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Datos de Facturación de Nómina</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Selector de periodicidad (Quincenal/Mensual) */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-black dark:text-white">Periodicidad:</label>
              <select
                name="periodicidad"
                value={formData.periodicidad || 'QUINCENAL'}
                onChange={handleFormChange}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>
            {[
              // RFC Emisor oculto - se toma del sistema por defecto
              { label: 'RFC Receptor', name: 'rfcReceptor', type: 'text', required: true },
              { label: 'Nombre', name: 'nombre', type: 'text', required: true },
              { label: 'CURP', name: 'curp', type: 'text' },
              { label: 'Domicilio Fiscal Receptor (CP)', name: 'domicilioFiscalReceptor', type: 'text', required: true, placeholder: 'Ej: 58000' },
              { label: 'Periodo de Pago', name: 'periodoPago', type: 'text', placeholder: 'Ej: 01/10/2025 al 30/10/2025' },
              { label: 'Fecha de Pago', name: 'fechaPago', type: 'date', required: true },
              { label: 'Percepciones', name: 'percepciones', type: 'number' },
              { label: 'Deducciones', name: 'deducciones', type: 'number' },
              { label: 'Total', name: 'total', type: 'number', required: true },
            ].map(({ label, name, type, required, placeholder }) => (
              <div className="flex flex-col" key={name}>
                <label className="mb-1 font-semibold text-black dark:text-white">{label}:</label>
                <input
                  type={type}
                  name={name}
                  value={(formData as any)[name]}
                  onChange={handleFormChange}
                  required={required}
                  placeholder={placeholder}
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  step="0.01" // Para permitir decimales en los campos numéricos
                  readOnly={name === 'periodoPago'}
                />
              </div>
            ))}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-black dark:text-white">Tipo de Nómina:</label>
              <select
                name="tipoNomina"
                value={formData.tipoNomina}
                onChange={handleFormChange}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Selecciona...</option>
                <option value="O">Ordinaria</option>
                <option value="E">Extraordinaria</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-black dark:text-white">Uso CFDI:</label>
              <select
                name="usoCfdi"
                value={formData.usoCfdi}
                onChange={handleFormChange}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Selecciona...</option>
                <option value="G01">G01 - Adquisición de mercancías</option>
                <option value="P01">P01 - Por definir</option>
                <option value="CN01">CN01 - Nómina</option>
              </select>
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 font-semibold text-black dark:text-white">Correo electrónico:</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleFormChange}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 font-semibold text-black dark:text-white">Teléfono para WhatsApp:</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleFormChange}
                placeholder="527331565237"
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            {/* CRÍTICO NOM44: Campos requeridos cuando existe RegistroPatronal */}
            {[
              { label: 'Número de Seguridad Social', name: 'numSeguridadSocial', type: 'text', required: true, placeholder: 'Ej: 12345678901' },
              { label: 'Fecha Inicio Relación Laboral', name: 'fechaInicioRelLaboral', type: 'date', required: true },
              { label: 'Antigüedad (PnYnMnDn)', name: 'antiguedad', type: 'text', required: true, placeholder: 'Ej: P1Y2M15D' },
              { label: 'Riesgo Puesto', name: 'riesgoPuesto', type: 'text', required: true, placeholder: 'Ej: 1, 2, 3' },
              { label: 'Salario Diario Integrado', name: 'salarioDiarioIntegrado', type: 'number', required: true, placeholder: 'Ej: 500.00' },
            ].map(({ label, name, type, required, placeholder }) => (
              <div className="flex flex-col" key={name}>
                <label className="mb-1 font-semibold text-black dark:text-white">{label}:</label>
                <input
                  type={type}
                  name={name}
                  value={(formData as any)[name]}
                  onChange={handleFormChange}
                  required={required}
                  placeholder={placeholder}
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  step={type === 'number' ? '0.01' : undefined}
                />
              </div>
            ))}
          </div>
          <ComprobanteAccionesBar
            id="guia-nom-generar"
            className="mt-6"
            showCancel={false}
            onVistaPrevia={handleVistaPrevia}
            generarType="submit"
            generarLabel="Emitir nómina"
            tieneUuid={Boolean((uuidNominaActiva || '').trim())}
            postEmisionHint="Después de emitir la nómina"
            onDescargarXml={() => void handleDescargarXmlNominaActiva()}
            onDescargarPdf={() => void handleDescargarPdfNominaActiva()}
            onEnviarCorreo={() => void enviarCorreoNomina(uuidNominaActiva)}
            onEnviarWhatsApp={() => abrirModalWhatsApp()}
            correoDisabled={!(formData.correo || '').trim()}
            correoTitle={!(formData.correo || '').trim() ? 'Capture el correo del receptor' : undefined}
          />
        </Card>
      </form>

      {/* Historial desde NOMINAS + FACTURAS */}
      <Card id="guia-nom-historial">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Historial de nóminas</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Últimos pagos en tabla NOMINAS (UUID y estatus desde FACTURAS).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={`${record.id}-${record.uuid || record.fecha}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.fecha || '—'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.folio || '—'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {record.total ? `$${record.total}` : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.estado || '—'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{record.tipoNomina || '—'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                          onClick={async () => {
                            if (!record.uuid || !record.uuid.trim()) {
                              alert('No hay UUID disponible para esta nómina.');
                              return;
                            }
                            try {
                              setPdfViewerLoading(true);
                              // Obtener PDF desde backend y abrir en visor modal
                              const response = await fetch(apiUrl(`/factura/descargar-pdf/${record.uuid}`));
                              if (!response.ok) {
                                const txt = await response.text().catch(() => '');
                                throw new Error(`Error al obtener PDF (HTTP ${response.status}) ${txt}`);
                              }
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              setPdfViewerUrl(url);
                              setPdfViewerOpen(true);
                            } catch (error: any) {
                              alert(`Error al visualizar PDF: ${error?.message || error}`);
                            } finally {
                              setPdfViewerLoading(false);
                            }
                          }}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          onClick={async () => {
                            if (!record.uuid || !record.uuid.trim()) {
                              alert('No hay UUID disponible para esta nómina.');
                              return;
                            }
                            try {
                              await facturaService.generarYDescargarPDF(record.uuid);
                            } catch (error: any) {
                              alert(`Error al descargar PDF: ${error?.message || error}`);
                            }
                          }}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                          onClick={async () => {
                            if (!record.uuid || !record.uuid.trim()) {
                              alert('No hay UUID disponible para esta nómina.');
                              return;
                            }
                            try {
                              await facturaService.generarYDescargarXML(record.uuid);
                            } catch (error: any) {
                              alert(`Error al descargar XML: ${error?.message || error}`);
                            }
                          }}
                        >
                          XML
                        </button>
                        <button
                          type="button"
                          className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                          onClick={async () => {
                            await enviarCorreoNomina(record.uuid || '');
                          }}
                        >
                          Correo
                        </button>
                        <button
                          type="button"
                          className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                          onClick={() => abrirModalWhatsApp(record.uuid)}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay historial para mostrar. Busque un empleado por No. Empleado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Modal visor PDF */}
      {pdfViewerOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-[95vw] max-w-5xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Vista previa PDF</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={closePdfViewer}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="p-0">
              {pdfViewerLoading ? (
                <div className="p-6 text-center text-gray-700 dark:text-gray-200">Cargando PDF…</div>
              ) : (
                <iframe
                  src={pdfViewerUrl || ''}
                  title="Visor PDF"
                  className="w-full h-[80vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <EnviarWhatsAppModal
        isOpen={modalWhatsApp.isOpen}
        onClose={cerrarModalWhatsApp}
        facturaUuid={modalWhatsApp.facturaUuid}
        facturaInfo={modalWhatsApp.facturaInfo}
        telefonoInicial={modalWhatsApp.telefonoInicial}
        tituloModal="Enviar Nómina por WhatsApp"
        etiquetaDocumento="Recibo de nómina"
        mensajeBase={WHATSAPP_MENSAJE_BASE_NOMINA}
        construirMensaje={construirMensajeWhatsAppNomina}
        notaArchivos="Se enviarán el PDF y el XML del recibo de nómina al número indicado."
      />
    </div>
  );
};