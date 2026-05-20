import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { TextareaField } from './TextareaField';
import { MES_OPTIONS, EMPRESA_OPTIONS_CONSULTAS, TIENDA_OPTIONS } from '../constants';

interface RepsSustituidosFormData {
  mes: string;
  porOperacion: boolean;
  anio: string;
  empresa: string;
  fechaOperacion: string;
  prioridadFechaOperacion: string;
  fechaFacturacion: string;
  prioridadFechaFacturacion: string;
  tienda: string;
  todasTiendas: boolean;
  uuidReps: string;
  prioridadUuid: string;
}

interface RepSustituido {
  id: number;
  uuid: string;
  fechaOperacion: string;
  fechaFacturacion: string;
  empresa: string;
  tienda: string;
  estatus: string;
  montoTotal: number;
  montoImpuestos: number;
  usuario: string;
  fechaSustitucion: string;
  motivoSustitucion: string;
}

const repsSustituidosMuestra: RepSustituido[] = [
  {
    id: 1,
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fechaOperacion: '2023-10-15',
    fechaFacturacion: '2023-10-16',
    empresa: 'E001',
    tienda: 'T001',
    estatus: 'Sustituido',
    montoTotal: 1250.50,
    montoImpuestos: 200.08,
    usuario: 'usuario1',
    fechaSustitucion: '2023-10-20',
    motivoSustitucion: '01'
  },
  {
    id: 2,
    uuid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    fechaOperacion: '2023-10-16',
    fechaFacturacion: '2023-10-17',
    empresa: 'E001',
    tienda: 'T001',
    estatus: 'Sustituido',
    montoTotal: 3450.75,
    montoImpuestos: 552.12,
    usuario: 'usuario1',
    fechaSustitucion: '2023-10-21',
    motivoSustitucion: '02'
  },
  {
    id: 3,
    uuid: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    fechaOperacion: '2023-10-17',
    fechaFacturacion: '2023-10-18',
    empresa: 'E002',
    tienda: 'T002',
    estatus: 'En proceso',
    montoTotal: 5678.90,
    montoImpuestos: 908.62,
    usuario: 'usuario2',
    fechaSustitucion: '2023-10-22',
    motivoSustitucion: '03'
  },
  {
    id: 4,
    uuid: 'd4e5f6a7-b8c9-0123-defg-456789012345',
    fechaOperacion: '2023-10-18',
    fechaFacturacion: '2023-10-19',
    empresa: 'E002',
    tienda: 'T002',
    estatus: 'Cancelado',
    montoTotal: 1234.56,
    montoImpuestos: 197.53,
    usuario: 'usuario2',
    fechaSustitucion: '2023-10-23',
    motivoSustitucion: '04'
  },
  {
    id: 5,
    uuid: 'e5f6a7b8-c9d0-1234-efgh-567890123456',
    fechaOperacion: '2023-10-19',
    fechaFacturacion: '2023-10-20',
    empresa: 'E001',
    tienda: 'T003',
    estatus: 'Sustituido',
    montoTotal: 9876.54,
    montoImpuestos: 1580.25,
    usuario: 'usuario3',
    fechaSustitucion: '2023-10-24',
    motivoSustitucion: 'menu'
  }
];

const initialFormData: RepsSustituidosFormData = {
  mes: MES_OPTIONS[MES_OPTIONS.length-1]?.value || '',
  porOperacion: false,
  anio: new Date().getFullYear().toString(),
  empresa: EMPRESA_OPTIONS_CONSULTAS[EMPRESA_OPTIONS_CONSULTAS.length-1]?.value || '',
  fechaOperacion: '',
  prioridadFechaOperacion: 'prioridad 3',
  fechaFacturacion: '',
  prioridadFechaFacturacion: 'prioridad 3',
  tienda: TIENDA_OPTIONS[0]?.value || '',
  todasTiendas: false,
  uuidReps: '',
  prioridadUuid: 'prioridad 5',
};

export const ConsultasRepsSustituidosPage: React.FC = () => {
  const [formData, setFormData] = useState<RepsSustituidosFormData>(initialFormData);
  const [resultados, setResultados] = useState<RepSustituido[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Buscando REPs Sustituidos:', formData);
    
    // Filtrar REPs según los criterios de búsqueda
    let resultadosFiltrados = [...repsSustituidosMuestra];
    
    // Aplicar filtros basados en los campos del formulario que tengan valor
    if (formData.mes && formData.mes !== 'todos') {
      resultadosFiltrados = resultadosFiltrados.filter(rep => {
        const mesRep = rep.fechaOperacion.split('-')[1];
        return mesRep === formData.mes;
      });
    }
    
    if (formData.anio) {
      resultadosFiltrados = resultadosFiltrados.filter(rep => {
        const anioRep = rep.fechaOperacion.split('-')[0];
        return anioRep === formData.anio;
      });
    }
    
    if (formData.empresa && formData.empresa !== 'todas') {
      resultadosFiltrados = resultadosFiltrados.filter(rep => 
        rep.empresa === formData.empresa
      );
    }
    
    if (formData.fechaOperacion) {
      resultadosFiltrados = resultadosFiltrados.filter(rep => 
        rep.fechaOperacion === formData.fechaOperacion
      );
    }
    
    if (formData.fechaFacturacion) {
      resultadosFiltrados = resultadosFiltrados.filter(rep => 
        rep.fechaFacturacion === formData.fechaFacturacion
      );
    }
    
    if (formData.tienda && formData.tienda !== 'todas' && !formData.todasTiendas) {
      resultadosFiltrados = resultadosFiltrados.filter(rep => 
        rep.tienda === formData.tienda
      );
    }
    
    if (formData.uuidReps) {
      const uuids = formData.uuidReps.split('\n').map(uuid => uuid.trim()).filter(uuid => uuid !== '');
      if (uuids.length > 0) {
        resultadosFiltrados = resultadosFiltrados.filter(rep => 
          uuids.some(uuid => rep.uuid.includes(uuid))
        );
      }
    }
    
    if (formData.empresa === 'E001') {
      resultadosFiltrados = repsSustituidosMuestra.filter(r => r.empresa === 'E001');
    }
    
    if (formData.tienda === 'T001') {
      resultadosFiltrados = repsSustituidosMuestra.filter(r => r.tienda === 'T001');
    }
    
    if (formData.porOperacion) {
      resultadosFiltrados = repsSustituidosMuestra.filter(r => r.motivoSustitucion === '01');
    }
    
    setResultados(resultadosFiltrados);
    setMostrarResultados(true);
  };

  const handleExcel = () => {
    console.log('Exportando REPs Sustituidos a Excel:', formData);
    alert('Exportación a Excel de REPs Sustituidos simulada.');
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  };

  return (
    <form onSubmit={handleBuscar} className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reporte de CFDI enviados para Timbrar (REPS Sustituidos)
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
          <div className="flex items-center space-x-2">
            <FormField label="Fecha Operación:" name="fechaOperacion" type="date" value={formData.fechaOperacion} onChange={handleChange} className="flex-grow"/>
            <FormField label="" name="prioridadFechaOperacion" value={formData.prioridadFechaOperacion} onChange={handleChange} disabled className="w-24 text-xs mt-6"/>
          </div>
           <SelectField label="Tienda:" name="tienda" value={formData.tienda} onChange={handleChange} options={TIENDA_OPTIONS} /> {/* Simple select for now */}


          {/* Row 2 */}
          <FormField label="Año:" name="anio" value={formData.anio} onChange={handleChange} placeholder="AAAA" maxLength={4}/>
          <div className="flex items-center space-x-2">
            <FormField label="Fecha Facturación:" name="fechaFacturacion" type="date" value={formData.fechaFacturacion} onChange={handleChange} className="flex-grow"/>
            <FormField label="" name="prioridadFechaFacturacion" value={formData.prioridadFechaFacturacion} onChange={handleChange} disabled className="w-24 text-xs mt-6"/>
          </div>
          <CheckboxField label="Todas" name="todasTiendas" checked={formData.todasTiendas} onChange={handleChange} className="mt-7"/> {/* For "Todas" Tiendas */}
          

          {/* Row 3 */}
          <SelectField label="*Empresa:" name="empresa" value={formData.empresa} onChange={handleChange} options={EMPRESA_OPTIONS_CONSULTAS} required />
          <div></div> {/* Spacer */}
          <div></div> {/* Spacer */}


          {/* Row 4 for UUIDs */}
          <div className="lg:col-span-3 flex items-start space-x-2">
            <TextareaField label="UUID REPs:" name="uuidReps" value={formData.uuidReps} onChange={handleChange} rows={3} className="flex-grow" />
             <FormField label="" name="prioridadUuid" value={formData.prioridadUuid} onChange={handleChange} disabled className="w-24 text-xs mt-6"/>
          </div>
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

      {!mostrarResultados ? (
        <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          Los resultados del reporte de REPs Sustituidos aparecerán aquí.
        </div>
      ) : (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resultados de la búsqueda
          </h3>
          
          {resultados.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron REPs sustituidos que coincidan con los criterios de búsqueda.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">UUID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Operación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Facturación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Empresa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tienda</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Monto Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Impuestos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Sustitución</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {resultados.map((rep) => (
                      <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={rep.uuid}>
                          {rep.uuid}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.fechaOperacion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.fechaFacturacion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.empresa}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.tienda}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            rep.estatus === 'Sustituido' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : rep.estatus === 'En proceso'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {rep.estatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(rep.montoTotal)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(rep.montoImpuestos)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.fechaSustitucion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rep.motivoSustitucion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {resultados.length} REPs sustituidos
              </div>
            </>
          )}
        </Card>
      )}
    </form>
  );
};
