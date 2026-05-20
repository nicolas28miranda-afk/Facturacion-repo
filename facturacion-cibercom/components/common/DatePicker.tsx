import React from 'react';
// import ReactDatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
// Nota: react-datepicker no está instalado. Instalar con: npm install react-datepicker @types/react-datepicker

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selected, onChange, className }) => {
  // Implementación temporal hasta instalar react-datepicker
  return (
    <input
      type="datetime-local"
      value={selected ? new Date(selected.getTime() - selected.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onChange(date);
      }}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${className}`}
    />
  );
};