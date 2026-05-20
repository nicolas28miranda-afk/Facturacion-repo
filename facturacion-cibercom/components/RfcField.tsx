import React, { useContext } from 'react';
import { ThemeContext } from '../App';
import { Button } from './Button';

interface RfcFieldProps {
  label: string;
  namePrefix: string; // e.g., "rfc" -> rfcIniciales, rfcFecha, rfcHomoclave
  values: {
    iniciales: string;
    fecha: string;
    homoclave: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onSearchClick?: () => void;
  error?: boolean;
}

export const RfcField: React.FC<RfcFieldProps> = ({
  label,
  namePrefix,
  values,
  onChange,
  required = false,
  className = '',
  disabled = false,
  onSearchClick,
  error = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const baseInputClasses = "px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200";
  const lightModeClasses = "border-gray-300 placeholder-gray-400 focus:ring-primary focus:border-primary bg-white text-gray-900";
  const darkModeClasses = "dark:border-gray-600 dark:placeholder-gray-500 dark:focus:ring-secondary dark:focus:border-secondary dark:bg-gray-700 dark:text-gray-100";
  const disabledClasses = "disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:cursor-not-allowed";
  const errorClasses = error ? "border-red-600 focus:ring-red-600 focus:border-red-600" : "";

  return (
    <div className={`mb-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex space-x-2 items-stretch">
        <input
          type="text"
          name={`${namePrefix}Iniciales`}
          id={`${namePrefix}Iniciales`}
          value={values.iniciales}
          onChange={onChange}
          placeholder="Iniciales"
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${theme === 'light' ? lightModeClasses : darkModeClasses} ${disabledClasses} ${errorClasses} flex-1 w-1/3`}
          maxLength={4}
        />
        <input
          type="text"
          name={`${namePrefix}Fecha`}
          id={`${namePrefix}Fecha`}
          value={values.fecha}
          onChange={onChange}
          placeholder="AAMMDD"
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${theme === 'light' ? lightModeClasses : darkModeClasses} ${disabledClasses} ${errorClasses} flex-1 w-1/3`}
          maxLength={6}
        />
        <input
          type="text"
          name={`${namePrefix}Homoclave`}
          id={`${namePrefix}Homoclave`}
          value={values.homoclave}
          onChange={onChange}
          placeholder="Homoclave"
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${theme === 'light' ? lightModeClasses : darkModeClasses} ${disabledClasses} ${errorClasses} flex-1 w-1/3`}
          maxLength={3}
        />
        {onSearchClick && (
          <Button
            type="button"
            onClick={onSearchClick}
            disabled={disabled}
            variant="primary"
            className="self-end h-full"
          >
            Buscar
          </Button>
        )}
      </div>
    </div>
  );
};