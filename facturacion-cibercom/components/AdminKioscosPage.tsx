import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PlusCircleIcon, PencilSquareIcon, MagnifyingGlassIcon } from './icons';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TIENDA_OPTIONS } from '../constants';
import { setSessionCodigoTienda } from '../services/sessionService';


interface Kiosco {
  id: string;
  tienda: string; // Store ID
  terminal: string;
  codigoPostal: string;
  ubicacion: string;
}

// Dummy data for kiosk list
const ITEMS_PER_PAGE = 10;

// Dummy data for kiosk list
const dummyKioscos: Kiosco[] = [
  { id: 'K001', tienda: 'S001', terminal: '1001', codigoPostal: '55001', ubicacion: 'Zona Norte' },
  { id: 'K002', tienda: 'S002', terminal: '1002', codigoPostal: '55002', ubicacion: 'Zona Centro' },
  { id: 'K003', tienda: 'S003', terminal: '1003', codigoPostal: '55003', ubicacion: 'Zona Sur' },
];

const initialKioscoData: Omit<Kiosco, 'id'> = {
    tienda: TIENDA_OPTIONS[0]?.value || '',
    terminal: '',
    codigoPostal: '',
    ubicacion: '',
};

export const AdminKioscosPage: React.FC = () => {
  const [kioscos, setKioscos] = useState<Kiosco[]>(dummyKioscos);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKiosco, setNewKiosco] = useState(initialKioscoData);
  const [editingKiosco, setEditingKiosco] = useState<Kiosco | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTienda, setFiltroTienda] = useState('');

  // Filtrado y búsqueda
  const kioscosFiltrados = useMemo(() => {
    return kioscos.filter(kiosco => {
      const matchesSearch = (
        kiosco.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kiosco.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kiosco.codigoPostal.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesTienda = !filtroTienda || kiosco.tienda === filtroTienda;
      return matchesSearch && matchesTienda;
    });
  }, [kioscos, searchTerm, filtroTienda]);

  // Paginación
  const totalPages = Math.ceil(kioscosFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const kioscosPaginados = kioscosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'tienda') {
      setSessionCodigoTienda(value);
    }
    if (editingKiosco) {
        setEditingKiosco(prev => prev ? {...prev, [name]:value} : null);
    } else {
        setNewKiosco(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddKioscoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingKiosco) {
        setKioscos(kioscos.map(k => k.id === editingKiosco.id ? editingKiosco : k));
        alert(`Kiosco ${editingKiosco.id} actualizado (simulado).`);
        setEditingKiosco(null);
    } else {
        const kioscoToAdd: Kiosco = { ...newKiosco, id: `K${Date.now()}` };
        setKioscos(prev => [...prev, kioscoToAdd]);
        alert(`Kiosco ${kioscoToAdd.ubicacion} agregado (simulado).`);
    }
    setNewKiosco(initialKioscoData);
    setShowAddForm(false);
  };

  const handleModifyKiosco = (kiosco: Kiosco) => {
    setEditingKiosco(kiosco);
    setNewKiosco(kiosco); // Pre-fill form for editing
    setShowAddForm(true);
  };
  
  const toggleAddForm = () => {
    setEditingKiosco(null);
    setNewKiosco(initialKioscoData);
    setShowAddForm(!showAddForm);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFiltroTienda('');
    setCurrentPage(1);
  };


  const renderForm = () => (
     <Card className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {editingKiosco ? 'Modificar Kiosco' : 'Agregar Nuevo Kiosco'}
        </h3>
        <form onSubmit={handleAddKioscoSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Tienda:" name="tienda" value={editingKiosco?.tienda || newKiosco.tienda} onChange={handleInputChange} options={TIENDA_OPTIONS.filter(t => t.value !== 'Todas')} required/>
            <FormField label="Terminal:" name="terminal" value={editingKiosco?.terminal || newKiosco.terminal} onChange={handleInputChange} required />
            <FormField label="Código Postal:" name="codigoPostal" value={editingKiosco?.codigoPostal || newKiosco.codigoPostal} onChange={handleInputChange} required />
            <FormField label="Ubicación:" name="ubicacion" value={editingKiosco?.ubicacion || newKiosco.ubicacion} onChange={handleInputChange} required />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button type="button" variant="neutral" onClick={toggleAddForm}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingKiosco ? 'Guardar Cambios' : 'Agregar Kiosco'}</Button>
          </div>
        </form>
      </Card>
  );


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 sr-only">
          ADMINISTRACIÓN DE KIOSCOS
        </h2>
        <div></div> {/* Spacer */}
        {!showAddForm && (
            <Button onClick={toggleAddForm} variant="primary" className="flex items-center">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Agregar
            </Button>
        )}
      </div>

      {showAddForm && renderForm()}

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
                placeholder="Buscar por ubicación, terminal o código postal..."
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <div className="w-full md:w-48">
              <SelectField
                label="Filtrar por tienda:"
                value={filtroTienda}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFiltroTienda(e.target.value);
                  setSessionCodigoTienda(e.target.value);
                  setCurrentPage(1);
                }}
                options={[{ value: '', label: 'Todas las tiendas' }, ...TIENDA_OPTIONS]}
              />
            </div>
            {(searchTerm || filtroTienda) && (
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
          Lista de Kiosco
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tienda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Terminal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Código Postal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Modificar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {kioscosPaginados.map((kiosco) => (
                <tr key={kiosco.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{TIENDA_OPTIONS.find(t=>t.value === kiosco.tienda)?.label || kiosco.tienda}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{kiosco.terminal}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{kiosco.codigoPostal}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{kiosco.ubicacion}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button onClick={() => handleModifyKiosco(kiosco)} className="text-primary dark:text-secondary hover:underline p-1" aria-label={`Modificar kiosco ${kiosco.ubicacion}`}>
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {kioscosFiltrados.length === 0 && (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">
            {searchTerm || filtroTienda ? 'No se encontraron resultados para la búsqueda' : 'No hay kioscos registrados.'}
          </p>
        )}

        {kioscosFiltrados.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, kioscosFiltrados.length)} de {kioscosFiltrados.length} resultados
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