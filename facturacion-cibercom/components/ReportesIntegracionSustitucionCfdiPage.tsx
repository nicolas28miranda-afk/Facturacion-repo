import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { TextareaField } from './TextareaField'; // For UUID
import { MES_OPTIONS, EMPRESA_OPTIONS_CONSULTAS, TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS, TIPO_CFDI_OPTIONS_REPORTS, TIENDA_OPTIONS_REPORTS } from '../constants';
import { utils, writeFile } from 'xlsx';

interface IntegracionSustitucionCfdiFormData {
  mes: string;
  porOperacion: boolean;
  anio: string;
  empresa: string;
  tiposFacturaGlobal: string[];
  todasTiposFacturaGlobal: boolean;
  tiposCfdi: string[];
  todosTiposCfdi: boolean;
  uuid: string; // For single UUID or list in textarea
  fechaOperacion: string;
  fechaFacturacion: string;
  tiendas: string[];
  todasTiendas: boolean;
}

const initialFormData: IntegracionSustitucionCfdiFormData = {
  mes: MES_OPTIONS[MES_OPTIONS.length - 1]?.value || '',
  porOperacion: false,
  anio: new Date().getFullYear().toString(),
  empresa: EMPRESA_OPTIONS_CONSULTAS[EMPRESA_OPTIONS_CONSULTAS.length - 1]?.value || '',
  tiposFacturaGlobal: [],
  todasTiposFacturaGlobal: false,
  tiposCfdi: [],
  todosTiposCfdi: false,
  uuid: '',
  fechaOperacion: '',
  fechaFacturacion: '',
  tiendas: [],
  todasTiendas: false,
};

