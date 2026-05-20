import React, { useState } from 'react';
import { Card } from './Card';
import { Select } from './common/Select';
import { Button } from './Button';

// Interfaces para los datos
interface BitacoraFormData {
  uuid: string;
  fechaFinal: string;
  fechaInicial: string;
  modulo: string;
  operacion: string;
  folio: string;
}

interface RegistroBitacora {
  id: string;
  nombre: string;
  modulo: string;
  fecha: string;
  operacion: string;
  estatus: string;
  usuario: string;
  detalles: string;
}

// Datos de muestra para la bitácora
const bitacoraMuestra: RegistroBitacora[] = [
  {
    id: 'BIT001',
    nombre: 'Actualización de factura',
    modulo: 'Facturación',
    fecha: '2023-10-15T14:30:00',
    operacion: 'Actualizar',
    estatus: 'Completado',
    usuario: 'admin@cibercom.com',
    detalles: 'Se actualizó el RFC del cliente en la factura F001-2023.'
  },
  {
    id: 'BIT002',
    nombre: 'Creación de usuario',
    modulo: 'Administración',
    fecha: '2023-10-14T09:15:00',
    operacion: 'Crear',
    estatus: 'Completado',
    usuario: 'supervisor@cibercom.com',
    detalles: 'Se creó el usuario para el nuevo empleado en el departamento de ventas.'
  },
  {
    id: 'BIT003',
    nombre: 'Eliminación de boleta',
    modulo: 'Boletas',
    fecha: '2023-10-13T16:45:00',
    operacion: 'Eliminar',
    estatus: 'Completado',
    usuario: 'operador@cibercom.com',
    detalles: 'Se eliminó la boleta B002-2023 por duplicidad.'
  },
  {
    id: 'BIT004',
    nombre: 'Generación de reporte',
    modulo: 'Reportes',
    fecha: '2023-10-12T11:20:00',
    operacion: 'Crear',
    estatus: 'Completado',
    usuario: 'analista@cibercom.com',
    detalles: 'Se generó el reporte mensual de facturación para septiembre 2023.'
  },
  {
    id: 'BIT005',
    nombre: 'Actualización de configuración',
    modulo: 'Configuración',
    fecha: '2023-10-11T10:05:00',
    operacion: 'Actualizar',
    estatus: 'Completado',
    usuario: 'admin@cibercom.com',
    detalles: 'Se actualizaron los parámetros de conexión al servicio de timbrado.'
  }
];

export const MonitorBitacoraPage: React.FC = () => {
  const [formData, setFormData] = useState<BitacoraFormData>({
    uuid: '',
    fechaFinal: '',
    fechaInicial: '',
    modulo: '',
    operacion: '',
    folio: ''
  });

  // Estados para manejar los resultados y su visualización
  const [resultados, setResultados] = useState<RegistroBitacora[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [detallesVisibles, setDetallesVisibles] = useState<{[key: string]: boolean}>({});

  // Función para manejar la búsqueda
  const handleBuscar = () => {
    // Filtrar los registros según los criterios de búsqueda
    let resultadosFiltrados = [...bitacoraMuestra];

    // Filtrar por UUID si se proporciona
    if (formData.uuid) {
      // Caso especial para demostración
      if (formData.uuid === 'BIT001') {
        resultadosFiltrados = bitacoraMuestra.filter(registro => registro.id === 'BIT001');
      } else {
        resultadosFiltrados = resultadosFiltrados.filter(registro => 
          registro.id.toLowerCase().includes(formData.uuid.toLowerCase()));
      }
    }

    // Filtrar por módulo si se proporciona
    if (formData.modulo) {
      // Caso especial para demostración
      if (formData.modulo.toLowerCase() === 'facturación') {
        resultadosFiltrados = resultadosFiltrados.filter(registro => registro.modulo === 'Facturación');
      } else {
        resultadosFiltrados = resultadosFiltrados.filter(registro => 
          registro.modulo.toLowerCase().includes(formData.modulo.toLowerCase()));
      }
    }

    // Filtrar por operación si se selecciona
    if (formData.operacion) {
      resultadosFiltrados = resultadosFiltrados.filter(registro => 
        registro.operacion.toLowerCase() === formData.operacion.toLowerCase());
    }

    // Filtrar por folio si se proporciona
    if (formData.folio) {
      resultadosFiltrados = resultadosFiltrados.filter(registro => 
        registro.nombre.toLowerCase().includes(formData.folio.toLowerCase()));
    }

    // Filtrar por fecha inicial si se proporciona
    if (formData.fechaInicial) {
      resultadosFiltrados = resultadosFiltrados.filter(registro => 
        new Date(registro.fecha) >= new Date(formData.fechaInicial));
    }

    // Filtrar por fecha final si se proporciona
    if (formData.fechaFinal) {
      resultadosFiltrados = resultadosFiltrados.filter(registro => 
        new Date(registro.fecha) <= new Date(formData.fechaFinal));
    }

    // Actualizar los resultados y mostrarlos
    setResultados(resultadosFiltrados);
    setMostrarResultados(true);
  };

  // Función para mostrar/ocultar detalles de un registro
  const toggleDetalles = (id: string) => {
    setDetallesVisibles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">UUID:</label>
              <input
                type="text"
                className="w-full rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={formData.uuid}
                onChange={(e) => setFormData({...formData, uuid: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">Fecha Final:</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={formData.fechaFinal}
                onChange={(e) => setFormData({...formData, fechaFinal: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">Fecha Inicial:</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={formData.fechaInicial}
                onChange={(e) => setFormData({...formData, fechaInicial: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">Módulo:</label>
              <input
                type="text"
                className="w-full rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">Operación:</label>
              <Select
                value={formData.operacion}
                onChange={(value) => setFormData({...formData, operacion: value})}
                options={[
                  { value: '', label: 'Seleccionar operación' },
                  { value: 'crear', label: 'Crear' },
                  { value: 'actualizar', label: 'Actualizar' },
                  { value: 'eliminar', label: 'Eliminar' }
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary dark:text-secondary">Folio:</label>
              <input
                type="text"
                className="w-full rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
                value={formData.folio}
                onChange={(e) => setFormData({...formData, folio: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button type="button" variant="primary" onClick={handleBuscar}>Buscar</Button>
          </div>
        </form>
      </Card>
      
      {mostrarResultados && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Elementos: {resultados.length}
            </span>
          </div>
          {resultados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-primary dark:bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Más</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Módulo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Operación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estatus</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {resultados.map((registro) => (
                    <React.Fragment key={registro.id}>
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => toggleDetalles(registro.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {detallesVisibles[registro.id] ? '▼' : '►'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{registro.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{registro.modulo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(registro.fecha).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            registro.operacion === 'Crear' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                            registro.operacion === 'Actualizar' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                            'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {registro.operacion}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            {registro.estatus}
                          </span>
                        </td>
                      </tr>
                      {detallesVisibles[registro.id] && (
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-2">
                              <p><strong>Usuario:</strong> {registro.usuario}</p>
                              <p><strong>Detalles:</strong> {registro.detalles}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">No se encontraron registros que coincidan con los criterios de búsqueda.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};