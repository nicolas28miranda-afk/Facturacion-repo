import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FaClipboardList, FaUser } from 'react-icons/fa';
import {
  consultarAdminFacturasAcciones,
  ComprobanteAdminItem,
  ResumenUsuarioItem,
  TIPOS_FACTURA_FILTRO,
  UsuarioCatalogoItem,
} from '../services/adminFacturasAccionesService';
import { facturaService } from '../services/facturaService';
import { correoService } from '../services/correoService';

type FiltroFecha = 'hoy' | 'mes' | 'personalizado';

const moduloBadgeClass = (modulo: string): string => {
  if (modulo.includes('Nota')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (modulo.includes('Nómina')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (modulo.includes('Carta')) return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
  if (modulo.includes('Complemento')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (modulo.includes('Retención')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
};

export const AdminFacturasAccionesPage: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [tipoFacturaFiltro, setTipoFacturaFiltro] = useState('');
  const [estatusFiltro, setEstatusFiltro] = useState('');
  const [usuariosCatalogo, setUsuariosCatalogo] = useState<UsuarioCatalogoItem[]>([]);
  const [resumenUsuarios, setResumenUsuarios] = useState<ResumenUsuarioItem[]>([]);
  const [comprobantes, setComprobantes] = useState<ComprobanteAdminItem[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [detalleUuid, setDetalleUuid] = useState<ComprobanteAdminItem | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const obtenerFechasPorFiltro = useCallback((filtro: FiltroFecha): { inicio: string; fin: string } => {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date = new Date(hoy);
    switch (filtro) {
      case 'hoy':
        inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'personalizado':
        return { inicio: fechaInicio || '', fin: fechaFin || '' };
      default:
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }
    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
    };
  }, [fechaInicio, fechaFin]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const fechas = obtenerFechasPorFiltro(filtroFecha);
      const resp = await consultarAdminFacturasAcciones({
        usuario: usuarioFiltro.trim() || undefined,
        fechaInicio: fechas.inicio || undefined,
        fechaFin: fechas.fin || undefined,
        tipoFactura: tipoFacturaFiltro ? Number(tipoFacturaFiltro) : undefined,
        estatus: estatusFiltro.trim() || undefined,
      });
      if (!resp.exitoso) {
        setError(resp.mensaje || 'No se pudo consultar');
        setComprobantes([]);
        setResumenUsuarios([]);
        return;
      }
      setUsuariosCatalogo(resp.usuariosCatalogo || []);
      setResumenUsuarios(resp.resumenUsuarios || []);
      setComprobantes(resp.comprobantes || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de consulta');
      setComprobantes([]);
      setResumenUsuarios([]);
    } finally {
      setCargando(false);
    }
  }, [filtroFecha, usuarioFiltro, tipoFacturaFiltro, estatusFiltro, obtenerFechasPorFiltro]);

  useEffect(() => {
    void cargar();
  }, []);

  const comprobantesVisibles = useMemo(() => {
    if (!usuarioSeleccionado) return comprobantes;
    return comprobantes.filter((c) => c.usuarioId === usuarioSeleccionado);
  }, [comprobantes, usuarioSeleccionado]);

  const resumenSeleccionado = useMemo(
    () => resumenUsuarios.find((r) => r.usuarioId === usuarioSeleccionado),
    [resumenUsuarios, usuarioSeleccionado]
  );

  const formatearMoneda = (valor?: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor ?? 0);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return fecha;
    }
  };

  const requiereUuid = (c: ComprobanteAdminItem) => {
    if (!c.uuid?.trim()) {
      alert('Este comprobante no tiene UUID timbrado.');
      return false;
    }
    return true;
  };

  const descargarXml = async (c: ComprobanteAdminItem) => {
    if (!requiereUuid(c)) return;
    setAccionEnCurso(`xml-${c.uuid}`);
    try {
      await facturaService.generarYDescargarXML(c.uuid!);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al descargar XML');
    } finally {
      setAccionEnCurso(null);
    }
  };

  const descargarPdf = async (c: ComprobanteAdminItem) => {
    if (!requiereUuid(c)) return;
    setAccionEnCurso(`pdf-${c.uuid}`);
    try {
      await facturaService.generarYDescargarPDF(c.uuid!);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al descargar PDF');
    } finally {
      setAccionEnCurso(null);
    }
  };

  const enviarCorreo = async (c: ComprobanteAdminItem) => {
    if (!requiereUuid(c)) return;
    const correo = window.prompt('Correo del receptor:', '')?.trim();
    if (!correo) return;
    setAccionEnCurso(`correo-${c.uuid}`);
    try {
      const asunto = `CFDI ${c.serie || ''}-${c.folio || ''}`.trim();
      const resp = await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: c.uuid!,
        correoReceptor: correo,
        asunto: asunto || 'Comprobante fiscal',
        mensaje: `Se adjunta el comprobante fiscal.\nUUID: ${c.uuid}\nMódulo: ${c.modulo}`,
      });
      if (resp?.simulado) {
        alert(`Modo simulado: ${resp.message || 'No se envió por SMTP real.'}`);
      } else if (resp?.success) {
        alert(`Correo enviado a ${correo}`);
      } else {
        alert(resp?.message || 'No se pudo enviar el correo');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al enviar correo');
    } finally {
      setAccionEnCurso(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <FaClipboardList className="w-6 h-6 text-primary dark:text-secondary" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Administrar facturas – acciones
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Supervisión de comprobantes emitidos por usuario (consulta a FACTURAS y USUARIOS). Descarga, reenvío de
          correo y detalle por UUID.
        </p>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario (login o nombre)
              </label>
              <input
                list="usuarios-catalogo"
                type="text"
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
                placeholder="Ej. admin, 12…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <datalist id="usuarios-catalogo">
                {usuariosCatalogo.map((u) => (
                  <option key={u.usuarioId} value={u.noUsuario}>
                    {u.nombreEmpleado}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                value={tipoFacturaFiltro}
                onChange={(e) => setTipoFacturaFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {TIPOS_FACTURA_FILTRO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
              <input
                type="text"
                value={estatusFiltro}
                onChange={(e) => setEstatusFiltro(e.target.value)}
                placeholder="TIMBRADA, VIGENTE…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <Button
                type="button"
                variant={filtroFecha === 'hoy' ? 'primary' : 'neutral'}
                size="sm"
                onClick={() => setFiltroFecha('hoy')}
              >
                Hoy
              </Button>
              <Button
                type="button"
                variant={filtroFecha === 'mes' ? 'primary' : 'neutral'}
                size="sm"
                onClick={() => setFiltroFecha('mes')}
              >
                Mes
              </Button>
              <Button
                type="button"
                variant={filtroFecha === 'personalizado' ? 'primary' : 'neutral'}
                size="sm"
                onClick={() => setFiltroFecha('personalizado')}
              >
                Rango
              </Button>
            </div>
          </div>

          {filtroFecha === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          )}

          <Button type="button" variant="primary" onClick={() => void cargar()} disabled={cargando}>
            {cargando ? 'Consultando…' : 'Consultar'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md border border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
      </Card>

      {resumenUsuarios.length > 0 && (
        <Card title="Resumen por usuario">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Usuario</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Comprobantes</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Importe</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Última emisión</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Desglose</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {resumenUsuarios.map((r) => (
                  <tr
                    key={r.usuarioId}
                    className={
                      usuarioSeleccionado === r.usuarioId
                        ? 'bg-primary/10 dark:bg-primary/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {r.nombreEmpleado || r.noUsuario || r.usuarioId}
                          </div>
                          <div className="text-xs text-gray-500">{r.noUsuario || r.usuarioId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">{r.totalComprobantes}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatearMoneda(r.totalImporte)}</td>
                    <td className="px-3 py-2">{formatearFecha(r.ultimaEmision)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      Art. {r.facturasArticulos} · NC {r.notasCredito} · Nom {r.nominas} · CP {r.cartasPorte} · REP{' '}
                      {r.complementosPago} · Ret {r.retenciones}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={usuarioSeleccionado === r.usuarioId ? 'primary' : 'secondary'}
                        onClick={() =>
                          setUsuarioSeleccionado(
                            usuarioSeleccionado === r.usuarioId ? null : r.usuarioId
                          )
                        }
                      >
                        {usuarioSeleccionado === r.usuarioId ? 'Quitar filtro' : 'Ver comprobantes'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card
        title={
          usuarioSeleccionado && resumenSeleccionado
            ? `Comprobantes – ${resumenSeleccionado.nombreEmpleado || resumenSeleccionado.noUsuario}`
            : 'Comprobantes (máx. 500 más recientes)'
        }
      >
        {cargando ? (
          <p className="text-center py-8 text-gray-500">Cargando…</p>
        ) : comprobantesVisibles.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Sin resultados para los filtros aplicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left">Módulo</th>
                  <th className="px-3 py-2 text-left">Serie-Folio</th>
                  <th className="px-3 py-2 text-left">Receptor</th>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Estatus</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comprobantesVisibles.map((c) => (
                  <tr key={c.uuid || `${c.serie}-${c.folio}-${c.fecha}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${moduloBadgeClass(c.modulo)}`}>
                        {c.modulo}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {c.serie && c.folio ? `${c.serie}-${c.folio}` : '—'}
                    </td>
                    <td className="px-3 py-2 max-w-[160px] truncate" title={c.receptorRazonSocial}>
                      {c.receptorRazonSocial || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.noUsuario || c.usuarioId}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatearMoneda(c.total)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(c.fecha)}</td>
                    <td className="px-3 py-2 text-xs">{c.estatusFacturacion || c.estatusSat || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" size="sm" variant="neutral" onClick={() => setDetalleUuid(c)}>
                          Detalle
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!c.uuid || accionEnCurso === `xml-${c.uuid}`}
                          onClick={() => void descargarXml(c)}
                        >
                          XML
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!c.uuid || accionEnCurso === `pdf-${c.uuid}`}
                          onClick={() => void descargarPdf(c)}
                        >
                          PDF
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!c.uuid || accionEnCurso === `correo-${c.uuid}`}
                          onClick={() => void enviarCorreo(c)}
                        >
                          Correo
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detalleUuid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalle del comprobante</h3>
            <dl className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
              <div>
                <dt className="font-medium">UUID</dt>
                <dd className="break-all">{detalleUuid.uuid || '—'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="font-medium">Módulo</dt>
                  <dd>{detalleUuid.modulo}</dd>
                </div>
                <div>
                  <dt className="font-medium">Tipo BD</dt>
                  <dd>{detalleUuid.tipoFactura ?? '—'}</dd>
                </div>
              </div>
              <div>
                <dt className="font-medium">Emisor en sistema</dt>
                <dd>
                  {detalleUuid.nombreUsuario} ({detalleUuid.noUsuario || detalleUuid.usuarioId})
                </dd>
              </div>
              <div>
                <dt className="font-medium">Receptor</dt>
                <dd>
                  {detalleUuid.receptorRazonSocial} — {detalleUuid.receptorRfc}
                </dd>
              </div>
              {detalleUuid.uuidOrigen && (
                <div>
                  <dt className="font-medium">UUID origen</dt>
                  <dd className="break-all">{detalleUuid.uuidOrigen}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="neutral" onClick={() => setDetalleUuid(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};
