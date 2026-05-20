import React, { useContext } from 'react';
import { ThemeContext } from '../App';

interface TextareaFieldProps {
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  rows = 3,
  disabled = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const fieldName = name || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const baseInputClasses = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200";
  const lightModeClasses = "border-gray-300 placeholder-gray-400 focus:ring-primary focus:border-primary bg-white text-gray-900";
  const darkModeClasses = "dark:border-gray-600 dark:placeholder-gray-500 dark:focus:ring-secondary dark:focus:border-secondary dark:bg-gray-700 dark:text-gray-100";
  const disabledClasses = "disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:cursor-not-allowed";

  return (
    <div className={`mb-1 ${className}`}>
      <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        name={fieldName}
        id={fieldName}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Ingrese ${label.toLowerCase()}`}
        required={required}
        rows={rows}
        disabled={disabled}
        className={`${baseInputClasses} ${theme === 'light' ? lightModeClasses : darkModeClasses} ${disabledClasses}`}
      />
    </div>
  );
};
