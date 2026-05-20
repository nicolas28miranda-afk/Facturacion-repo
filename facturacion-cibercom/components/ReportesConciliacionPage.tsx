import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { SelectField } from './SelectField';
import { FormField } from './FormField';
import { Button } from './Button';
import { FileInputField } from './FileInputField';
import { TrashIcon, MagnifyingGlassIcon } from './icons';
import { TIPO_DOCUMENTO_CONCILIACION_OPTIONS, dummyConciliacionData } from '../constants';

interface DocumentoConciliacion {
  id: string;
  identificador: string;
  tipo: string;
  nombre: string;
  fechaArchivo: string;
  usuario: string;
  estatus: string;
  fechaCarga: string;
  fechaValidacion: string;
}

interface NewDocumentoFormData {
  tipoDocumento: string;
  fechaDocumento: string;
  archivo: File | null;
}

const initialNewDocumentoFormData: NewDocumentoFormData = {
  tipoDocumento: TIPO_DOCUMENTO_CONCILIACION_OPTIONS[0]?.value || '',
  fechaDocumento: new Date().toISOString().split('T')[0],
  archivo: null,
};

export const ReportesConciliacionPage: React.FC = () => {
  const [newDocumento, setNewDocumento] = useState<NewDocumentoFormData>(initialNewDocumentoFormData);
  const [documentos, setDocumentos] = useState<DocumentoConciliacion[]>(dummyConciliacionData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedEstatus, setSelectedEstatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar documentos
  const filteredDocumentos = useMemo(() => {
    return documentos.filter(doc => {
      const matchesSearch = searchTerm === '' ||
        doc.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.usuario.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = selectedTipo === '' || doc.tipo === selectedTipo;
      const matchesEstatus = selectedEstatus === '' || doc.estatus === selectedEstatus;

      return matchesSearch && matchesTipo && matchesEstatus;
    });
  }, [documentos, searchTerm, selectedTipo, selectedEstatus]);

  // Calcular páginas
  const totalPages = Math.ceil(filteredDocumentos.length / itemsPerPage);
  const paginatedDocumentos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocumentos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocumentos, currentPage]);

  // Obtener opciones únicas para filtros
  const tipoOptions = useMemo(() => {
    const tipos = Array.from(new Set(documentos.map(doc => doc.tipo)));
    return tipos.map(tipo => ({ value: tipo, label: tipo }));
  }, [documentos]);

  const estatusOptions = useMemo(() => {
    const estatus = Array.from(new Set(documentos.map(doc => doc.estatus)));
    return estatus.map(est => ({ value: est, label: est }));
  }, [documentos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewDocumento({ ...newDocumento, [e.target.name]: e.target.value });
  };

  const handleFileChange = (file: File | null) => {
    setNewDocumento({ ...newDocumento, archivo: file });
  };

  const handleCargarDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumento.archivo) {
      alert('Por favor, seleccione un archivo.');
      return;
    }
    const nuevoDoc: DocumentoConciliacion = {
      id: `doc${Date.now()}`,
      identificador: `ID-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      tipo: TIPO_DOCUMENTO_CONCILIACION_OPTIONS.find(opt => opt.value === newDocumento.tipoDocumento)?.label || newDocumento.tipoDocumento,
      nombre: newDocumento.archivo.name,
      fechaArchivo: newDocumento.fechaDocumento,
      usuario: 'currentUser', // Placeholder
      estatus: 'Pendiente',
      fechaCarga: new Date().toISOString().split('T')[0],
      fechaValidacion: '',
    };
    setDocumentos([nuevoDoc, ...documentos]);
    setNewDocumento(initialNewDocumentoFormData);
    alert('Documento cargado para conciliación (simulado).');
  };

  const handleDeleteDocumento = (id: string) => {
    setDocumentos(documentos.filter(doc => doc.id !== id));
    alert(`Documento ${id} eliminado (simulado).`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTipo('');
    setSelectedEstatus('');
    setCurrentPage(1);
  };

  const fileHelpText = "Seleccione el archivo XML, TXT, etc.";

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Favor de no subir archivos mayores a 9.5 Megas, si su archivo supera esa cantidad favor de dividirlos, recuerde incluir el encabezado en cada uno de los archivos.
      </p>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          --Cargar nuevo documento--
        </h3>
        <form onSubmit={handleCargarDocumento} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <SelectField
              label="Tipo de documento:"
              name="tipoDocumento"
              value={newDocumento.tipoDocumento}
              onChange={handleInputChange}
              options={TIPO_DOCUMENTO_CONCILIACION_OPTIONS}
              required
            />
            <FormField
              label="Fecha del documento:"
              name="fechaDocumento"
              type="date"
              value={newDocumento.fechaDocumento}
              onChange={handleInputChange}
              required
            />
            <div></div>
            <FileInputField
              label="Archivo:"
              name="archivo"
              onChange={handleFileChange}
              accept=".xml,.txt,.csv,.xlsx"
              helpText={fileHelpText}
              className="md:col-span-2"
            />
            <Button type="submit" variant="primary" className="self-end">
              Cargar archivo
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Documentos Cargados
          </h3>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <input
                type="text"
                placeholder="Buscar por ID, nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
            <SelectField
              label=""
              placeholder="Filtrar por tipo"
              value={selectedTipo}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTipo(e.target.value)}
              options={[{ value: '', label: 'Todos los tipos' }, ...tipoOptions]}
              className="w-full md:w-48"
            />
            <SelectField
              label=""
              placeholder="Filtrar por estatus"
              value={selectedEstatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEstatus(e.target.value)}
              options={[{ value: '', label: 'Todos los estatus' }, ...estatusOptions]}
              className="w-full md:w-48"
            />
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              className="w-full md:w-auto"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Identificador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Archivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Carga</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Validación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedDocumentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.identificador}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={doc.nombre}>{doc.nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.fechaArchivo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.usuario}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.estatus}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.fechaCarga}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{doc.fechaValidacion}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteDocumento(doc.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1"
                      aria-label={`Eliminar documento ${doc.nombre}`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocumentos.length === 0 && (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">
            No se encontraron documentos que coincidan con los criterios de búsqueda.
          </p>
        )}

        {filteredDocumentos.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredDocumentos.length)} de {filteredDocumentos.length} documentos
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'secondary'}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
