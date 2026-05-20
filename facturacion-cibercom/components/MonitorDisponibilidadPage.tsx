import React, { useState } from 'react';
import { Card } from './Card';


const METODOS_HTTP = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

interface Header {
  key: string;
  value: string;
}

export const MonitorDisponibilidadPage: React.FC = () => {
  const [titulo, setTitulo] = useState('');
  const [metodo, setMetodo] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, _setHeaders] = useState<Header[]>([]);
  const [nuevoHeader, setNuevoHeader] = useState<Header>({ key: '', value: '' });

  // --- Tu lógica de funciones permanece intacta ---
  const handleAddHeader = () => { /* ... */ };
  const handleHeaderChange = (_index: number, _field: 'key' | 'value', _value: string) => { /* ... */ };
  const handleRemoveHeader = (_index: number) => { /* ... */ };
  const handleGenerar = (_e: React.FormEvent) => { /* ... */ };

  return (
    <div className="flex justify-center items-start min-h-[60vh] p-4">
      <Card className="w-full max-w-3xl mx-auto p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monitorear URL adicional</h2>
        <form onSubmit={handleGenerar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Título:</label>
              <input
                type="text"
                placeholder="Titulo"
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Método:</label>
              <select
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 font-bold"
                value={metodo}
                onChange={e => setMetodo(e.target.value)}
              >
                {METODOS_HTTP.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">URL:</label>
              <input
                type="text"
                placeholder="URL"
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Header Key:</label>
              <input
                type="text"
                placeholder="Header Key"
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={nuevoHeader.key}
                onChange={e => setNuevoHeader({ ...nuevoHeader, key: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold">Header Value:</label>
              <input
                type="text"
                placeholder="Header Value"
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={nuevoHeader.value}
                onChange={e => setNuevoHeader({ ...nuevoHeader, value: e.target.value })}
              />
            </div>
            <div className="flex items-end justify-end md:col-span-1">
              <button
                type="button"
                className="text-white px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onClick={handleAddHeader}
              >
                Nuevo Header
              </button>
            </div>
            {headers.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <h4 className="font-semibold">Headers añadidos:</h4>
                <ul className="space-y-2">
                  {headers.map((header: Header, idx: number) => (
                    <li key={idx} className="flex flex-col md:flex-row gap-2 items-center p-2 border rounded-md">
                      <input
                        type="text"
                        value={header.key}
                        onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                        className="p-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-gray-100 flex-1"
                      />
                      <span className="mx-1">:</span>
                      <input
                        type="text"
                        value={header.value}
                        onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                        className="p-1 rounded border border-gray-300 dark:bg-gray-700 dark:text-gray-100 flex-1"
                      />
                      <button
                        type="button"
                        className="text-red-500 font-bold"
                        onClick={() => handleRemoveHeader(idx)}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="text-white px-8 py-3 rounded font-semibold text-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Generar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};