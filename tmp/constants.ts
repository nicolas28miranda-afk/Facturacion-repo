import type { NavItem, User, CustomColors } from './types';
import { HomeIcon } from './components/icons/HomeIcon'; // Import HomeIcon
import CubeIcon from './components/icons/CubeIcon';


import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { MagnifyingGlassIcon } from './components/icons/MagnifyingGlassIcon';
import { WrenchScrewdriverIcon } from './components/icons/WrenchScrewdriverIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { CurrencyDollarIcon } from './components/icons/CurrencyDollarIcon';
import { TruckIcon } from './components/icons/TruckIcon';
import { GiftIcon } from './components/icons/GiftIcon';
import { StopIcon } from './components/icons/StopIcon';
import { ChevronDoubleRightIcon } from './components/icons/ChevronDoubleRightIcon';
import { CogIcon } from './components/icons/CogIcon';
import { PaintBrushIcon } from './components/icons/PaintBrushIcon';
import { 
  FaUser, FaStore, FaCalendarAlt, FaLaptop, FaExclamationTriangle, FaLayerGroup, 
  FaChartBar, FaFileAlt, FaUsers, FaExchangeAlt, FaClipboardCheck, FaSyncAlt, FaFileSignature, FaHistory, FaEnvelope
} from 'react-icons/fa';
import { FiFileText, FiUsers, FiRepeat, FiSettings } from 'react-icons/fi';
import { ChartPieIcon } from './components/icons/ChartPieIcon';
import { SignalIcon } from './components/icons/SignalIcon';
import { DocumentMagnifyingGlassIcon } from './components/icons/DocumentMagnifyingGlassIcon';
import { ClipboardDocumentListIcon } from './components/icons/ClipboardDocumentListIcon';

export const DEFAULT_USER: User = {
  name: 'RODRIGUEZ MARTINEZ CHRISTIAN JESUS',
  storeId: '798',
};

