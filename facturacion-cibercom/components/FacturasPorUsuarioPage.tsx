import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { dashboardService, UsuarioFacturas } from '../services/dashboardService';
import { FaUser } from 'react-icons/fa';

type FiltroFecha = 'hoy' | 'mes' | 'personalizado';

export const FacturasPorUsuarioPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioFacturas[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('mes');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>('');
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);

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
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
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
      const response = await dashboardService.consultarFacturasPorUsuario(
        usuarioFiltro || undefined,
        fechas.inicio || undefined,
        fechas.fin || undefined
      );

      if (response.exitoso) {
        setUsuarios(response.usuarios);
      } else {
        console.error('Error cargando facturas por usuario:', response.mensaje);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error obteniendo facturas por usuario:', error);
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (nuevoFiltro: FiltroFecha) => {
    setFiltroFecha(nuevoFiltro);
  };

  const handleBuscar = () => {
    cargarFacturas();
  };

  const toggleExpandirUsuario = (usuario: string) => {
    setUsuarioExpandido(usuarioExpandido === usuario ? null : usuario);
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
          <FaUser className="w-6 h-6 mr-2 text-primary dark:text-secondary" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Facturas por Usuario
          </h2>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar por Usuario
              </label>
              <input
                type="text"
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
                placeholder="Ingrese nombre de usuario..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              type="button"
              variant={filtroFecha === 'personalizado' ? 'primary' : 'neutral'}
              onClick={() => handleFiltroChange('personalizado')}
              className="w-full"
            >
              Personalizado
            </Button>
            {filtroFecha === 'personalizado' && (
              <>
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
              </>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleBuscar}
              disabled={cargando}
              className="w-full md:col-span-1"
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Lista de usuarios */}
        {cargando ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Cargando facturas por usuario...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron facturas para los criterios seleccionados.
          </div>
        ) : (
          <div className="space-y-4">
            {usuarios.map((usuario) => (
              <Card key={usuario.usuario} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleExpandirUsuario(usuario.usuario)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FaUser className="w-5 h-5 mr-2 text-primary dark:text-secondary" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          {usuario.nombreUsuario || usuario.usuario}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Usuario: {usuario.usuario}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {usuario.totalFacturas} Factura(s) | {usuario.totalNotasCredito} Nota(s) de Crédito
                      </div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Total: {formatearMoneda(usuario.totalImporte)}
                      </div>
                    </div>
                  </div>
                </div>

                {usuarioExpandido === usuario.usuario && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Tipo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Serie-Folio
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
                              Estatus
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {usuario.documentos.map((doc, index) => (
                            <tr
                              key={doc.uuid || index}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    doc.tipo === 'FACTURA'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  }`}
                                >
                                  {doc.tipo === 'FACTURA' ? 'Factura' : 'Nota de Crédito'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                {doc.serie && doc.folio ? `${doc.serie}-${doc.folio}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                {doc.receptorRazonSocial || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                {doc.receptorRfc || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                                {formatearMoneda(doc.total)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                {formatearFecha(doc.fechaFactura)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    doc.estatusFacturacion === 'TIMBRADA' ||
                                    doc.estatusSat === 'VIGENTE'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}
                                >
                                  {doc.estatusFacturacion || doc.estatusSat || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {usuarios.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Mostrando {usuarios.length} usuario(s) con facturas
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

