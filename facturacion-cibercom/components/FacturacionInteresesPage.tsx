import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { PAIS_OPTIONS, REGIMEN_FISCAL_OPTIONS, USO_CFDI_OPTIONS } from '../constants';
import { facturaService } from '../services/facturaService';
import { pacUrl } from '../services/api';
import { ensureSessionDefaults, getLastPeriodoIntereses, getSessionCodigoTienda, getSessionIdTienda, getSessionIdUsuario, setLastPeriodoIntereses, setSessionIdReceptor } from '../services/sessionService';

interface InteresesFormData {
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
  cuenta: string;
  periodo: string; // yyyyMM
  interesFinanciero: string;
  interesMoratorio: string;
  ivaInteresFinanciero: string;
  ivaInteresMoratorio: string;
}

const initialInteresesFormData: InteresesFormData = {
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
  cuenta: '',
  periodo: '',
  interesFinanciero: '',
  interesMoratorio: '',
  ivaInteresFinanciero: '',
  ivaInteresMoratorio: '',
};

export const FacturacionInteresesPage: React.FC = () => {
  const [formData, setFormData] = useState<InteresesFormData>(initialInteresesFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'error' | ''>('');
  const [receptorValido, setReceptorValido] = useState<boolean>(false);
  const [rfcBloqueado, setRfcBloqueado] = useState<boolean>(false);
  const [_idReceptor, setIdReceptor] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'rfc' | 'correoElectronico' | 'razonSocial' | 'nombre' | 'paterno' | 'materno' | 'domicilioFiscal' | 'regimenFiscal' | 'usoCfdi', string>>>({});
  const [consultaIntereses, setConsultaIntereses] = useState<{
    financiero: number;
    financieroIva: number;
    moratorio: number;
    moratorioIva: number;
    codigoRespuesta?: string;
    mensaje?: string;
  } | null>(null);
  const [facturarFinanciero, setFacturarFinanciero] = useState<boolean>(true);
  const [facturarMoratorio, setFacturarMoratorio] = useState<boolean>(true);
  const [timbradoStatus, setTimbradoStatus] = useState<string | null>(null);
  const [timbradoIntervalId, setTimbradoIntervalId] = useState<number | null>(null);

  // Al montar: asegurar sesión y prellenar último periodo usado
  useEffect(() => {
    ensureSessionDefaults();
    const lastPeriodo = getLastPeriodoIntereses();
    if (lastPeriodo) {
      setFormData(prev => ({ ...prev, periodo: lastPeriodo }));
    }
  }, []);

  // Helpers de validación local para habilitar flujo al completar campos
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const isRFCValid = (rfc: string) => /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test((rfc || '').toUpperCase());
  const buildRFC = (data: InteresesFormData) => `${(data.rfcIniciales || '').toUpperCase()}${(data.rfcFecha || '').toUpperCase()}${(data.rfcHomoclave || '').toUpperCase()}`;
  const requiredFiscalFields: Array<keyof InteresesFormData> = ['razonSocial', 'domicilioFiscal', 'regimenFiscal', 'usoCfdi'];
  const missingRequiredFields = (data: InteresesFormData) => requiredFiscalFields.filter(k => !(data[k] || '').toString().trim());
  const recomputeReceptorValidoFromForm = (data: InteresesFormData) => {
    const rfcCompleto = buildRFC(data);
    const requisitosCompletos = isEmailValid(data.correoElectronico || '') && isRFCValid(rfcCompleto) && missingRequiredFields(data).length === 0;
    setReceptorValido(requisitosCompletos);
    return requisitosCompletos;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value } as InteresesFormData;
    setFormData(nextData);
    // Limpiar error del campo editado
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (name === 'rfcIniciales' || name === 'rfcFecha' || name === 'rfcHomoclave') {
        delete updated.rfc;
      }
      if (name in updated) {
        // @ts-ignore
        delete updated[name as keyof typeof updated];
      }
      return updated;
    });
    // Recalcular receptor válido cuando se completan campos requeridos
    recomputeReceptorValidoFromForm(nextData);
  };

  const handleRfcSearch = async () => {
    // Limpiar alertas y errores previos
    setAlertMessage('');
    setAlertType('');
    setFieldErrors({});

    const rfcCompleto = `${(formData.rfcIniciales || '').toUpperCase()}${(formData.rfcFecha || '').toUpperCase()}${(formData.rfcHomoclave || '').toUpperCase()}`;
    const email = formData.correoElectronico || '';

    // Validaciones de RFC y Email
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const errors: Partial<Record<'rfc' | 'correoElectronico', string>> = {};
    if (!emailRegex.test(email)) {
      errors.correoElectronico = 'Escriba un email válido para realizar la búsqueda';
    }
    if (!rfcRegex.test(rfcCompleto)) {
      errors.rfc = 'El RFC debe tener un formato válido (13 caracteres)';
    }
    if (errors.correoElectronico || errors.rfc) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      setAlertType('error');
      setAlertMessage(errors.correoElectronico || errors.rfc || 'Datos inválidos para búsqueda');
      setReceptorValido(false);
      setRfcBloqueado(false);
      setIdReceptor(null);
      setSessionIdReceptor(null);
      return;
    }

    try {
      setLoading(true);
      const idTienda = getSessionIdTienda();
      const resp = await facturaService.buscarReceptorPorRFC({ rfc: rfcCompleto, idTienda, correoElectronico: email });
      setLoading(false);

      if (!resp.encontrado) {
        setAlertType('error');
        setAlertMessage('Receptor no encontrado por RFC');
        setReceptorValido(false);
        setRfcBloqueado(false);
        setIdReceptor(null);
        setSessionIdReceptor(null);
        return;
      }

      // Rellenar datos fiscales con lo devuelto
      const r = resp.receptor;
      const nextForm: InteresesFormData = {
        ...formData,
        rfcIniciales: rfcCompleto.slice(0, 4),
        rfcFecha: rfcCompleto.slice(4, 10),
        rfcHomoclave: rfcCompleto.slice(10),
        razonSocial: r.razonSocial || formData.razonSocial,
        nombre: r.nombre || formData.nombre,
        paterno: r.paterno || formData.paterno,
        materno: r.materno || formData.materno,
        pais: r.pais || formData.pais,
        domicilioFiscal: r.domicilioFiscal || formData.domicilioFiscal,
        regimenFiscal: r.regimenFiscal || formData.regimenFiscal,
        usoCfdi: r.usoCfdi || formData.usoCfdi,
        correoElectronico: email,
      };
      setFormData(nextForm);

      // Manejo de estado según completitud CFDI 4.0
      if (resp.completoCFDI40) {
        setAlertType('success');
        setAlertMessage('Receptor encontrado y validado (CFDI 4.0)');
        setReceptorValido(true);
        setRfcBloqueado(true);
        setIdReceptor(resp.idReceptor || null);
        // Persistir idReceptor válido en sesión
        setSessionIdReceptor(resp.idReceptor || null);
      } else {
        setAlertType('error');
        setAlertMessage('Datos fiscales incompletos');
        setRfcBloqueado(false);
        setIdReceptor(resp.idReceptor || null);
        // Construir errores solo para campos aún vacíos
        const faltantesList = (resp.faltantes || []);
        const calculatedMissing = missingRequiredFields(nextForm);
        const effectiveMissing = Array.from(new Set([ ...faltantesList, ...calculatedMissing ]));
        const faltantes: any = {};
        effectiveMissing.forEach((f: string) => {
          faltantes[f as keyof typeof faltantes] = 'Campo requerido';
        });
        setFieldErrors(faltantes);
        // Si el usuario ya completó todos los requeridos manualmente, habilitar flujo
        const completos = recomputeReceptorValidoFromForm(nextForm);
        if (completos) {
          setAlertType('success');
          setAlertMessage('Datos completos manualmente. Continúa con la consulta.');
        } else {
          setReceptorValido(false);
        }
      }
    } catch (e: any) {
      setLoading(false);
      setAlertType('error');
      setAlertMessage(e?.message || 'Error inesperado al buscar receptor');
      setReceptorValido(false);
      setRfcBloqueado(false);
      setIdReceptor(null);
      setSessionIdReceptor(null);
    }
  };

  // Helpers periodo -> fechas ISO yyyy-MM-dd
  const periodoToFechas = (periodo: string) => {
    const match = /^([0-9]{4})(0[1-9]|1[0-2])$/.exec(periodo || '');
    if (!match) return { fechaIni: '', fechaFin: '' };
    const year = parseInt(match[1], 10);
    const monthIdx = parseInt(match[2], 10) - 1; // 0-based
    const inicio = new Date(Date.UTC(year, monthIdx, 1));
    const fin = new Date(Date.UTC(year, monthIdx + 1, 0));
    const fmt = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { fechaIni: fmt(inicio), fechaFin: fmt(fin) };
  };

  const handleConsultarIntereses = async () => {
    setAlertMessage('');
    setAlertType('');
    setConsultaIntereses(null);
    // Validaciones mínimas
    // Se permite consultar intereses sin validar datos fiscales del receptor
    if (!(formData.cuenta || '').trim()) {
      setAlertType('error');
      setAlertMessage('Debes capturar la cuenta');
      return;
    }
    const periodoValido = /^([0-9]{4})(0[1-9]|1[0-2])$/.test(formData.periodo || '');
    if (!periodoValido) {
      setAlertType('error');
      setAlertMessage('Periodo inválido. Usa formato yyyyMM (ej. 202501)');
      return;
    }

    const { fechaIni, fechaFin } = periodoToFechas(formData.periodo);
    try {
      setLoading(true);
      const resp = await facturaService.consultarIntereses({
        cuenta: formData.cuenta,
        fechaIni,
        fechaFin,
      });
      setLoading(false);

      if (resp.exitoso) {
        setConsultaIntereses({
          financiero: resp.financiero,
          financieroIva: resp.financieroIva,
          moratorio: resp.moratorio,
          moratorioIva: resp.moratorioIva,
          codigoRespuesta: resp.codigoRespuesta,
          mensaje: resp.mensaje,
        });
        // Volcar montos al form para payloads existentes
        setFormData(prev => ({
          ...prev,
          interesFinanciero: String(resp.financiero ?? 0),
          ivaInteresFinanciero: String(resp.financieroIva ?? 0),
          interesMoratorio: String(resp.moratorio ?? 0),
          ivaInteresMoratorio: String(resp.moratorioIva ?? 0),
        }));
        setAlertType('success');
        setAlertMessage(`Consulta exitosa. Código: ${resp.codigoRespuesta}`);
      } else {
        setAlertType('error');
        setAlertMessage(resp.mensaje || 'Error en consulta de intereses');
      }
    } catch (e: any) {
      setLoading(false);
      setAlertType('error');
      setAlertMessage(e?.message || 'Error inesperado al consultar intereses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage('');
    setAlertType('');

    // Validación de periodo yyyyMM
    const periodoValido = /^([0-9]{4})(0[1-9]|1[0-2])$/.test(formData.periodo || '');
    if (!periodoValido) {
      alert('Periodo inválido. Usa formato yyyyMM (ej. 202501)');
      return;
    }

    // Requiere consulta previa
    if (!consultaIntereses) {
      setAlertType('error');
      setAlertMessage('Primero consulta los intereses para este periodo');
      return;
    }

    // Importes con selección del usuario
    const interesFinanciero = facturarFinanciero ? (consultaIntereses.financiero ?? 0) : 0;
    const ivaInteresFinanciero = facturarFinanciero ? (consultaIntereses.financieroIva ?? 0) : 0;
    const interesMoratorio = facturarMoratorio ? (consultaIntereses.moratorio ?? 0) : 0;
    const ivaInteresMoratorio = facturarMoratorio ? (consultaIntereses.moratorioIva ?? 0) : 0;

    const idUsuario = getSessionIdUsuario();
    const idTienda = getSessionIdTienda();
    const codigoTienda = getSessionCodigoTienda();
    const rfcCompleto = `${formData.rfcIniciales}${formData.rfcFecha}${formData.rfcHomoclave}`;

    const payload = {
      idUsuario,
      idTienda,
      codigoTienda,
      cuenta: formData.cuenta,
      periodo: formData.periodo,
      // Campos adicionales requeridos por el backend real
      correoElectronico: formData.correoElectronico,
      razonSocial: formData.razonSocial,
      nombre: formData.nombre,
      paterno: formData.paterno,
      materno: formData.materno,
      pais: formData.pais,
      receptor: {
        rfc: rfcCompleto,
        usoCfdi: formData.usoCfdi,
        regimenFiscal: formData.regimenFiscal,
        domicilioFiscal: formData.domicilioFiscal,
      },
      importes: {
        interesFinanciero,
        interesMoratorio,
        ivaInteresFinanciero,
        ivaInteresMoratorio,
      },
      tipo: 'INTERESES' as const,
      medioPago: 'PUE',
      formaPago: '01',
    };

    try {
      setLoading(true);
      const resp = await facturaService.emitirFacturaIntereses(payload);
      setLoading(false);
      // Persistir último periodo usado
      setLastPeriodoIntereses(formData.periodo);
      if (resp.exitoso) {
        const serieFolio = resp.serie && resp.folio ? `${resp.serie}-${resp.folio}` : '';
        const detalles = [
          resp.uuid ? `UUID: ${resp.uuid}` : '',
          serieFolio ? `Serie-Folio: ${serieFolio}` : '',
          resp.fechaEmision ? `Fecha: ${new Date(resp.fechaEmision).toLocaleString()}` : ''
        ].filter(Boolean).join(' | ');
        setAlertType('success');
        setAlertMessage(`${resp.mensaje}${detalles ? ' — ' + detalles : ''}`);
        if (resp.uuid) {
          setTimbradoStatus('4 - EN PROCESO DE EMISION');
          iniciarPollingTimbrado(resp.uuid);
        }
      } else {
        setAlertType('error');
        setAlertMessage(resp.mensaje || 'Error al emitir intereses');
      }
    } catch (err: any) {
      setLoading(false);
      // Persistir último periodo incluso si hubo error, para conveniencia del usuario
      setLastPeriodoIntereses(formData.periodo);
      setAlertType('error');
      setAlertMessage(err?.message || 'Error inesperado al emitir');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {timbradoStatus && (
        <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
          Estado de timbrado: {timbradoStatus}
        </div>
      )}
      <DatosFiscalesSection
        formData={formData}
        handleChange={handleChange}
        onRfcSearchClick={handleRfcSearch}
        isRFCRequired={true}
        isRazonSocialRequired={true}
        isDomicilioFiscalRequired={true}
        isRegimenFiscalRequired={true}
        isUsoCfdiRequired={true}
        isCorreoElectronicoRequired={true}
        rfcDisabled={rfcBloqueado}
        isRegimenFiscalDisabled={receptorValido}
        isUsoCfdiDisabled={receptorValido}
        fieldErrors={fieldErrors}
      />

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Consulta Factura:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <FormField label="Cuenta:" name="cuenta" value={formData.cuenta} onChange={handleChange} required />
          <FormField label="Periodo (yyyyMM):" name="periodo" value={formData.periodo} onChange={handleChange} required />
      </div>
    </Card>

      {/* Montos consultados y selección de emisión */}
      {consultaIntereses && (
        <Card>
          <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-4">Intereses calculados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-black dark:text-white">Interés financiero:</label>
              <span className="text-black dark:text-white">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(consultaIntereses.financiero)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-black dark:text-white">IVA interés financiero:</label>
              <span className="text-black dark:text-white">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(consultaIntereses.financieroIva)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-black dark:text-white">Interés moratorio:</label>
              <span className="text-black dark:text-white">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(consultaIntereses.moratorio)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-black dark:text-white">IVA interés moratorio:</label>
              <span className="text-black dark:text-white">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(consultaIntereses.moratorioIva)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={facturarFinanciero}
                onChange={(e) => setFacturarFinanciero(e.target.checked)}
              />
              <span className="ml-2 text-sm text-black dark:text-white">Facturar interés financiero</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={facturarMoratorio}
                onChange={(e) => setFacturarMoratorio(e.target.checked)}
              />
              <span className="ml-2 text-sm text-black dark:text-white">Facturar interés moratorio</span>
            </label>
          </div>
        </Card>
      )}

      <div className="flex justify-end mt-6">
        <Button type="button" variant="primary" disabled={loading} onClick={handleConsultarIntereses}>
          Consultar Intereses
        </Button>
        <Button type="submit" variant="secondary" disabled={loading || !consultaIntereses} className="ml-3">
          Emitir Factura
        </Button>
      </div>

      {alertType && (
        <div
          className={
            alertType === 'success'
              ? 'mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-800'
              : 'mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800'
          }
          role="alert"
        >
          <p className="font-semibold mb-1">
            {alertType === 'success' ? 'Operación exitosa' : 'Error en operación'}
          </p>
          <p className="text-sm">
            {alertMessage}
          </p>
        </div>
      )}

      {/* Resultado de emisión oculto en la vista */}
    </form>
  );
};