export const DUMMY_CREDENTIALS = {
  username: 'cibercom',
  password: 'password123',
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: 'dashboard',
    icon: HomeIcon,
  },
  {
    label: 'Facturación',
    icon: DocumentTextIcon,
    children: [
      { label: 'Artículos', path: 'facturacion-articulos', icon: CubeIcon },
      { label: 'Notas de crédito', path: 'facturacion-intereses', icon: CurrencyDollarIcon },
      { label: 'Carta Porte', path: 'facturacion-carta-porte', icon: DocumentTextIcon },
      { label: 'Captura Libre', path: 'facturacion-captura', icon: ChevronDoubleRightIcon },
      { label: 'Factura Global', path: 'facturacion-global', icon: DocumentTextIcon },
      { label: 'Cancelación Masiva', path: 'facturacion-cancelacion', icon: StopIcon },
      // { label: 'Motos', path: 'facturacion-motos', icon: TruckIcon }, // DESHABILITADO TEMPORALMENTE
      { label: 'Monederos', path: 'facturacion-monederos', icon: GiftIcon },
      { label: 'Nóminas', path: 'facturacion-nominas', icon: FaUsers },
    ],
  },
  {
    label: 'Consultas',
    icon: MagnifyingGlassIcon,
    children: [
      { label: 'Facturas', path: 'consultas-facturas', icon: DocumentTextIcon },
      { label: 'SKU', path: 'consultas-sku', icon: CubeIcon },
      { label: 'Boletas', path: 'consultas-boletas', icon: DocumentTextIcon },
    ],
  },
  {
    label: 'Administración',
    icon: WrenchScrewdriverIcon,
    children: [
      { label: 'Empleados', path: 'admin-empleados', icon: FaUser }, 
      { label: 'Tiendas', path: 'admin-tiendas', icon: FaStore }, 
      { label: 'Periodos por Perfil', path: 'admin-periodos-perfil', icon: FaCalendarAlt }, 
      { label: 'Periodos Plataforma', path: 'admin-periodos-plataforma', icon: FaCalendarAlt }, 
      { label: 'Kioscos', path: 'admin-kioscos', icon: FaLaptop }, 
      { label: 'Excepciones', path: 'admin-excepciones', icon: FaExclamationTriangle }, 
      { label: 'Secciones', path: 'admin-secciones', icon: FaLayerGroup }, 
    ],
  },
  {
    label: 'Reportes Facturación Fiscal',
    icon: FaChartBar,
    children: [
      { label: 'Boletas No Auditadas', path: 'reportes-boletas-no-auditadas', icon: FaFileAlt },
      { label: 'Reporte Ingreso-Facturación', path: 'reportes-ingreso-facturacion', icon: FiFileText },
      { label: 'Integración Factura Global', path: 'reportes-integracion-factura-global', icon: FaFileSignature },
      { label: 'Integración Clientes', path: 'reportes-integracion-clientes', icon: FiUsers },
      { label: 'Facturación clientes posterior a Global', path: 'reportes-facturacion-clientes-global', icon: FaClipboardCheck },
      { label: 'Integración Sustitución CFDI', path: 'reportes-integracion-sustitucion-cfdi', icon: FaSyncAlt },
      { label: 'Control de emisión de REP', path: 'reportes-control-emision-rep', icon: FaExchangeAlt },
      { label: 'Reportes REPgcp', path: 'reportes-repgcp', icon: FaChartBar },
      { label: 'Control de cambios', path: 'reportes-control-cambios', icon: FaHistory },
      { label: 'Conciliación', path: 'reportes-conciliacion', icon: FaChartBar },
      { label: 'REPs Sustituidos (Fiscal)', path: 'reportes-fiscales-reps-sustituidos', icon: DocumentTextIcon },
      // Nuevos reportes agregados
      { label: 'Reporte de Consulta Monederos', path: 'reportes-consulta-monederos', icon: GiftIcon },
      { label: 'Reporte de Ventas Máquina Corporativas Serely Polu', path: 'reportes-ventas-maquina-corporativas', icon: FaChartBar },
      { label: 'Régimen de Facturación No Misma Boleta', path: 'reportes-regimen-facturacion-no-misma-boleta', icon: DocumentTextIcon },
      { label: 'Doble Facturación Pendiente por Defencia', path: 'reportes-doble-facturacion-pendiente', icon: FaExclamationTriangle },
      { label: 'Sustitución en Proceso', path: 'reportes-sustitucion-en-proceso', icon: FaSyncAlt },
      { label: 'Cancelación Sustitución de Facturación', path: 'reportes-cancelacion-sustitucion-facturacion', icon: StopIcon },
      { label: 'Saldo a Favor de Clientes', path: 'reportes-saldo-favor-clientes', icon: CurrencyDollarIcon },
      { label: 'Orden de Módulos y Facturación', path: 'reportes-orden-modulos-facturacion', icon: WrenchScrewdriverIcon },
      { label: 'Consulta de Usuarios', path: 'reportes-consulta-usuarios', icon: FaUsers },
      { label: 'Consulta Tiendas de Total de Facturas Diarias', path: 'reportes-consulta-tiendas-facturas-diarias', icon: FaStore },
      { label: 'Validación por Importe Intereses', path: 'reportes-validacion-importe-intereses', icon: CurrencyDollarIcon },
      { label: 'Conciliación Cambio de Sistema de Facturación', path: 'reportes-conciliacion-cambio-sistema', icon: FaSyncAlt },
      { label: 'Control de Complementos de Pago (REP) Generados por Ventas Corporativas', path: 'reportes-control-complementos-pago-rep', icon: FaExchangeAlt },
      { label: 'Reporte por Factura de Mercancía de Monederos', path: 'reportes-factura-mercancia-monederos', icon: GiftIcon },
      { label: 'Ventas Corporativas vs SAT', path: 'reportes-ventas-corporativas-vs-sat', icon: FaChartBar },
      { label: 'Captura Libre Complemento de Pago (REP)', path: 'reportes-captura-libre-complemento-pago', icon: ChevronDoubleRightIcon },
      { label: 'Conciliación Sistema de Facturación de Boletas vs SAT', path: 'reportes-conciliacion-boletas-vs-sat', icon: FaSyncAlt },
      { label: 'Reporte de Trazabilidad de Boletas Canceladas', path: 'reportes-trazabilidad-boletas-canceladas', icon: FaHistory },
      { label: 'Estatus Actualizar SAT de CFDI por Petición', path: 'reportes-estatus-actualizar-sat-cfdi', icon: FaSyncAlt },
    ],
  },
  {
    label: 'Registro CFDI',
    icon: DocumentTextIcon,
    children: [
      { label: 'Registro de Constancias', path: 'registro-cfdi', icon: DocumentTextIcon },
    ],
  },
  {
    label: 'Monitor',
    icon: ChartPieIcon,
    children: [
      { label: 'Gráficas', path: 'monitor-graficas', icon: ChartBarIcon },
      { label: 'Bitácora', path: 'monitor-bitacora', icon: ClipboardDocumentListIcon },   
      { label: 'Disponibilidad', path: 'monitor-disponibilidad', icon: SignalIcon },
      { label: 'Logs', path: 'monitor-logs', icon: DocumentMagnifyingGlassIcon },
      { label: 'Decodificador', path: 'monitor-decodificador', icon: WrenchScrewdriverIcon },
      { label: 'Permisos', path: 'monitor-permisos', icon: FiSettings },
      { label: 'Test PDF', path: 'test-pdf', icon: DocumentTextIcon },
      { label: 'Test iText PDF', path: 'test-itext-pdf', icon: DocumentTextIcon },
    ],
  },
  {
    label: 'Configuración',
    icon: CogIcon,
    children: [
      { label: 'Temas', path: 'configuracion-temas', icon: PaintBrushIcon },
      { label: 'Empresa', path: 'configuracion-empresa', icon: FaStore },
      { label: 'Mensajes de Correo', path: 'configuracion-correo', icon: FaEnvelope },
      { label: 'Configuración de Menús', path: 'configuracion-menus', icon: CogIcon }
    ]
  }
];

