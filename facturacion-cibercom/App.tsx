import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { LoginPage } from './components/LoginPage';
import { DEFAULT_COLORS, DEFAULT_USER, getDefaultLogoUrl, NAV_ITEMS } from './constants';
import type { CustomColors, NavItem, Theme, UsuarioLogin } from './types';
import { EmpresaProvider } from './context/EmpresaContext';
import { DashboardPage } from './components/DashboardPage';
import { FacturacionGlobalPage } from './components/FacturacionGlobalPage';
import { FacturacionCancelacionMasivaPage } from './components/FacturacionCancelacionMasivaPage';
import { FacturacionCapturaLibrePage } from './components/FacturacionCapturaLibrePage';
import { FacturacionCartaPortePage } from './components/FacturacionCartaPortePage';
import { FacturacionMonederosPage } from './components/FacturacionMonederosPage';
import { FacturacionMotosPage } from './components/FacturacionMotosPage';
import { FacturacionNominasPage } from './components/FacturacionNominasPage';
import { FacturacionInteresesPage } from './components/FacturacionInteresesPage';
import FacturacionComplementoPagosPage from './components/FacturacionComplementoPagosPage';
import FacturacionRetencionPagosPage from './components/FacturacionRetencionPagosPage';
import { ConsultasFacturasPage } from './components/ConsultasFacturasPage';
import { ConsultasSkuPage } from './components/ConsultasSkuPage';
import { ConsultasBoletasPage } from './components/ConsultasBoletasPage';
import { ConsultasReportesPage } from './components/ConsultasReportesPage';
import { ConsultasRepsSustituidosPage } from './components/ConsultasRepsSustituidosPage';
import { RefacturaPage } from './components/RefacturaPage';
import { FacturasSustituidasPage } from './components/FacturasSustituidasPage';
import { FacturasPorUsuarioPage } from './components/FacturasPorUsuarioPage';
import { AdminEmpleadosPage } from './components/AdminEmpleadosPage';
import { AdminTiendasPage } from './components/AdminTiendasPage';
import { AdminPeriodosPerfilPage } from './components/AdminPeriodosPerfilPage';
import { AdminPeriodosPlataformaPage } from './components/AdminPeriodosPlataformaPage';
import { AdminKioscosPage } from './components/AdminKioscosPage';
import { AdminExcepcionesPage } from './components/AdminExcepcionesPage';
import { AdminSeccionesPage } from './components/AdminSeccionesPage';
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
import { MonitorGraficasPage } from './components/MonitorGraficasPage';
import { MonitorBitacoraPage } from './components/MonitorBitacoraPage';
import { MonitorDisponibilidadPage } from './components/MonitorDisponibilidadPage';
import { MonitorLogsPage } from './components/MonitorLogsPage';
import { MonitorDecodificadorPage } from './components/MonitorDecodificadorPage';
import { MonitorPermisosPage } from './components/MonitorPermisosPage';
import { MonitorConexionesPage } from './components/MonitorConexionesPage';
import TestPdfPage from './components/TestPdfPage';
import ITextPdfTest from './components/ITextPdfTest';
import RegistroCFDIPage from './components/RegistroCFDIPage';
import { CatalogosProductosServiciosPage } from './components/CatalogosProductosServiciosPage';
import { CatalogosClientesPage } from './components/CatalogosClientesPage';
import { ConfiguracionTemasPage } from './components/ConfiguracionTemasPage';
import { ConfiguracionEmpresaPage } from './components/ConfiguracionEmpresaPage';
import { ConfiguracionCorreoPage } from './components/ConfiguracionCorreoPage';
import ConfiguracionMenusPage from './components/ConfiguracionMenusPage';
import { InvoiceForm } from './components/InvoiceForm';
import { FacturacionCartaFacturaPage } from './components/FacturacionCartaFacturaPage';
import ReporteConsultaMonederosPage from './components/ReporteConsultaMonederosPage';
import ReporteRegimenFacturacionNoMismaBoletaPage from './components/ReporteRegimenFacturacionNoMismaBoletaPage';
import ReporteVentasMaquinaCorporativasPage from './components/ReporteVentasMaquinaCorporativasPage';
import { NotasCreditoPage } from './components/NotasCreditoPage';
import { OperacionPage } from './components/OperacionPage';
import { OperacionAdminPage } from './components/OperacionAdminPage';
import { AdminFacturasAccionesPage } from './components/AdminFacturasAccionesPage';
import { login as loginService } from './services/authService';
import {
  collectNavPaths,
  fetchMenuConfigForProfile,
  filterNavItemsByProfile,
  isPathAllowedForUser,
  pickDefaultPath,
} from './utils/menuAccess';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  customColors: CustomColors;
  setCustomColors: React.Dispatch<React.SetStateAction<CustomColors>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
};

