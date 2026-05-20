import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { TIENDA_OPTIONS_REPORTS, TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS, EMPRESA_OPTIONS_CONSULTAS } from '../constants';
import { utils, writeFile } from 'xlsx';

interface IntegracionFacturaGlobalFormData {
  fecha: string;
  tiendas: string[];
  todasTiendas: boolean;
  tiposFacturaGlobal: string[];
  todosTiposFactura: boolean;
  empresa: string;
}

const initialFormData: IntegracionFacturaGlobalFormData = {
  fecha: '',
  tiendas: [],
  todasTiendas: false,
  tiposFacturaGlobal: [],
  todosTiposFactura: false,
  empresa: EMPRESA_OPTIONS_CONSULTAS[EMPRESA_OPTIONS_CONSULTAS.length - 1]?.value || '',
};

export const ReportesIntegracionFacturaGlobalPage: React.FC = () => {
  const [formData, setFormData] = useState<IntegracionFacturaGlobalFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'IFG-001', fecha: '2024-06-01', tienda: 'Sucursal 1', tipoFactura: 'CON', empresa: 'Empresa A', monto: 5000.00 },
    { folio: 'IFG-002', fecha: '2024-06-01', tienda: 'Sucursal 2', tipoFactura: 'DEV', empresa: 'Empresa B', monto: 3200.50 },
    { folio: 'IFG-003', fecha: '2024-06-01', tienda: 'Sucursal 3', tipoFactura: 'CRE', empresa: 'Empresa C', monto: 2100.00 },
  ];

  const handleCheckboxGroupChange = (
    groupName: keyof Pick<IntegracionFacturaGlobalFormData, 'tiendas' | 'tiposFacturaGlobal'>,
    itemName: string,
    isChecked: boolean
  ) => {
    setFormData(prev => {
      const currentGroup = prev[groupName] as string[];
      const newGroup = isChecked
        ? [...currentGroup, itemName]
        : currentGroup.filter(item => item !== itemName);
      return { ...prev, [groupName]: newGroup };
    });
  };

  const handleSelectAllChange = (
    groupName: keyof Pick<IntegracionFacturaGlobalFormData, 'tiendas' | 'tiposFacturaGlobal'>,
    allFlagName: keyof Pick<IntegracionFacturaGlobalFormData, 'todasTiendas' | 'todosTiposFactura'>,
    options: {value: string, label: string}[],
    isChecked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [allFlagName]: isChecked,
      [groupName]: isChecked ? options.map(opt => opt.value) : [],
    }));
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Buscar Integración Factura Global (Rep. 2):', formData);
    // alert('Búsqueda (Rep. 2) simulada. Ver consola.');
  };

  const handleExcel = () => {
    if (resultados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const ws = utils.json_to_sheet(resultados);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'IntegracionFacturaGlobal');
    writeFile(wb, 'integracion_factura_global.xlsx');
  };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Integración Factura Global (Rep. 2)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          --Ingresa los datos para consulta:--
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <FormField label="*Fecha:" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required/>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tienda:</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-2 h-32 overflow-y-auto">
              {TIENDA_OPTIONS_REPORTS.map(option => (
                <CheckboxField
                  key={option.value}
                  label={option.label}
                  name={`tienda-${option.value}`}
                  checked={formData.tiendas.includes(option.value)}
                  onChange={(e) => handleCheckboxGroupChange('tiendas', option.value, e.target.checked)}
                />
              ))}
            </div>
            <CheckboxField label="Todas" name="todasTiendas" checked={formData.todasTiendas} 
                           onChange={(e) => handleSelectAllChange('tiendas', 'todasTiendas', TIENDA_OPTIONS_REPORTS, e.target.checked)} className="mt-1"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Factura Global:</label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-2 h-32 overflow-y-auto">
              {TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS.map(option => (
                <CheckboxField
                  key={option.value}
                  label={option.label}
                  name={`tipoFacturaGlobal-${option.value}`}
                  checked={formData.tiposFacturaGlobal.includes(option.value)}
                  onChange={(e) => handleCheckboxGroupChange('tiposFacturaGlobal', option.value, e.target.checked)}
                />
              ))}
            </div>
             <CheckboxField label="Todos" name="todosTiposFactura" checked={formData.todosTiposFactura} 
                           onChange={(e) => handleSelectAllChange('tiposFacturaGlobal', 'todosTiposFactura', TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS, e.target.checked)} className="mt-1"/>
          </div>
          
          <SelectField label="*Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required className="self-start"/>
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
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tienda</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tipo Factura</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Empresa</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fecha}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tienda}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tipoFactura}</td>
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