export const DEFAULT_COLORS: CustomColors = {
  primary: '#2E86AB', 
  primaryDark: '#1E4A5F', 
  secondary: '#1E4A5F', 
  secondaryDark: '#0F2A3A', 
  accent: '#0F2A3A', 
  accentDark: '#2C5F7C', 
};

export const PAIS_OPTIONS = [
  { value: 'MEX', label: 'México' },
  { value: 'USA', label: 'Estados Unidos' },
  { value: 'CAN', label: 'Canadá' },
  { value: 'otro', label: 'Otro' },
];

export const REGIMEN_FISCAL_OPTIONS = [
  { value: '601', label: 'General de Ley Personas Morales' },
  { value: '605', label: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: 'Arrendamiento' },
  { value: '612', label: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { value: '616', label: 'Sin obligaciones fiscales' },
  { value: '626', label: 'Régimen Simplificado de Confianza' },
];

export const USO_CFDI_OPTIONS = [
  { value: 'G01', label: 'Adquisición de mercancías' },
  { value: 'G03', label: 'Gastos en general' },
  { value: 'I08', label: 'Otra maquinaria y equipo' },
  { value: 'S01', label: 'Sin efectos fiscales' },
  { value: 'CP01', label: 'Pagos' },
];

export const TIENDA_OPTIONS = [
    { value: 'S001', label: 'Sucursal 1 (S001)' },
    { value: 'S002', label: 'Sucursal 2 (S002)' },
    { value: 'S003', label: 'Sucursal 3 (S003)' },
    { value: 'S004', label: 'Sucursal 4 (S004)' },
    { value: 'S005', label: 'Sucursal 5 (S005)' },
    { value: 'Todas', label: 'Todas las Sucursales' },
];

export const TIENDA_OPTIONS_REPORTS = [
    { value: 'S001', label: 'Sucursal 1 (S001)' },
    { value: 'S002', label: 'Sucursal 2 (S002)' },
    { value: 'S003', label: 'Sucursal 3 (S003)' },
    { value: 'S004', label: 'Sucursal 4 (S004)' },
    { value: 'S005', label: 'Sucursal 5 (S005)' },
];


export const MEDIO_PAGO_OPTIONS = [
    { value: '01', label: 'Efectivo' },
    { value: '02', label: 'Cheque nominativo' },
    { value: '03', label: 'Transferencia electrónica de fondos' },
    { value: '04', label: 'Tarjeta de crédito' },
    { value: '28', label: 'Tarjeta de débito' },
    { value: '99', label: 'Por definir' },
];

export const FORMA_PAGO_OPTIONS = [
    { value: 'PUE', label: 'Pago en una sola exhibición' },
    { value: 'PPD', label: 'Pago en parcialidades o diferido' },
];

export const TIPO_FACTURA_OPTIONS = [
    { value: 'Todas', label: '--Todas--' },
    { value: 'I', label: 'Ingreso' },
    { value: 'E', label: 'Egreso' },
    { value: 'P', label: 'Pago' },
];

export const ESTATUS_FACTURA_OPTIONS = [
    { value: 'Todas', label: '--Todas--' },
    { value: 'Timbrada', label: 'Timbrada' },
    { value: 'Cancelada', label: 'Cancelada' },
    { value: 'Pendiente', label: 'Pendiente' },
];

export const JUSTIFICACION_FUNCIONALIDAD_OPTIONS = [
    { value: 'opc1', label: 'Opción de justificación 1' },
    { value: 'opc2', label: 'Opción de justificación 2' },
    { value: 'opc3', label: 'Otra justificación' },
];

export const TIPO_DOCUMENTO_CAPTURA_LIBRE_OPTIONS = [
    { value: 'I', label: 'Factura (Ingreso)' },
    { value: 'E', label: 'Nota de crédito (Egreso)' },
    { value: 'P', label: 'Complemento de pago' },
];

export const EMISOR_OPTIONS = [
    { value: 'LPC', label: 'LPC' },
    { value: 'DILISA', label: 'DILISA' },
];

export const UNIDAD_MEDIDA_OPTIONS = [
    { value: 'H87', label: 'Pieza (H87)' },
    { value: 'KGM', label: 'Kilogramo (KGM)' },
    { value: 'EA', label: 'Cada uno (EA)' },
    { value: 'ACT', label: 'Actividad (ACT)' },
    { value: 'E48', label: 'Unidad de servicio (E48)' },
];

export const TASA_IVA_OPTIONS = [
    { value: '0.16', label: '16%' },
    { value: '0.08', label: '8%' },
    { value: '0.00', label: '0%' },
    { value: 'EXENTO', label: 'Exento' },
];

export const TASA_IEPS_OPTIONS = [ 
    { value: '0.265', label: '26.5% (Gasolinas)' },
    { value: '0.53', label: '53% (Tabacos Labrados)' },
    { value: '0.08', label: '8% (Alimentos no básicos alta densidad calórica)' },
    { value: '0.00', label: '0%' },
    { value: 'EXENTO', label: 'Exento' },
];

export const ALMACEN_OPTIONS = [
    { value: 'A01', label: 'Almacén Principal' },
    { value: 'A02', label: 'Almacén Secundario' },
    { value: 'TODOS', label: '--SELECCIONAR--' },
];

export const MOTIVO_SUSTITUCION_OPTIONS = [
    { value: '01', label: 'Comprobante emitido con errores con relación' },
    { value: '02', label: 'Comprobante emitido con errores sin relación' },
    { value: '03', label: 'No se llevó a cabo la operación' },
    { value: '04', label: 'Operación nominativa relacionada en una factura global' },
    { value: 'menu', label: 'Sustitución por menú de artículos' },
];

export const MES_OPTIONS = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
    { value: 'todos', label: '--SELECCIONA MES--'}
];

