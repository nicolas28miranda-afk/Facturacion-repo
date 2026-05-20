import React, { useState } from 'react';
import { Card } from './Card';
import { useEmpresa } from '../context/EmpresaContext';

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/i;

export const ConfiguracionEmpresaPage: React.FC = () => {
  const { empresaInfo, setEmpresaInfo } = useEmpresa();
  const [form, setForm] = useState({ nombre: empresaInfo.nombre, rfc: empresaInfo.rfc });
  const [rfcTouched, setRfcTouched] = useState(false);
  const [saved, setSaved] = useState(false);

  const isRfcValid = RFC_REGEX.test(form.rfc);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    if (id === 'rfc') setRfcTouched(true);
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRfcValid) return;
    setEmpresaInfo({ ...form });
    setSaved(true);
  };

  return (
    <div className="animate-fadeIn p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Configuración de la Empresa
      </h2>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="nombre" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nombre de la Empresa
            </label>
            <input
              type="text"
              id="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white "
              style={{ borderColor: '#d1d5db' }}
              required
            />
          </div>

          <div>
            <label 
              htmlFor="rfc" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              RFC
            </label>
            <input
              type="text"
              id="rfc"
              value={form.rfc}
              onChange={handleChange}
              onBlur={() => setRfcTouched(true)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white ${rfcTouched && !isRfcValid ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              pattern="^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$"
              title="Ingrese un RFC válido"
              required
            />
            {rfcTouched && !isRfcValid && (
              <p className="text-red-500 text-xs mt-1">RFC inválido. Ejemplo: ABCD123456EF1</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary"
              disabled={!isRfcValid}
            >
              Guardar Cambios
            </button>
          </div>
          {saved && (
            <div className="text-green-600 dark:text-green-400 text-sm text-right">¡Cambios guardados correctamente!</div>
          )}
        </form>
      </Card>
    </div>
  );
};