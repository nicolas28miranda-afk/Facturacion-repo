import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { apiUrl } from '../services/api';
import {
  addOperacionBulk,
  addOperacionItem,
  listOperacionItemsAdminPage,
  OPERACION_STORAGE_EVENT,
  patchOperacionItem,
  patchReasignarOperacionItem,
  type OperacionEstado,
  type OperacionItem,
  type OperacionTipo,
  type TodasQuery,
} from '../services/operacionTareasStorage';

const TEMPLATES_LS = 'cibercom.operacion.admin.templates.v1';

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

const TIPOS: { value: OperacionTipo; label: string }[] = [
  { value: 'TAREA', label: 'Tarea (bandeja del operador)' },
  { value: 'MENSAJE', label: 'Mensaje' },
  { value: 'NOTIFICACION', label: 'Notificación' },
];

type SortKey = 'fechaIso' | 'tipo' | 'noUsuarioPara' | 'noUsuarioDe' | 'asunto' | 'estado';

interface EmpleadoOpt {
  noUsuario: string;
  nombreEmpleado: string;
}

function parseDestinatariosMultiples(raw: string): string[] {
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

function leerPlantillas(): { nombre: string; tipo: OperacionTipo; asunto: string; cuerpo: string }[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_LS);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as { nombre: string; tipo: OperacionTipo; asunto: string; cuerpo: string }[]) : [];
  } catch {
    return [];
  }
}

function guardarPlantillas(
  list: { nombre: string; tipo: OperacionTipo; asunto: string; cuerpo: string }[],
) {
  localStorage.setItem(TEMPLATES_LS, JSON.stringify(list.slice(0, 20)));
}

