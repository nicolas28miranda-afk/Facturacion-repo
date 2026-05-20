import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { TrashIcon } from './icons';
import { PLATAFORMA_OPTIONS } from '../constants';

interface ReglaPeriodoPlataforma {
  id: string; // For unique key in table
  plataforma: string;
  tipoRegla: 'emision'; // Fixed for this page
  fechaInicio: string;
  fechaFin: string;
}

const initialNewRuleData: Omit<ReglaPeriodoPlataforma, 'id' | 'tipoRegla'> = {
  plataforma: PLATAFORMA_OPTIONS[PLATAFORMA_OPTIONS.length-1]?.value || '',
  fechaInicio: '',
  fechaFin: '',
};

const dummyReglas: ReglaPeriodoPlataforma[] = [
  { id: '1', tipoRegla: 'emision', plataforma: 'kiosko', fechaInicio: '2023-01-01', fechaFin: '2023-12-31' },
  { id: '2', tipoRegla: 'emision', plataforma: 'internet', fechaInicio: '2024-01-01', fechaFin: '2024-06-30' },
];

export const AdminPeriodosPlataformaPage: React.FC = () => {
  const [newRule, setNewRule] = useState(initialNewRuleData);
  const [reglas, setReglas] = useState<ReglaPeriodoPlataforma[]>(dummyReglas);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRule(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRegla = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaReglaConId: ReglaPeriodoPlataforma = { ...newRule, tipoRegla: 'emision', id: Date.now().toString() };
    setReglas(prevReglas => [...prevReglas, nuevaReglaConId]);
    setNewRule(initialNewRuleData); // Reset form
    alert('Regla de plataforma agregada (simulado).');
  };

  const handleDeleteRegla = (id: string) => {
    setReglas(prevReglas => prevReglas.filter(regla => regla.id !== id));
    alert(`Regla de plataforma con ID ${id} eliminada (simulado).`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleAddRegla} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-end">
            <SelectField label="Plataforma:" name="plataforma" value={newRule.plataforma} onChange={handleChange} options={PLATAFORMA_OPTIONS} required />
            <FormField label="Tipo Regla:" name="tipoReglaDisplay" value="Emisión" onChange={() => {}} disabled />
            <div /> {/* Spacer */}
            <FormField label="Fecha Inicio:" name="fechaInicio" type="date" value={newRule.fechaInicio} onChange={handleChange} required />
            <FormField label="Fecha Final:" name="fechaFin" type="date" value={newRule.fechaFin} onChange={handleChange} required />
          </div>
          <div className="flex justify-start mt-4">
            <Button type="submit" variant="primary">
              Agregar Regla
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lista de Reglas de periodos de emisión
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo Regla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Plataforma</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Fin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reglas.map((regla) => (
                <tr key={regla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm capitalize text-gray-700 dark:text-gray-200">{regla.tipoRegla}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{PLATAFORMA_OPTIONS.find(p=>p.value === regla.plataforma)?.label || regla.plataforma}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{regla.fechaInicio}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{regla.fechaFin}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteRegla(regla.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1" aria-label={`Eliminar regla para ${regla.plataforma}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reglas.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No hay reglas de plataforma definidas.</p>
        )}
      </Card>
    </div>
  );
};