
import React from 'react';
// import { useContext } from 'react';
// import { ThemeContext } from '../App';

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  name,
  checked,
  onChange,
  className = '',
  disabled = false,
}) => {
  // const { theme } = useContext(ThemeContext); // No utilizado actualmente
  const baseCheckboxClasses = "h-4 w-4 rounded border-gray-300 dark:border-gray-600 focus:ring-2 transition-colors duration-200";
  const checkedClasses = "text-primary dark:text-secondary focus:ring-primary dark:focus:ring-secondary";
  const uncheckedClasses = "text-gray-600 dark:text-gray-400"; // Not directly applicable to checkbox color itself, but for consistency
  const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`${baseCheckboxClasses} ${checked ? checkedClasses : uncheckedClasses} ${disabledClasses}`}
      />
      <label htmlFor={name} className={`ml-2 block text-sm text-gray-900 dark:text-gray-200 ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}`}>
        {label}
      </label>
    </div>
  );
};
    