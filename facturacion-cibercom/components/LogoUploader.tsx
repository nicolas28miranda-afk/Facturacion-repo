import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface LogoUploaderProps {
  onLogoChange: (logoBase64: string) => void;
  initialLogo?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoChange, initialLogo }) => {
  const [logo, setLogo] = useState<string | null>(initialLogo || null);
  const [error, setError] = useState<string | null>(null);

  // Convierte a PNG si el formato no es soportado directamente por iText (por ejemplo WEBP)
  const convertToPngIfNeeded = async (dataUri: string): Promise<string> => {
    try {
      const lower = dataUri.toLowerCase();
      if (lower.startsWith('data:image/png;base64,') || lower.startsWith('data:image/svg+xml;base64,')) {
        return dataUri; // ya soportado
      }
      // Renderizar en canvas y exportar a PNG
      const img = new Image();
      img.src = dataUri;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen para convertir a PNG'));
      });
      const maxDim = 600; // limitar tamaño para evitar PNG excesivo
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible para conversión');
      ctx.drawImage(img, 0, 0, width, height);
      const pngDataUri = canvas.toDataURL('image/png');
      // Validar tamaño resultante (<1MB)
      const approxBytes = Math.ceil((pngDataUri.length * 3) / 4); // aproximación base64
      if (approxBytes > 1024 * 1024) {
        throw new Error('La imagen convertida a PNG supera 1MB. Usa una imagen más pequeña.');
      }
      return pngDataUri;
    } catch (e) {
      console.warn('Fallo convirtiendo a PNG, se usará el original:', e);
      return dataUri; // fallback: enviamos original
    }
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    
    // Validar tamaño (máximo 1MB)
    if (file.size > 1024 * 1024) {
      setError('La imagen debe ser menor a 1MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const normalized = await convertToPngIfNeeded(base64);
        setLogo(normalized);
        onLogoChange(normalized);
      } catch (err: any) {
        setError(err?.message || 'Error al procesar la imagen');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    onLogoChange('');
  };

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-medium mb-2">Logo para correos electrónicos</h3>
      <p className="text-sm text-gray-600 mb-4">
        Este logo aparecerá en los correos electrónicos enviados con las facturas.
      </p>
      
      {logo && (
        <div className="mb-4">
          <div className="border p-4 rounded-md bg-blue-50 flex justify-center mb-2">
            <img 
              src={logo} 
              alt="Logo para correos" 
              className="max-h-24 max-w-full object-contain" 
            />
          </div>
          <Button 
            onClick={handleRemoveLogo}
            variant="secondary"
            className="text-sm"
          >
            Eliminar logo
          </Button>
        </div>
      )}
      
      <div className="mt-2">
        <label className="block mb-2 text-sm font-medium">
          {logo ? 'Cambiar logo' : 'Subir logo'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <p className="mt-1 text-sm text-gray-500">
          PNG, JPG o SVG (máx. 1MB)
        </p>
      </div>
    </Card>
  );
};