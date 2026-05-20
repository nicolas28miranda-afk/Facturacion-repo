import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { RadioGroupField } from './RadioGroupField';
import { Button } from './Button';
import { TrashIcon } from './icons';
import { PERFIL_OPTIONS, MENU_OPTIONS_ADMIN } from '../constants';

interface ReglaPeriodoPerfil {
  id: string; // For unique key in table
  perfil: string;
  tipoRegla: 'emision' | 'cancelacion';
  fechaInicio: string;
  fechaFin: string;
  menu: string;
}

const initialNewRuleData: Omit<ReglaPeriodoPerfil, 'id'> = {
  perfil: PERFIL_OPTIONS[0]?.value || '',
  tipoRegla: 'emision',
  fechaInicio: '',
  fechaFin: '',
  menu: MENU_OPTIONS_ADMIN[MENU_OPTIONS_ADMIN.length -1]?.value || '', // --SELECCIONA--
};

const dummyReglas: ReglaPeriodoPerfil[] = [
  { id: '1', tipoRegla: 'cancelacion', perfil: 'jefe_credito', menu: 'facturacion', fechaInicio: '2023-01-01', fechaFin: '2023-12-31' },
  { id: '2', tipoRegla: 'emision', perfil: 'operador_credito', menu: 'consultas', fechaInicio: '2024-01-01', fechaFin: '2024-06-30' },
];

export const AdminPeriodosPerfilPage: React.FC = () => {
  const [newRule, setNewRule] = useState(initialNewRuleData);
  const [reglas, setReglas] = useState<ReglaPeriodoPerfil[]>(dummyReglas);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRule(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRegla = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaReglaConId = { ...newRule, id: Date.now().toString() };
    setReglas(prevReglas => [...prevReglas, nuevaReglaConId]);
    setNewRule(initialNewRuleData); // Reset form
    alert('Regla agregada (simulado).');
  };

  const handleDeleteRegla = (id: string) => {
    setReglas(prevReglas => prevReglas.filter(regla => regla.id !== id));
    alert(`Regla con ID ${id} eliminada (simulado).`);
  };

  const tipoReglaOptions = [
    { value: 'emision', label: 'Emisión' },
    { value: 'cancelacion', label: 'Cancelación' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleAddRegla} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-end">
            <SelectField label="Perfil:" name="perfil" value={newRule.perfil} onChange={handleChange} options={PERFIL_OPTIONS} required />
            <RadioGroupField label="Tipo Regla:" name="tipoRegla" options={tipoReglaOptions} selectedValue={newRule.tipoRegla} onChange={handleChange} inline />
            <div /> {/* Spacer */}
            <FormField label="Fecha Inicio:" name="fechaInicio" type="date" value={newRule.fechaInicio} onChange={handleChange} required />
            <FormField label="Fecha Final:" name="fechaFin" type="date" value={newRule.fechaFin} onChange={handleChange} required />
            <SelectField label="Menú:" name="menu" value={newRule.menu} onChange={handleChange} options={MENU_OPTIONS_ADMIN} required />
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
          Lista de Reglas de periodos de cancelación y emisión
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo Regla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Menú</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Fin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reglas.map((regla) => (
                <tr key={regla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm capitalize text-gray-700 dark:text-gray-200">{regla.tipoRegla}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{PERFIL_OPTIONS.find(p=>p.value === regla.perfil)?.label || regla.perfil}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{MENU_OPTIONS_ADMIN.find(m=>m.value === regla.menu)?.label || regla.menu}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{regla.fechaInicio}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{regla.fechaFin}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button onClick={() => handleDeleteRegla(regla.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1" aria-label={`Eliminar regla para ${regla.perfil}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reglas.length === 0 && (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No hay reglas definidas.</p>
        )}
      </Card>
    </div>
  );
};