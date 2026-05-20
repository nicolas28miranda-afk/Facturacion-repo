import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { MES_OPTIONS, EMPRESA_OPTIONS_CONSULTAS } from '../constants';
// import { utils, writeFile } from 'xlsx'; // No utilizado actualmente

interface ControlEmisionRepFormData {
  mes: string;
  anio: string;
  empresa: string;
}

const initialFormData: ControlEmisionRepFormData = {
  mes: MES_OPTIONS[MES_OPTIONS.length - 1]?.value || '',
  anio: new Date().getFullYear().toString(),
  empresa: EMPRESA_OPTIONS_CONSULTAS[EMPRESA_OPTIONS_CONSULTAS.length - 1]?.value || '',
};

export const ReportesControlEmisionRepPage: React.FC = () => {
  const [formData, setFormData] = useState<ControlEmisionRepFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'REP-001', mes: 'Junio', anio: '2024', empresa: 'Empresa A', total: 5 },
    { folio: 'REP-002', mes: 'Junio', anio: '2024', empresa: 'Empresa B', total: 3 },
    { folio: 'REP-003', mes: 'Junio', anio: '2024', empresa: 'Empresa C', total: 7 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Buscar Control de Emisión de REP:', formData);
    // alert('Búsqueda de Control de Emisión de REP simulada. Ver consola.');
  };

  // Función no utilizada - comentada para evitar error de TypeScript
  // const handleExcel = () => {
  //   if (resultados.length === 0) {
  //     alert('No hay datos para exportar.');
  //     return;
  //   }
  //   const ws = utils.json_to_sheet(resultados);
  //   const wb = utils.book_new();
  //   utils.book_append_sheet(wb, ws, 'ControlEmisionREP');
  //   writeFile(wb, 'control_emision_rep.xlsx');
  // };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reporte control de emisión de Recibo Electrónico de Pago (REP)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          --Ingresa los datos para consulta:--
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <SelectField label="Mes:" name="mes" value={formData.mes} onChange={handleChange} options={MES_OPTIONS} />
          <FormField label="Año:" name="anio" value={formData.anio} onChange={handleChange} placeholder="AAAA" maxLength={4}/>
          <SelectField label="*Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required />
        </div>
        <div className="mt-6 flex justify-start">
          <Button type="submit" variant="primary">
            Buscar
          </Button>
        </div>
      </Card>
      <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px]">
        {resultados.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
            Los resultados del reporte aparecerán aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Folio</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Mes</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Año</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Empresa</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Total REP</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.mes}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.anio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.empresa}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.total}</td>
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
