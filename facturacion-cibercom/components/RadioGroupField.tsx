import React, { useContext } from 'react';
import { ThemeContext } from '../App';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupFieldProps {
  label: string;
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  inline?: boolean;
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
  required = false,
  className = '',
  inline = false,
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`mb-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`flex ${inline ? 'flex-row space-x-4' : 'flex-col space-y-1'}`}>
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={onChange}
              required={required}
              className={`form-radio h-4 w-4 transition-colors duration-200 ${
                theme === 'light' ? 'text-primary focus:ring-primary' : 'dark:text-secondary dark:focus:ring-secondary dark:bg-gray-600 dark:border-gray-500'
              }`}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
