import { useState, useEffect } from 'react';
// import { Layout } from '../components/Layout'; // Componente no existe, usando div directamente
import { LogoUploader } from '../components/LogoUploader';
import { logoService } from '../services/logoService';
import { Button } from '../components/Button';

export default function ConfiguracionCorreo() {
  const [logo, setLogo] = useState<string>('');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    // Cargar logo al iniciar
    const initLogo = async () => {
      const activo = await logoService.obtenerLogoActivoBackend();
      if (activo && activo.trim() !== '') {
        setLogo(activo);
        logoService.guardarLogo(activo);
      } else {
        const logoGuardado = logoService.obtenerLogo();
        setLogo(logoGuardado);
      }
    };
    initLogo();
  }, []);

  const handleLogoChange = (logoBase64: string) => {
    setLogo(logoBase64);
    setGuardado(false);
  };

  const handleGuardar = async () => {
    logoService.guardarLogo(logo);
    try {
      await logoService.guardarLogoBackend(logo || '');
    } catch (e) {
      console.warn('No se pudo persistir logo en backend:', e);
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Configuración de Correo Electrónico</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Personalización de Correos</h2>
          
          <LogoUploader 
            onLogoChange={handleLogoChange}
            initialLogo={logo}
          />
          
          <div className="mt-6 flex items-center">
            <Button onClick={handleGuardar}>
              Guardar Configuración
            </Button>
            
            {guardado && (
              <span className="ml-4 text-green-600 font-medium">
                ¡Configuración guardada correctamente!
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Vista Previa del Mensaje</h2>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="bg-blue-600 p-4 rounded-t-lg">
              <div className="flex justify-center">
                {logo ? (
                  <img 
                    src={logo} 
                    alt="Logo Cibercom" 
                    className="max-h-16 max-w-full object-contain" 
                  />
                ) : (
                  <div className="text-white font-bold text-xl">Facturación Cibercom</div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-100 rounded-b-lg">
              <h3 className="font-medium mb-2">Variables disponibles:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{facturaInfo}'} - Serie y folio de la factura</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{serie}'} - Serie de la factura</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{folio}'} - Folio de la factura</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{uuid}'} - UUID de la factura</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{rfcEmisor}'} - RFC del emisor</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{rfcReceptor}'} - RFC del receptor</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{fechaTimbrado}'} - Fecha de timbrado</div>
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{'{total}'} - Total de la factura</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}