import React, { useState, useRef } from 'react';
// import { useContext } from 'react';
// import { ThemeContext } from '../App';
import { Button } from './Button';

interface FileInputFieldProps {
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  accept?: string; // e.g., ".csv, .xlsx"
  required?: boolean;
  className?: string;
  helpText?: string;
}

export const FileInputField: React.FC<FileInputFieldProps> = ({
  label,
  name,
  onChange,
  accept = '.xlsx, .csv',
  required = false,
  className = '',
  helpText,
}) => {
  // const { theme } = useContext(ThemeContext); // No utilizado actualmente
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setFileName(file ? file.name : null);
    onChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const baseLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const fileInfoClasses = "ml-3 text-sm text-gray-600 dark:text-gray-400 truncate";

  return (
    <div className={`mb-1 ${className}`}>
      <label htmlFor={`${name}-button`} className={baseLabelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center">
        <Button
          type="button"
          variant="neutral"
          onClick={handleButtonClick}
          id={`${name}-button`}
          aria-controls={name}
        >
          Elegir archivo
        </Button>
        <input
          type="file"
          name={name}
          id={name}
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          required={required}
          className="hidden" // Hidden, as the button triggers it
          aria-labelledby={`${name}-button`}
          aria-describedby={helpText ? `${name}-help` : undefined}
        />
        {fileName ? (
          <span className={fileInfoClasses} title={fileName}>{fileName}</span>
        ) : (
          <span className={fileInfoClasses}>No se eligió ningún archivo</span>
        )}
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id={`${name}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
};