const defaultThemeContext: ThemeContextValue = {
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  customColors: DEFAULT_COLORS,
  setCustomColors: () => {},
  logoUrl: getDefaultLogoUrl(),
  setLogoUrl: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

const APP_NAME = 'Cibercom Facturación';
const AUTH_STORAGE_KEY = 'cibercom.authenticated';
const THEME_STORAGE_KEY = 'cibercom.theme';
const COLORS_STORAGE_KEY = 'cibercom.customColors';
const LOGO_STORAGE_KEY = 'logoUrl';
const ACTIVE_PATH_STORAGE_KEY = 'cibercom.activePath';
const USER_STORAGE_KEY = 'cibercom.user';
const TOKEN_STORAGE_KEY = 'cibercom.token';
const SESSION_TIMESTAMP_KEY = 'cibercom.sessionTimestamp';
// Tiempo de expiración de sesión en milisegundos (3 minutos)
const SESSION_TIMEOUT = 3 * 60 * 1000;

const flattenNavItems = (items: NavItem[]): NavItem[] => {
  const result: NavItem[] = [];
  items.forEach((item) => {
    if (item.path) {
      result.push(item);
    }
    if (item.children && item.children.length > 0) {
      result.push(...flattenNavItems(item.children));
    }
  });
  return result;
};

const PagePlaceholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="p-6 text-center text-gray-600 dark:text-gray-300">
    <h2 className="text-xl font-semibold mb-2">Sección en construcción</h2>
    <p>
      La sección <strong>{label}</strong> aún no cuenta con una implementación completa.
    </p>
  </div>
);

const findNavItemByIdentifier = (
  items: NavItem[],
  identifier: string,
): NavItem | undefined => {
  const normalized = identifier.trim().toLowerCase();
  return flattenNavItems(items).find(
    (item) =>
      item.path?.toLowerCase() === normalized ||
      item.label.trim().toLowerCase() === normalized,
  );
};

const getStoredCustomColors = (): CustomColors => {
  try {
    const stored = localStorage.getItem(COLORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CustomColors;
      if (
        parsed &&
        typeof parsed.primary === 'string' &&
        typeof parsed.primaryDark === 'string' &&
        typeof parsed.secondary === 'string' &&
        typeof parsed.secondaryDark === 'string' &&
        typeof parsed.accent === 'string' &&
        typeof parsed.accentDark === 'string'
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('No se pudo leer customColors desde localStorage:', error);
  }
  return DEFAULT_COLORS;
};

const getStoredLogo = (): string => {
  const stored = localStorage.getItem(LOGO_STORAGE_KEY);
  if (stored && stored.trim().length > 0) {
    return stored;
  }
  return getDefaultLogoUrl();
};

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

const getStoredActivePath = (): string => {
  // Si la URL tiene hash (#vista), usarlo para abrir esa vista directamente
  const hash = typeof window !== 'undefined' ? window.location.hash.slice(1).trim() : '';
  if (hash) {
    const match = flattenNavItems(NAV_ITEMS).find(
      (item) => item.path && (item.path === hash || item.path === hash.toLowerCase()),
    );
    if (match?.path) return match.path;
  }
  const stored = localStorage.getItem(ACTIVE_PATH_STORAGE_KEY);
  return stored || 'dashboard';
};

const getStoredUser = (): UsuarioLogin | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioLogin;
  } catch {
    return null;
  }
};

const updateCssCustomProperties = (colors: CustomColors) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-secondary-dark', colors.secondaryDark);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-dark', colors.accentDark);
};

