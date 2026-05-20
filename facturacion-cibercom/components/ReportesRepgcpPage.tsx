import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';
import { utils, writeFile } from 'xlsx';

interface RepgcpFormData {
  fechaSolicitud: string;
}

const initialFormData: RepgcpFormData = {
  fechaSolicitud: new Date().toISOString().split('T')[0],
};

export const ReportesRepgcpPage: React.FC = () => {
  const [formData, setFormData] = useState<RepgcpFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'GCP-001', fechaSolicitud: '2024-06-01', estatus: 'Procesado', monto: 1000.00 },
    { folio: 'GCP-002', fechaSolicitud: '2024-06-01', estatus: 'Pendiente', monto: 2000.00 },
    { folio: 'GCP-003', fechaSolicitud: '2024-06-01', estatus: 'Procesado', monto: 1500.00 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardarFecha = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Guardar Fecha REPgcp:', formData);
    // alert('Guardar Fecha REPgcp simulado. Ver consola.');
  };

  const handleExcel = () => {
    if (resultados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const ws = utils.json_to_sheet(resultados);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'REPgcp');
    writeFile(wb, 'repgcp.xlsx');
  };

  return (
    <form onSubmit={handleGuardarFecha} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          --Especificar Fecha--
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end">
          <FormField label="Fecha de Solicitud:" name="fechaSolicitud" type="date" value={formData.fechaSolicitud} onChange={handleChange} />
          <div className="flex justify-start">
            <Button type="submit" variant="primary">
              Guardar Fecha
            </Button>
          </div>
        </div>
      </Card>
       <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px]">
        {resultados.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
            Los resultados o confirmaciones aparecerán aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Folio</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha Solicitud</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Estatus</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fechaSolicitud}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.estatus}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">${row.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={handleExcel} variant="secondary">
          Excel
        </Button>
      </div>
    </form>
  );
};
