import React, { useState, useContext } from 'react';
import { FaDownload, FaFilter, FaSearch, FaCalendarAlt, FaStore, FaUser, FaFileAlt, FaChartBar } from 'react-icons/fa';
import { ThemeContext } from '../App';
import { Card } from './Card';

interface ReporteData {
  id: string;
  nombre: string;
  fecha: string;
  usuario: string;
  tipo: string;
  formato: string;
  tamaño: string;
  estatus: string;
  descargas: number;
}

const ReporteVentasMaquinaCorporativasPage: React.FC = () => {
  const { customColors } = useContext(ThemeContext);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tienda: '',
    usuario: '',
    maquina: ''
  });
  const [reportes, setReportes] = useState<ReporteData[]>([
    {
      id: '1',
      nombre: 'REPORTE DE VENTAS MÁQUINA CORPORATIVAS SERELY POLU',
      fecha: '2023-10-15',
      usuario: 'admin',
      tipo: 'Ventas Corporativas',
      formato: 'PDF',
      tamaño: '2.1 MB',
      estatus: 'Disponible',
      descargas: 3
    }
  ]);
  const [isGenerando, setIsGenerando] = useState(false);

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const generarReporte = async () => {
    setIsGenerando(true);
    // Simular generación de reporte
    setTimeout(() => {
      const nuevoReporte: ReporteData = {
        id: Date.now().toString(),
        nombre: 'REPORTE DE VENTAS MÁQUINA CORPORATIVAS SERELY POLU',
        fecha: new Date().toISOString().split('T')[0],
        usuario: 'admin',
        tipo: 'Ventas Corporativas',
        formato: 'PDF',
        tamaño: '2.1 MB',
        estatus: 'Disponible',
        descargas: 0
      };
      setReportes(prev => [nuevoReporte, ...prev]);
      setIsGenerando(false);
    }, 2000);
  };

  const descargarReporte = (id: string) => {
    // Simular descarga
    console.log('Descargando reporte:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reporte de Ventas Máquina Corporativas Serely Polu
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Genera y consulta reportes de ventas de máquinas corporativas
          </p>
        </div>

        {/* Filtros */}
        <Card title="Filtros de Búsqueda" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaStore className="inline mr-2" />
                Tienda
              </label>
              <select
                value={filtros.tienda}
                onChange={(e) => handleFiltroChange('tienda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las tiendas</option>
                <option value="S001">Sucursal 1 (S001)</option>
                <option value="S002">Sucursal 2 (S002)</option>
                <option value="S003">Sucursal 3 (S003)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaUser className="inline mr-2" />
                Usuario
              </label>
              <input
                type="text"
                value={filtros.usuario}
                onChange={(e) => handleFiltroChange('usuario', e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaChartBar className="inline mr-2" />
                Máquina
              </label>
              <select
                value={filtros.maquina}
                onChange={(e) => handleFiltroChange('maquina', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las máquinas</option>
                <option value="MAQ001">Máquina 001</option>
                <option value="MAQ002">Máquina 002</option>
                <option value="MAQ003">Máquina 003</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setFiltros({ fechaInicio: '', fechaFin: '', tienda: '', usuario: '', maquina: '' })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <FaFilter className="inline mr-2" />
              Limpiar Filtros
            </button>
            <button
              onClick={generarReporte}
              disabled={isGenerando}
              className="px-6 py-2 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: customColors.primary }}
            >
              {isGenerando ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <FaSearch className="inline mr-2" />
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Lista de Reportes */}
        <Card title="Reportes Generados">
          {reportes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaFileAlt className="mx-auto h-12 w-12 mb-4" />
              <p>No se encontraron reportes disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Formato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descargas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportes.map((reporte) => (
                    <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reporte.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.tipo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.formato}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.tamaño}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {reporte.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {reporte.descargas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => descargarReporte(reporte.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                        >
                          <FaDownload className="mr-1" />
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReporteVentasMaquinaCorporativasPage;
