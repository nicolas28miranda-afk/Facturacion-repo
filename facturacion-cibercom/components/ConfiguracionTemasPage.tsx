import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../App';
import { Button } from './Button';
import { Card } from './Card';
import type { CustomColors } from '../types';
import { DEFAULT_COLORS, getDefaultLogoUrl } from '../constants';

const ColorInputRow: React.FC<{ 
    fieldId: string; 
    label: string; 
    description: string;
    color: string; 
    onChange: (color: string) => void;
}> = ({ fieldId, label, description, color, onChange }) => (
  <div className="mb-4 p-3 border rounded-md border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
        <div>
            <label htmlFor={fieldId} className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}:</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      <div className="flex items-center">
        <input
          type="color"
          id={fieldId}
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0 border-none rounded cursor-pointer mr-2"
          aria-label={`Select color for ${label}`}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary"
          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          title="Ingrese un código de color hexadecimal válido, ej: #RRGGBB"
          aria-label={`Código hexadecimal para ${label}`}
        />
      </div>
    </div>
  </div>
);

export const ConfiguracionTemasPage: React.FC = () => {
  const { customColors, setCustomColors, logoUrl, setLogoUrl } = useContext(ThemeContext);
  const [localColors, setLocalColors] = useState<CustomColors>(customColors);
  const [logoPreview, setLogoPreview] = useState<string>(logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    setLocalColors(customColors);
  }, [customColors]);

  useEffect(() => {
    setLogoPreview(logoUrl);
  }, [logoUrl]);

  const handleColorChange = (colorName: keyof CustomColors, value: string) => {
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) || value === '') {
       setLocalColors(prev => ({ ...prev, [colorName]: value }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySettings = () => {
    setCustomColors(localColors);
    if (logoFile && logoPreview) {
      setLogoUrl(logoPreview);
      localStorage.setItem('logoUrl', logoPreview);
    } else if (!logoFile) {
      setLogoUrl(logoPreview);
    }
    alert('Configuración de tema aplicada.');
  };
  
  const handleResetToDefaults = () => {
    const DEFAULT_LOGO_URL = getDefaultLogoUrl();
    setLocalColors(DEFAULT_COLORS);
    setCustomColors(DEFAULT_COLORS);  
    setLogoPreview(DEFAULT_LOGO_URL);
    setLogoUrl(DEFAULT_LOGO_URL); 
    setLogoFile(null);
    alert('Configuración de tema restaurada a los valores predeterminados.');
  };

  return (
    <div className="space-y-6">
      <Card title="Personalización de Colores del Tema">
        <ColorInputRow 
            fieldId="color-primary"
            label="Principal" 
            description="Botones principales, Pestañas activas, Elementos destacados."
            color={localColors.primary} 
            onChange={(c) => handleColorChange('primary', c)} 
        />
        <ColorInputRow 
            fieldId="color-primary-dark"
            label="Principal Interactivo" 
            description="Estado 'hover' o 'activo' de elementos principales."
            color={localColors.primaryDark} 
            onChange={(c) => handleColorChange('primaryDark', c)} 
        />
        <ColorInputRow 
            fieldId="color-secondary"
            label="Secundario" 
            description="Iconos, Sub-elementos activos, Indicadores visuales."
            color={localColors.secondary} 
            onChange={(c) => handleColorChange('secondary', c)} 
        />
        <ColorInputRow 
            fieldId="color-secondary-dark"
            label="Secundario Interactivo" 
            description="Estado 'hover' o 'activo' de elementos secundarios."
            color={localColors.secondaryDark} 
            onChange={(c) => handleColorChange('secondaryDark', c)} 
        />
        <ColorInputRow 
            fieldId="color-accent"
            label="Acento" 
            description="Fondos especiales, Énfasis visual, Notificaciones."
            color={localColors.accent} 
            onChange={(c) => handleColorChange('accent', c)} 
        />
        <ColorInputRow 
            fieldId="color-accent-dark"
            label="Acento Interactivo" 
            description="Estado 'hover' o 'activo' de elementos de acento."
            color={localColors.accentDark} 
            onChange={(c) => handleColorChange('accentDark', c)} 
        />
      </Card>

      <Card title="Personalización del Logo">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo de la Empresa:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
        />
        {logoPreview &&
          <div className="mt-3 p-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 inline-block">
            <img 
              src={logoPreview} 
              alt="Previsualización del Logo" 
              className="h-10 max-w-xs object-contain" 
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display='none';
                const errorText = target.nextElementSibling as HTMLElement;
                if (errorText) errorText.style.display = 'block';
              }}
            />
            <p style={{display: 'none'}} className="text-xs text-red-500">No se pudo cargar la imagen.</p>
          </div>
        }
      </Card>
      
      <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" onClick={handleResetToDefaults} variant="neutral">
            Restaurar Predeterminados
          </Button>
          <Button type="button" onClick={handleApplySettings} variant="primary">
            Aplicar Cambios
          </Button>
        </div>
    </div>
  );
};