export const ReportesIntegracionSustitucionCfdiPage: React.FC = () => {
  const [formData, setFormData] = useState<IntegracionSustitucionCfdiFormData>(initialFormData);
  const [resultados, setResultados] = useState<any[]>([]);

  const datosDummy = [
    { folio: 'ISC-001', fechaOperacion: '2024-06-01', fechaFacturacion: '2024-06-02', tienda: 'Sucursal 1', tipoFactura: 'CON', tipoCfdi: 'I', uuid: 'UUID-001', empresa: 'Empresa A', monto: 8000.00 },
    { folio: 'ISC-002', fechaOperacion: '2024-06-01', fechaFacturacion: '2024-06-02', tienda: 'Sucursal 2', tipoFactura: 'DEV', tipoCfdi: 'E', uuid: 'UUID-002', empresa: 'Empresa B', monto: 5200.50 },
    { folio: 'ISC-003', fechaOperacion: '2024-06-01', fechaFacturacion: '2024-06-02', tienda: 'Sucursal 3', tipoFactura: 'EMON', tipoCfdi: 'I', uuid: 'UUID-003', empresa: 'Empresa C', monto: 3100.00 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox' && name !== 'porOperacion' && !name.startsWith('todas')) {
        // Grouped logic handled separately
    } else if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    }
     else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxGroupChange = (
    groupName: keyof Pick<IntegracionSustitucionCfdiFormData, 'tiposFacturaGlobal' | 'tiposCfdi' | 'tiendas'>,
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
    groupName: keyof Pick<IntegracionSustitucionCfdiFormData, 'tiposFacturaGlobal' | 'tiposCfdi' | 'tiendas'>,
    allFlagName: keyof Pick<IntegracionSustitucionCfdiFormData, 'todasTiposFacturaGlobal' | 'todosTiposCfdi' | 'todasTiendas'>,
    options: {value: string, label: string}[],
    isChecked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [allFlagName]: isChecked,
      [groupName]: isChecked ? options.map(opt => opt.value) : [],
    }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setResultados(datosDummy);
    console.log('Buscar Integración Sustitución CFDI (Rep. 6,7,8):', formData);
    // alert('Búsqueda (Rep. 6,7,8) simulada. Ver consola.');
  };

  const handleExcel = () => {
    if (resultados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const ws = utils.json_to_sheet(resultados);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'IntegracionSustitucionCFDI');
    writeFile(wb, 'integracion_sustitucion_cfdi.xlsx');
  };
  
  const checkboxContainerClass = "border border-gray-300 dark:border-gray-600 rounded-md p-2 h-24 overflow-y-auto text-sm";

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Integración Sustitución CFDI por periodos (Rep. 6, 7 y 8)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          --Ingresa los datos para consulta:--
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {/* Row 1 */}
          <div className="flex items-end space-x-2">
            <SelectField label="Mes:" name="mes" value={formData.mes} onChange={handleChange} options={MES_OPTIONS} className="flex-grow"/>
            <CheckboxField label="por Operacion" name="porOperacion" checked={formData.porOperacion} onChange={handleChange} className="pb-1"/>
          </div>
          <FormField label="Fecha Operación:" name="fechaOperacion" type="date" value={formData.fechaOperacion} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tienda:</label>
            <div className={checkboxContainerClass}>
              {TIENDA_OPTIONS_REPORTS.map(option => (
                <CheckboxField key={option.value} label={option.label} name={`tienda-${option.value}`} checked={formData.tiendas.includes(option.value)} onChange={(e) => handleCheckboxGroupChange('tiendas', option.value, e.target.checked)} />
              ))}
            </div>
            <CheckboxField label="Todas" name="todasTiendas" checked={formData.todasTiendas} onChange={(e) => handleSelectAllChange('tiendas', 'todasTiendas', TIENDA_OPTIONS_REPORTS, e.target.checked)} className="mt-1"/>
          </div>

          {/* Row 2 */}
          <FormField label="Año:" name="anio" value={formData.anio} onChange={handleChange} placeholder="AAAA" maxLength={4}/>
          <FormField label="Fecha Facturación:" name="fechaFacturacion" type="date" value={formData.fechaFacturacion} onChange={handleChange} />
          <div></div> {/* Spacer */}

          {/* Row 3 */}
          <SelectField label="*Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required className="self-start"/>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Factura Global:</label>
            <div className={checkboxContainerClass}>
              {TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS.map(option => (
                <CheckboxField key={option.value} label={option.label} name={`tipoFacturaGlobal-${option.value}`} checked={formData.tiposFacturaGlobal.includes(option.value)} onChange={(e) => handleCheckboxGroupChange('tiposFacturaGlobal', option.value, e.target.checked)} />
              ))}
            </div>
            <CheckboxField label="Todos" name="todasTiposFacturaGlobal" checked={formData.todasTiposFacturaGlobal} onChange={(e) => handleSelectAllChange('tiposFacturaGlobal', 'todasTiposFacturaGlobal', TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS, e.target.checked)} className="mt-1"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo CFDI:</label>
            <div className={checkboxContainerClass}>
              {TIPO_CFDI_OPTIONS_REPORTS.map(option => (
                <CheckboxField key={option.value} label={option.label} name={`tipoCfdi-${option.value}`} checked={formData.tiposCfdi.includes(option.value)} onChange={(e) => handleCheckboxGroupChange('tiposCfdi', option.value, e.target.checked)} />
              ))}
            </div>
            <CheckboxField label="Todos" name="todosTiposCfdi" checked={formData.todosTiposCfdi} onChange={(e) => handleSelectAllChange('tiposCfdi', 'todosTiposCfdi', TIPO_CFDI_OPTIONS_REPORTS, e.target.checked)} className="mt-1"/>
          </div>
          
          {/* Row 4 */}
          <TextareaField label="UUID:" name="uuid" value={formData.uuid} onChange={handleChange} rows={2} placeholder="Ingrese UUID(s)" className="lg:col-span-2"/>
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
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha Operación</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Fecha Facturación</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tienda</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tipo Factura</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Tipo CFDI</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">UUID</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Empresa</th>
                  <th className="px-2 py-1 text-gray-700 dark:text-gray-100">Monto</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.folio}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fechaOperacion}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.fechaFacturacion}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tienda}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tipoFactura}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.tipoCfdi}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-100">{row.uuid}</td>
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
