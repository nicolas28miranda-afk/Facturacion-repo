import React, { useCallback, useEffect, useState } from 'react';
import { Card } from './Card';
import {
  listOperacionItemsParaPage,
  marcarInboxLeidas,
  OPERACION_STORAGE_EVENT,
  patchOperacionItem,
  type OperacionItem,
  type OperacionTipo,
} from '../services/operacionTareasStorage';

type TabId = 'notificaciones' | 'bandeja' | 'historial';

const PAGE_SIZE = 15;
const POLL_MS = 60_000;

function badgeInbox(tipo: OperacionTipo) {
  if (tipo === 'MENSAJE') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
}

function leerNoUsuarioSesion(): string {
  try {
    const raw = window.localStorage.getItem('perfil');
    if (!raw) return '';
    const p = JSON.parse(raw) as { noUsuario?: string };
    return (p?.noUsuario ?? '').trim();
  } catch {
    return '';
  }
}

function labelTipo(t: OperacionTipo): string {
  if (t === 'TAREA') return 'Tarea';
  if (t === 'MENSAJE') return 'Mensaje';
  return 'Notificación';
}

function labelEstado(est: OperacionItem['estado']): string {
  switch (est) {
    case 'PENDIENTE':
      return 'Pendiente';
    case 'LEIDO':
      return 'Leído';
    case 'COMPLETADO':
      return 'Completado';
    case 'ARCHIVADO':
      return 'Archivado';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return est;
  }
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function vencimientoInfo(item: OperacionItem): 'vencida' | 'proxima' | null {
  if (item.tipo !== 'TAREA' || !item.fechaVencimientoIso) return null;
  if (item.estado === 'COMPLETADO' || item.estado === 'CANCELADO' || item.estado === 'ARCHIVADO') return null;
  const v = new Date(item.fechaVencimientoIso).getTime();
  const t0 = startOfTodayMs();
  if (v < t0) return 'vencida';
  const threeDays = t0 + 3 * 86400000;
  if (v <= threeDays) return 'proxima';
  return null;
}

function categoriaPorTab(tab: TabId): 'inbox' | 'tareas' | 'todos' {
  if (tab === 'notificaciones') return 'inbox';
  if (tab === 'bandeja') return 'tareas';
  return 'todos';
}

export const OperacionPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('notificaciones');
  const [items, setItems] = useState<OperacionItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [filtEstado, setFiltEstado] = useState('');
  const [filtTexto, setFiltTexto] = useState('');
  const [filtDesde, setFiltDesde] = useState('');
  const [filtHasta, setFiltHasta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<OperacionItem | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [badgeInboxPendientes, setBadgeInboxPendientes] = useState(0);

  const usuario = leerNoUsuarioSesion();

  const actualizarBadgeInbox = useCallback(async () => {
    if (!usuario) {
      setBadgeInboxPendientes(0);
      return;
    }
    try {
      const r = await listOperacionItemsParaPage({
        para: usuario,
        categoria: 'inbox',
        estado: 'PENDIENTE',
        page: 0,
        size: 1,
      });
      setBadgeInboxPendientes(r.totalElements);
    } catch {
      setBadgeInboxPendientes(0);
    }
  }, [usuario]);

  useEffect(() => {
    void actualizarBadgeInbox();
  }, [actualizarBadgeInbox]);

  const recargar = useCallback(async () => {
    if (!usuario) {
      setItems([]);
      setTotalElements(0);
      setCargando(false);
      setErrorCarga('No hay NO_USUARIO en sesión. Vuelva a iniciar sesión.');
      return;
    }
    setCargando(true);
    setErrorCarga(null);
    try {
      const q = {
        para: usuario,
        categoria: categoriaPorTab(tab),
        page,
        size: PAGE_SIZE,
        ...(filtEstado ? { estado: filtEstado } : {}),
        ...(filtTexto.trim() ? { texto: filtTexto.trim() } : {}),
        ...(filtDesde ? { fechaDesde: filtDesde } : {}),
        ...(filtHasta ? { fechaHasta: filtHasta } : {}),
      };
      const res = await listOperacionItemsParaPage(q);
      setItems(res.items);
      setTotalElements(res.totalElements);
      void actualizarBadgeInbox();
    } catch (err) {
      console.error('Operación: no se pudieron cargar datos desde la API', err);
      setItems([]);
      setTotalElements(0);
      setErrorCarga(err instanceof Error ? err.message : 'Error al cargar desde el servidor.');
    } finally {
      setCargando(false);
    }
  }, [usuario, tab, page, filtEstado, filtTexto, filtDesde, filtHasta, actualizarBadgeInbox]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const fn = () => {
      void actualizarBadgeInbox();
      void recargar();
    };
    window.addEventListener(OPERACION_STORAGE_EVENT, fn);
    return () => window.removeEventListener(OPERACION_STORAGE_EVENT, fn);
  }, [actualizarBadgeInbox, recargar]);

  useEffect(() => {
    if (!autoRefresh || !usuario) return undefined;
    const id = window.setInterval(() => {
      void recargar();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, usuario, recargar]);

  useEffect(() => {
    setPage(0);
  }, [tab, filtEstado, filtTexto, filtDesde, filtHasta]);


  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    void recargar();
  };

  const limpiarFiltros = () => {
    setFiltEstado('');
    setFiltTexto('');
    setFiltDesde('');
    setFiltHasta('');
    setPage(0);
  };

  const marcarLeida = async (id: string) => {
    if (!/^\d+$/.test(id)) return;
    try {
      await patchOperacionItem(id, { estado: 'LEIDO' });
      await recargar();
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTareaCompletada = async (id: string) => {
    if (!/^\d+$/.test(id)) return;
    try {
      await patchOperacionItem(id, { estado: 'COMPLETADO' });
      await recargar();
    } catch (err) {
      console.error(err);
    }
  };

  const archivar = async (id: string) => {
    if (!/^\d+$/.test(id)) return;
    try {
      await patchOperacionItem(id, { estado: 'ARCHIVADO' });
      setDetalle(null);
      await recargar();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelarItem = async (id: string) => {
    if (!/^\d+$/.test(id)) return;
    try {
      await patchOperacionItem(id, { estado: 'CANCELADO' });
      setDetalle(null);
      await recargar();
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodasLeidas = async () => {
    if (!usuario) return;
    try {
      await marcarInboxLeidas(usuario);
      await recargar();
    } catch (err) {
      console.error(err);
      setErrorCarga(err instanceof Error ? err.message : 'Error al marcar leídas');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'notificaciones', label: 'Notificaciones', badge: badgeInboxPendientes > 0 ? badgeInboxPendientes : undefined },
    { id: 'bandeja', label: 'Bandeja de tareas' },
    { id: 'historial', label: 'Historial' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Operación</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Bandeja en <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">TAREAS_OPERACION</code> para{' '}
            <span className="font-mono text-xs">{usuario || '—'}</span>. Las asignaciones las envía{' '}
            <span className="font-medium">Administración → Operación (admin)</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Auto cada {POLL_MS / 1000}s
          </label>
          <button
            type="button"
            onClick={() => {
              void recargar();
            }}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {errorCarga && (
        <div
          className="rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          {errorCarga}
        </div>
      )}

      <Card title="Filtros">
        <form onSubmit={aplicarFiltros} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</label>
            <select
              value={filtEstado}
              onChange={(e) => setFiltEstado(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">(todos)</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="LEIDO">Leído</option>
              <option value="COMPLETADO">Completado</option>
              <option value="ARCHIVADO">Archivado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Texto en asunto</label>
            <input
              value={filtTexto}
              onChange={(e) => setFiltTexto(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Buscar…"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={filtDesde}
              onChange={(e) => setFiltDesde(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input
              type="date"
              value={filtHasta}
              onChange={(e) => setFiltHasta(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            Limpiar
          </button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 items-center">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-b-0 border-gray-200 dark:border-gray-600 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 ? (
              <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs bg-blue-600 text-white">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
        {tab === 'notificaciones' && badgeInboxPendientes > 0 && (
          <button
            type="button"
            onClick={() => {
              void marcarTodasLeidas();
            }}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Marcar todas leídas
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Página {page + 1} de {totalPages} · {totalElements} registros
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 0 || cargando}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page + 1 >= totalPages || cargando}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {cargando ? (
        <Card title="Operación">
          <p className="text-sm text-gray-600 dark:text-gray-400">Obteniendo datos del servidor…</p>
        </Card>
      ) : null}

      {!cargando && tab === 'notificaciones' && (
        <Card title="Notificaciones y mensajes">
          {items.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay mensajes ni notificaciones.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((i) => {
                const leida = i.estado !== 'PENDIENTE';
                return (
                  <li key={i.id} className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setDetalle(i)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${badgeInbox(i.tipo)}`}>{labelTipo(i.tipo)}</span>
                        {!leida && (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Nueva</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">{labelEstado(i.estado)}</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{i.asunto}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-pre-wrap">{i.cuerpo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        De: <span className="font-mono">{i.noUsuarioDe}</span>
                      </p>
                    </button>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(i.fechaIso).toLocaleString()}
                      </span>
                      {!leida && (
                        <button
                          type="button"
                          onClick={() => {
                            void marcarLeida(i.id);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {!cargando && tab === 'bandeja' && (
        <Card title="Bandeja de tareas">
          {items.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay tareas asignadas.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => {
                const pendiente = i.estado === 'PENDIENTE' || i.estado === 'LEIDO';
                const venceTxt = i.fechaVencimientoIso
                  ? new Date(i.fechaVencimientoIso).toLocaleDateString()
                  : '—';
                const ven = vencimientoInfo(i);
                return (
                  <li
                    key={i.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border ${
                      ven === 'vencida'
                        ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                        : ven === 'proxima'
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20'
                    }`}
                  >
                    <button type="button" className="text-left flex-1 min-w-0" onClick={() => setDetalle(i)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{i.asunto}</p>
                        {ven === 'vencida' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white">Vencida</span>
                        )}
                        {ven === 'proxima' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-600 text-white">Por vencer</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap line-clamp-3">
                        {i.cuerpo}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        De: <span className="font-mono">{i.noUsuarioDe}</span> · Vence: {venceTxt}
                      </p>
                    </button>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded self-start sm:self-center ${
                          i.estado === 'COMPLETADO'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                            : i.estado === 'LEIDO'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
                        }`}
                      >
                        {i.estado === 'COMPLETADO'
                          ? 'Completada'
                          : i.estado === 'LEIDO'
                            ? 'En proceso'
                            : 'Pendiente'}
                      </span>
                      {pendiente && i.estado !== 'COMPLETADO' && (
                        <button
                          type="button"
                          onClick={() => {
                            void marcarTareaCompletada(i.id);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Marcar completada
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {!cargando && tab === 'historial' && (
        <Card title="Historial">
          {items.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                    <th className="pb-2 pr-4 font-medium">Fecha</th>
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="pb-2 pr-4 font-medium">Estado</th>
                    <th className="pb-2 pr-4 font-medium">Asunto</th>
                    <th className="pb-2 font-medium">De</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((i) => (
                    <tr
                      key={i.id}
                      className="text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setDetalle(i)}
                    >
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">
                        {new Date(i.fechaIso).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{labelTipo(i.tipo)}</td>
                      <td className="py-2 pr-4">{labelEstado(i.estado)}</td>
                      <td className="py-2 pr-4 max-w-xs truncate" title={i.asunto}>
                        {i.asunto}
                      </td>
                      <td className="py-2 font-mono text-xs">{i.noUsuarioDe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-6">{detalle.asunto}</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setDetalle(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {labelTipo(detalle.tipo)} · {labelEstado(detalle.estado)} · {new Date(detalle.fechaIso).toLocaleString()}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{detalle.cuerpo}</p>
            <p className="text-xs text-gray-500">
              De <span className="font-mono">{detalle.noUsuarioDe}</span> →{' '}
              <span className="font-mono">{detalle.noUsuarioPara}</span>
            </p>
            {detalle.fechaVencimientoIso && (
              <p className="text-xs text-gray-500">
                Vencimiento: {new Date(detalle.fechaVencimientoIso).toLocaleString()}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              {detalle.estado === 'PENDIENTE' && (detalle.tipo === 'MENSAJE' || detalle.tipo === 'NOTIFICACION') && (
                <button
                  type="button"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    void marcarLeida(detalle.id);
                    setDetalle(null);
                  }}
                >
                  Marcar leída
                </button>
              )}
              {detalle.tipo === 'TAREA' &&
                detalle.estado !== 'COMPLETADO' &&
                detalle.estado !== 'CANCELADO' &&
                detalle.estado !== 'ARCHIVADO' && (
                  <button
                    type="button"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => {
                      void marcarTareaCompletada(detalle.id);
                      setDetalle(null);
                    }}
                  >
                    Marcar completada
                  </button>
                )}
              {detalle.estado !== 'ARCHIVADO' && detalle.estado !== 'CANCELADO' && (
                <button
                  type="button"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                  onClick={() => {
                    void archivar(detalle.id);
                  }}
                >
                  Archivar
                </button>
              )}
              {detalle.estado !== 'CANCELADO' && (
                <button
                  type="button"
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  onClick={() => {
                    void cancelarItem(detalle.id);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
