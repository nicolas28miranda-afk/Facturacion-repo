// src/components/MonitorLogsPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './Card';
import { SelectField } from './SelectField';
import { Button } from './Button';
import LogPreviewModal from './LogPreviewModal';
import DirectoryPickerModal from './DirectoryPickerModal';

// --- Icono de Descarga (Componente interno) ---
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// --- Icono de Vista Previa (Ojo) ---
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-6 w-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// --- Opciones para los Selectores ---
const DIRECTORY_OPTIONS = [ { value: 'server_logs', label: 'Logs del servidor' } ];
const LINES_OPTIONS = [ { value: 'all', label: 'Todas' }, { value: '100', label: 'Últimas 100' } ];
const ITEMS_PER_PAGE_OPTIONS = [ { value: '15', label: '15' }, { value: '25', label: '25' }, { value: '50', label: '50' } ];

type ListedFile = { name: string; relative: string; size: number; modified: number };

interface MonitorFilters {
  directory: string;
  lines: string;
  itemsPerPage: string;
}

// --- Componente Principal de la Página ---
export const MonitorLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<MonitorFilters>({
    directory: 'server_logs',
    lines: 'all',
    itemsPerPage: '15',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string>('');
  const [baseDir, setBaseDir] = useState<string>(() => {
    const stored = localStorage.getItem('logsBaseDir');
    // Ignorar si es "<null>" o está vacío, y limpiar localStorage si contiene "<null>"
    if (stored === '<null>') {
      localStorage.removeItem('logsBaseDir');
      return '';
    }
    return (stored && stored.trim() !== '') ? stored : '';
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [files, setFiles] = useState<ListedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState<string | null>(null);
  // Usar la variable que sí está definida en .env (VITE_API_BASE_URL) y normalizar para no duplicar /api
  const rawApiBase =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      ((import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_API_URL)) ||
    '';
  const apiBase = rawApiBase.replace(/\/api\/?$/, '');
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'itemsPerPage') {
      setCurrentPage(1);
    }
  };

  const paginatedLogs = useMemo(() => {
    const lastIndex = currentPage * parseInt(filters.itemsPerPage);
    const firstIndex = lastIndex - parseInt(filters.itemsPerPage);
    return files.slice(firstIndex, lastIndex);
  }, [currentPage, filters.itemsPerPage, files]);
  
  const totalPages = Math.max(1, Math.ceil(files.length / parseInt(filters.itemsPerPage)));

  const handleDownload = (fileRel: string) => {
    // Solo incluir baseDir si no es "<null>" o está vacío
    const baseParam = (baseDir && baseDir !== '<null>' && baseDir.trim() !== '') 
      ? `&baseDir=${encodeURIComponent(baseDir)}` 
      : '';
    const url = `${apiBase}/api/logs/download?file=${encodeURIComponent(fileRel)}${baseParam}`;
    window.open(url, '_blank');
  };

  const handlePreview = (fileName: string) => {
    setPreviewFile(fileName);
    setPreviewOpen(true);
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const loadFiles = () => {
    // Validar que baseDir no sea "<null>" o esté vacío
    if (!baseDir || baseDir === '<null>' || baseDir.trim() === '') { 
      setFiles([]); 
      setErrorFiles('No se ha configurado el directorio base de logs. Por favor, selecciona una ruta.');
      return; 
    }
    setLoadingFiles(true); setErrorFiles(null);
    fetch(`${apiBase}/api/logs/list?baseDir=${encodeURIComponent(baseDir)}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
      .then(data => { setFiles(data.files || []); setCurrentPage(1); })
      .catch(e => setErrorFiles(e.message || 'No se pudieron cargar los logs'))
      .finally(() => setLoadingFiles(false));
  };

  useEffect(() => { loadFiles(); }, [baseDir]);

  useEffect(() => {
    // Si no hay baseDir guardado, intenta leer el que usa el backend
    if (!baseDir) {
      fetch(`${apiBase}/api/logs/config`).then(r => r.text()).then(t => {
        // formato: yml=...\nsysprop=...\nenv=...\neffective=...
        const match = t.match(/effective=(.*)/);
        const eff = match?.[1]?.trim();
        // Ignorar si es "<null>" o está vacío
        if (eff && eff !== '<null>' && eff.length > 0) {
          setBaseDir(eff);
          localStorage.setItem('logsBaseDir', eff);
        }
      }).catch(() => {});
    }
  }, []);

  const handleSaveBaseDir = () => {
    localStorage.setItem('logsBaseDir', baseDir);
    // feedback mínimo
    alert('Directorio de logs establecido');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end gap-x-6 gap-y-4">
          <SelectField label="Directorio:" name="directory" value={filters.directory} onChange={handleFilterChange} options={DIRECTORY_OPTIONS} />
          <p className="text-sm text-primary dark:text-secondary self-center pt-6">
             <span className="font-semibold">Servidor:</span> Intranet_Apps_Server1
          </p>
          <SelectField label="Líneas a descargar:" name="lines" value={filters.lines} onChange={handleFilterChange} options={LINES_OPTIONS} />
          <SelectField 
            label="Elementos:" 
            name="itemsPerPage" 
            value={filters.itemsPerPage} 
            onChange={handleFilterChange} 
            options={ITEMS_PER_PAGE_OPTIONS} 
          />
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ruta base de logs (servidor)</label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                value={baseDir}
                readOnly
                placeholder="C:/cibercom/logs"
                className="min-w-0 w-full flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    // Solo enviar baseDir si no es "<null>" o está vacío
                    const startPath = (baseDir && baseDir !== '<null>' && baseDir.trim() !== '') ? baseDir : '';
                    const resp = await fetch(`${apiBase}/api/logs/pick-dir?start=${encodeURIComponent(startPath)}`);
                    if (resp.status === 204) return; // cancelado
                    if (!resp.ok) throw new Error(await resp.text());
                    const data = await resp.json();
                    if (data.path) setBaseDir(data.path);
                  } catch {
                    // Fallback al modal de navegador de carpetas del servidor
                    setPickerOpen(true);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Elegir ruta
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  // Validar que baseDir no sea "<null>" o esté vacío
                  if (!baseDir || baseDir === '<null>' || baseDir.trim() === '') { 
                    alert('Selecciona una ruta primero'); 
                    return; 
                  }
                  try {
                    const resp = await fetch(`${apiBase}/api/logs/set-log-dir?baseDir=${encodeURIComponent(baseDir)}&fileName=${encodeURIComponent('server.log')}`, { method: 'POST' });
                    const txt = await resp.text();
                    if (!resp.ok) throw new Error(txt);
                    alert('El backend guardará logs en: ' + (JSON.parse(txt).path || baseDir));
                  } catch (e:any) {
                    alert('No se pudo reconfigurar logging: ' + (e?.message || ''));
                  }
                }}
                className="w-full sm:w-auto"
              >
                Usar para escribir logs
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveBaseDir}
                className="w-full sm:w-auto"
              >
                Guardar
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Usa el selector para navegar carpetas en el servidor y establecer la ruta.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={loadFiles}>
            Mostrar Descargas
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-primary dark:bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
              {loadingFiles && (
                <tr><td className="px-6 py-4" colSpan={2}>Cargando…</td></tr>
              )}
              {errorFiles && !loadingFiles && (
                <tr><td className="px-6 py-4 text-red-600" colSpan={2}>{errorFiles}</td></tr>
              )}
              {!loadingFiles && !errorFiles && paginatedLogs.map((file, index) => (
                <tr key={file.relative} className={index % 2 !== 0 ? 'bg-pink-50 dark:bg-purple-900/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => handlePreview(file.relative)}
                        className="text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                        title="Vista previa"
                        aria-label={`Vista previa de ${file.name}`}
                      >
                        <EyeIcon />
                      </button>
                      <button
                        onClick={() => handleDownload(file.relative)}
                        className="text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                        title="Descargar"
                        aria-label={`Descargar ${file.name}`}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingFiles && !errorFiles && files.length === 0 && (
                <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>No hay archivos en la ruta seleccionada</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center py-4">
          <nav className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </nav>
        </div>
      </Card>
      {/* Modal de Vista Previa */}
      <LogPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        lines={200}
        baseDir={(baseDir && baseDir !== '<null>' && baseDir.trim() !== '') ? baseDir : undefined}
      />

      <DirectoryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialBaseDir={baseDir}
        onSelect={(full) => { setBaseDir(full); setPickerOpen(false); }}
      />
    </div>
  );
};
