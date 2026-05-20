// src/components/MiNuevaPagina1.tsx
import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

// No necesitas props por ahora si es una página simple
export const MonitorDecodificadorPage: React.FC = () => {
  const [modo, setModo] = useState<'encriptado' | 'desencriptado'>('encriptado');
  const [boleta, setBoleta] = useState('');
  const [tienda, setTienda] = useState('');
  const [terminal, setTerminal] = useState('');
  const [fecha, setFecha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí va la lógica de codificación/decodificación
    alert(`Modo: ${modo}\nBoleta: ${boleta}\nTienda: ${tienda}\nTerminal: ${terminal}\nFecha: ${fecha}`);
  };

  return (
    <div className="flex justify-center items-start min-h-[60vh] p-4">
      <Card className="w-full max-w-3xl mx-auto p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Decodificador de Facturas</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2 flex gap-8 justify-center mb-2">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  id="encriptado"
                  name="modo"
                  checked={modo === 'encriptado'}
                  onChange={() => setModo('encriptado')}
                  className="accent-primary"
                />
                Encriptado
              </label>
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  id="desencriptado"
                  name="modo"
                  checked={modo === 'desencriptado'}
                  onChange={() => setModo('desencriptado')}
                  className="accent-primary"
                />
                Desencriptado
              </label>
            </div>

            {modo === 'encriptado' && <>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Boleta:</label>
                <input
                  type="text"
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  value={boleta}
                  onChange={e => setBoleta(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Tienda:</label>
                <input
                  type="text"
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  value={tienda}
                  onChange={e => setTienda(e.target.value)}
                />
              </div>
            </>}

            {modo === 'desencriptado' && <>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Terminal:</label>
                <input
                  type="text"
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  value={terminal}
                  onChange={e => setTerminal(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Fecha:</label>
                <input
                  type="text"
                  className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                />
              </div>
            </>}

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" variant="primary">
                Codificar
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};