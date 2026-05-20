import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { XMarkIcon } from './icons/XMarkIcon';
import { apiUrl, getHeadersWithUsuario } from '../services/api';

interface ProductoServicio {
  id: number;
  claveProdServ: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
  objetoImpuesto: string;
  valorUnitario: number;
  importe: number;
  tasaIVA: number;
}

interface SeleccionarProductoServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: ProductoServicio) => void;
}

export const SeleccionarProductoServicioModal: React.FC<SeleccionarProductoServicioModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [catalogo, setCatalogo] = useState<ProductoServicio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cargar catálogo al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarCatalogo();
    } else {
      // Limpiar al cerrar
      setBusqueda('');
      setError(null);
    }
  }, [isOpen]);

  const cargarCatalogo = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/catalogos/productos-servicios'), {
        headers: getHeadersWithUsuario(),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.exitoso && data.resultados) {
          const productosMapeados = data.resultados.map((item: any) => ({
            id: item.id,
            claveProdServ: item.claveProdServ || '',
            cantidad: parseFloat(item.cantidad) || 1,
            unidad: item.unidad || 'Servicio',
            claveUnidad: item.claveUnidad || 'E48',
            descripcion: item.descripcion || '',
            objetoImpuesto: item.objetoImpuesto || '02',
            valorUnitario: parseFloat(item.valorUnitario) || 0,
            importe: parseFloat(item.importe) || 0,
            tasaIVA: parseFloat(item.tasaIVA) || 0,
          }));
          setCatalogo(productosMapeados);
        } else {
          setError(data.error || 'No se pudo cargar el catálogo');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Error al cargar catálogo (${response.status})`);
      }
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      setError('Error de conexión al cargar el catálogo');
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = catalogo.filter((item) => {
    if (!busqueda.trim()) return true;
    const busquedaLower = busqueda.toLowerCase();
    return (
      item.claveProdServ.toLowerCase().includes(busquedaLower) ||
      item.descripcion.toLowerCase().includes(busquedaLower)
    );
  });

  const handleSeleccionar = (producto: ProductoServicio) => {
    onSelect(producto);
    onClose();
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Seleccionar Producto o Servicio
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por clave o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Tabla de productos */}
            {cargando ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando catálogo...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-2">
                  {busqueda ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos en tu catálogo'}
                </p>
                {!busqueda && (
                  <p className="text-sm">
                    Ve a la sección de Catálogos para agregar productos o servicios
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Clave
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valor Unitario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        IVA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Importe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {productosFiltrados.map((producto) => (
                      <tr
                        key={producto.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {producto.claveProdServ}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {producto.descripcion}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {producto.unidad}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {producto.cantidad.toFixed(6)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {formatearMoneda(producto.valorUnitario)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                          {producto.tasaIVA > 0 ? `${producto.tasaIVA}%` : 'Exento'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatearMoneda(producto.importe)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Button
                            type="button"
                            onClick={() => handleSeleccionar(producto)}
                            variant="primary"
                            className="text-xs px-3 py-1"
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={onClose} variant="neutral">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

