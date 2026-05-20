import { apiUrl } from './api';

export type OperacionTipo = 'TAREA' | 'MENSAJE' | 'NOTIFICACION';

export type OperacionEstado = 'PENDIENTE' | 'LEIDO' | 'COMPLETADO' | 'ARCHIVADO' | 'CANCELADO';

export interface OperacionItem {
  id: string;
  tipo: OperacionTipo;
  asunto: string;
  cuerpo: string;
  noUsuarioDe: string;
  noUsuarioPara: string;
  fechaIso: string;
  estado: OperacionEstado;
  fechaVencimientoIso?: string;
}

export type OperacionCategoria = 'inbox' | 'tareas' | 'todos';

export interface OperacionPage {
  items: OperacionItem[];
  totalElements: number;
}

export const OPERACION_STORAGE_EVENT = 'cibercom.operacion.updated';

function emitUpdated() {
  window.dispatchEvent(new CustomEvent(OPERACION_STORAGE_EVENT));
}

/** Si el backend tiene app.tareas-operacion.admin-secret, enviar el mismo valor en esta cabecera. */
export function operacionAdminHeaders(): Record<string, string> {
  const secret = import.meta.env?.VITE_TAREAS_OPERACION_ADMIN_SECRET as string | undefined;
  if (secret && String(secret).trim().length > 0) {
    return { 'X-Tareas-Operacion-Admin': String(secret).trim() };
  }
  return {};
}

function isOperacionTipo(x: string): x is OperacionTipo {
  return x === 'TAREA' || x === 'MENSAJE' || x === 'NOTIFICACION';
}

function isOperacionEstado(x: string): x is OperacionEstado {
  return ['PENDIENTE', 'LEIDO', 'COMPLETADO', 'ARCHIVADO', 'CANCELADO'].includes(x);
}

function mapDto(raw: unknown): OperacionItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const id = d.id != null ? String(d.id) : '';
  const tipo = typeof d.tipo === 'string' && isOperacionTipo(d.tipo) ? d.tipo : null;
  const estado = typeof d.estado === 'string' && isOperacionEstado(d.estado) ? d.estado : null;
  if (!id || !tipo || !estado) return null;
  return {
    id,
    tipo,
    asunto: typeof d.asunto === 'string' ? d.asunto : '',
    cuerpo: typeof d.cuerpo === 'string' ? d.cuerpo : '',
    noUsuarioDe: typeof d.noUsuarioDe === 'string' ? d.noUsuarioDe : '',
    noUsuarioPara: typeof d.noUsuarioPara === 'string' ? d.noUsuarioPara : '',
    fechaIso: typeof d.fechaIso === 'string' ? d.fechaIso : new Date().toISOString(),
    estado,
    fechaVencimientoIso:
      typeof d.fechaVencimientoIso === 'string' ? d.fechaVencimientoIso : undefined,
  };
}

function parsePage(res: Response, data: unknown): OperacionPage {
  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const content = o.content;
    const total = typeof o.totalElements === 'number' ? o.totalElements : 0;
    if (Array.isArray(content)) {
      const items = content.map(mapDto).filter((x): x is OperacionItem => x != null);
      return { items, totalElements: total };
    }
  }
  if (Array.isArray(data)) {
    const items = data.map(mapDto).filter((x): x is OperacionItem => x != null);
    return { items, totalElements: items.length };
  }
  return { items: [], totalElements: 0 };
}

async function readErrorBody(res: Response, data: unknown): Promise<string> {
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: string }).message === 'string') {
    return (data as { message: string }).message;
  }
  return `Error ${res.status}`;
}

export interface RecibidasQuery {
  para: string;
  tipo?: string;
  estado?: string;
  texto?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: OperacionCategoria;
  page?: number;
  size?: number;
}

export async function listOperacionItemsParaPage(q: RecibidasQuery): Promise<OperacionPage> {
  const params = new URLSearchParams();
  params.set('para', q.para.trim());
  if (q.tipo) params.set('tipo', q.tipo);
  if (q.estado) params.set('estado', q.estado);
  if (q.texto) params.set('texto', q.texto);
  if (q.fechaDesde) params.set('fechaDesde', q.fechaDesde);
  if (q.fechaHasta) params.set('fechaHasta', q.fechaHasta);
  if (q.categoria) params.set('categoria', q.categoria);
  if (q.page != null) params.set('page', String(q.page));
  if (q.size != null) params.set('size', String(q.size));
  const res = await fetch(apiUrl(`/tareas-operacion/recibidas?${params.toString()}`));
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  return parsePage(res, data);
}