export const EMPRESA_OPTIONS_CONSULTAS = [
    { value: 'E001', label: 'Empresa Principal SA de CV' },
    { value: 'E002', label: 'Filial Servicios SC' },
    { value: 'todas', label: '--SELECCIONA--' },
];

export const REPORT_BUTTON_LIST = [
    "REPORTE DE CONSULTA MONEDEROS", "REPORTE DE VENTAS MÁQUINA CORPORATIVAS SERELY POLU", "RÉGIMEN DE FACTURACIÓN NO MISMA BOLETA", "DOBLE FACTURACIÓN PENDIENTE POR DEFENCIA", "SUSTITUCIÓN EN PROCESO", "CANCELACIÓN SUSTITUCIÓN DE FACTURACIÓN", "SALDO A FAVOR DE CLIENTES", "ORDEN DE MODULOS Y FACTURACIÓN",
    "CONSULTA DE USUARIOS", "CONSULTA TIENDAS DE TOTAL DE FACTURAS DIARIAS Y VALIDACIÓN DEL IMPORTE TOTAL DE FACTURAS DIARIAS", "VALIDACIÓN POR IMPORTE INTERESES", "FACTURA POR SISTEMA DE FACTURACIÓN VS SAT", "CONCILIACIÓN CAMBIO DE SISTEMA DE FACTURACIÓN", "CONTROL DE COMPLEMENTOS DE PAGO (REP) GENERADOS POR VENTAS CORPORATIVAS", "REPORTE POR FACTURA DE MERCANCÍA DE MONEDEROS", "VENTAS CORPORATIVAS VS SAT", "CAPTURA LIBRE COMPLEMENTO DE PAGO (REP)",
    "CONCILIACIÓN SISTEMA DE FACTURACIÓN DE BOLETAS VS SAT", "REPORTE DE TRAZABILIDAD DE BOLETAS CANCELADAS", "ESTATUS ACTUALIZAR SAT DE CFDI POR PETICIÓN"
];

