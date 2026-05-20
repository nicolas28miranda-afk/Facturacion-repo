import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { InvoiceForm } from './components/InvoiceForm'; // Facturacion Articulos
import { LoginPage } from './components/LoginPage';
import { TwoFactorAuthPage } from './components/TwoFactorAuthPage';
import { NAV_ITEMS, DEFAULT_USER, DEFAULT_COLORS } from './constants';
import type { Theme, CustomColors, User } from './types';

// Icons
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

// Page Components
import { DashboardPage } from './components/DashboardPage';

// Facturacion Pages
import { FacturacionInteresesPage } from './components/FacturacionInteresesPage';
import { NotasCreditoPage } from './components/NotasCreditoPage';
import { FacturacionCartaPortePage } from './components/FacturacionCartaPortePage';
import { FacturacionGlobalPage } from './components/FacturacionGlobalPage';
import { FacturacionMonederosPage } from './components/FacturacionMonederosPage';
import { FacturacionCapturaLibrePage } from './components/FacturacionCapturaLibrePage';
import { FacturacionMotosPage } from './components/FacturacionMotosPage';
import { FacturacionCancelacionMasivaPage } from './components/FacturacionCancelacionMasivaPage';
import { FacturacionNominasPage } from './components/FacturacionNominasPage';

// Consultas Pages
import { ConsultasFacturasPage } from './components/ConsultasFacturasPage';
import { ConsultasSkuPage } from './components/ConsultasSkuPage';
import { ConsultasBoletasPage } from './components/ConsultasBoletasPage';
import { ConsultasReportesPage } from './components/ConsultasReportesPage';
import { ConsultasRepsSustituidosPage } from './components/ConsultasRepsSustituidosPage';

// Administracion Pages
import { AdminEmpleadosPage } from './components/AdminEmpleadosPage';
import { AdminTiendasPage } from './components/AdminTiendasPage';
import { AdminPeriodosPerfilPage } from './components/AdminPeriodosPerfilPage';
import { AdminPeriodosPlataformaPage } from './components/AdminPeriodosPlataformaPage';
import { AdminKioscosPage } from './components/AdminKioscosPage';
import { AdminExcepcionesPage } from './components/AdminExcepcionesPage';
import { AdminSeccionesPage } from './components/AdminSeccionesPage';

// Reportes Fiscales Pages
import { ReportesBoletasNoAuditadasPage } from './components/ReportesBoletasNoAuditadasPage';
import { ReportesIngresoFacturacionPage } from './components/ReportesIngresoFacturacionPage';
import { ReportesIntegracionFacturaGlobalPage } from './components/ReportesIntegracionFacturaGlobalPage';
import { ReportesIntegracionClientesPage } from './components/ReportesIntegracionClientesPage';
import { ReportesFacturacionClientesGlobalPage } from './components/ReportesFacturacionClientesGlobalPage';
import { ReportesIntegracionSustitucionCfdiPage } from './components/ReportesIntegracionSustitucionCfdiPage';
import { ReportesControlEmisionRepPage } from './components/ReportesControlEmisionRepPage';
import { ReportesRepgcpPage } from './components/ReportesRepgcpPage';
import { ReportesControlCambiosPage } from './components/ReportesControlCambiosPage';
import { ReportesConciliacionPage } from './components/ReportesConciliacionPage';
import { ReportesFiscalesRepsSustituidosPage } from './components/ReportesFiscalesRepsSustituidosPage';

// Configuracion Pages
import { ConfiguracionTemasPage } from './components/ConfiguracionTemasPage';
import { ConfiguracionEmpresaPage } from './components/ConfiguracionEmpresaPage';
import { ConfiguracionCorreoPage } from './components/ConfiguracionCorreoPage';
import ConfiguracionMenusPage from './components/ConfiguracionMenusPage';

// Registro CFDI Pages
import RegistroCFDIPage from './components/RegistroCFDIPage';