/** Compatibilidad: devuelve todas las filas del primer “página” grande (sin filtro de categoría). */
export async function listOperacionItemsPara(noUsuarioPara: string): Promise<OperacionItem[]> {
  const p = await listOperacionItemsParaPage({
    para: noUsuarioPara,
    categoria: 'todos',
    page: 0,
    size: 5000,
  });
  return p.items;
}

export interface TodasQuery {
  para?: string;
  de?: string;
  tipo?: string;
  estado?: string;
  texto?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  size?: number;
}

export async function listOperacionItemsAdminPage(q: TodasQuery): Promise<OperacionPage> {
  const params = new URLSearchParams();
  if (q.para) params.set('para', q.para);
  if (q.de) params.set('de', q.de);
  if (q.tipo) params.set('tipo', q.tipo);
  if (q.estado) params.set('estado', q.estado);
  if (q.texto) params.set('texto', q.texto);
  if (q.fechaDesde) params.set('fechaDesde', q.fechaDesde);
  if (q.fechaHasta) params.set('fechaHasta', q.fechaHasta);
  if (q.page != null) params.set('page', String(q.page));
  if (q.size != null) params.set('size', String(q.size));
  const qs = params.toString();
  const res = await fetch(apiUrl(`/tareas-operacion/todas${qs ? `?${qs}` : ''}`), {
    headers: { ...operacionAdminHeaders() },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  return parsePage(res, data);
}

export async function listOperacionItems(): Promise<OperacionItem[]> {
  const res = await fetch(apiUrl('/tareas-operacion/todas'), {
    headers: { ...operacionAdminHeaders() },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  return parsePage(res, data).items;
}

export async function addOperacionItem(
  input: Omit<OperacionItem, 'id' | 'fechaIso' | 'estado'> & {
    estado?: OperacionEstado;
  },
): Promise<OperacionItem> {
  const body = {
    tipo: input.tipo,
    asunto: input.asunto,
    cuerpo: input.cuerpo ?? '',
    noUsuarioDe: input.noUsuarioDe,
    noUsuarioPara: input.noUsuarioPara,
    fechaVencimientoIso: input.fechaVencimientoIso,
  };
  const res = await fetch(apiUrl('/tareas-operacion'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...operacionAdminHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  const mapped = mapDto(data);
  if (!mapped) throw new Error('Respuesta inválida del servidor');
  emitUpdated();
  return mapped;
}

export async function addOperacionBulk(input: {
  tipo: OperacionTipo;
  asunto: string;
  cuerpo: string;
  noUsuarioDe: string;
  noUsuariosPara: string[];
  fechaVencimientoIso?: string;
}): Promise<OperacionItem[]> {
  const res = await fetch(apiUrl('/tareas-operacion/bulk'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...operacionAdminHeaders() },
    body: JSON.stringify({
      tipo: input.tipo,
      asunto: input.asunto,
      cuerpo: input.cuerpo ?? '',
      noUsuarioDe: input.noUsuarioDe,
      noUsuariosPara: input.noUsuariosPara,
      fechaVencimientoIso: input.fechaVencimientoIso,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor');
  const items = data.map(mapDto).filter((x): x is OperacionItem => x != null);
  emitUpdated();
  return items;
}

export async function patchOperacionItem(id: string, patch: Partial<Pick<OperacionItem, 'estado'>>) {
  if (patch.estado == null) return;
  const res = await fetch(apiUrl(`/tareas-operacion/${encodeURIComponent(id)}/estado`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: patch.estado }),
  });
  const errData = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, errData));
  }
  emitUpdated();
}

export async function patchReasignarOperacionItem(id: string, noUsuarioPara: string): Promise<void> {
  const res = await fetch(apiUrl(`/tareas-operacion/${encodeURIComponent(id)}/reasignar`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...operacionAdminHeaders() },
    body: JSON.stringify({ noUsuarioPara }),
  });
  const errData = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(await readErrorBody(res, errData));
  }
  emitUpdated();
}

export async function marcarInboxLeidas(noUsuarioPara: string, ids?: string[]): Promise<number> {
  const res = await fetch(apiUrl('/tareas-operacion/inbox/marcar-leidas'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      noUsuarioPara,
      ids: ids?.map((x) => Number(x)).filter((n) => !Number.isNaN(n)),
    }),
  });
  const data = (await res.json().catch(() => null)) as { actualizadas?: number; message?: string } | null;
  if (!res.ok) {
    throw new Error(await readErrorBody(res, data));
  }
  emitUpdated();
  return data && typeof data.actualizadas === 'number' ? data.actualizadas : 0;
}
