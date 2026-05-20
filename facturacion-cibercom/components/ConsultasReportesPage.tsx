import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { REPORT_BUTTON_LIST } from '../constants';
import { DocumentTextIcon } from './icons';
import { FaUser } from 'react-icons/fa';

interface Reporte {
  id: number;
  nombre: string;
  fechaGeneracion: string;
  usuario: string;
  tipoReporte: string;
  formato: string;
  tamaño: string;
  estatus: string;
  descargas: number;
}

const reportesMuestra: Reporte[] = [
  {
    id: 1,
    nombre: 'REPORTE DE CONSULTA MONEDEROS',
    fechaGeneracion: '2023-10-15',
    usuario: 'admin',
    tipoReporte: 'Monederos',
    formato: 'PDF',
    tamaño: '1.2 MB',
    estatus: 'Disponible',
    descargas: 5
  },
  {
    id: 2,
    nombre: 'REPORTE DE VENTAS MÁQUINA CORPORATIVAS SERELY POLU',
    fechaGeneracion: '2023-10-16',
    usuario: 'supervisor',
    tipoReporte: 'Ventas',
    formato: 'Excel',
    tamaño: '3.5 MB',
    estatus: 'Disponible',
    descargas: 12
  },
  {
    id: 3,
    nombre: 'RÉGIMEN DE FACTURACIÓN NO MISMA BOLETA',
    fechaGeneracion: '2023-10-17',
    usuario: 'admin',
    tipoReporte: 'Facturación',
    formato: 'PDF',
    tamaño: '0.8 MB',
    estatus: 'Disponible',
    descargas: 3
  },
  {
    id: 4,
    nombre: 'DOBLE FACTURACIÓN PENDIENTE POR DEFENCIA',
    fechaGeneracion: '2023-10-18',
    usuario: 'supervisor',
    tipoReporte: 'Facturación',
    formato: 'Excel',
    tamaño: '2.1 MB',
    estatus: 'En proceso',
    descargas: 0
  },
  {
    id: 5,
    nombre: 'SUSTITUCIÓN EN PROCESO',
    fechaGeneracion: '2023-10-19',
    usuario: 'admin',
    tipoReporte: 'Sustitución',
    formato: 'PDF',
    tamaño: '1.5 MB',
    estatus: 'Disponible',
    descargas: 7
  }
];

export interface ConsultasReportesPageProps {
  setActivePage?: (page: string) => void;
}

export const ConsultasReportesPage: React.FC<ConsultasReportesPageProps> = ({ setActivePage }) => {
  const [reporteSeleccionado, setReporteSeleccionado] = useState<string>('');
  const [resultados, setResultados] = useState<Reporte[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const handleReportButtonClick = (reportName: string) => {
    console.log(`Generando reporte: "${reportName}"`);
    setReporteSeleccionado(reportName);
    
    // Filtrar reportes según el nombre seleccionado
    let reportesFiltrados = reportesMuestra.filter(reporte => 
      reporte.nombre === reportName
    );
    
    // Si no hay coincidencias exactas, buscar coincidencias parciales
    if (reportesFiltrados.length === 0) {
      reportesFiltrados = reportesMuestra.filter(reporte => 
        reporte.nombre.includes(reportName)
      );
    }
    
    // Casos especiales para demostración
    if (reportName === 'REPORTE DE CONSULTA MONEDEROS') {
      reportesFiltrados = reportesMuestra.filter(r => r.tipoReporte === 'Monederos');
    } else if (reportName === 'REPORTE DE VENTAS MÁQUINA CORPORATIVAS SERELY POLU') {
      reportesFiltrados = reportesMuestra.filter(r => r.tipoReporte === 'Ventas');
    } else if (reportName === 'RÉGIMEN DE FACTURACIÓN NO MISMA BOLETA') {
      reportesFiltrados = reportesMuestra.filter(r => r.tipoReporte === 'Facturación');
    }
    
    setResultados(reportesFiltrados);
    setMostrarResultados(true);
  };

  const handleDescargarReporte = (id: number) => {
    alert(`Descargando reporte ID: ${id} (simulado).`);
    // Aquí iría la lógica real para descargar el reporte
  };

  const numColumns = Math.min(REPORT_BUTTON_LIST.length, 4);

  const handleIrAFacturasSustituidas = () => {
    if (setActivePage) {
      setActivePage('facturas-sustituidas');
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Seleccione un reporte:
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleIrAFacturasSustituidas}
            className="flex items-center gap-2"
          >
            <DocumentTextIcon className="w-4 h-4" />
            Facturas Sustituidas
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setActivePage && setActivePage('facturas-por-usuario')}
            className="flex items-center gap-2"
          >
            <FaUser className="w-4 h-4" />
            Facturas por Usuario
          </Button>
        </div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${numColumns} gap-3`}>
        {REPORT_BUTTON_LIST.map((reportName) => (
          <Button
            key={reportName}
            type="button"
            variant={reportName === reporteSeleccionado ? "primary" : "neutral"}
            onClick={() => handleReportButtonClick(reportName)}
            className="w-full h-full text-xs text-center break-words whitespace-normal py-3 px-2 justify-center" 
          >
            {reportName}
          </Button>
        ))}
      </div>
      
      {!mostrarResultados ? (
        <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          El reporte seleccionado se mostrará o descargará aquí.
        </div>
      ) : (
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Reporte: {reporteSeleccionado}
          </h3>
          
          {resultados.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron reportes disponibles para esta selección.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Formato</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tamaño</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Descargas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {resultados.map((reporte) => (
                      <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={reporte.nombre}>
                          {reporte.nombre}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.fechaGeneracion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.usuario}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.tipoReporte}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.formato}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.tamaño}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            reporte.estatus === 'Disponible' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : reporte.estatus === 'En proceso'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {reporte.estatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{reporte.descargas}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleDescargarReporte(reporte.id)}
                            disabled={reporte.estatus !== 'Disponible'}
                            className="text-xs py-1 px-2"
                          >
                            Descargar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {resultados.length} reportes
              </div>
            </>
          )}
        </Card>
      )}
    </Card>
  );
};