// Nuevos Reportes Pages
import ReporteConsultaMonederosPage from './components/ReporteConsultaMonederosPage';
import ReporteVentasMaquinaCorporativasPage from './components/ReporteVentasMaquinaCorporativasPage';
import ReporteRegimenFacturacionNoMismaBoletaPage from './components/ReporteRegimenFacturacionNoMismaBoletaPage';

// Monitor Pages
import { MonitorGraficasPage } from './components/MonitorGraficasPage';
import { MonitorBitacoraPage } from './components/MonitorBitacoraPage';
import { MonitorPermisosPage } from './components/MonitorPermisosPage';
import { MonitorDisponibilidadPage } from './components/MonitorDisponibilidadPage';
import { MonitorLogsPage } from './components/MonitorLogsPage';
import { MonitorDecodificadorPage } from './components/MonitorDecodificadorPage';
import TestPdfPage from './components/TestPdfPage';
import ITextPdfTest from './components/ITextPdfTest';


interface EmpresaInfo {
  nombre: string;
  rfc: string;
}

export const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
  customColors: CustomColors;
  setCustomColors: React.Dispatch<React.SetStateAction<CustomColors>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
}>({
  theme: 'light',
  toggleTheme: () => {},
  customColors: DEFAULT_COLORS,
  setCustomColors: () => {},
  logoUrl: '/images/cibercom-logo.svg',
  setLogoUrl: () => {},
});

export const EmpresaContext = React.createContext<{
  empresaInfo: EmpresaInfo;
  setEmpresaInfo: React.Dispatch<React.SetStateAction<EmpresaInfo>>;
}>({
  empresaInfo: {
    nombre: 'Empresa Ejemplo S.A. de C.V.',
    rfc: 'EEJ920629TE3',
  },
  setEmpresaInfo: () => {},
});

