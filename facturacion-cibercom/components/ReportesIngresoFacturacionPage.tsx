import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { MES_OPTIONS, EMPRESA_OPTIONS_CONSULTAS } from '../constants';
// import { ALMACEN_OPTIONS } from '../constants'; // No utilizado
import { utils, writeFile } from 'xlsx';

interface IngresoFacturacionFormData {
  mes: string;
  almacen: string;
  fecha: string;
  empresa: string;
}

const initialFormData: IngresoFacturacionFormData = {
  mes: MES_OPTIONS[MES_OPTIONS.length - 1]?.value || '',
  almacen: '',
  fecha: '',
  empresa: EMPRESA_OPTIONS_CONSULTAS[EMPRESA_OPTIONS_CONSULTAS.length -1 ]?.value || '',
};

export const ReportesIngresoFacturacionPage: React.FC = () => {
  const [formData, setFormData] = useState<IngresoFacturacionFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'IF-001', mes: 'Junio', almacen: 'Sucursal 1', fecha: '2024-06-01', empresa: 'Empresa A', monto: 12000.00 },
    { folio: 'IF-002', mes: 'Junio', almacen: 'Sucursal 2', fecha: '2024-06-01', empresa: 'Empresa B', monto: 8500.50 },
    { folio: 'IF-003', mes: 'Junio', almacen: 'Sucursal 3', fecha: '2024-06-01', empresa: 'Empresa C', monto: 4300.00 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Buscar Desglose Facturación de Ingresos:', formData);
    // alert('Búsqueda de Desglose Facturación (Rep. 1) simulada. Ver consola.');
  };

  const handleExcel = () => {
    if (resultados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const ws = utils.json_to_sheet(resultados);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'IngresoFacturacion');
    writeFile(wb, 'ingreso_facturacion.xlsx');
  };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Desglose Facturación de Ingresos (Rep. 1)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          --Ingresa los datos para consulta:--
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <SelectField label="Mes:" name="mes" value={formData.mes} onChange={handleChange} options={MES_OPTIONS} />
          <FormField label="Alm:" name="almacen" value={formData.almacen} onChange={handleChange} placeholder="Almacén" />
          <FormField label="Fecha:" name="fecha" type="date" value={formData.fecha} onChange={handleChange} />
          <SelectField label="*Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required/>
        </div>
        <div className="mt-6 flex justify-start space-x-3">
          <Button type="submit" variant="primary">
            Buscar
          </Button>
          <Button type="button" onClick={handleExcel} variant="secondary">
            Excel
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
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Almacén</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Empresa</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.mes}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.almacen}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fecha}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.empresa}</td>
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
