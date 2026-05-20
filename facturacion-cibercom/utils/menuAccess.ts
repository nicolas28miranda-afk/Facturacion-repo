import type { NavItem, UsuarioLogin } from '../types';

import { apiUrl } from '../services/api';



export type MenuConfigRow = {

  idConfig?: number;

  idPerfil?: number;

  menuLabel: string;

  menuPath?: string | null;

  isVisible: boolean;

  orden?: number;

};



const ADMIN_ONLY_SECTIONS = new Set([

  'administracion',

  'configuracion',

]);



const ADMIN_ONLY_PATH_PREFIXES = [

  'admin-',

  'operacion-admin',

  'configuracion-menus',

];

/** Pantallas visibles bajo Administración (resto de admin-* ocultas en menú). */
export const ADMINISTRACION_MENU_PATHS = new Set([
  'admin-empleados',
  'operacion-admin',
  'admin-facturas-acciones',
]);



function normalizeMenuLabel(label: string): string {

  return label

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .trim()

    .toLowerCase();

}



export function isAdminOnlyPath(path: string | undefined | null): boolean {

  if (!path) return false;

  return ADMIN_ONLY_PATH_PREFIXES.some(

    (prefix) => path === prefix || path.startsWith(prefix),

  );

}



export function isAdminOnlySection(label: string): boolean {

  return ADMIN_ONLY_SECTIONS.has(normalizeMenuLabel(label));

}



/** Solo perfiles explícitamente administradores (evita falsos positivos con includes('admin')). */

export function isAdminProfile(user: UsuarioLogin | null): boolean {

  if (!user) return false;

  const name = normalizeMenuLabel(user.nombrePerfil || '');

  if (!name) return false;

  return (

    name === 'administrador' ||

    name.startsWith('administrador ') ||

    name.endsWith(' administrador') ||

    name.includes(' administrador ') ||

    name === 'admin'

  );

}



export function isOperatorProfile(user: UsuarioLogin | null): boolean {

  if (!user) return false;

  if (isAdminProfile(user)) return false;

  const name = normalizeMenuLabel(user.nombrePerfil || '');

  return (

    name.includes('operador') ||

    name.includes('credito') ||

    name.includes('crédito')

  );

}



export async function fetchMenuConfigForProfile(

  idPerfil: number,

): Promise<{ tabs: MenuConfigRow[]; screens: MenuConfigRow[] }> {

  const [tabsRes, screensRes] = await Promise.all([

    fetch(apiUrl(`/menu-config/perfil/${idPerfil}`)),

    fetch(apiUrl(`/menu-config/pantallas/${idPerfil}`)),

  ]);



  if (!tabsRes.ok || !screensRes.ok) {

    throw new Error('No se pudo cargar la configuración de menús');

  }



  const tabsRaw = (await tabsRes.json()) as MenuConfigRow[];

  const screensRaw = (await screensRes.json()) as MenuConfigRow[];



  const tabs = Array.isArray(tabsRaw)

    ? tabsRaw.filter((row) => !row.menuPath)

    : [];

  const screens = Array.isArray(screensRaw) ? screensRaw : [];



  return { tabs, screens };

}



function isScreenVisibleForChild(

  child: NavItem,

  visibleScreenLabels: Set<string>,

  visibleScreenPaths: Set<string>,

): boolean {

  if (visibleScreenLabels.has(child.label)) return true;

  if (child.path && visibleScreenPaths.has(child.path)) return true;

  return false;

}

/**
 * Pantallas admin definidas en NAV_ITEMS que aún no están en MENU_CONFIG (Oracle).
 * Así aparecen en el menú sin insert manual en BD.
 */
function mergeAdminMenuChildren(
  filtered: NavItem[],
  canonicalChildren: NavItem[],
  admin: boolean,
): NavItem[] {
  if (!admin || canonicalChildren.length === 0) return filtered;
  const paths = new Set(
    filtered.map((c) => c.path).filter((p): p is string => Boolean(p)),
  );
  const missing = canonicalChildren.filter(
    (c) =>
      c.path &&
      ADMINISTRACION_MENU_PATHS.has(c.path) &&
      !paths.has(c.path),
  );
  if (missing.length === 0) return filtered;
  return [...filtered, ...missing];
}