export const OperacionAdminPage: React.FC = () => {
  const [items, setItems] = useState<OperacionItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 25;
  const [query, setQuery] = useState<TodasQuery>({ page: 0, size: 25 });

  const [filtPara, setFiltPara] = useState('');
  const [filtDe, setFiltDe] = useState('');
  const [filtTipo, setFiltTipo] = useState('');
  const [filtEstado, setFiltEstado] = useState('');
  const [filtTexto, setFiltTexto] = useState('');
  const [filtDesde, setFiltDesde] = useState('');
  const [filtHasta, setFiltHasta] = useState('');

  const [noUsuarioPara, setNoUsuarioPara] = useState('');
  const [destinatariosBulk, setDestinatariosBulk] = useState('');
  const [modoBulk, setModoBulk] = useState(false);
  const [tipo, setTipo] = useState<OperacionTipo>('TAREA');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [sugerencias, setSugerencias] = useState<EmpleadoOpt[]>([]);
  const [busquedaEmp, setBusquedaEmp] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('fechaIso');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [plantillas, setPlantillas] = useState(leerPlantillas());
  const [nombrePlantilla, setNombrePlantilla] = useState('');

  const [reasignarPorId, setReasignarPorId] = useState<Record<string, string>>({});
  const [estadoPorId, setEstadoPorId] = useState<Record<string, OperacionEstado>>({});

  const recargar = useCallback(async () => {
    try {
      const res = await listOperacionItemsAdminPage(query);
      setItems(res.items);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotalElements(0);
      setMensaje({
        tipo: 'error',
        texto:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el listado. ¿Backend en marcha y cabecera admin si aplica?',
      });
    }
  }, [query]);

  const aplicarBusqueda = (nuevaPagina: number) => {
    setQuery({
      ...(filtPara.trim() ? { para: filtPara.trim() } : {}),
      ...(filtDe.trim() ? { de: filtDe.trim() } : {}),
      ...(filtTipo ? { tipo: filtTipo } : {}),
      ...(filtEstado ? { estado: filtEstado } : {}),
      ...(filtTexto.trim() ? { texto: filtTexto.trim() } : {}),
      ...(filtDesde ? { fechaDesde: filtDesde } : {}),
      ...(filtHasta ? { fechaHasta: filtHasta } : {}),
      page: nuevaPagina,
      size: pageSize,
    });
  };

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const fn = () => {
      void recargar();
    };
    window.addEventListener(OPERACION_STORAGE_EVENT, fn);
    return () => window.removeEventListener(OPERACION_STORAGE_EVENT, fn);
  }, [recargar]);

  useEffect(() => {
    const q = busquedaEmp.trim();
    if (q.length < 2) {
      setSugerencias([]);
      return undefined;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams();
          params.set('nombreEmpleado', q);
          const res = await fetch(apiUrl(`/usuarios/empleados?${params.toString()}`));
          if (!res.ok) return;
          const data = (await res.json()) as { noUsuario?: string; nombreEmpleado?: string }[];
          if (!Array.isArray(data)) return;
          setSugerencias(
            data
              .filter((e) => e.noUsuario)
              .slice(0, 12)
              .map((e) => ({
                noUsuario: String(e.noUsuario),
                nombreEmpleado: String(e.nombreEmpleado ?? ''),
              })),
          );
        } catch {
          setSugerencias([]);
        }
      })();
    }, 300);
    return () => window.clearTimeout(t);
  }, [busquedaEmp]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const de = leerNoUsuarioSesion();
    const para = noUsuarioPara.trim();
    if (!de) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario en sesión (perfil). Inicie sesión de nuevo.' });
      return;
    }
    if (!asunto.trim()) {
      setMensaje({ tipo: 'error', texto: 'El asunto es obligatorio.' });
      return;
    }
    try {
      if (modoBulk) {
        const lista = parseDestinatariosMultiples(destinatariosBulk);
        if (lista.length === 0) {
          setMensaje({ tipo: 'error', texto: 'Indique al menos un NO_USUARIO (coma o salto de línea).' });
          return;
        }
        await addOperacionBulk({
          tipo,
          asunto: asunto.trim(),
          cuerpo: cuerpo.trim(),
          noUsuarioDe: de,
          noUsuariosPara: lista,
          fechaVencimientoIso: tipo === 'TAREA' && fechaVencimiento ? `${fechaVencimiento}T23:59:59` : undefined,
        });
        setMensaje({ tipo: 'ok', texto: `Enviado a ${lista.length} destinatario(s).` });
      } else {
        if (!para) {
          setMensaje({ tipo: 'error', texto: 'Indique el NO_USUARIO del operador destino.' });
          return;
        }
        await addOperacionItem({
          tipo,
          asunto: asunto.trim(),
          cuerpo: cuerpo.trim(),
          noUsuarioDe: de,
          noUsuarioPara: para,
          fechaVencimientoIso: tipo === 'TAREA' && fechaVencimiento ? `${fechaVencimiento}T23:59:59` : undefined,
        });
        setMensaje({ tipo: 'ok', texto: `Registrado en BD para "${para}".` });
      }
      setAsunto('');
      setCuerpo('');
      setFechaVencimiento('');
      setDestinatariosBulk('');
      await recargar();
    } catch (err) {
      const texto = err instanceof Error ? err.message : 'Error al guardar.';
      setMensaje({ tipo: 'error', texto });
    }
  };

  const badgeEstado = (est: OperacionEstado) => {
    if (est === 'PENDIENTE') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';
    if (est === 'LEIDO') return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    if (est === 'COMPLETADO') return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  };

  const resumen = useMemo(() => {
    const porTipo = { TAREA: 0, MENSAJE: 0, NOTIFICACION: 0 };
    for (const i of items) {
      porTipo[i.tipo]++;
    }
    return porTipo;
  }, [items]);

  const filasOrdenadas = useMemo(() => {
    const copy = [...items];
    const mul = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortKey === 'fechaIso') {
        va = new Date(a.fechaIso).getTime();
        vb = new Date(b.fechaIso).getTime();
      } else {
        va = String(a[sortKey] ?? '');
        vb = String(b[sortKey] ?? '');
      }
      if (va < vb) return -1 * mul;
      if (va > vb) return 1 * mul;
      return 0;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir(k === 'fechaIso' ? 'desc' : 'asc');
    }
  };

  const exportarCsv = () => {
    const sep = ';';
    const head = ['id', 'fechaIso', 'tipo', 'para', 'de', 'estado', 'asunto'];
    const lines = [head.join(sep)];
    for (const r of filasOrdenadas) {
      lines.push(
        [r.id, r.fechaIso, r.tipo, r.noUsuarioPara, r.noUsuarioDe, r.estado, `"${(r.asunto || '').replace(/"/g, '""')}"`].join(
          sep,
        ),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tareas-operacion-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guardarComoPlantilla = () => {
    const nombre = nombrePlantilla.trim() || `Plantilla ${plantillas.length + 1}`;
    const next = [{ nombre, tipo, asunto: asunto.trim(), cuerpo: cuerpo.trim() }, ...plantillas].slice(0, 20);
    setPlantillas(next);
    guardarPlantillas(next);
    setNombrePlantilla('');
    setMensaje({ tipo: 'ok', texto: 'Plantilla guardada en este navegador.' });
  };

  const aplicarPlantilla = (p: { tipo: OperacionTipo; asunto: string; cuerpo: string }) => {
    setTipo(p.tipo);
    setAsunto(p.asunto);
    setCuerpo(p.cuerpo);
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Operación (administración)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Asigna tareas y mensajes. Si en backend defines <code className="text-xs">TAREAS_OPERACION_ADMIN_SECRET</code> y en
          el front <code className="text-xs">VITE_TAREAS_OPERACION_ADMIN_SECRET</code>, envía la misma clave en la cabecera{' '}
          <code className="text-xs">X-Tareas-Operacion-Admin</code>.
        </p>
      </div>

      <Card title="Nueva asignación">
        <form onSubmit={enviar} className="space-y-4 max-w-2xl">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={modoBulk} onChange={(e) => setModoBulk(e.target.checked)} />
            Envío masivo (varios NO_USUARIO, uno por línea o separados por coma)
          </label>

          {!modoBulk ? (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destino (NO_USUARIO)
              </label>
              <input
                type="text"
                value={noUsuarioPara}
                onChange={(e) => {
                  setNoUsuarioPara(e.target.value);
                  setBusquedaEmp(e.target.value);
                  setMostrarSugerencias(true);
                }}
                onFocus={() => setMostrarSugerencias(true)}
                onBlur={() => window.setTimeout(() => setMostrarSugerencias(false), 200)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Buscar por nombre o escribir usuario"
                autoComplete="off"
              />
              {mostrarSugerencias && sugerencias.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg text-sm">
                  {sugerencias.map((s) => (
                    <li key={s.noUsuario}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setNoUsuarioPara(s.noUsuario);
                          setBusquedaEmp('');
                          setMostrarSugerencias(false);
                        }}
                      >
                        <span className="font-mono text-xs">{s.noUsuario}</span>
                        {s.nombreEmpleado ? (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">{s.nombreEmpleado}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destinatarios (NO_USUARIO)
              </label>
              <textarea
                value={destinatariosBulk}
                onChange={(e) => setDestinatariosBulk(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                placeholder={'oper1\noper2\noper3'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as OperacionTipo)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Resumen breve"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle</label>
            <textarea
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Instrucciones o contexto"
            />
          </div>
          {tipo === 'TAREA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vencimiento (opcional)
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full max-w-xs border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-end border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre plantilla</label>
              <input
                value={nombrePlantilla}
                onChange={(e) => setNombrePlantilla(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800"
                placeholder="Ej. Cierre diario"
              />
            </div>
            <Button type="button" variant="secondary" onClick={guardarComoPlantilla}>
              Guardar plantilla (local)
            </Button>
          </div>
          {plantillas.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Plantillas: </span>
              {plantillas.map((p) => (
                <button
                  key={p.nombre}
                  type="button"
                  className="mr-2 mb-1 text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => aplicarPlantilla(p)}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}

          {mensaje && (
            <p
              className={`text-sm rounded-md px-3 py-2 ${
                mensaje.tipo === 'ok'
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}
            >
              {mensaje.texto}
            </p>
          )}
          <Button type="submit" variant="primary">
            {modoBulk ? 'Enviar a todos' : 'Enviar al operador'}
          </Button>
        </form>
      </Card>

      <Card title="Registro (filtrado en servidor)">
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-2 items-end">
            <input
              placeholder="Para (NO_USUARIO)"
              value={filtPara}
              onChange={(e) => setFiltPara(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            />
            <input
              placeholder="De (NO_USUARIO)"
              value={filtDe}
              onChange={(e) => setFiltDe(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            />
            <select
              value={filtTipo}
              onChange={(e) => setFiltTipo(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            >
              <option value="">Tipo</option>
              <option value="TAREA">TAREA</option>
              <option value="MENSAJE">MENSAJE</option>
              <option value="NOTIFICACION">NOTIFICACION</option>
            </select>
            <select
              value={filtEstado}
              onChange={(e) => setFiltEstado(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            >
              <option value="">Estado</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="LEIDO">LEIDO</option>
              <option value="COMPLETADO">COMPLETADO</option>
              <option value="ARCHIVADO">ARCHIVADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
            <input
              placeholder="Asunto contiene"
              value={filtTexto}
              onChange={(e) => setFiltTexto(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 min-w-[120px]"
            />
            <input
              type="date"
              value={filtDesde}
              onChange={(e) => setFiltDesde(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            />
            <input
              type="date"
              value={filtHasta}
              onChange={(e) => setFiltHasta(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                aplicarBusqueda(0);
              }}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFiltPara('');
                setFiltDe('');
                setFiltTipo('');
                setFiltEstado('');
                setFiltTexto('');
                setFiltDesde('');
                setFiltHasta('');
                setQuery({ page: 0, size: pageSize });
              }}
            >
              Limpiar filtros
            </Button>
            <Button type="button" variant="secondary" onClick={exportarCsv}>
              Exportar CSV (página ordenada)
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tareas: {resumen.TAREA} · Mensajes: {resumen.MENSAJE} · Notificaciones: {resumen.NOTIFICACION} · Total BD:{' '}
            {totalElements}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Página {(query.page ?? 0) + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={(query.page ?? 0) <= 0}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                onClick={() => aplicarBusqueda(Math.max(0, (query.page ?? 0) - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={(query.page ?? 0) + 1 >= totalPages}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                onClick={() => aplicarBusqueda((query.page ?? 0) + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Sin registros con los filtros actuales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  {(['fechaIso', 'tipo', 'noUsuarioPara', 'noUsuarioDe', 'asunto', 'estado'] as SortKey[]).map((k) => (
                    <th key={k} className="pb-2 pr-3 font-medium">
                      <button type="button" className="hover:underline" onClick={() => toggleSort(k)}>
                        {k === 'fechaIso'
                          ? 'Fecha'
                          : k === 'noUsuarioPara'
                            ? 'Para'
                            : k === 'noUsuarioDe'
                              ? 'De'
                              : k}
                        {sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </button>
                    </th>
                  ))}
                  <th className="pb-2 pr-3 font-medium">Acciones admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filasOrdenadas.map((row) => (
                  <tr key={row.id} className="text-gray-800 dark:text-gray-200 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {new Date(row.fechaIso).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{row.tipo}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{row.noUsuarioPara}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{row.noUsuarioDe}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={row.asunto}>
                      {row.asunto}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${badgeEstado(row.estado)}`}>{row.estado}</span>
                    </td>
                    <td className="py-2 pr-2 space-y-2 min-w-[220px]">
                      <div className="flex flex-wrap gap-1 items-center">
                        <select
                          value={estadoPorId[row.id] ?? row.estado}
                          onChange={(e) =>
                            setEstadoPorId((m) => ({ ...m, [row.id]: e.target.value as OperacionEstado }))
                          }
                          className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-800"
                        >
                          {(['PENDIENTE', 'LEIDO', 'COMPLETADO', 'ARCHIVADO', 'CANCELADO'] as OperacionEstado[]).map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ),
                          )}
                        </select>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            const st = estadoPorId[row.id] ?? row.estado;
                            void patchOperacionItem(row.id, { estado: st }).then(() => recargar());
                          }}
                        >
                          Guardar estado
                        </button>
                      </div>
                      <div className="flex gap-1 items-center">
                        <input
                          placeholder="Reasignar a"
                          value={reasignarPorId[row.id] ?? ''}
                          onChange={(e) =>
                            setReasignarPorId((m) => ({ ...m, [row.id]: e.target.value }))
                          }
                          className="text-xs border rounded px-1 py-0.5 w-28 font-mono bg-white dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
                          onClick={() => {
                            const u = (reasignarPorId[row.id] ?? '').trim();
                            if (!u) return;
                            void patchReasignarOperacionItem(row.id, u).then(() => recargar());
                          }}
                        >
                          Reasignar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
