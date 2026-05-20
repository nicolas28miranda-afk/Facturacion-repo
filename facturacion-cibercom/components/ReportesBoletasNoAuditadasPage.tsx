import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { TIENDA_OPTIONS } from '../constants';
import { utils, writeFile } from 'xlsx';

interface BoletasNoAuditadasFormData {
  fecha: string;
  tienda: string;
}

const initialFormData: BoletasNoAuditadasFormData = {
  fecha: new Date().toISOString().split('T')[0],
  tienda: TIENDA_OPTIONS[0]?.value || '',
};

export const ReportesBoletasNoAuditadasPage: React.FC = () => {
  const [formData, setFormData] = useState<BoletasNoAuditadasFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'BNA-001', fecha: '2024-06-01', tienda: 'Tienda 1', monto: 1500.00 },
    { folio: 'BNA-002', fecha: '2024-06-01', tienda: 'Tienda 2', monto: 2300.50 },
    { folio: 'BNA-003', fecha: '2024-06-01', tienda: 'Tienda 3', monto: 980.00 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Buscar Boletas No Auditadas:', formData);
    // alert('Búsqueda de boletas no auditadas simulada. Ver consola.');
  };

  const handleAgregarTda = () => {
    alert('Funcionalidad "Agregar Tda" no implementada.');
  };

  const handleExcel = () => {
    if (resultados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const ws = utils.json_to_sheet(resultados);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'BoletasNoAuditadas');
    writeFile(wb, 'boletas_no_auditadas.xlsx');
  };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          --Especificar búsqueda--
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-end">
          <FormField label="Fecha:" name="fecha" type="date" value={formData.fecha} onChange={handleChange} />
          <SelectField label="Tienda:" name="tienda" value={formData.tienda} onChange={handleChange} options={TIENDA_OPTIONS} />
          {/* Empty divs for spacing if needed, or adjust grid-cols */}
          <div></div>
          <div></div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button type="button" onClick={handleAgregarTda} variant="neutral">
            Agregar Tienda
          </Button>
          <Button type="submit" variant="primary">
            Buscar
          </Button>
          <Button type="button" onClick={handleExcel} variant="secondary">
            XLS
          </Button>
        </div>
      </Card>
      <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px]">
        {resultados.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
            Los resultados del reporte de Boletas No Auditadas aparecerán aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Folio</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tienda</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fecha}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tienda}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">${row.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </form>
  );
};