function isAdministracionSection(label: string): boolean {
  return normalizeMenuLabel(label) === 'administracion';
}

function restrictAdministracionChildren(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    if (!isAdministracionSection(item.label) || !item.children?.length) {
      return item;
    }
    const children = item.children.filter(
      (c) => c.path && ADMINISTRACION_MENU_PATHS.has(c.path),
    );
    return { ...item, children };
  });
}

/** Filtra NAV_ITEMS según MENU_CONFIG o reglas por defecto si no hay datos en BD. */

export function filterNavItemsByProfile(

  navItems: NavItem[],

  user: UsuarioLogin | null,

  menuTabs: MenuConfigRow[],

  menuScreens: MenuConfigRow[],

): NavItem[] {

  const admin = isAdminProfile(user);



  if (menuTabs.length === 0) {

    if (admin) return restrictAdministracionChildren(navItems);

    return navItems.filter((item) => !isAdminOnlySection(item.label));

  }



  const visibleTabLabels = new Set(

    menuTabs.filter((t) => t.isVisible).map((t) => t.menuLabel),

  );

  const visibleScreenLabels = new Set(

    menuScreens.filter((s) => s.isVisible).map((s) => s.menuLabel),

  );

  const visibleScreenPaths = new Set(

    menuScreens

      .filter((s) => s.isVisible && s.menuPath)

      .map((s) => s.menuPath as string),

  );



  const filtered = navItems

    .map((item) => {

      if (item.label === 'Dashboard') return item;

      if (!visibleTabLabels.has(item.label)) return null;



      if (!item.children?.length) {

        if (!admin && item.path && isAdminOnlyPath(item.path)) return null;

        if (menuScreens.length > 0 && item.path) {

          const pathOk = visibleScreenPaths.has(item.path);

          const labelOk = visibleScreenLabels.has(item.label);

          if (!pathOk && !labelOk) return null;

        }

        return item;

      }



      const filteredChildren = item.children.filter((child) =>
        isScreenVisibleForChild(child, visibleScreenLabels, visibleScreenPaths),
      );
      let children = mergeAdminMenuChildren(filteredChildren, item.children, admin);
      if (isAdministracionSection(item.label)) {
        children = children.filter(
          (c) => c.path && ADMINISTRACION_MENU_PATHS.has(c.path),
        );
      }

      if (children.length === 0) return null;

      return { ...item, children };

    })

    .filter((item): item is NavItem => item !== null);

  return restrictAdministracionChildren(filtered);

}



export function collectNavPaths(items: NavItem[]): Set<string> {

  const paths = new Set<string>();

  const walk = (list: NavItem[]) => {

    list.forEach((item) => {

      if (item.path) paths.add(item.path);

      if (item.children) walk(item.children);

    });

  };

  walk(items);

  return paths;

}



/** Solo rutas del menú filtrado (lista blanca); administradores sin restricción. */

export function isPathAllowedForUser(

  path: string,

  user: UsuarioLogin | null,

  allowedPaths: Set<string>,

): boolean {

  if (!path) return false;

  if (isAdminProfile(user)) return true;

  if (path === 'dashboard') return allowedPaths.has('dashboard');

  if (!allowedPaths.has(path)) return false;

  return !isAdminOnlyPath(path);

}



export function pickDefaultPath(

  allowedPaths: Set<string>,

  user?: UsuarioLogin | null,

): string {

  if (isOperatorProfile(user ?? null) && allowedPaths.has('operacion')) {

    return 'operacion';

  }

  if (allowedPaths.has('dashboard')) return 'dashboard';

  const ordered = ['operacion', 'facturacion-articulos', 'consultas-facturas'];

  for (const candidate of ordered) {

    if (allowedPaths.has(candidate)) return candidate;

  }

  const first = [...allowedPaths][0];

  return first || 'dashboard';

}


