import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { dashboardService, FacturaSustituida } from '../services/dashboardService';
import { facturaService } from '../services/facturaService';
import { DocumentTextIcon } from './icons';

type FiltroFecha = 'hoy' | 'mes' | 'personalizado';

export const FacturasSustituidasPage: React.FC = () => {
  const [facturas, setFacturas] = useState<FacturaSustituida[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('hoy');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [descargando, setDescargando] = useState<string | null>(null);

  useEffect(() => {
    cargarFacturas();
  }, []);

  const obtenerFechasPorFiltro = (filtro: FiltroFecha): { inicio: string; fin: string } => {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date = new Date(hoy);

    switch (filtro) {
      case 'hoy':
        inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case 'personalizado':
        return {
          inicio: fechaInicio || '',
          fin: fechaFin || '',
        };
      default:
        inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
    };
  };

  const cargarFacturas = async () => {
    setCargando(true);
    try {
      const fechas = obtenerFechasPorFiltro(filtroFecha);
      const response = await dashboardService.consultarFacturasSustituidas(
        fechas.inicio || undefined,
        fechas.fin || undefined
      );

      if (response.exitoso) {
        setFacturas(response.facturas);
      } else {
        console.error('Error cargando facturas sustituidas:', response.mensaje);
        setFacturas([]);
      }
    } catch (error) {
      console.error('Error obteniendo facturas sustituidas:', error);
      setFacturas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (nuevoFiltro: FiltroFecha) => {
    setFiltroFecha(nuevoFiltro);
  };

  const handleBuscar = () => {
    setSeleccionados(new Set());
    cargarFacturas();
  };

  const handleSeleccionar = (uuid: string) => {
    const nuevosSeleccionados = new Set(seleccionados);
    if (nuevosSeleccionados.has(uuid)) {
      nuevosSeleccionados.delete(uuid);
    } else {
      nuevosSeleccionados.add(uuid);
    }
    setSeleccionados(nuevosSeleccionados);
  };

  const handleSeleccionarTodos = () => {
    if (seleccionados.size === facturas.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(facturas.map(f => f.uuid).filter(Boolean)));
    }
  };

  const handleDescargarPDF = async (uuid: string) => {
    if (!uuid) return;
    setDescargando(uuid);
    try {
      await facturaService.generarYDescargarPDF(uuid);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setDescargando(null);
    }
  };

  const handleDescargarXML = async (uuid: string) => {
    if (!uuid) return;
    setDescargando(uuid);
    try {
      await facturaService.generarYDescargarXML(uuid);
    } catch (error) {
      console.error('Error descargando XML:', error);
      alert('Error al descargar el XML: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setDescargando(null);
    }
  };

  const handleDescargarSeleccionados = async (tipo: 'pdf' | 'xml' | 'zip') => {
    const uuids = Array.from(seleccionados).filter(Boolean);
    if (uuids.length === 0) {
      alert('Por favor seleccione al menos una factura');
      return;
    }

    setDescargando('masivo');
    try {
      if (tipo === 'zip') {
        await facturaService.generarYDescargarZIPMultiple(uuids);
      } else if (tipo === 'pdf') {
        // Descargar PDFs individualmente
        for (const uuid of uuids) {
          try {
            await facturaService.generarYDescargarPDF(uuid);
            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error descargando PDF de ${uuid}:`, error);
          }
        }
      } else if (tipo === 'xml') {
        // Descargar XMLs individualmente
        for (const uuid of uuids) {
          try {
            await facturaService.generarYDescargarXML(uuid);
            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error descargando XML de ${uuid}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error descargando seleccionados:', error);
      alert('Error al descargar los documentos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setDescargando(null);
    }
  };

  const formatearMoneda = (valor: number | undefined): string => {
    if (valor === undefined || valor === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(valor);
  };

  const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="w-6 h-6 mr-2 text-primary dark:text-secondary" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Facturas Sustituidas
          </h2>
        </div>

        {/* Filtros de fecha */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Button
              type="button"
              variant={filtroFecha === 'hoy' ? 'primary' : 'neutral'}
              onClick={() => handleFiltroChange('hoy')}
              className="w-full"
            >
              Día Actual
            </Button>
            <Button
              type="button"
              variant={filtroFecha === 'mes' ? 'primary' : 'neutral'}
              onClick={() => handleFiltroChange('mes')}
              className="w-full"
            >
              Mes Actual
            </Button>
            <Button
              type="button"
              variant={filtroFecha === 'personalizado' ? 'primary' : 'neutral'}
              onClick={() => handleFiltroChange('personalizado')}
              className="w-full"
            >
              Personalizado
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleBuscar}
              disabled={cargando}
              className="w-full"
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {filtroFecha === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabla de resultados */}
        {cargando ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Cargando facturas sustituidas...
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron facturas sustituidas para el periodo seleccionado.
          </div>
        ) : (
          <>
            {/* Barra de acciones para seleccionados */}
            {seleccionados.size > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {seleccionados.size} documento(s) seleccionado(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleDescargarSeleccionados('pdf')}
                    disabled={descargando === 'masivo'}
                    className="text-xs"
                  >
                    {descargando === 'masivo' ? 'Descargando...' : 'Descargar PDFs'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleDescargarSeleccionados('xml')}
                    disabled={descargando === 'masivo'}
                    className="text-xs"
                  >
                    {descargando === 'masivo' ? 'Descargando...' : 'Descargar XMLs'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleDescargarSeleccionados('zip')}
                    disabled={descargando === 'masivo'}
                    className="text-xs"
                  >
                    {descargando === 'masivo' ? 'Generando...' : 'Descargar ZIP'}
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === facturas.length && facturas.length > 0}
                        onChange={handleSeleccionarTodos}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      UUID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Serie-Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      UUID Original
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Serie-Folio Original
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Receptor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      RFC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {facturas.map((factura, index) => (
                    <tr
                      key={factura.uuid || index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={factura.uuid ? seleccionados.has(factura.uuid) : false}
                          onChange={() => factura.uuid && handleSeleccionar(factura.uuid)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 font-mono text-xs break-all max-w-xs">
                        <span title={factura.uuid || ''}>
                          {factura.uuid || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        {factura.serie && factura.folio
                          ? `${factura.serie}-${factura.folio}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 font-mono text-xs break-all max-w-xs">
                        <span title={factura.uuidOrig || ''}>
                          {factura.uuidOrig || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        {factura.serieOrig && factura.folioOrig
                          ? `${factura.serieOrig}-${factura.folioOrig}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {factura.receptorRazonSocial || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        {factura.receptorRfc || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                        {formatearMoneda(factura.total)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                        {formatearFecha(factura.fechaFactura)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => factura.uuid && handleDescargarPDF(factura.uuid)}
                            disabled={!factura.uuid || descargando === factura.uuid}
                            className="text-xs py-1 px-2"
                            title="Descargar PDF"
                          >
                            {descargando === factura.uuid ? '...' : 'PDF'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => factura.uuid && handleDescargarXML(factura.uuid)}
                            disabled={!factura.uuid || descargando === factura.uuid}
                            className="text-xs py-1 px-2"
                            title="Descargar XML"
                          >
                            {descargando === factura.uuid ? '...' : 'XML'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {facturas.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Mostrando {facturas.length} factura(s) sustituida(s)
          </div>
        )}
      </Card>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

