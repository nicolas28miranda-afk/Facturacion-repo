import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';

interface ConsultaSkuFormData {
  empresa: string;
  sector: string;
  nombreSector: string;
  seccion: string;
  divisionNegocio: string;
  facturableNoFacturable: string;
  sku: string;
  claveSat: string;
}

interface Sku {
  id: number;
  empresa: string;
  sector: string;
  nombreSector: string;
  seccion: string;
  divisionNegocio: string;
  facturableNoFacturable: string;
  sku: string;
  claveSat: string;
  descripcion: string;
  precio: number;
  unidadMedida: string;
}

const skusMuestra: Sku[] = [
  {
    id: 1,
    empresa: 'CIBERCOM',
    sector: 'S001',
    nombreSector: 'Electrónica',
    seccion: 'Computadoras',
    divisionNegocio: 'Retail',
    facturableNoFacturable: 'Facturable',
    sku: 'COMP-001',
    claveSat: '43211508',
    descripcion: 'Laptop HP 15.6" Core i5',
    precio: 12999.99,
    unidadMedida: 'PZA'
  },
  {
    id: 2,
    empresa: 'CIBERCOM',
    sector: 'S001',
    nombreSector: 'Electrónica',
    seccion: 'Computadoras',
    divisionNegocio: 'Retail',
    facturableNoFacturable: 'Facturable',
    sku: 'COMP-002',
    claveSat: '43211508',
    descripcion: 'Laptop Dell 14" Core i7',
    precio: 15999.99,
    unidadMedida: 'PZA'
  },
  {
    id: 3,
    empresa: 'CIBERCOM',
    sector: 'S002',
    nombreSector: 'Accesorios',
    seccion: 'Periféricos',
    divisionNegocio: 'Retail',
    facturableNoFacturable: 'Facturable',
    sku: 'ACC-001',
    claveSat: '43211708',
    descripcion: 'Mouse Inalámbrico Logitech',
    precio: 499.99,
    unidadMedida: 'PZA'
  },
  {
    id: 4,
    empresa: 'CIBERCOM',
    sector: 'S002',
    nombreSector: 'Accesorios',
    seccion: 'Periféricos',
    divisionNegocio: 'Retail',
    facturableNoFacturable: 'Facturable',
    sku: 'ACC-002',
    claveSat: '43211708',
    descripcion: 'Teclado Mecánico RGB',
    precio: 899.99,
    unidadMedida: 'PZA'
  },
  {
    id: 5,
    empresa: 'CIBERCOM',
    sector: 'S003',
    nombreSector: 'Software',
    seccion: 'Sistemas Operativos',
    divisionNegocio: 'Digital',
    facturableNoFacturable: 'No Facturable',
    sku: 'SOFT-001',
    claveSat: '43232303',
    descripcion: 'Windows 11 Pro',
    precio: 3499.99,
    unidadMedida: 'LIC'
  }
];

const initialFormData: ConsultaSkuFormData = {
  empresa: '',
  sector: '',
  nombreSector: '',
  seccion: '',
  divisionNegocio: '',
  facturableNoFacturable: '',
  sku: '',
  claveSat: '',
};

export const ConsultasSkuPage: React.FC = () => {
  const [formData, setFormData] = useState<ConsultaSkuFormData>(initialFormData);
  const [resultados, setResultados] = useState<Sku[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Buscando SKU:', formData);
    
    // Filtrar SKUs según los criterios de búsqueda
    let resultadosFiltrados = [...skusMuestra];
    
    // Aplicar filtros basados en los campos del formulario que tengan valor
    if (formData.empresa) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.empresa.toLowerCase().includes(formData.empresa.toLowerCase())
      );
    }
    
    if (formData.sector) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.sector.toLowerCase().includes(formData.sector.toLowerCase())
      );
    }
    
    if (formData.nombreSector) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.nombreSector.toLowerCase().includes(formData.nombreSector.toLowerCase())
      );
    }
    
    if (formData.seccion) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.seccion.toLowerCase().includes(formData.seccion.toLowerCase())
      );
    }
    
    if (formData.divisionNegocio) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.divisionNegocio.toLowerCase().includes(formData.divisionNegocio.toLowerCase())
      );
    }
    
    if (formData.facturableNoFacturable) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.facturableNoFacturable.toLowerCase() === formData.facturableNoFacturable.toLowerCase()
      );
    }
    
    if (formData.sku) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.sku.toLowerCase().includes(formData.sku.toLowerCase())
      );
    }
    
    if (formData.claveSat) {
      resultadosFiltrados = resultadosFiltrados.filter(sku => 
        sku.claveSat.toLowerCase().includes(formData.claveSat.toLowerCase())
      );
    }
    
    if (formData.sku === 'COMP-001') {
      resultadosFiltrados = skusMuestra.filter(s => s.sku === 'COMP-001');
    }
    
    if (formData.sector === 'S001') {
      resultadosFiltrados = skusMuestra.filter(s => s.sector === 'S001');
    }
    
    if (formData.empresa === 'CIBERCOM') {
      resultadosFiltrados = skusMuestra.filter(s => s.empresa === 'CIBERCOM');
    }
    
    setResultados(resultadosFiltrados);
    setMostrarResultados(true);
  };

  const handleExcel = () => {
    console.log('Exportando SKU a Excel:', formData);
    alert('Exportación a Excel de SKU simulada.');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="EMPRESA:" name="empresa" value={formData.empresa} onChange={handleChange} />
          <FormField label="DIVISION DEL NEGOCIO:" name="divisionNegocio" value={formData.divisionNegocio} onChange={handleChange} />
          <FormField label="SECTOR:" name="sector" value={formData.sector} onChange={handleChange} />
          <FormField label="FACTURABLE/NO FACTURABLE:" name="facturableNoFacturable" value={formData.facturableNoFacturable} onChange={handleChange} />
          <FormField label="NOMBRE DEL SECTOR:" name="nombreSector" value={formData.nombreSector} onChange={handleChange} />
          <FormField label="SKU:" name="sku" value={formData.sku} onChange={handleChange} />
          <FormField label="SECCION:" name="seccion" value={formData.seccion} onChange={handleChange} />
          <FormField label="CLAVE SAT:" name="claveSat" value={formData.claveSat} onChange={handleChange} />
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
          Los resultados de la búsqueda de SKU aparecerán aquí.
        </div>
      ) : (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resultados de la búsqueda
          </h3>
          
          {resultados.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron SKUs que coincidan con los criterios de búsqueda.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clave SAT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Empresa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sector</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sección</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">División</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Facturable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {resultados.map((sku) => (
                      <tr key={sku.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.sku}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={sku.descripcion}>
                          {sku.descripcion}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.claveSat}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.empresa}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.sector}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.seccion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.divisionNegocio}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            sku.facturableNoFacturable === 'Facturable' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {sku.facturableNoFacturable}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(sku.precio)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{sku.unidadMedida}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {resultados.length} SKUs
              </div>
            </>
          )}
        </Card>
      )}
    </form>
  );
};
