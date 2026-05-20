import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialBaseDir: string;
  onSelect: (path: string) => void;
}

export default function DirectoryPickerModal({ isOpen, onClose, initialBaseDir, onSelect }: Props) {
  const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_URL) ? (import.meta as any).env.VITE_API_URL : '';
  const [currentPath, setCurrentPath] = useState<string>(initialBaseDir);
  const [directories, setDirectories] = useState<Array<{ name: string; relative: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadDirectories();
  }, [isOpen, currentPath]);

  const loadDirectories = async () => {
    if (!currentPath) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiBase}/api/logs/browse?baseDir=${encodeURIComponent(currentPath)}`);
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setDirectories(data.directories || []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar directorios');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryClick = (dir: { name: string; relative: string }) => {
    setCurrentPath(dir.relative);
  };

  const handleSelect = () => {
    onSelect(currentPath);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <strong>Seleccionar directorio de logs</strong>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">×</button>
        </div>
        <div style={styles.body}>
          <div style={styles.pathInfo}>
            <label style={styles.label}>Ruta actual:</label>
            <div style={styles.pathDisplay}>{currentPath || 'No seleccionado'}</div>
          </div>
          
          {loading && <div style={styles.loading}>Cargando directorios...</div>}
          {error && <div style={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div style={styles.directoryList}>
              {directories.map((dir) => (
                <div
                  key={dir.relative}
                  style={styles.directoryItem}
                  onClick={() => handleDirectoryClick(dir)}
                >
                  📁 {dir.name}
                </div>
              ))}
              {directories.length === 0 && (
                <div style={styles.emptyMessage}>No hay subdirectorios</div>
              )}
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancelar
          </button>
          <button onClick={handleSelect} style={styles.selectBtn}>
            Seleccionar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: { 
    width: '60%', 
    height: '60%', 
    background: '#fff', 
    borderRadius: 8, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden' 
  },
  header: { 
    padding: '16px', 
    borderBottom: '1px solid #e5e7eb', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  body: { 
    flex: 1, 
    overflow: 'auto', 
    padding: '16px' 
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  pathInfo: {
    marginBottom: '16px'
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '4px',
    display: 'block'
  },
  pathDisplay: {
    padding: '8px',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    wordBreak: 'break-all'
  },
  directoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  directoryItem: {
    padding: '8px 12px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  emptyMessage: {
    padding: '16px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px'
  },
  loading: {
    padding: '16px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px'
  },
  error: {
    padding: '16px',
    textAlign: 'center',
    color: '#dc2626',
    fontSize: '14px'
  },
  closeBtn: { 
    background: 'transparent', 
    border: 'none', 
    fontSize: 22, 
    cursor: 'pointer', 
    lineHeight: 1 
  },
  cancelBtn: {
    background: '#6b7280',
    color: '#fff',
    borderRadius: 6,
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14
  },
  selectBtn: {
    background: '#4f46e5',
    color: '#fff',
    borderRadius: 6,
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14
  }
};
