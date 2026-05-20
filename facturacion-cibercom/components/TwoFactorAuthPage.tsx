import React, { useState } from 'react';
import { ThemeContext } from '../App';
import { Button } from './Button';
import { FormField } from './FormField';

interface TwoFactorAuthPageProps {
  onVerify: (code: string, sessionToken: string) => Promise<boolean>;
  onCancel: () => void;
  username: string;
  sessionToken: string;
  qrCodeUrl?: string;
  secretKey?: string;
}

export const TwoFactorAuthPage: React.FC<TwoFactorAuthPageProps> = ({ 
  onVerify, 
  onCancel, 
  username, 
  sessionToken,
  qrCodeUrl,
  secretKey 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { customColors } = React.useContext(ThemeContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await onVerify(code, sessionToken);
      if (!success) {
        setError('Código de verificación inválido. Inténtalo de nuevo.');
      }
    } catch (error) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSetup = () => {
    if (secretKey) {
      // Mostrar instrucciones para configuración manual
      alert(`Para configurar Google Authenticator manualmente:\n\n1. Abre Google Authenticator\n2. Toca "Agregar cuenta"\n3. Selecciona "Introducir una clave de configuración"\n4. Ingresa:\n   - Cuenta: Cibercom - ${username}\n   - Clave: ${secretKey}\n   - Tipo: Basado en tiempo\n5. Toca "Agregar"`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center">
              Autenticación en Dos Pasos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
              Ingresa el código de 6 dígitos de Google Authenticator
            </p>
          </div>
          
          {/* QR Code o instrucciones */}
          {qrCodeUrl ? (
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Escanea este código QR con Google Authenticator:
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                  alt="QR Code para 2FA" 
                  className="mx-auto"
                />
              </div>
            </div>
          ) : secretKey ? (
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configuración manual de Google Authenticator:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Clave secreta:</p>
                <code className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                  {secretKey}
                </code>
                <button
                  onClick={handleManualSetup}
                  className="block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver instrucciones detalladas
                </button>
              </div>
            </div>
          ) : null}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Código de Verificación"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />
            
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
            
            <div className="space-y-3">
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full !py-3 text-base" 
                disabled={isLoading || code.length !== 6}
                style={{
                  backgroundColor: customColors.primary
                }}
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </Button>
              
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full !py-2 text-sm" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ¿No tienes Google Authenticator? 
              <a 
                href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                Descargar para Android
              </a>
              {' | '}
              <a 
                href="https://apps.apple.com/us/app/google-authenticator/id388497605" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                iOS
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