export const PERFIL_OPTIONS = [
    { value: 'jefe_credito', label: 'Jefe de Crédito' },
    { value: 'operador_credito', label: 'Operador de Crédito' },
    { value: 'admin_sis', label: 'Administrador del Sistema' },
    { value: 'cajero', label: 'Cajero' },
];

export const MENU_OPTIONS_ADMIN = [
    { value: 'facturacion', label: 'Facturación' },
    { value: 'consultas', label: 'Consultas' },
    { value: 'admin', label: 'Administración' },
    { value: 'reportes_fiscal', label: 'Reportes Fiscales' },
    { value: 'todos', label: '--SELECCIONA--' },
];

export const PLATAFORMA_OPTIONS = [
    { value: 'pos', label: 'POS' },
    { value: 'kiosko', label: 'KIOSKO' },
    { value: 'internet', label: 'INTERNET' },
    { value: 'todas', label: '--SELECCIONA--' },
];

export const ORIGEN_OPTIONS_ADMIN = [
    { value: 'web', label: 'WEB' },
    { value: 'pos', label: 'POS' },
    { value: 'internet', label: 'Internet' },
    { value: 'kiosco', label: 'Kiosco' },
];

export const SECCIONES_FACTURABLES_OPTIONS = [
    { value: '101', label: '101 - MUEBLES' },
    { value: '102', label: '102 - ELECTRICOS' },
    { value: '103', label: '103 - EXT. GTIAS' },
    { value: '107', label: '107 - muebles' },
    { value: '116', label: '116 - MUEBLES DE JARDIN' },
    { value: '121', label: '121 - TAPETES Y ALFOMBRAS' },
    { value: '122', label: '122 - ALFOMBRAS Y PISOS' },
    { value: '123', label: '123 - FERRETERIA' },
    { value: 'restaurante', label: 'RESTAURANTE'},
    { value: 'snack_bar', label: 'SNACK BAR'},
];

