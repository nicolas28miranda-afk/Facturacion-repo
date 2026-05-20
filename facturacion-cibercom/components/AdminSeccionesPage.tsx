import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { TrashIcon, MagnifyingGlassIcon } from './icons';
import { ORIGEN_OPTIONS_ADMIN, SECCIONES_FACTURABLES_OPTIONS } from '../constants';
import { FormField } from './FormField';

interface SeccionNoFacturable {
  id: string;
  origen: string;
  noSeccionViajero: string;
  nombreSeccionViajero: string;
}

const initialNewSeccionData: Omit<SeccionNoFacturable, 'id' | 'nombreSeccionViajero'> = {
  origen: ORIGEN_OPTIONS_ADMIN[0]?.value || '',
  noSeccionViajero: SECCIONES_FACTURABLES_OPTIONS[0]?.value || '',
};

const dummySecciones: SeccionNoFacturable[] = [
  { id: '1', origen: 'web', noSeccionViajero: '700', nombreSeccionViajero: 'CONFIRMAR 16 20 NOVIEMBRE' },
  { id: '2', origen: 'web', noSeccionViajero: '104', nombreSeccionViajero: 'KRISPY KREME' },
  { id: '3', origen: 'web', noSeccionViajero: '207', nombreSeccionViajero: 'MOTOS' },
];

const ITEMS_PER_PAGE = 10;

export const AdminSeccionesPage: React.FC = () => {
  const [newSeccion, setNewSeccion] = useState(initialNewSeccionData);
  const [secciones, setSecciones] = useState<SeccionNoFacturable[]>(dummySecciones);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');

  // Filtrado y búsqueda
  const seccionesFiltradas = useMemo(() => {
    return secciones.filter(seccion => {
      const matchesSearch = (
        seccion.nombreSeccionViajero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seccion.noSeccionViajero.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesOrigen = !filtroOrigen || seccion.origen === filtroOrigen;
      return matchesSearch && matchesOrigen;
    });
  }, [secciones, searchTerm, filtroOrigen]);

  // Paginación
  const totalPages = Math.ceil(seccionesFiltradas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const seccionesPaginadas = seccionesFiltradas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSeccion(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSeccion = (e: React.FormEvent) => {
    e.preventDefault();
    const seccionLabel = SECCIONES_FACTURABLES_OPTIONS.find(s => s.value === newSeccion.noSeccionViajero)?.label || newSeccion.noSeccionViajero;
    const nuevaSeccionConId: SeccionNoFacturable = { 
        ...newSeccion, 
        nombreSeccionViajero: seccionLabel, 
        id: Date.now().toString() 
    };
    setSecciones(prev => [...prev, nuevaSeccionConId]);
    setNewSeccion(initialNewSeccionData);
    alert('Sección no facturable agregada (simulado).');
  };

  const handleDeleteSeccion = (id: string) => {
    setSecciones(prev => prev.filter(s => s.id !== id));
    alert(`Sección con ID ${id} eliminada (simulado).`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFiltroOrigen('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleAddSeccion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <SelectField 
                label="Origen:" 
                name="origen" 
                value={newSeccion.origen} 
                onChange={handleChange} 
                options={ORIGEN_OPTIONS_ADMIN} 
                required 
            />
            <SelectField 
                label="Secciones:" 
                name="noSeccionViajero" 
                value={newSeccion.noSeccionViajero} 
                onChange={handleChange} 
                options={SECCIONES_FACTURABLES_OPTIONS} 
                required
            />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => alert('Nueva Sección (simulado)')}>Nueva Sección</Button>
            <Button type="submit" variant="primary">Agregar Sección</Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <FormField
                label="Buscar:"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por número o nombre de sección..."
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <div className="w-full md:w-48">
              <SelectField
                label="Filtrar por origen:"
                value={filtroOrigen}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFiltroOrigen(e.target.value);
                  setCurrentPage(1);
                }}
                options={[{ value: '', label: 'Todos los orígenes' }, ...ORIGEN_OPTIONS_ADMIN]}
              />
            </div>
            {(searchTerm || filtroOrigen) && (
              <Button
                type="button"
                variant="neutral"
                onClick={clearFilters}
                className="mb-2"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lista de secciones no facturables
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">No. Sección viajero</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre Sección viajero</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {seccionesPaginadas.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{ORIGEN_OPTIONS_ADMIN.find(o => o.value === s.origen)?.label || s.origen}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{s.noSeccionViajero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{s.nombreSeccionViajero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteSeccion(s.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1" aria-label={`Eliminar sección ${s.nombreSeccionViajero}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {seccionesFiltradas.length === 0 && (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">
            {searchTerm || filtroOrigen ? 'No se encontraron resultados para la búsqueda' : 'No hay secciones no facturables definidas.'}
          </p>
        )}

        {seccionesFiltradas.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, seccionesFiltradas.length)} de {seccionesFiltradas.length} resultados
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                variant="neutral"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'neutral'}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="neutral"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};