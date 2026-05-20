import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { TrashIcon } from './icons/TrashIcon';
import { apiUrl, getHeadersWithUsuario } from '../services/api';

interface ProductoServicio {
  id?: number;
  claveProdServ: string;
  cantidad: number;
  unidad: string;
  claveUnidad?: string;
  descripcion: string;
  objetoImpuesto: string;
  valorUnitario: number;
  importe: number;
  tasaIVA?: number;
}

const initialProducto: ProductoServicio = {
  claveProdServ: '',
  cantidad: 1,
  unidad: 'Servicio',
  claveUnidad: 'E48',
  descripcion: '',
  objetoImpuesto: '02',
  valorUnitario: 0,
  importe: 0,
  tasaIVA: 0,
};

const UNIDAD_OPTIONS = [
  { value: 'H87', label: 'H87-Pieza' },
  { value: 'EA', label: 'EA-Elemento' },
  { value: 'E48', label: 'E48-Unidad de Servicio' },
  { value: 'ACT', label: 'ACT-Actividad' },
  { value: 'KGM', label: 'KGM-Kilogramo' },
  { value: 'E51', label: 'E51-Trabajo' },
  { value: 'A9', label: 'A9-Tarifa' },
  { value: 'MTR', label: 'MTR-Metro' },
  { value: 'AB', label: 'AB-Paquete a granel' },
  { value: 'BB', label: 'BB-Caja base' },
  { value: 'KT', label: 'KT-Kit' },
  { value: 'SET', label: 'SET-Conjunto' },
  { value: 'LTR', label: 'LTR-Litro' },
  { value: 'XBX', label: 'XBX-Caja' },
  { value: 'MON', label: 'MON-Mes' },
  { value: 'HUR', label: 'HUR-Hora' },
  { value: 'MTK', label: 'MTK-Metro cuadrado' },
  { value: '11', label: '11-Equipos' },
  { value: 'MGM', label: 'MGM-Miligramo' },
  { value: 'XPK', label: 'XPK-Paquete' },
  { value: 'XKI', label: 'XKI-Kit (Conjunto de piezas)' },
  { value: 'AS', label: 'AS-Variedad' },
  { value: 'GRM', label: 'GRM-Gramo' },
  { value: 'PR', label: 'PR-Par' },
  { value: 'DPC', label: 'DPC-Docenas de piezas' },
  { value: 'xun', label: 'xun-Unidad' },
  { value: 'DAY', label: 'DAY-Día' },
  { value: 'XLT', label: 'XLT-Lote' },
  { value: '10', label: '10-Grupos' },
  { value: 'MLT', label: 'MLT-Mililitro' },
  { value: 'E54', label: 'E54-Viaje' },
];

const OBJETO_IMPUESTO_OPTIONS = [
  { value: '01', label: '01-No objeto de impuesto' },
  { value: '02', label: '02-Sí objeto de impuesto' },
  { value: '03', label: '03-Sí objeto del impuesto y no obligado al desglose' },
];