const ensureThemeClass = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const resolvePageTitle = (items: NavItem[], path: string): string => {
  const match = flattenNavItems(items).find((item) => item.path === path);
  return match?.label ?? 'Dashboard';
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [customColors, setCustomColors] = useState<CustomColors>(() =>
    getStoredCustomColors(),
  );
  const [logoUrl, setLogoUrl] = useState<string>(() => getStoredLogo());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    if (auth) {
      // Verificar si la sesión ha expirado al cargar
      const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const ahora = Date.now();
        const tiempoTranscurrido = ahora - timestamp;
        if (tiempoTranscurrido >= SESSION_TIMEOUT) {
          // Sesión expirada, limpiar
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(SESSION_TIMESTAMP_KEY);
          return false;
        }
      } else {
        // No hay timestamp, considerar sesión inválida
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return false;
      }
    }
    return auth;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<string>(() => getStoredActivePath());
  const [authUser, setAuthUser] = useState<UsuarioLogin | null>(() => getStoredUser());
  const [navItemsForUser, setNavItemsForUser] = useState<NavItem[]>(NAV_ITEMS);
  const [allowedPaths, setAllowedPaths] = useState<Set<string>>(() =>
    new Set(['dashboard']),
  );
  const [menuAccessReady, setMenuAccessReady] = useState(false);

  const flatNavItems = useMemo(() => flattenNavItems(navItemsForUser), [navItemsForUser]);

  const applyMenuForUser = useCallback(async (user: UsuarioLogin | null) => {
    setMenuAccessReady(false);
    if (!user?.idPerfil) {
      const filtered = filterNavItemsByProfile(NAV_ITEMS, user, [], []);
      setNavItemsForUser(filtered);
      const paths = collectNavPaths(filtered);
      setAllowedPaths(paths);
      setActivePath((current) =>
        isPathAllowedForUser(current, user, paths) ? current : pickDefaultPath(paths),
      );
      setMenuAccessReady(true);
      return;
    }

    try {
      const { tabs, screens } = await fetchMenuConfigForProfile(user.idPerfil);
      const filtered = filterNavItemsByProfile(NAV_ITEMS, user, tabs, screens);
      setNavItemsForUser(filtered);
      const paths = collectNavPaths(filtered);
      setAllowedPaths(paths);
      setActivePath((current) =>
        isPathAllowedForUser(current, user, paths) ? current : pickDefaultPath(paths),
      );
    } catch (error) {
      console.warn('No se pudo cargar MENU_CONFIG, usando reglas por perfil:', error);
      const filtered = filterNavItemsByProfile(NAV_ITEMS, user, [], []);
      setNavItemsForUser(filtered);
      const paths = collectNavPaths(filtered);
      setAllowedPaths(paths);
      setActivePath((current) =>
        isPathAllowedForUser(current, user, paths) ? current : pickDefaultPath(paths),
      );
    } finally {
      setMenuAccessReady(true);
    }
  }, []);

  useEffect(() => {
    ensureThemeClass(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    updateCssCustomProperties(customColors);
    localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    if (logoUrl) {
      localStorage.setItem(LOGO_STORAGE_KEY, logoUrl);
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    }
  }, [logoUrl]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
      const nombreEmpleado =
        authUser.nombreEmpleado || authUser.noUsuario || DEFAULT_USER.name;
      try {
        localStorage.setItem('nombreEmpleado', nombreEmpleado);
      } catch {}
      try {
        // Determinar el ID del usuario: preferir idDfi, luego idPerfil
        // IMPORTANTE: ID_PERFIL es NOT NULL en la tabla USUARIOS, siempre existe
        // ID_DFI puede ser NULL, por lo que usamos ID_PERFIL como fallback
        const idUsuario = authUser.idDfi != null && authUser.idDfi !== undefined 
                         ? authUser.idDfi 
                         : (authUser.idPerfil != null && authUser.idPerfil !== undefined 
                            ? authUser.idPerfil 
                            : null);
        
        if (!idUsuario) {
          console.warn('Usuario no tiene ID_DFI ni ID_PERFIL. NO_USUARIO:', authUser.noUsuario);
        }
        
        localStorage.setItem(
          'perfil',
          JSON.stringify({
            nombrePerfil: authUser.nombrePerfil || 'Sin perfil',
            idPerfil: authUser.idPerfil, // ID del perfil asignado al usuario (NOT NULL en BD)
            idDfi: authUser.idDfi, // ID numérico del usuario en tabla DFI/empleados (puede ser NULL)
            idEstacionamiento: authUser.idEstacionamiento,
            noUsuario: authUser.noUsuario, // Guardar también noUsuario para referencia (NO usar como ID)
            idUsuario: idUsuario, // ID del usuario que se usará para guardar en FACTURAS
          }),
        );
        
        // Guardar el ID del usuario en session.idUsuario para acceso rápido
        if (idUsuario != null) {
          localStorage.setItem('session.idUsuario', String(idUsuario));
        } else {
          console.error('No se pudo determinar el ID del usuario');
        }
      } catch (error) {
        console.error('Error al guardar perfil del usuario:', error);
      }
      try {
        const username = authUser.noUsuario || nombreEmpleado;
        localStorage.setItem('username', username);
        // NO sobrescribir session.idUsuario aquí si ya se estableció arriba con el ID real
        if (!localStorage.getItem('session.idUsuario')) {
          localStorage.setItem('session.idUsuario', username);
        }
      } catch {}
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('nombreEmpleado');
      localStorage.removeItem('perfil');
      localStorage.removeItem('username');
    }
  }, [authUser]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PATH_STORAGE_KEY, activePath);
  }, [activePath]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void applyMenuForUser(authUser);
  }, [isAuthenticated, authUser, applyMenuForUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onMenuConfigUpdated = () => {
      void applyMenuForUser(authUser);
    };

    window.addEventListener('menuConfigUpdated', onMenuConfigUpdated);
    return () => window.removeEventListener('menuConfigUpdated', onMenuConfigUpdated);
  }, [isAuthenticated, authUser, applyMenuForUser]);

  // Sincronizar hash con la vista actual: al cambiar activePath actualizar URL (#vista)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const newHash = activePath ? `#${activePath}` : '';
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
    }
  }, [activePath]);

  // Si el usuario cambia el hash en la URL, cambiar la vista
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1).trim();
      if (!hash || !menuAccessReady) return;
      if (!isPathAllowedForUser(hash, authUser, allowedPaths)) return;
      const match = flatNavItems.find((item) => item.path && item.path === hash);
      if (match?.path && match.path !== activePath) setActivePath(match.path);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activePath, allowedPaths, authUser, flatNavItems, menuAccessReady]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(ACTIVE_PATH_STORAGE_KEY);
    localStorage.removeItem('perfil');
    localStorage.removeItem('nombreEmpleado');
    localStorage.removeItem('username');
    setActivePath('dashboard');
    setNavItemsForUser(NAV_ITEMS);
    setAllowedPaths(new Set(['dashboard']));
    setMenuAccessReady(false);
    setIsSidebarOpen(false);
  }, []);

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      try {
        const response = await loginService(username, password);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        // Guardar timestamp de inicio de sesión
        localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
        if (response.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        if (response.usuario) {
          setAuthUser({
            ...response.usuario,
            idPerfil:
              response.usuario.idPerfil !== null
                ? response.usuario.idPerfil
                : null,
            idDfi:
              response.usuario.idDfi !== null ? response.usuario.idDfi : null,
            idEstacionamiento:
              response.usuario.idEstacionamiento !== null
                ? response.usuario.idEstacionamiento
                : null,
            modificaUbicacion:
              response.usuario.modificaUbicacion ?? null,
          });
        } else {
          setAuthUser(null);
        }
        localStorage.removeItem(ACTIVE_PATH_STORAGE_KEY);
        setActivePath('dashboard');
        setMenuAccessReady(false);
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
        throw error instanceof Error
          ? error
          : new Error('No se pudo iniciar sesión.');
      }
    },
    [],
  );

  // Función para verificar si la sesión ha expirado
  const verificarSesionExpirada = useCallback(() => {
    if (!isAuthenticated) return false;

    const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!timestampStr) {
      // No hay timestamp, considerar sesión inválida
      handleLogout();
      return true;
    }

    const timestamp = parseInt(timestampStr, 10);
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - timestamp;

    if (tiempoTranscurrido >= SESSION_TIMEOUT) {
      // Sesión expirada
      handleLogout();
      return true;
    }

    return false;
  }, [isAuthenticated, handleLogout]);

  // Función para actualizar el timestamp de la sesión (resetear el timer)
  const actualizarTimestampSesion = useCallback(() => {
    if (isAuthenticated) {
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }
  }, [isAuthenticated]);

  // Verificar sesión al cargar y periódicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificar inmediatamente al montar
    verificarSesionExpirada();

    // Verificar cada 30 segundos
    const intervalId = setInterval(() => {
      verificarSesionExpirada();
    }, 30000); // Verificar cada 30 segundos

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, verificarSesionExpirada]);

  // Resetear el timer de sesión cuando el usuario interactúa
  useEffect(() => {
    if (!isAuthenticated) return;

    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetearTimer = () => {
      actualizarTimestampSesion();
    };

    // Agregar listeners con throttling para evitar demasiadas actualizaciones
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledReset = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetearTimer();
        throttleTimer = null;
      }, 1000); // Actualizar máximo una vez por segundo
    };

    eventos.forEach(evento => {
      window.addEventListener(evento, throttledReset, { passive: true });
    });

    return () => {
      eventos.forEach(evento => {
        window.removeEventListener(evento, throttledReset);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, actualizarTimestampSesion]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleNavItemClick = useCallback(
    (
      label: string,
      _icon: React.FC<React.SVGProps<SVGSVGElement>>,
      path?: string,
    ) => {
      const targetPath =
        path ?? findNavItemByIdentifier(navItemsForUser, label)?.path;
      if (targetPath && isPathAllowedForUser(targetPath, authUser, allowedPaths)) {
        setActivePath(targetPath);
      }
      setIsSidebarOpen(false);
    },
    [allowedPaths, authUser, navItemsForUser],
  );

  const setActivePage = useCallback(
    (identifier: string) => {
      const match = findNavItemByIdentifier(navItemsForUser, identifier);
      const targetPath = match?.path ?? identifier;
      if (targetPath && isPathAllowedForUser(targetPath, authUser, allowedPaths)) {
        setActivePath(targetPath);
      }
    },
    [allowedPaths, authUser, navItemsForUser],
  );

  const themeContextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      customColors,
      setCustomColors,
      logoUrl,
      setLogoUrl,
    }),
    [customColors, logoUrl, theme, toggleTheme],
  );

  const pageTitle = useMemo(
    () => resolvePageTitle(navItemsForUser, activePath),
    [activePath, navItemsForUser],
  );

  const headerUser = useMemo(() => {
    if (authUser) {
      return {
        name:
          authUser.nombreEmpleado ||
          authUser.noUsuario ||
          DEFAULT_USER.name,
        storeId:
          authUser.idEstacionamiento !== null &&
          authUser.idEstacionamiento !== undefined
            ? String(authUser.idEstacionamiento)
            : DEFAULT_USER.storeId,
      };
    }
    return DEFAULT_USER;
  }, [authUser]);

  const renderPage = () => {
    if (!menuAccessReady || !isPathAllowedForUser(activePath, authUser, allowedPaths)) {
      return <DashboardPage setActivePage={setActivePage} />;
    }

    switch (activePath) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'operacion':
        return <OperacionPage />;
      case 'operacion-admin':
        return <OperacionAdminPage />;
      case 'facturacion-articulos':
        return <InvoiceForm />;
      case 'facturacion-intereses':
        return <FacturacionInteresesPage />;
      case 'facturacion-carta-porte':
        return <FacturacionCartaPortePage />;
      case 'facturacion-complemento-pagos':
        return <FacturacionComplementoPagosPage />;
      case 'facturacion-retencion-pagos':
        return <FacturacionRetencionPagosPage />;
      case 'facturacion-captura':
        return <FacturacionCapturaLibrePage />;
      case 'facturacion-global':
        return <FacturacionGlobalPage />;
      case 'facturacion-cancelacion':
        return <FacturacionCancelacionMasivaPage />;
      case 'facturacion-motos':
        return <FacturacionMotosPage />;
      case 'facturacion-monederos':
        return <FacturacionMonederosPage />;
      case 'facturacion-nominas':
        return <FacturacionNominasPage />;
      case 'facturacion-carta-factura':
        return <FacturacionCartaFacturaPage />;
      case 'consultas-facturas':
        return <ConsultasFacturasPage />;
      case 'consultas-sku':
        return <ConsultasSkuPage />;
      case 'consultas-tickets':
        return <ConsultasBoletasPage />;
      case 'consultas-reportes':
        return <ConsultasReportesPage setActivePage={setActivePage} />;
      case 'consultas-reps-sustituidos':
        return <ConsultasRepsSustituidosPage />;
      case 'refactura':
        return <RefacturaPage />;
      case 'facturas-sustituidas':
        return <FacturasSustituidasPage />;
      case 'facturas-por-usuario':
        return <FacturasPorUsuarioPage />;
      case 'admin-empleados':
        return <AdminEmpleadosPage />;
      case 'admin-tiendas':
        return <AdminTiendasPage />;
      case 'admin-periodos-perfil':
        return <AdminPeriodosPerfilPage />;
      case 'admin-periodos-plataforma':
        return <AdminPeriodosPlataformaPage />;
      case 'admin-kioscos':
        return <AdminKioscosPage />;
      case 'admin-excepciones':
        return <AdminExcepcionesPage />;
      case 'admin-secciones':
        return <AdminSeccionesPage />;
      case 'admin-facturas-acciones':
        return <AdminFacturasAccionesPage />;
      case 'reportes-boletas-no-auditadas':
        return <ReportesBoletasNoAuditadasPage />;
      case 'reportes-ingreso-facturacion':
        return <ReportesIngresoFacturacionPage />;
      case 'reportes-integracion-factura-global':
        return <ReportesIntegracionFacturaGlobalPage />;
      case 'reportes-integracion-clientes':
        return <ReportesIntegracionClientesPage />;
      case 'reportes-facturacion-clientes-global':
        return <ReportesFacturacionClientesGlobalPage />;
      case 'reportes-integracion-sustitucion-cfdi':
        return <ReportesIntegracionSustitucionCfdiPage />;
      case 'reportes-control-emision-rep':
        return <ReportesControlEmisionRepPage />;
      case 'reportes-repgcp':
        return <ReportesRepgcpPage />;
      case 'reportes-control-cambios':
        return <ReportesControlCambiosPage />;
      case 'reportes-conciliacion':
        return <ReportesConciliacionPage />;
      case 'reportes-fiscales-reps-sustituidos':
        return <ReportesFiscalesRepsSustituidosPage />;
      case 'monitor-graficas':
        return <MonitorGraficasPage />;
      case 'monitor-bitacora':
        return <MonitorBitacoraPage />;
      case 'monitor-disponibilidad':
        return <MonitorDisponibilidadPage />;
      case 'monitor-logs':
        return <MonitorLogsPage />;
      case 'monitor-decodificador':
        return <MonitorDecodificadorPage />;
      case 'monitor-permisos':
        return <MonitorPermisosPage />;
      case 'monitor-conexiones':
        return <MonitorConexionesPage />;
      case 'test-pdf':
        return <TestPdfPage />;
      case 'test-itext-pdf':
        return <ITextPdfTest />;
      case 'registro-cfdi':
        return <RegistroCFDIPage />;
      case 'catalogos-productos-servicios':
        return <CatalogosProductosServiciosPage />;
      case 'catalogos-clientes':
        return <CatalogosClientesPage />;
      case 'configuracion-temas':
        return <ConfiguracionTemasPage />;
      case 'configuracion-empresa':
        return <ConfiguracionEmpresaPage />;
      case 'configuracion-correo':
        return <ConfiguracionCorreoPage />;
      case 'configuracion-menus':
        return <ConfiguracionMenusPage />;
      case 'reportes-consulta-monederos':
        return <ReporteConsultaMonederosPage />;
      case 'reportes-regimen-facturacion-no-misma-boleta':
        return <ReporteRegimenFacturacionNoMismaBoletaPage />;
      case 'reportes-ventas-maquina-corporativas':
        return <ReporteVentasMaquinaCorporativasPage />;
      case 'notas-credito':
        return <NotasCreditoPage />;
      default: {
        const fallbackLabel =
          flatNavItems.find((item) => item.path === activePath)?.label ||
          activePath;
        return <PagePlaceholder label={fallbackLabel} />;
      }
    }
  };

  const ThemeToggleButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? 'Oscuro' : 'Claro'}
    </button>
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <EmpresaProvider>
        {isAuthenticated ? (
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">
            <Sidebar
              navItems={navItemsForUser}
              activePath={activePath}
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              onNavItemClick={handleNavItemClick}
              logoUrl={logoUrl}
              appName={APP_NAME}
            />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header
                user={headerUser}
                toggleSidebar={toggleSidebar}
                onLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                isAuthenticated={isAuthenticated}
                ThemeToggleButton={ThemeToggleButton}
              />
              <MainContent pageTitle={pageTitle}>{renderPage()}</MainContent>
            </div>
          </div>
        ) : (
          <LoginPage onLogin={handleLogin} logoUrl={logoUrl} appName={APP_NAME} />
        )}
      </EmpresaProvider>
    </ThemeContext.Provider>
  );
};

export default App;

