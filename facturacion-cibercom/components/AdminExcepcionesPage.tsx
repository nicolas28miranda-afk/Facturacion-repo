import React, { useState } from 'react';
import { Card } from './Card';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { TrashIcon } from './icons';
import { ORIGEN_OPTIONS_ADMIN, SECCIONES_FACTURABLES_OPTIONS, FORMA_PAGO_EXCEPCIONES_OPTIONS, LEYENDA_EXCEPCIONES_OPTIONS } from '../constants';

interface ExcepcionFacturable {
  id: string;
  origen: string;
  pos: string;
  leyenda: string;
  seccion: string;
  formasPago: string;
}

const initialNewExcepcionData: Omit<ExcepcionFacturable, 'id' | 'pos'> = {
  origen: ORIGEN_OPTIONS_ADMIN[0]?.value || '',
  leyenda: LEYENDA_EXCEPCIONES_OPTIONS[LEYENDA_EXCEPCIONES_OPTIONS.length-1]?.value || '',
  seccion: SECCIONES_FACTURABLES_OPTIONS[0]?.value || '',
  formasPago: FORMA_PAGO_EXCEPCIONES_OPTIONS[0]?.value || '',
};

const dummyExcepciones: ExcepcionFacturable[] = [
  { id: '1', origen: 'web', pos: 'web', leyenda: 'Pagado en una sola exhibición', seccion: 'RESTAURANTE', formasPago: '-1 (CUALQUIERA)' },
  { id: '2', origen: 'internet', pos: 'internet', leyenda: 'Pagado en una sola exhibición', seccion: 'RESTAURANTE', formasPago: '0 - Cheque' },
  { id: '3', origen: 'kiosco', pos: 'kiosco', leyenda: 'Pagado en una sola exhibición', seccion: 'SNACK BAR', formasPago: '1 - Cupón' },
];

export const AdminExcepcionesPage: React.FC = () => {
  const [newExcepcion, setNewExcepcion] = useState(initialNewExcepcionData);
  const [excepciones, setExcepciones] = useState<ExcepcionFacturable[]>(dummyExcepciones);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExcepcion(prev => ({ ...prev, [name]: value }));
  };

  const handleAddExcepcion = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaExcepcionConId: ExcepcionFacturable = { ...newExcepcion, pos: newExcepcion.origen, id: Date.now().toString() };
    setExcepciones(prev => [...prev, nuevaExcepcionConId]);
    setNewExcepcion(initialNewExcepcionData);
    alert('Excepción agregada (simulado).');
  };

  const handleDeleteExcepcion = (id: string) => {
    setExcepciones(prev => prev.filter(ex => ex.id !== id));
    alert(`Excepción con ID ${id} eliminada (simulado).`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleAddExcepcion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <SelectField label="Origen:" name="origen" value={newExcepcion.origen} onChange={handleChange} options={ORIGEN_OPTIONS_ADMIN} required />
            <SelectField label="Secciones:" name="seccion" value={newExcepcion.seccion} onChange={handleChange} options={SECCIONES_FACTURABLES_OPTIONS} required />
            <SelectField label="Forma de Pago:" name="formasPago" value={newExcepcion.formasPago} onChange={handleChange} options={FORMA_PAGO_EXCEPCIONES_OPTIONS} required />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4">
            <SelectField label="Leyenda:" name="leyenda" value={newExcepcion.leyenda} onChange={handleChange} options={LEYENDA_EXCEPCIONES_OPTIONS} required />
             <div className="md:col-span-2 flex justify-end space-x-3 self-end">
                <Button type="button" variant="secondary" onClick={() => alert('Nueva Sección (simulado)')}>Nueva Sección</Button>
                <Button type="button" variant="secondary" onClick={() => alert('Nueva Forma Pago (simulado)')}>Nueva Forma Pago</Button>
                <Button type="submit" variant="primary">Agregar Excepción</Button>
            </div>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lista de secciones no facturables (Excepciones)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">POS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Leyenda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Formas de Pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {excepciones.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{ORIGEN_OPTIONS_ADMIN.find(o => o.value === ex.origen)?.label || ex.origen}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{ex.pos}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{LEYENDA_EXCEPCIONES_OPTIONS.find(l=>l.value === ex.leyenda)?.label || ex.leyenda}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{SECCIONES_FACTURABLES_OPTIONS.find(s => s.value === ex.seccion)?.label || ex.seccion}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{FORMA_PAGO_EXCEPCIONES_OPTIONS.find(f=>f.value === ex.formasPago)?.label || ex.formasPago}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteExcepcion(ex.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1" aria-label={`Eliminar excepción ${ex.id}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {excepciones.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No hay excepciones definidas.</p>
        )}
      </Card>
    </div>
  );
};