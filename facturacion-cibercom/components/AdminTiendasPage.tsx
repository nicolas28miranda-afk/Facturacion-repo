import React, { useState, useEffect } from 'react';
import { tiendaService, Tienda, FiltrosTienda, EstadisticasTiendas } from '../services/tiendaService';
import { Button } from './Button';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';

export const AdminTiendasPage: React.FC = () => {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasTiendas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [editingTienda, setEditingTienda] = useState<Tienda | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosTienda>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState<Tienda>({
    codigoTienda: '',
    nombreTienda: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    gerente: '',
    region: '',
    zona: '',
    tipoTienda: 'Sucursal',
    estadoTienda: 'ACTIVO',
    fechaApertura: '',
    observaciones: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarTiendas();
    cargarEstadisticas();
  }, []);

  const cargarTiendas = async () => {
    setLoading(true);
    try {
      const response = await tiendaService.listarTiendas(filtros);
      if (response.success && Array.isArray(response.data)) {
        setTiendas(response.data);
        setError(null);
      } else {
        setError(response.message || 'Error al cargar las tiendas');
      }
    } catch (err) {
      setError('Error de conexión al cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await tiendaService.obtenerEstadisticas();
      if (response.success && response.data) {
        setEstadisticas(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (modalMode === 'edit' && editingTienda?.idTienda) {
        response = await tiendaService.actualizarTienda(editingTienda.idTienda, {
          ...formData,
          usuarioModificacion: 'admin'
        });
      } else {
        response = await tiendaService.crearTienda({
          ...formData,
          usuarioCreacion: 'admin'
        });
      }

      if (response.success) {
        setSuccess(response.message);
        setShowModal(false);
        resetForm();
        cargarTiendas();
        cargarEstadisticas();
      } else {
        setError(response.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tienda: Tienda) => {
    setEditingTienda(tienda);
    setFormData({
      ...tienda,
      fechaApertura: tienda.fechaApertura ? tienda.fechaApertura.split('T')[0] : ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (tienda: Tienda) => {
    setEditingTienda(tienda);
    setFormData({
      ...tienda,
      fechaApertura: tienda.fechaApertura ? tienda.fechaApertura.split('T')[0] : ''
    });
    setModalMode('view');
    setShowModal(true);
  };

  const handleDelete = async (tienda: Tienda) => {
    if (!tienda.idTienda) return;
    
    if (window.confirm(`¿Está seguro de que desea eliminar la tienda "${tienda.nombreTienda}"?`)) {
      setLoading(true);
      try {
        const response = await tiendaService.eliminarTienda(tienda.idTienda, 'admin');
        if (response.success) {
          setSuccess(response.message);
          cargarTiendas();
          cargarEstadisticas();
        } else {
          setError(response.message || 'Error al eliminar la tienda');
        }
      } catch (err) {
        setError('Error de conexión al eliminar la tienda');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      codigoTienda: '',
      nombreTienda: '',
      direccion: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      telefono: '',
      email: '',
      gerente: '',
      region: '',
      zona: '',
      tipoTienda: 'Sucursal',
      estadoTienda: 'ACTIVO',
      fechaApertura: '',
      observaciones: ''
    });
    setEditingTienda(null);
    setModalMode('create');
  };

  const handleFilterChange = (field: keyof FiltrosTienda, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const aplicarFiltros = () => {
    cargarTiendas();
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setTimeout(() => cargarTiendas(), 100);
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVO':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'SUSPENDIDO':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administración de Tiendas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las tiendas del sistema
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nueva Tienda
        </Button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {estadisticas.totalTiendas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tiendas</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {estadisticas.tiendasActivas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Activas</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {estadisticas.tiendasInactivas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Inactivas</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {estadisticas.tiendasSuspendidas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Suspendidas</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filtros</h3>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SelectField
              label="Estado"
              value={filtros.estadoTienda || ''}
              onChange={(value: string | number) => handleFilterChange('estadoTienda', String(value))}
              options={[
                { value: '', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'INACTIVO', label: 'Inactivo' },
                { value: 'SUSPENDIDO', label: 'Suspendido' }
              ]}
            />
            <SelectField
              label="Región"
              value={filtros.region || ''}
              onChange={(value: string | number) => handleFilterChange('region', String(value))}
              options={[
                { value: '', label: 'Todas' },
                ...(estadisticas?.regiones?.map(r => ({ value: r, label: r })) || [])
              ]}
            />
            <SelectField
              label="Zona"
              value={filtros.zona || ''}
              onChange={(value: string | number) => handleFilterChange('zona', String(value))}
              options={[
                { value: '', label: 'Todas' },
                ...(estadisticas?.zonas?.map(z => ({ value: z, label: z })) || [])
              ]}
            />
            <SelectField
              label="Tipo"
              value={filtros.tipoTienda || ''}
              onChange={(value: string | number) => handleFilterChange('tipoTienda', String(value))}
              options={[
                { value: '', label: 'Todos' },
                ...(estadisticas?.tiposTienda?.map(t => ({ value: t, label: t })) || [])
              ]}
            />
            <FormField
              label="Búsqueda"
              type="text"
              value={filtros.busqueda || ''}
              onChange={(e) => handleFilterChange('busqueda', e.target.value)}
              placeholder="Buscar por nombre, código, ciudad..."
            />
          </div>
        )}
        
        {showFilters && (
          <div className="flex gap-2 mt-4">
            <Button onClick={aplicarFiltros} size="sm">
              Aplicar Filtros
            </Button>
            <Button onClick={limpiarFiltros} variant="outline" size="sm">
              Limpiar
            </Button>
          </div>
        )}
      </Card>

      {/* Tabla de tiendas */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Región/Zona
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando tiendas...
                  </td>
                </tr>
              ) : tiendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron tiendas
                  </td>
                </tr>
              ) : (
                tiendas.map((tienda) => (
                  <tr key={tienda.idTienda} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tienda.codigoTienda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tienda.nombreTienda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tienda.ciudad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tienda.region} / {tienda.zona}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tienda.tipoTienda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeClass(tienda.estadoTienda || 'ACTIVO')}`}>
                        {tienda.estadoTienda}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        onClick={() => handleView(tienda)}
                        variant="outline"
                        size="sm"
                      >
                        Ver
                      </Button>
                      <Button
                        onClick={() => handleEdit(tienda)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(tienda)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === 'create' ? 'Nueva Tienda' : 
                   modalMode === 'edit' ? 'Editar Tienda' : 'Ver Tienda'}
                </h2>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Código de Tienda *"
                    type="text"
                    value={formData.codigoTienda}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigoTienda: e.target.value }))}
                    required
                    disabled={modalMode === 'view'}
                    placeholder="Ej: T001"
                  />
                  <FormField
                    label="Nombre de Tienda *"
                    type="text"
                    value={formData.nombreTienda}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreTienda: e.target.value }))}
                    required
                    disabled={modalMode === 'view'}
                    placeholder="Nombre de la tienda"
                  />
                  <FormField
                    label="Dirección"
                    type="text"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Dirección completa"
                  />
                  <FormField
                    label="Ciudad"
                    type="text"
                    value={formData.ciudad || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Ciudad"
                  />
                  <FormField
                    label="Estado"
                    type="text"
                    value={formData.estado || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Estado o provincia"
                  />
                  <FormField
                    label="Código Postal"
                    type="text"
                    value={formData.codigoPostal || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Código postal"
                  />
                  <FormField
                    label="Teléfono"
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Número de teléfono"
                  />
                  <FormField
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="correo@ejemplo.com"
                  />
                  <FormField
                    label="Gerente"
                    type="text"
                    value={formData.gerente || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gerente: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Nombre del gerente"
                  />
                  <FormField
                    label="Región"
                    type="text"
                    value={formData.region || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Región"
                  />
                  <FormField
                    label="Zona"
                    type="text"
                    value={formData.zona || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, zona: e.target.value }))}
                    disabled={modalMode === 'view'}
                    placeholder="Zona"
                  />
                  <SelectField
                    label="Tipo de Tienda"
                    value={formData.tipoTienda || 'Sucursal'}
                    onChange={(value: string | number) => setFormData(prev => ({ ...prev, tipoTienda: String(value) }))}
                    disabled={modalMode === 'view'}
                    options={[
                      { value: 'Sucursal', label: 'Sucursal' },
                      { value: 'Franquicia', label: 'Franquicia' },
                      { value: 'Corporativo', label: 'Corporativo' },
                      { value: 'Outlet', label: 'Outlet' }
                    ]}
                  />
                  <SelectField
                    label="Estado de Tienda"
                    value={formData.estadoTienda || 'ACTIVO'}
                    onChange={(value: string | number) => setFormData(prev => ({ ...prev, estadoTienda: String(value) }))}
                    disabled={modalMode === 'view'}
                    options={[
                      { value: 'ACTIVO', label: 'Activo' },
                      { value: 'INACTIVO', label: 'Inactivo' },
                      { value: 'SUSPENDIDO', label: 'Suspendido' }
                    ]}
                  />
                  <FormField
                    label="Fecha de Apertura"
                    type="date"
                    value={formData.fechaApertura || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaApertura: e.target.value }))}
                    disabled={modalMode === 'view'}
                  />
                </div>

                <TextareaField
                  label="Observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  disabled={modalMode === 'view'}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />

                {modalMode !== 'view' && (
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Procesando...' : 
                       modalMode === 'edit' ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};