export const FORMA_PAGO_EXCEPCIONES_OPTIONS = [
    { value: '-1', label: '-1 (CUALQUIERA)' },
    { value: '0', label: '0 - Cheque' },
    { value: '1', label: '1 - Cupón' },
    { value: '2', label: '2 - ValeMonedero Electrónico' },
    { value: '8', label: '8 - DILISA' },
    { value: '9', label: '9 - LPC' },
    { value: '10', label: '10 - Tarjetas externas' },
    { value: '11', label: '11 - LPC' },
];

export const LEYENDA_EXCEPCIONES_OPTIONS = [
    { value: 'pag_exhib', label: 'Pagado en una sola exhibición' },
    { value: 'cred_dllo', label: 'Credito Desarrollo' },
    { value: 'nota_cred', label: 'Nota de Credito' },
    { value: 'seleccionar', label: '[Seleccionar]' },
];

export const TIPO_FACTURA_GLOBAL_OPTIONS_REPORTS = [
    { value: 'CON', label: 'CON' },
    { value: 'DEV', label: 'DEV' },
    { value: 'CRE', label: 'CRE' },
    { value: 'EMON', label: 'EMON' },
];

export const TIPO_CFDI_OPTIONS_REPORTS = [
    { value: 'PAGO', label: 'PAGO' },
    { value: 'INGRESO', label: 'INGRESO' },
    { value: 'EGRESO', label: 'EGRESO' },
];

export const TIPO_DOCUMENTO_CONCILIACION_OPTIONS = [
    { value: 'factura', label: 'Factura' },
    { value: 'nota_credito', label: 'Nota de Crédito' },
    { value: 'rep', label: 'REP' },
    { value: 'otro', label: 'Otro' },
];

export const dummyControlCambiosData = [
  { id: '5', versionSistema: 'v6', versionBroker: 'v6', descripcion: 'Hola mundo este es una prueba de creación de versión con una breve descripción para modelar en la notificación que es un mensaje que se le muestra al administrador', fechaVersion: '2021-07-07 00:00:00.0' },
  { id: '4', versionSistema: 'v5', versionBroker: 'v5', descripcion: 'test', fechaVersion: '2021-07-06 00:00:00.0' },
  { id: '1', versionSistema: 'v3', versionBroker: 'v3', descripcion: 'TEST asdfsadfsdafdsafdsafjklasdjflkasjdflkjasdlfkjalskdfjlaksjdflkajsdlkfjalksdjflkajsdflkasjfdlkjasflkdj', fechaVersion: '2021-06-30 00:00:00.0' },
  { id: '2', versionSistema: 'v3', versionBroker: 'v3', descripcion: 'Descripcion', fechaVersion: '2021-06-28 00:00:00.0' },
  { id: '0', versionSistema: 'v4', versionBroker: 'v4', descripcion: 'Test', fechaVersion: '2021-06-26 00:00:00.0' },
  { id: '3', versionSistema: 'v1', versionBroker: 'v1', descripcion: 'Alkjdflakjd', fechaVersion: '2021-06-25 00:00:00.0' },
];

export const dummyConciliacionData = [
    { id: 'doc1', identificador: 'F001', tipo: 'Factura', nombre: 'cliente_a.xml', fechaArchivo: '2023-10-01', usuario: 'admin', estatus: 'Conciliado', fechaCarga: '2023-10-01', fechaValidacion: '2023-10-02' },
    { id: 'doc2', identificador: 'NC001', tipo: 'Nota de Crédito', nombre: 'devolucion_b.xml', fechaArchivo: '2023-10-03', usuario: 'user1', estatus: 'Pendiente', fechaCarga: '2023-10-03', fechaValidacion: '' },
];
