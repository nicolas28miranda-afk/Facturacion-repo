import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { MenuIcon } from './icons/MenuIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';
import { useEmpresa } from '../context/EmpresaContext';

interface HeaderProps {
  user: User;
  toggleSidebar: () => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  isAuthenticated: boolean; 
  ThemeToggleButton: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  toggleSidebar,
  onLogout,
  isSidebarOpen,
  isAuthenticated, 
  ThemeToggleButton,
}) => {
  const { empresaInfo } = useEmpresa();
  const [currentUser, setCurrentUser] = useState<{name: string, perfil: string} | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      if (isAuthenticated) {
        const nombreEmpleado = localStorage.getItem('nombreEmpleado');
        const perfilData = localStorage.getItem('perfil');
        
        if (nombreEmpleado) {
          let perfilNombre = 'Sin perfil';
          
          if (perfilData) {
            try {
              // Intentar parsear como JSON
              if (perfilData.trim().startsWith('{')) {
                const perfil = JSON.parse(perfilData);
                perfilNombre = perfil?.nombrePerfil || perfil?.nombre || 'Sin perfil';
              } else {
                // Si no es JSON, usar directamente como string
                perfilNombre = perfilData;
              }
            } catch (error) {
              // Si falla el parseo, intentar usar el valor directo
              console.warn('Error al parsear perfil:', error);
              perfilNombre = perfilData !== 'null' && perfilData !== 'undefined' ? perfilData : 'Sin perfil';
            }
          }
          
          setCurrentUser({
            name: nombreEmpleado,
            perfil: perfilNombre
          });
        }
      } else {
        setCurrentUser(null);
      }
    };

    // Cargar datos inmediatamente al montar
    loadUserData();
    
    // Escuchar cambios en localStorage (para cambios desde otras pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'perfil' || e.key === 'nombreEmpleado') {
        loadUserData();
      }
    };
    
    // Escuchar eventos personalizados para cambios en la misma pestaña
    const handleCustomStorageChange = () => {
      loadUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);
    
    // Polling cada 2 segundos para detectar cambios en localStorage (fallback)
    const interval = setInterval(loadUserData, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md min-h-16 flex items-center justify-between px-2 sm:px-4 md:px-6 sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center flex-1 min-w-0">
        {isAuthenticated && !isSidebarOpen && ( 
            <button
            onClick={toggleSidebar}
            className="md:hidden p-2 mr-1 sm:mr-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            aria-label="Open sidebar"
            >
            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        )}
         <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0 flex-1">
           <h1 className="text-xs sm:text-sm md:text-lg font-semibold text-gray-700 dark:text-gray-200 truncate">
             Sistema de Facturación Cibercom
           </h1>
           <div className="hidden sm:flex items-center gap-2 md:gap-3 text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-3 md:pl-6 flex-shrink-0">
             <div className="min-w-0">
               <p className="text-xs md:text-sm font-medium truncate max-w-[120px] md:max-w-none">{empresaInfo.nombre}</p>
               <p className="text-[10px] md:text-xs truncate">RFC: {empresaInfo.rfc}</p>
             </div>
           </div>
           {/* Versión móvil compacta - solo RFC */}
           <div className="sm:hidden text-gray-600 dark:text-gray-400 text-xs">
             <p className="truncate max-w-[120px]">{empresaInfo.nombre}</p>
             <p className="truncate">RFC: {empresaInfo.rfc}</p>
           </div>
         </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
        {ThemeToggleButton}
        {/* {isAuthenticated && SettingsButton} Show settings only if authenticated - Removed */}
        
        {isAuthenticated && ( 
          <div 
            className="relative z-50"
            onMouseEnter={() => {
              // Cancelar cualquier timeout pendiente
              if (menuTimeoutRef.current) {
                clearTimeout(menuTimeoutRef.current);
                menuTimeoutRef.current = null;
              }
              setIsUserMenuOpen(true);
            }}
            onMouseLeave={() => {
              // Agregar un delay antes de cerrar para dar tiempo al usuario
              menuTimeoutRef.current = setTimeout(() => {
                setIsUserMenuOpen(false);
              }, 300); // 300ms de delay
            }}
          >
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0" 
              aria-haspopup="true" 
              aria-expanded={isUserMenuOpen}
              aria-label={`User menu for ${currentUser?.name || user.name}`}
            >
              <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              <span className="hidden lg:inline ml-2 text-sm">{currentUser?.name.split(' ')[0] || user.name.split(' ')[0]}</span>
            </button>
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 z-[9999] ring-1 ring-black ring-opacity-5 dark:ring-gray-700 transition-opacity duration-200 ease-in-out" 
                role="menu" 
                aria-orientation="vertical" 
                aria-labelledby="user-menu-button"
                onMouseEnter={() => {
                  // Cancelar timeout cuando el mouse entra al menú
                  if (menuTimeoutRef.current) {
                    clearTimeout(menuTimeoutRef.current);
                    menuTimeoutRef.current = null;
                  }
                }}
              >
                <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate" id="user-name-full">{currentUser?.name || user.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Perfil: {currentUser?.perfil || 'Sin perfil'}</p>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary-dark transition-colors"
                  role="menuitem"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  Salir
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};