export const CatalogosProductosServiciosPage: React.FC = () => {
  const [productos, setProductos] = useState<ProductoServicio[]>([]);
  const [productoActual, setProductoActual] = useState<ProductoServicio>(initialProducto);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] = useState(false);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  // Cargar catálogo del usuario al iniciar
  useEffect(() => {
    cargarCatalogoUsuario();
  }, []);

  const cargarCatalogoUsuario = async () => {
    setCargando(true);
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
          setProductos(productosMapeados);
        }
      } else {
        console.warn('No se pudo cargar el catálogo del usuario');
      }
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setCargando(false);
    }
  };

  // Búsqueda con debounce en el campo claveProdServ
  useEffect(() => {
    const busqueda = productoActual.claveProdServ.trim();
    
    if (busqueda.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoCatalogo(true);
      try {
        const url = apiUrl(`/catalogos/sat/productos-servicios?busqueda=${encodeURIComponent(busqueda)}&limite=10`);
        console.log('Buscando en catálogo SAT:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setSugerencias(data.resultados || []);
          setMostrarSugerencias(true);
        } else {
          // Intentar obtener el mensaje de error del servidor
          try {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            if (errorData.error) {
              console.error('Mensaje de error:', errorData.error);
            }
          } catch (e) {
            console.error(`Error HTTP ${response.status}: ${response.statusText}`);
          }
          setSugerencias([]);
        }
      } catch (error) {
        console.error('Error al buscar en catálogo:', error);
        setSugerencias([]);
      } finally {
        setBuscandoCatalogo(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [productoActual.claveProdServ]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = ['cantidad', 'valorUnitario', 'importe', 'tasaIVA'].includes(name)
      ? parseFloat(value) || 0
      : value;

    setProductoActual(prev => {
      const updated = { ...prev, [name]: numValue };
      
      // Calcular importe automáticamente
      if (name === 'cantidad' || name === 'valorUnitario') {
        updated.importe = updated.cantidad * updated.valorUnitario;
      }
      
      // Si cambia unidad, actualizar también claveUnidad si no está definida
      if (name === 'unidad' && !updated.claveUnidad) {
        // Extraer el código de la opción seleccionada (ej: "E48-Unidad de servicio" -> "E48")
        const codigo = value.split('-')[0].trim();
        updated.claveUnidad = codigo;
      }
      
      return updated;
    });
  };

  const handleSeleccionarSugerencia = (item: any) => {
    setProductoActual(prev => ({
      ...prev,
      claveProdServ: item.clave,
      descripcion: item.descripcion || prev.descripcion,
      unidad: item.unidad || prev.unidad,
    }));
    setMostrarSugerencias(false);
    setSugerencias([]);
  };

  const handleAgregar = async () => {
    if (!productoActual.claveProdServ || !productoActual.descripcion) {
      alert('Por favor complete los campos obligatorios: Clave de Producto/Servicio y Descripción');
      return;
    }

    setCargando(true);
    try {
      const payload = {
        id: modoEdicion ? productoActual.id : undefined,
        claveProdServ: productoActual.claveProdServ,
        cantidad: productoActual.cantidad,
        unidad: productoActual.unidad,
        claveUnidad: productoActual.claveUnidad || 'E48',
        descripcion: productoActual.descripcion,
        objetoImpuesto: productoActual.objetoImpuesto,
        valorUnitario: productoActual.valorUnitario,
        importe: productoActual.importe,
        tasaIVA: productoActual.tasaIVA || 0,
      };

      const url = modoEdicion && productoActual.id
        ? apiUrl(`/catalogos/productos-servicios/${productoActual.id}`)
        : apiUrl('/catalogos/productos-servicios');

      const method = modoEdicion && productoActual.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeadersWithUsuario({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exitoso) {
          // Recargar el catálogo desde el servidor
          await cargarCatalogoUsuario();
          setProductoActual(initialProducto);
          setModoEdicion(false);
          alert(modoEdicion ? 'Producto/servicio actualizado exitosamente' : 'Producto/servicio guardado exitosamente');
        } else {
          alert('Error: ' + (data.error || 'No se pudo guardar el producto/servicio'));
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error al guardar' }));
        alert('Error al guardar: ' + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error('Error al guardar producto/servicio:', error);
      alert('Error al guardar el producto/servicio. Por favor intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (producto: ProductoServicio) => {
    if (producto.id) {
      setProductoActual({
        ...producto,
        id: producto.id,
      });
      setModoEdicion(true);
      // Scroll al formulario
      setTimeout(() => {
        const formCard = document.querySelector('[data-form-card]');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este producto/servicio?')) {
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(apiUrl(`/catalogos/productos-servicios/${id}`), {
        method: 'DELETE',
        headers: getHeadersWithUsuario(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exitoso) {
          // Recargar el catálogo desde el servidor
          await cargarCatalogoUsuario();
          alert('Producto/servicio eliminado exitosamente');
        } else {
          alert('Error: ' + (data.error || 'No se pudo eliminar el producto/servicio'));
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar' }));
        alert('Error al eliminar: ' + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error('Error al eliminar producto/servicio:', error);
      alert('Error al eliminar el producto/servicio. Por favor intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = async () => {
    if (!filtroBusqueda.trim()) {
      alert('Por favor ingrese un término de búsqueda');
      return;
    }

    setBuscandoCatalogo(true);
    try {
      const response = await fetch(apiUrl(`/catalogos/sat/productos-servicios?busqueda=${encodeURIComponent(filtroBusqueda)}&limite=50`));
      if (response.ok) {
        const data = await response.json();
        const resultados = data.resultados || [];
        setResultadosBusqueda(resultados);
        setMostrarResultadosBusqueda(true);
        
        if (resultados.length === 0) {
          alert('No se encontraron productos/servicios que coincidan con la búsqueda');
        }
      } else {
        alert('Error al buscar en el catálogo SAT');
      }
    } catch (error) {
      console.error('Error al buscar en catálogo:', error);
      alert('Error al buscar en el catálogo SAT');
    } finally {
      setBuscandoCatalogo(false);
    }
  };


  const productosFiltrados = filtroBusqueda
    ? productos.filter(p =>
        p.claveProdServ.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase())
      )
    : productos;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Búsqueda */}
      <Card title="Buscar Productos o Servicios">
        <div className="flex flex-col sm:flex-row gap-2">
          <FormField
            name="filtroBusqueda"
            label="Buscar"
            value={filtroBusqueda}
            onChange={(e) => {
              setFiltroBusqueda(e.target.value);
              setMostrarResultadosBusqueda(false);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleBuscar();
              }
            }}
            placeholder="Buscar por clave o descripción..."
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleBuscar}
            variant="secondary"
            disabled={buscandoCatalogo}
            className="w-full sm:w-auto mt-6 sm:mt-0 flex items-center justify-center gap-2"
          >
            {buscandoCatalogo ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span>Buscar</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Resultados de búsqueda */}
        {mostrarResultadosBusqueda && resultadosBusqueda.length > 0 && (
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Resultados de búsqueda ({resultadosBusqueda.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {resultadosBusqueda.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setProductoActual(prev => ({
                      ...prev,
                      claveProdServ: item.clave,
                      descripcion: item.descripcion || prev.descripcion,
                      unidad: item.unidad || prev.unidad,
                    }));
                    setMostrarResultadosBusqueda(false);
                    setFiltroBusqueda('');
                    // Scroll al formulario (buscamos el Card del formulario)
                    setTimeout(() => {
                      const formCard = document.querySelector('[data-form-card]');
                      if (formCard) {
                        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {item.clave}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.descripcion}
                      </div>
                    </div>
                    {item.unidad && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {item.unidad}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Formulario de Producto/Servicio */}
      <Card title="Agregar/Modificar Producto o Servicio" data-form-card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="relative">
              <FormField
                ref={inputRef}
                name="claveProdServ"
                label="Producto o servicio (Clave SAT) *"
                value={productoActual.claveProdServ}
                onChange={handleChange}
                onFocus={() => {
                  if (sugerencias.length > 0) {
                    setMostrarSugerencias(true);
                  }
                }}
                required
                placeholder="Escriba la clave o descripción para buscar..."
              />
              {buscandoCatalogo && (
                <div className="absolute right-3 top-9 text-gray-400">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {/* Dropdown de sugerencias */}
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div
                  ref={sugerenciasRef}
                  className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {sugerencias.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSeleccionarSugerencia(item)}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {item.clave}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.descripcion}
                          </div>
                        </div>
                        {item.unidad && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {item.unidad}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <FormField
            name="cantidad"
            label="Cantidad *"
            type="number"
            value={productoActual.cantidad.toString()}
            onChange={handleChange}
            required
            step="0.000001"
          />

          <SelectField
            name="unidad"
            label="Unidad (Descriptivo) *"
            value={productoActual.unidad}
            onChange={handleChange}
            options={UNIDAD_OPTIONS}
            required
          />

          <SelectField
            name="claveUnidad"
            label="Clave Unidad (Código SAT) *"
            value={productoActual.claveUnidad || 'E48'}
            onChange={handleChange}
            options={UNIDAD_OPTIONS}
            required
          />

          <div className="md:col-span-2 lg:col-span-3">
            <FormField
              name="descripcion"
              label="Descripción *"
              value={productoActual.descripcion}
              onChange={handleChange}
              required
              placeholder="Descripción del producto o servicio"
            />
          </div>

          <SelectField
            name="objetoImpuesto"
            label="Objeto de impuesto *"
            value={productoActual.objetoImpuesto}
            onChange={handleChange}
            options={OBJETO_IMPUESTO_OPTIONS}
            required
          />

          <FormField
            name="valorUnitario"
            label="Valor unitario *"
            type="number"
            value={productoActual.valorUnitario.toString()}
            onChange={handleChange}
            required
            step="0.01"
          />

          <FormField
            name="importe"
            label="Importe"
            type="number"
            value={productoActual.importe.toFixed(2)}
            onChange={handleChange}
            disabled
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
          <Button
            type="button"
            onClick={handleAgregar}
            variant="primary"
            disabled={cargando}
            className="w-full sm:w-auto"
          >
            {cargando ? 'Guardando...' : modoEdicion ? 'Modificar' : 'Agregar'}
          </Button>
          {modoEdicion && (
            <Button
              type="button"
              onClick={() => {
                setProductoActual(initialProducto);
                setModoEdicion(false);
              }}
              variant="neutral"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      {/* Tabla de Productos/Servicios */}
      <Card title="Productos o Servicios Registrados">
        {cargando && productos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Cargando catálogo...
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay productos o servicios registrados. Agregue uno para comenzar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Producto o servicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Objeto de impuesto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor unitario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {producto.claveProdServ}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {producto.cantidad.toFixed(6).replace(/\.?0+$/, '')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {producto.unidad}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {producto.descripcion}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {producto.objetoImpuesto === '02'
                        ? `02-Sí objeto de impuesto. Tasa IVA: ${(producto.tasaIVA || 0).toFixed(6)}`
                        : `${producto.objetoImpuesto}-${OBJETO_IMPUESTO_OPTIONS.find(o => o.value === producto.objetoImpuesto)?.label.split('-')[1] || ''}`}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${producto.valorUnitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${producto.importe.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditar(producto)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(producto.id!)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
};

