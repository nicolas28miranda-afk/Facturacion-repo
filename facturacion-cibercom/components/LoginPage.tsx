
import React, { useState } from 'react';
// import { useContext } from 'react';
// import { ThemeContext } from '../App';
import { Button } from './Button';
import { FormField } from './FormField';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  logoUrl?: string;
  appName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, logoUrl, appName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const { theme } = useContext(ThemeContext); // No utilizado actualmente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await onLogin(username, password);
    } catch (error) {
      if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError('Error de conexión con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 p-4`}>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <div className="flex flex-col items-center mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt={`${appName} Logo`} className="h-12 mb-4 object-contain" />
            ) : (
              appName && <h1 className="text-3xl font-bold text-primary dark:text-primary-dark mb-4">{appName}</h1>
            )}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Iniciar Sesión</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Usuario"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              required
            />
            <FormField
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
            
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
            
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full !py-3 text-base" 
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} {appName || 'Cibercom'}. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
