
import React, { useContext } from 'react';
import { ThemeContext } from '../App';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  name?: string;
  value: string | number;
  onChange: ((e: React.ChangeEvent<HTMLSelectElement>) => void) | ((value: string | number) => void);
  options: SelectOption[];
  required?: boolean;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  className = '',
  disabled = false,
  error = false,
  placeholder,
}) => {
  const { theme } = useContext(ThemeContext);
  const fieldName = name || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : 'select-field');
  const baseSelectClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm appearance-none transition-colors duration-200";
  const lightModeClasses = "border-gray-300 focus:ring-primary focus:border-primary bg-white text-gray-900";
  const darkModeClasses = "dark:border-gray-600 dark:focus:ring-secondary dark:focus:border-secondary dark:bg-gray-700 dark:text-gray-100";
  const disabledClasses = "disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:cursor-not-allowed";
  const errorClasses = error ? "border-red-600 focus:ring-red-600 focus:border-red-600" : "";
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Extraer el valor del evento
    const value = e.target.value;
    const numValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
    
    // Intentar detectar el tipo de función onChange
    // Verificar si la función espera un valor directo o un evento
    const funcLength = (onChange as any).length;
    
    // Si la función tiene exactamente 1 parámetro, intentar pasar el valor
    // Si tiene 0 o más de 1, pasar el evento
    if (funcLength === 1) {
      // Intentar llamar con el valor primero
      try {
        (onChange as (value: string | number) => void)(numValue);
        return;
      } catch (err) {
        // Si falla, intentar con el evento
        try {
          (onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void)(e);
        } catch (err2) {
          // Si ambos fallan, al menos intentamos
          console.error('Error calling onChange handler:', err2);
        }
      }
    } else {
      // Por defecto, pasar el evento completo
      (onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void)(e);
    }
  };
  
  return (
    <div className={`mb-1 ${className}`}>
      {label && (
        <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={fieldName}
          id={fieldName}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={`${baseSelectClasses} ${theme === 'light' ? lightModeClasses : darkModeClasses} ${disabledClasses} ${errorClasses}`}
        >
          <option value="" disabled hidden className="text-gray-500">
            {placeholder || '- Selecciona -'}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className={theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
    