import { EmpresaProvider } from './context/EmpresaContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [theme, setTheme] = useState<Theme>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Quitamos setCurrentUser para evitar warning porque no se usa
  const [currentUser] = useState<User>(DEFAULT_USER);
  
  // Estados para 2FA
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{
    username: string;
    sessionToken: string;
    qrCodeUrl?: string;
    secretKey?: string;
  } | null>(null);

  const [activePage, setActivePage] = useState<string>('Dashboard');

  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    const storedColors = localStorage.getItem('customColors');
    return storedColors ? JSON.parse(storedColors) : DEFAULT_COLORS;
  });

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    const storedLogoUrl = localStorage.getItem('logoUrl');
    return storedLogoUrl || '/images/cibercom-logo.svg';
  });

  const [profileSelected, setProfileSelected] = useState<string | null>(() => {
    const perfilData = localStorage.getItem('perfil');
    if (perfilData) {
      const perfil = JSON.parse(perfilData);
      return perfil.nombrePerfil;
    }
    return localStorage.getItem('profileSelected');
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Inicializar favicon al cargar la aplicación (usa el mismo logo que el sistema)
    const updateFavicon = () => {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      const storedLogo = localStorage.getItem('logoUrl');
      // Usar el mismo logo del sistema como favicon
      favicon.href = storedLogo || '/images/cibercom-logo.svg';
    };
    
    updateFavicon();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', customColors.primary);
    root.style.setProperty('--color-primary-dark', customColors.primaryDark);
    root.style.setProperty('--color-secondary', customColors.secondary);
    root.style.setProperty('--color-secondary-dark', customColors.secondaryDark);
    root.style.setProperty('--color-accent', customColors.accent);
    root.style.setProperty('--color-accent-dark', customColors.accentDark);
    localStorage.setItem('customColors', JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    localStorage.setItem('logoUrl', logoUrl);
    
    // Actualizar el favicon cuando cambia el logo del sistema
    const updateFavicon = () => {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      
      favicon.href = logoUrl;
    };
    
    updateFavicon();
  }, [logoUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      setActivePage('Dashboard');
    }
  }, [isAuthenticated]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleNavItemClick = useCallback((label: string) => {
    setActivePage(label);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  },
  []
);


  const handleLogin = useCallback(async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usernameInput,
          password: passwordInput
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.usuario) {
        // Verificar si requiere 2FA
        if (data.requiresTwoFactor) {
          console.log('Login exitoso, pero requiere 2FA');
          setTwoFactorData({
            username: usernameInput,
            sessionToken: data.token,
            qrCodeUrl: data.qrCodeUrl,
            secretKey: data.secretKey
          });
          setRequiresTwoFactor(true);
          return true; // Login exitoso, pero pendiente de 2FA
        }
        
        // Login completo sin 2FA
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', data.usuario.noUsuario);
        localStorage.setItem('nombreEmpleado', data.usuario.nombreEmpleado);
        localStorage.setItem('perfil', JSON.stringify({
          idPerfil: data.usuario.idPerfil,
          nombrePerfil: data.usuario.nombrePerfil
        }));
        
        setIsAuthenticated(true);
        setProfileSelected(data.usuario.nombrePerfil);
        
        console.log('Login successful:', {
          usuario: data.usuario.noUsuario,
          nombrePerfil: data.usuario.nombrePerfil,
          idPerfil: data.usuario.idPerfil
        });

        setActivePage('Dashboard');

        if (window.innerWidth >= 768) {
          setIsSidebarOpen(true);
        }
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      return false;
    }
  }, []);

  const handleTwoFactorVerify = useCallback(async (code: string, sessionToken: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: twoFactorData?.username,
          code: code,
          sessionToken: sessionToken
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.usuario) {
        // 2FA verificado exitosamente
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', data.usuario.noUsuario);
        localStorage.setItem('nombreEmpleado', data.usuario.nombreEmpleado);
        localStorage.setItem('perfil', JSON.stringify({
          idPerfil: data.usuario.idPerfil,
          nombrePerfil: data.usuario.nombrePerfil
        }));
        
        setIsAuthenticated(true);
        setProfileSelected(data.usuario.nombrePerfil);
        setRequiresTwoFactor(false);
        setTwoFactorData(null);
        
        console.log('2FA verification successful:', {
          usuario: data.usuario.noUsuario,
          nombrePerfil: data.usuario.nombrePerfil,
          idPerfil: data.usuario.idPerfil
        });

        setActivePage('Dashboard');

        if (window.innerWidth >= 768) {
          setIsSidebarOpen(true);
        }
        return true;
      } else {
        console.error('2FA verification failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error durante la verificación 2FA:', error);
      return false;
    }
  }, [twoFactorData]);

  const handleTwoFactorCancel = useCallback(() => {
    setRequiresTwoFactor(false);
    setTwoFactorData(null);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('profileSelected');
    localStorage.removeItem('username');
    localStorage.removeItem('nombreEmpleado');
    localStorage.removeItem('perfil');
    setIsAuthenticated(false);
    setProfileSelected(null);
    setRequiresTwoFactor(false);
    setTwoFactorData(null);
    setActivePage('Dashboard');
  }, []);


  const [menuConfig, setMenuConfig] = useState<any[]>([]);
  const [pantallasConfig, setPantallasConfig] = useState<any[]>([]);

  // Logs para rastrear actualizaciones de estado
  useEffect(() => {
    console.log('*** menuConfig state updated ***', menuConfig.length, menuConfig);
  }, [menuConfig]);

  useEffect(() => {
    console.log('*** pantallasConfig state updated ***', pantallasConfig.length, pantallasConfig);
  }, [pantallasConfig]);

  // Cargar configuración de menús desde la base de datos
  const cargarConfiguracionMenus = async () => {
    console.log('=== cargarConfiguracionMenus INICIADO ===');
    console.log('profileSelected:', profileSelected);
    
    if (!profileSelected) {
      console.log('❌ No hay profileSelected, saliendo');
      return;
    }
    
    try {
      // Obtener el ID del perfil desde el localStorage o desde la respuesta del login
      const perfilData = localStorage.getItem('perfil');
      console.log('perfilData from localStorage:', perfilData);
      
      if (!perfilData) {
        console.log('❌ No hay perfilData en localStorage, saliendo');
        return;
      }
      
      const perfil = JSON.parse(perfilData);
      const idPerfil = perfil.idPerfil;
      console.log('idPerfil extraído:', idPerfil);
      
      // Cargar pestañas principales (sin MENU_PATH)
      const urlPestañas = `http://localhost:8080/api/menu-config/perfil/${idPerfil}`;
      console.log('🔗 Llamando a:', urlPestañas);
      
      const responsePestañas = await fetch(urlPestañas);
      console.log('📡 Response pestañas status:', responsePestañas.status);
      
      if (!responsePestañas.ok) {
        console.error('❌ Error en response pestañas:', responsePestañas.status, responsePestañas.statusText);
        throw new Error('Error al cargar configuración de pestañas');
      }
      
      const pestañasData = await responsePestañas.json();
      console.log('📊 pestañasData recibido:', pestañasData);
      
      const pestañasPrincipales = pestañasData.filter((item: any) => !item.menuPath);
      console.log('🎯 pestañasPrincipales filtradas:', pestañasPrincipales);
      setMenuConfig(pestañasPrincipales);

      // Cargar pantallas específicas (con MENU_PATH)
      const urlPantallas = `http://localhost:8080/api/menu-config/pantallas/${idPerfil}`;
      console.log('🔗 Llamando a:', urlPantallas);
      
      const responsePantallas = await fetch(urlPantallas);
      console.log('📡 Response pantallas status:', responsePantallas.status);
      
      if (!responsePantallas.ok) {
        console.error('❌ Error en response pantallas:', responsePantallas.status, responsePantallas.statusText);
        throw new Error('Error al cargar configuración de pantallas');
      }
      
      const pantallasData = await responsePantallas.json();
      console.log('📊 pantallasData recibido:', pantallasData);
      setPantallasConfig(pantallasData);
      
      console.log('✅ cargarConfiguracionMenus COMPLETADO');
    } catch (error) {
      console.error('❌ Error al cargar configuración de menús:', error);
      // Si hay error, usar configuración por defecto
      setMenuConfig([]);
      setPantallasConfig([]);
    } finally {
      // Loading state handled
    }
  };

  // Asegurar que profileSelected se actualice desde localStorage al cargar la página
  useEffect(() => {
    if (isAuthenticated) {
      const perfilData = localStorage.getItem('perfil');
      if (perfilData) {
        const perfil = JSON.parse(perfilData);
        if (perfil.nombrePerfil !== profileSelected) {
          console.log('🔄 Actualizando profileSelected desde localStorage:', perfil.nombrePerfil);
          setProfileSelected(perfil.nombrePerfil);
        }
      }
    }
  }, [isAuthenticated, profileSelected]);

  useEffect(() => {
    if (isAuthenticated && profileSelected) {
      cargarConfiguracionMenus();
    }
  }, [isAuthenticated, profileSelected]);

  const getFilteredNavItems = () => {
    console.log('=== getFilteredNavItems called ===');
    console.log('profileSelected:', profileSelected);
    console.log('menuConfig.length:', menuConfig.length);
    console.log('pantallasConfig.length:', pantallasConfig.length);
    console.log('menuConfig:', menuConfig);
    console.log('pantallasConfig:', pantallasConfig);

    // Si no hay configuración cargada, usar configuración por defecto
    if (menuConfig.length === 0) {
      console.log('⚠️ USANDO CONFIGURACIÓN POR DEFECTO - No hay menuConfig cargado');
      let filteredItems = NAV_ITEMS;
      
      // Verificar si es administrador por ID de perfil (más confiable)
      const perfilData = localStorage.getItem('perfil');
      const isAdmin = perfilData ? JSON.parse(perfilData).idPerfil === 3 : false;
      
      if (isAdmin || profileSelected === "Administrador" || profileSelected?.toLowerCase().includes("admin")) {
        console.log('Usuario identificado como administrador');
        return NAV_ITEMS; // Muestra todo
      }
      // Para operadores y jefes de crédito, solo mostrar secciones clave
      if (profileSelected === "Operador de Credito" || profileSelected?.toLowerCase().includes("operador")) {
        filteredItems = NAV_ITEMS.filter(item =>
          item.label === "Dashboard" || ["Facturación", "Consultas", "Reportes Facturación Fiscal", "Registro CFDI"].includes(item.label)
        );
      }
      if (profileSelected === "Jefe de Credito" || profileSelected?.toLowerCase().includes("jefe")) {
        filteredItems = NAV_ITEMS.filter(item =>
          item.label === "Dashboard" || ["Facturación", "Consultas", "Reportes Facturación Fiscal", "Administración", "Registro CFDI"].includes(item.label)
        );
      }
      
      return filteredItems;
    }

    // Usar configuración dinámica de la base de datos
    const menuLabelsVisibles = menuConfig
      .filter(config => config.isVisible)
      .map(config => config.menuLabel);

    // Obtener pantallas visibles por pestaña
    const pantallasVisibles = pantallasConfig
      .filter(pantalla => pantalla.isVisible)
      .map(pantalla => pantalla.menuLabel);

    console.log('=== FILTRADO DE MENÚS ===');
    console.log('Menu labels visibles:', menuLabelsVisibles);
    console.log('Pantallas visibles:', pantallasVisibles);
    console.log('Total pantallas configuradas:', pantallasConfig.length);
    console.log('Pantallas habilitadas:', pantallasConfig.filter(p => p.isVisible).length);
    console.log('Pantallas deshabilitadas:', pantallasConfig.filter(p => !p.isVisible).length);
    
    // Debug: Mostrar algunas pantallas específicas para depuración
    console.log('🔍 Pantallas de Facturación:', pantallasConfig.filter(p => p.menuLabel === 'Artículos' || p.menuLabel === 'Intereses'));
    console.log('🔍 Pantallas de Consultas:', pantallasConfig.filter(p => p.menuLabel === 'Facturas' || p.menuLabel === 'SKU'));

    const filteredItems = NAV_ITEMS.map(item => {
      // Dashboard siempre debe estar visible para todos los perfiles
      if (item.label === 'Dashboard') {
        console.log(`Dashboard: SIEMPRE VISIBLE`);
        return item;
      }
      
      // Filtrar elementos principales
      if (menuLabelsVisibles.includes(item.label)) {
        console.log(`Pestaña ${item.label}: VISIBLE`);
        
        // Si es un elemento con children, filtrar también los children
        if (item.children) {
          const filteredChildren = item.children.filter(child => {
            // Solo administradores pueden ver la configuración de menús
            if (child.label === "Configuración de Menús") {
              const perfilData = localStorage.getItem('perfil');
              const isAdmin = perfilData ? JSON.parse(perfilData).idPerfil === 3 : false;
              const canSee = isAdmin || profileSelected === "Administrador" || profileSelected?.toLowerCase().includes("admin");
              console.log(`Configuración de Menús: ${canSee ? 'VISIBLE' : 'OCULTO'} (admin: ${isAdmin})`);
              return canSee;
            }
            
            // Para administradores, las pantallas de Configuración siempre son visibles
            if (item.label === "Configuración") {
              const perfilData = localStorage.getItem('perfil');
              const isAdmin = perfilData ? JSON.parse(perfilData).idPerfil === 3 : false;
              if (isAdmin || profileSelected === "Administrador" || profileSelected?.toLowerCase().includes("admin")) {
                console.log(`Pantalla ${child.label} (Configuración): SIEMPRE VISIBLE para admin`);
                return true;
              }
            }
            
            // Filtrar pantallas específicas basándose en la configuración de la base de datos
            const isVisible = pantallasVisibles.includes(child.label);
            console.log(`Pantalla ${child.label}: ${isVisible ? 'VISIBLE' : 'OCULTO'} (está en pantallasVisibles: ${pantallasVisibles.includes(child.label)})`);
            return isVisible;
          });
          
          console.log(`Pestaña ${item.label}: ${filteredChildren.length} pantallas visibles de ${item.children.length} total`);
          console.log(`Pantallas filtradas para ${item.label}:`, filteredChildren.map(c => c.label));
          
          const filteredItem = {
            ...item,
            children: filteredChildren
          };
          console.log(`Retornando pestaña ${item.label} con ${filteredChildren.length} children:`, filteredChildren.map(c => c.label));
          return filteredItem;
        }
        return item;
      } else {
        console.log(`Pestaña ${item.label}: OCULTA`);
        return null; // Marcar como null para filtrar después
      }
    }).filter(item => item !== null); // Filtrar los elementos null

    console.log('=== RESULTADO FINAL ===');
    console.log('Items filtrados:', filteredItems.length);
    filteredItems.forEach(item => {
      if (item.children) {
        console.log(`${item.label}: ${item.children.length} pantallas`);
        console.log(`  Pantallas de ${item.label}:`, item.children.map(c => c.label));
      }
    });

    console.log('🎯 ARRAY FINAL QUE SE PASA AL SIDEBAR:', filteredItems);
    return filteredItems;
  };

  if (!isAuthenticated) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme, customColors, setCustomColors, logoUrl, setLogoUrl }}>
        <LoginPage onLogin={handleLogin} logoUrl={logoUrl} appName="Cibercom" />
      </ThemeContext.Provider>
    );
  }

  if (requiresTwoFactor && twoFactorData) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme, customColors, setCustomColors, logoUrl, setLogoUrl }}>
        <TwoFactorAuthPage 
          onVerify={handleTwoFactorVerify}
          onCancel={handleTwoFactorCancel}
          username={twoFactorData.username}
          sessionToken={twoFactorData.sessionToken}
          qrCodeUrl={twoFactorData.qrCodeUrl}
          secretKey={twoFactorData.secretKey}
        />
      </ThemeContext.Provider>
    );
  }

  // Eliminamos el selector de perfil estático - ahora se maneja dinámicamente

  const renderPageContent = () => {
    // Dashboard
    if (activePage === 'Dashboard') return <DashboardPage setActivePage={setActivePage} />;
    // Facturación
    if (activePage === 'Artículos') return <InvoiceForm />;
    if (activePage === 'Intereses') return <FacturacionInteresesPage />;
    if (activePage === 'Notas de crédito') return <NotasCreditoPage />;
    if (activePage === 'Carta Porte') return <FacturacionCartaPortePage />;
    if (activePage === 'Factura Global') return <FacturacionGlobalPage />;
    if (activePage === 'Monederos') return <FacturacionMonederosPage />;
    if (activePage === 'Captura Libre') return <FacturacionCapturaLibrePage />;
    if (activePage === 'Motos') return <FacturacionMotosPage />;
    if (activePage === 'Cancelación Masiva') return <FacturacionCancelacionMasivaPage />;
    if (activePage === 'Nóminas') return <FacturacionNominasPage />;

    // Consultas
    if (activePage === 'Facturas') return <ConsultasFacturasPage />;
    if (activePage === 'SKU') return <ConsultasSkuPage />;
    if (activePage === 'Boletas') return <ConsultasBoletasPage />;
    if (activePage === 'Reportes') return <ConsultasReportesPage />;
    if (activePage === 'REPs Sustituidos') return <ConsultasRepsSustituidosPage />;

    // Administración
    if (activePage === 'Empleados') return <AdminEmpleadosPage />;
    if (activePage === 'Tiendas') return <AdminTiendasPage />;
    if (activePage === 'Periodos por Perfil') return <AdminPeriodosPerfilPage />;
    if (activePage === 'Periodos Plataforma') return <AdminPeriodosPlataformaPage />;
    if (activePage === 'Kioscos') return <AdminKioscosPage />;
    if (activePage === 'Excepciones') return <AdminExcepcionesPage />;
    if (activePage === 'Secciones') return <AdminSeccionesPage />;

    // Reportes Facturación Fiscal
    if (activePage === 'Boletas No Auditadas') return <ReportesBoletasNoAuditadasPage />;
    if (activePage === 'Reporte Ingreso-Facturación') return <ReportesIngresoFacturacionPage />;
    if (activePage === 'Integración Factura Global') return <ReportesIntegracionFacturaGlobalPage />;
    if (activePage === 'Integración Clientes') return <ReportesIntegracionClientesPage />;
    if (activePage === 'Facturación clientes posterior a Global') return <ReportesFacturacionClientesGlobalPage />;
    if (activePage === 'Integración Sustitución CFDI') return <ReportesIntegracionSustitucionCfdiPage />;
    if (activePage === 'Control de emisión de REP') return <ReportesControlEmisionRepPage />;
    if (activePage === 'Reportes REPgcp') return <ReportesRepgcpPage />;
    if (activePage === 'Control de cambios') return <ReportesControlCambiosPage />;
    if (activePage === 'Conciliación') return <ReportesConciliacionPage />;
    if (activePage === 'REPs Sustituidos (Fiscal)') return <ReportesFiscalesRepsSustituidosPage />;

    // Configuracion
    if (activePage === 'Temas') return <ConfiguracionTemasPage />;
    if (activePage === 'Empresa') return <ConfiguracionEmpresaPage />;
    if (activePage === 'Mensajes de Correo') return <ConfiguracionCorreoPage />;
    if (activePage === 'Configuración de Menús') return <ConfiguracionMenusPage />;

    // Registro CFDI
    if (activePage === 'Registro de Constancias') return <RegistroCFDIPage />;

    // Nuevos Reportes
    if (activePage === 'Reporte de Consulta Monederos') return <ReporteConsultaMonederosPage />;
    if (activePage === 'Reporte de Ventas Máquina Corporativas Serely Polu') return <ReporteVentasMaquinaCorporativasPage />;
    if (activePage === 'Régimen de Facturación No Misma Boleta') return <ReporteRegimenFacturacionNoMismaBoletaPage />;

    // Monitor
    if (activePage === 'Gráficas') return <MonitorGraficasPage />;
    if (activePage === 'Bitácora') return <MonitorBitacoraPage />;
    if (activePage === 'Permisos') return <MonitorPermisosPage />;
    if (activePage === 'Disponibilidad') return <MonitorDisponibilidadPage />;
    if (activePage === 'Logs') return <MonitorLogsPage />;
    if (activePage === 'Decodificador') return <MonitorDecodificadorPage />;

    // Pruebas
    if (activePage === 'Test PDF') return <TestPdfPage />;
    if (activePage === 'Test iText PDF') return <ITextPdfTest />;

    const navItemExists = NAV_ITEMS.flatMap(item => item.children ? [item, ...item.children] : [item]).some(nav => nav.label === activePage);
    if (navItemExists) {
      return (
        <div className="p-6 text-gray-700 dark:text-gray-300">
          Contenido para "{activePage}" aún no implementado.
        </div>
      );
    }

    return <DashboardPage setActivePage={setActivePage} />;
  };

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={{ theme, toggleTheme, customColors, setCustomColors, logoUrl, setLogoUrl }}>
        <EmpresaProvider>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar
              navItems={getFilteredNavItems()}
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              onNavItemClick={handleNavItemClick}
              logoUrl={logoUrl}
              appName="Cibercom"
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header
                user={currentUser}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                isAuthenticated={isAuthenticated}
                ThemeToggleButton={
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                  </button>
                }
              />
              <ErrorBoundary>
                <MainContent pageTitle={activePage}>
                  {renderPageContent()}
                </MainContent>
              </ErrorBoundary>
            </div>
          </div>
        </EmpresaProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
