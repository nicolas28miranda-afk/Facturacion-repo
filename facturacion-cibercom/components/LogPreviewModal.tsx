import React, { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  file: string; // relative path inside logs base dir
  lines?: number; // how many last lines to show
  baseDir?: string; // optional base directory override
}

export default function LogPreviewModal({ isOpen, onClose, file, lines: linesProp = 200, baseDir }: Props) {
  const apiBase =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_API_URL) ||
    'http://localhost:8080';
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Solo incluir baseDir si no es "<null>" o está vacío
        const baseParam = (baseDir && baseDir !== '<null>' && baseDir.trim() !== '') 
          ? `&baseDir=${encodeURIComponent(baseDir)}` 
          : '';
        const skip = page * linesProp;
        const res = await fetch(`${apiBase}/api/logs/previewPage?file=${encodeURIComponent(file)}&lines=${linesProp}&skip=${skip}${baseParam}`, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setLines(Array.isArray(data.lines) ? data.lines : []);
        setHasMore(!!data.hasMore);
      } catch (e:any) {
        setError(e?.message || 'Error al cargar vista previa');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, file, linesProp, baseDir, page]);

  useEffect(() => { setPage(0); }, [file, isOpen]);

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <strong>Vista previa: {file}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={async () => {
                try {
                  // Solo incluir baseDir si no es "<null>" o está vacío
                  const baseParam = (baseDir && baseDir !== '<null>' && baseDir.trim() !== '') 
                    ? `&baseDir=${encodeURIComponent(baseDir)}` 
                    : '';
                  const res = await fetch(`${apiBase}/api/logs/download?file=${encodeURIComponent(file)}${baseParam}`);
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  const blob = await res.blob();
                  // Intentar leer el nombre de archivo del header
                  const cd = res.headers.get('content-disposition') || '';
                  const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
                  const filename = decodeURIComponent((match?.[1] || match?.[2] || file));
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  alert('No se pudo descargar el archivo');
                }
              }}
              style={styles.actionBtn as React.CSSProperties}
            >
              Descargar
            </button>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">×</button>
          </div>
        </div>
        <div style={styles.toolbarTop}>
          <button disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))} style={styles.pagerBtn}>&lt;</button>
          <span style={styles.pagerText}>Página {page + 1}</span>
          <button disabled={!hasMore} onClick={() => setPage(p => p+1)} style={styles.pagerBtn}>&gt;</button>
        </div>
        <div style={styles.body}>
          {loading && <div>Cargando…</div>}
          {error && <div style={{ color: '#b00020' }}>{error}</div>}
          {!loading && !error && (
            <ul style={styles.ul}>
              {lines.map((ln, idx) => (
                <li key={idx} style={styles.li}><code>{ln}</code></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: { width: '80%', height: '70%', background: '#fff', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 12, color: '#374151' },
  body: { flex: 1, overflow: 'auto', background: '#0b1020' },
  pre: { margin: 0, padding: 16, color: '#e5e7eb', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', whiteSpace: 'pre-wrap' },
  closeBtn: { background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  actionBtn: { background: '#4f46e5', color: '#fff', borderRadius: 6, padding: '6px 10px', textDecoration: 'none', fontSize: 13 }
};

// Extra styles for list + pager
(styles as any).ul = { margin: 0, padding: 16, listStyle: 'none', color: '#e5e7eb', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' } as React.CSSProperties;
(styles as any).li = { padding: '2px 0' } as React.CSSProperties;
(styles as any).toolbarTop = { padding: '8px 16px', borderBottom: '1px solid #1f2937', background: '#0b1020', display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af' } as React.CSSProperties;
(styles as any).pagerBtn = { background: '#1f2937', color: '#e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13, border: '1px solid #374151', cursor: 'pointer' } as React.CSSProperties;
(styles as any).pagerText = { fontSize: 12 } as React.CSSProperties;
