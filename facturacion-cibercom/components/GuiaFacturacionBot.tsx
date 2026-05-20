import React, { useState, useCallback, useEffect } from 'react';

type VistaGuia = 'menu' | 'pasos' | 'botones';

const PASOS = [
  { id: 'guia-paso-datos-fiscales', titulo: 'Datos fiscales del receptor', descripcion: 'RFC, razón social, domicilio, régimen y uso de CFDI.' },
  { id: 'guia-paso-contacto', titulo: 'Datos de contacto', descripcion: 'Correo y teléfono para enviar la factura.' },
  { id: 'guia-paso-detalle', titulo: 'Detalle (artículos)', descripcion: 'Modo automático por folio o manual agregando productos del catálogo.' },
  { id: 'guia-paso-forma-pago', titulo: 'Forma de pago', descripcion: 'Medio y forma de pago según el SAT.' },
  { id: 'guia-paso-relacion-cfdi', titulo: 'Relación con CFDI', descripcion: 'Solo si sustituyes otra factura.' },
  { id: 'guia-paso-generar', titulo: 'Generar factura', descripcion: 'Vista previa, generar, descargar y enviar.' },
] as const;

const SECCIONES_RAPIDAS = [
  { id: 'guia-paso-datos-fiscales', label: 'Datos del cliente' },
  { id: 'guia-paso-contacto', label: 'Datos de contacto' },
  { id: 'guia-paso-detalle', label: 'Agregar artículos' },
  { id: 'guia-paso-forma-pago', label: 'Forma de pago' },
  { id: 'guia-paso-generar', label: 'Botones de generar / descargar' },
] as const;

const EXPLICACION_BOTONES = [
  {
    nombre: 'Buscar',
    descripcion: 'En modo automático, busca un ticket por folio y trae los datos para facturar sin capturar artículos a mano.',
  },
  {
    nombre: 'Agregar Producto/Servicio',
    descripcion: 'Abre el catálogo de productos y servicios. Elige concepto, cantidad y se agrega a la factura (modo manual).',
  },
  {
    nombre: 'Vista Previa',
    descripcion: 'Genera un PDF de cómo quedará la factura sin timbrarla. Sirve para revisar antes de emitir.',
  },
  {
    nombre: 'Generar',
    descripcion: 'Envía la factura a timbrar y la guarda. Después podrás descargar XML/PDF y enviar por correo o WhatsApp.',
  },
  {
    nombre: 'Descargar XML',
    descripcion: 'Descarga el archivo XML de la factura ya generada (la última que tengas en pantalla).',
  },
  {
    nombre: 'Descargar PDF',
    descripcion: 'Descarga el PDF de la factura para imprimir o enviar al cliente.',
  },
  {
    nombre: 'Enviar por Correo',
    descripcion: 'Envía la factura (PDF/XML) al correo del cliente que capturaste en el formulario.',
  },
  {
    nombre: 'Enviar por WhatsApp',
    descripcion: 'Abre una ventana para enviar la factura por WhatsApp al número que indiques.',
  },
  {
    nombre: 'Cancelar',
    descripcion: 'Limpia todo el formulario y lo reinicia para empezar otra factura.',
  },
] as const;

/** Contenido completo para Notas de crédito (mismo formato que Facturar artículos). */
const NOTAS_CREDITO_PASOS = [
  { id: 'guia-nc-datos-fiscales', titulo: 'Datos fiscales (RFC)', descripcion: 'Ingresa el RFC del receptor. Si está en el catálogo se completan razón social y domicilio.' },
  { id: 'guia-nc-datos-completos', titulo: 'Datos completos del receptor', descripcion: 'Correo, razón social, domicilio fiscal, régimen y uso de CFDI.' },
  { id: 'guia-nc-detalles', titulo: 'Detalles de la nota de crédito', descripcion: 'Referencia a la factura, motivo SAT, serie, folio, uso CFDI y régimen.' },
  { id: 'guia-nc-concepto', titulo: 'Concepto', descripcion: 'Descripción del concepto, cantidad, unidad y precio unitario. Los importes se calculan automáticamente.' },
  { id: 'guia-nc-generar', titulo: 'Generar y enviar', descripcion: 'Vista previa, guardar factura, enviar por correo, descargar XML o PDF.' },
] as const;

const NOTAS_CREDITO_SECCIONES = [
  { id: 'guia-nc-datos-fiscales', label: 'Datos fiscales (RFC)' },
  { id: 'guia-nc-datos-completos', label: 'Datos completos del receptor' },
  { id: 'guia-nc-detalles', label: 'Detalles de la nota de crédito' },
  { id: 'guia-nc-concepto', label: 'Concepto' },
  { id: 'guia-nc-generar', label: 'Botones de generar / descargar' },
] as const;

const NOTAS_CREDITO_BOTONES = [
  { nombre: 'Vista Previa', descripcion: 'Genera un PDF de cómo quedará la nota de crédito sin timbrarla, para revisar antes de emitir.' },
  { nombre: 'Guardar factura', descripcion: 'Timbra y guarda la nota de crédito. Después podrás descargar XML/PDF y enviar por correo.' },
  { nombre: 'Enviar por correo', descripcion: 'Envía la nota de crédito (PDF/XML) al correo del receptor que capturaste en el formulario.' },
  { nombre: 'Descargar XML', descripcion: 'Descarga el archivo XML de la nota de crédito ya generada.' },
  { nombre: 'Descargar PDF', descripcion: 'Descarga el PDF de la nota de crédito para imprimir o enviar al cliente.' },
  { nombre: 'Descargar PDF y XML', descripcion: 'Descarga ambos archivos a la vez.' },
] as const;

/** Retención e información de pagos */
const RETENCION_PASOS = [
  { id: 'guia-ret-datos-receptor', titulo: 'Datos del receptor', descripcion: 'Nacionalidad, RFC y datos fiscales del receptor (razón social o nombre, domicilio fiscal).' },
  { id: 'guia-ret-periodo', titulo: 'Período', descripcion: 'Mes inicial, mes final y ejercicio (año) al que corresponde la retención.' },
  { id: 'guia-ret-info-retencion', titulo: 'Información de la retención', descripcion: 'Clave y descripción de retención, folio interno, concepto y fecha de pago.' },
  { id: 'guia-ret-totales', titulo: 'Totales', descripcion: 'Monto total de la operación, gravado y exento. Los montos retenidos se calculan automáticamente.' },
  { id: 'guia-ret-impuestos', titulo: 'Impuestos retenidos', descripcion: 'Agrega cada impuesto retenido: base, tipo de impuesto (ISR/IVA/IEPS), monto y tipo de pago.' },
  { id: 'guia-ret-info-adicional', titulo: 'Información adicional', descripcion: 'Correo del receptor y usuario que registra.' },
  { id: 'guia-ret-generar', titulo: 'Generar', descripcion: 'Vista previa, limpiar o guardar la retención.' },
] as const;
const RETENCION_SECCIONES = [
  { id: 'guia-ret-datos-receptor', label: 'Datos del receptor' },
  { id: 'guia-ret-periodo', label: 'Período' },
  { id: 'guia-ret-info-retencion', label: 'Información de la retención' },
  { id: 'guia-ret-totales', label: 'Totales' },
  { id: 'guia-ret-impuestos', label: 'Impuestos retenidos' },
  { id: 'guia-ret-info-adicional', label: 'Información adicional' },
  { id: 'guia-ret-generar', label: 'Botones de generar' },
] as const;
const RETENCION_BOTONES = [
  { nombre: 'Limpiar formulario', descripcion: 'Borra todos los datos del formulario para empezar de nuevo.' },
  { nombre: 'Vista Previa', descripcion: 'Genera un PDF de cómo quedará el comprobante de retención antes de guardar.' },
  { nombre: 'Guardar Retención', descripcion: 'Valida, timbra y guarda el comprobante de retención e información de pagos.' },
  { nombre: '+ Agregar Impuesto Retenido', descripcion: 'Añade otra línea de impuesto retenido (base, tipo, monto).' },
] as const;

/** Carta porte */
const CARTA_PORTE_PASOS = [
  { id: 'guia-cp-datos', titulo: 'Datos del comprobante', descripcion: 'Número de serie, precio y fecha (AAAAMMDD) del CFDI.' },
  { id: 'guia-cp-datos-fiscales', titulo: 'Datos fiscales', descripcion: 'RFC, razón social o nombre, domicilio fiscal del receptor según el SAT.' },
  { id: 'guia-cp-info-general', titulo: 'Información general', descripcion: 'Descripción del traslado, persona que autoriza y puesto.' },
  { id: 'guia-cp-ubicaciones', titulo: 'Ubicaciones', descripcion: 'Origen, destino e intermedias: tipo, ID, RFC, nombre, fecha/hora y distancia.' },
  { id: 'guia-cp-mercancias', titulo: 'Mercancías', descripcion: 'Peso bruto total, número de mercancías y detalle (clave, descripción, cantidad, unidad, peso, valor).' },
  { id: 'guia-cp-transporte', titulo: 'Transporte', descripcion: 'Tipo de transporte; si es autotransporte: permiso SCT, placa, configuración, seguros y remolques; si es ferroviario: carros.' },
  { id: 'guia-cp-figuras', titulo: 'Figuras de transporte', descripcion: 'Operador, propietario, arrendador u otras figuras con sus datos y domicilio.' },
  { id: 'guia-cp-generar', titulo: 'Generar', descripcion: 'Cargar ejemplo, descargar XML, vista previa, timbrar y guardar o enviar al correo.' },
] as const;
const CARTA_PORTE_SECCIONES = [
  { id: 'guia-cp-datos', label: 'Datos del comprobante' },
  { id: 'guia-cp-datos-fiscales', label: 'Datos fiscales' },
  { id: 'guia-cp-info-general', label: 'Información general' },
  { id: 'guia-cp-ubicaciones', label: 'Ubicaciones' },
  { id: 'guia-cp-mercancias', label: 'Mercancías' },
  { id: 'guia-cp-transporte', label: 'Transporte' },
  { id: 'guia-cp-figuras', label: 'Figuras de transporte' },
  { id: 'guia-cp-generar', label: 'Botones de generar' },
] as const;
const CARTA_PORTE_BOTONES = [
  { nombre: 'Cargar ejemplo', descripcion: 'Rellena el formulario con datos de ejemplo para probar o como plantilla.' },
  { nombre: 'Descargar XML', descripcion: 'Descarga el XML de la carta porte (si ya fue timbrada).' },
  { nombre: 'Vista Previa', descripcion: 'Genera un PDF de cómo quedará la carta porte sin timbrar.' },
  { nombre: 'Timbrar y guardar', descripcion: 'Envía a timbrar el CFDI con complemento carta porte y lo guarda en base de datos.' },
  { nombre: 'Enviar al correo', descripcion: 'Envía la carta porte timbrada (PDF/XML) al correo del receptor.' },
] as const;

/** Nóminas */
const NOMINAS_PASOS = [
  { id: 'guia-nom-filtro', titulo: 'Filtro de nómina', descripcion: 'Fecha de nómina e ID de empleado para buscar recibos a facturar. Usa Buscar o Limpiar.' },
  { id: 'guia-nom-datos', titulo: 'Datos de facturación de nómina', descripcion: 'Periodicidad, RFC receptor, nombre, CURP, domicilio fiscal, periodo de pago, percepciones, deducciones, total, tipo de nómina, uso CFDI, correo y campos NOM 44 (NSS, antigüedad, etc.).' },
  { id: 'guia-nom-generar', titulo: 'Generar', descripcion: 'Vista previa del PDF o guardar la nómina para timbrarla.' },
  { id: 'guia-nom-historial', titulo: 'Historial de facturación', descripcion: 'Tabla con nóminas ya facturadas. Desde aquí puedes Ver PDF, descargar PDF, XML o enviar por correo.' },
] as const;
const NOMINAS_SECCIONES = [
  { id: 'guia-nom-filtro', label: 'Filtro de nómina' },
  { id: 'guia-nom-datos', label: 'Datos de facturación' },
  { id: 'guia-nom-generar', label: 'Botones Vista Previa / Guardar' },
  { id: 'guia-nom-historial', label: 'Historial de facturación' },
] as const;
const NOMINAS_BOTONES = [
  { nombre: 'Buscar', descripcion: 'Busca recibos de nómina según la fecha e ID empleado del filtro.' },
  { nombre: 'Limpiar', descripcion: 'Limpia el filtro de búsqueda.' },
  { nombre: 'Vista Previa', descripcion: 'Genera un PDF de cómo quedará el comprobante de nómina antes de guardar.' },
  { nombre: 'Guardar Nómina', descripcion: 'Timbra y guarda el CFDI de nómina.' },
  { nombre: 'Ver / PDF / XML / Correo', descripcion: 'En el historial: Ver abre el PDF en pantalla; PDF/XML descargan el archivo; Correo envía el comprobante al correo del empleado.' },
] as const;

/** Complemento de pagos */
const COMPLEMENTO_PAGOS_PASOS = [
  { id: 'guia-comp-factura', titulo: 'Factura a relacionar', descripcion: 'UUID de la factura que se va a complementar. Buscar factura para obtener el ID interno. Correo del receptor.' },
  { id: 'guia-comp-pago', titulo: 'Detalle del pago', descripcion: 'Fecha de pago, forma de pago, moneda y monto. Agregar pago para sumarlo a la lista.' },
  { id: 'guia-comp-pagos', titulo: 'Pagos registrados', descripcion: 'Lista de pagos agregados. Debe haber al menos uno. Totales por moneda, vista previa, preparar complemento y generar PDF/XML o enviar por correo.' },
  { id: 'guia-comp-generar', titulo: 'Acciones del complemento', descripcion: 'Reiniciar formulario, vista previa, preparar complemento, generar PDF, generar XML, enviar por correo.' },
] as const;
const COMPLEMENTO_PAGOS_SECCIONES = [
  { id: 'guia-comp-factura', label: 'Factura a relacionar' },
  { id: 'guia-comp-pago', label: 'Detalle del pago' },
  { id: 'guia-comp-pagos', label: 'Pagos registrados' },
  { id: 'guia-comp-generar', label: 'Botones de generar / enviar' },
] as const;
const COMPLEMENTO_PAGOS_BOTONES = [
  { nombre: 'Buscar factura', descripcion: 'Obtiene el ID interno de la factura a partir del UUID para poder registrar el complemento de pago.' },
  { nombre: 'Agregar pago / Actualizar pago', descripcion: 'Añade el pago capturado (fecha, forma, moneda, monto) a la lista, o actualiza uno existente.' },
  { nombre: 'Limpiar captura', descripcion: 'Borra los campos del detalle del pago actual para capturar otro.' },
  { nombre: 'Reiniciar formulario', descripcion: 'Limpia todo: factura, pagos y correo para empezar de nuevo.' },
  { nombre: 'Vista Previa', descripcion: 'Genera un PDF de cómo quedará el complemento de pagos (requiere UUID y al menos un pago).' },
  { nombre: 'Preparar complemento', descripcion: 'Prepara y timbra el complemento en el PAC. Después podrás generar PDF/XML o enviar por correo.' },
  { nombre: 'Generar PDF / Generar XML', descripcion: 'Descarga el PDF o el XML del complemento ya preparado.' },
  { nombre: 'Enviar por correo', descripcion: 'Envía el complemento al correo del receptor (requiere haberlo preparado antes).' },
] as const;

type PasoConId = { id: string; titulo: string; descripcion: string };
type SeccionRapida = { id: string; label: string };
type BotonExplicacion = { nombre: string; descripcion: string };

/** Rutas que tienen guía completa (Ver pasos + Qué hace cada botón + Llevarme a). */
const CONTENIDO_COMPLETO_POR_RUTA: Record<string, { pasos: readonly PasoConId[]; seccionesRapidas: readonly SeccionRapida[]; botones: readonly BotonExplicacion[] }> = {
  'facturacion-articulos': { pasos: PASOS, seccionesRapidas: SECCIONES_RAPIDAS, botones: EXPLICACION_BOTONES },
  'notas-credito': { pasos: NOTAS_CREDITO_PASOS, seccionesRapidas: NOTAS_CREDITO_SECCIONES, botones: NOTAS_CREDITO_BOTONES },
  'facturacion-retencion-pagos': { pasos: RETENCION_PASOS, seccionesRapidas: RETENCION_SECCIONES, botones: RETENCION_BOTONES },
  'facturacion-carta-porte': { pasos: CARTA_PORTE_PASOS, seccionesRapidas: CARTA_PORTE_SECCIONES, botones: CARTA_PORTE_BOTONES },
  'facturacion-nominas': { pasos: NOMINAS_PASOS, seccionesRapidas: NOMINAS_SECCIONES, botones: NOMINAS_BOTONES },
  'facturacion-complemento-pagos': { pasos: COMPLEMENTO_PAGOS_PASOS, seccionesRapidas: COMPLEMENTO_PAGOS_SECCIONES, botones: COMPLEMENTO_PAGOS_BOTONES },
};

/** Guía genérica por pantalla (pasos sugeridos cuando no hay contenido completo). */
const GUIA_POR_RUTA: Record<string, { titulo: string; pasos: string[] }> = {
  'notas-credito': {
    titulo: 'Notas de crédito',
    pasos: [
      'Indica el UUID o datos de la factura que se va a afectar con la nota de crédito.',
      'Completa los datos del receptor y el motivo de la nota de crédito.',
      'Revisa los conceptos e importes. Genera la nota de crédito cuando todo esté correcto.',
      'Puedes descargar XML/PDF y enviar por correo o WhatsApp al cliente.',
    ],
  },
  'facturacion-captura': {
    titulo: 'Facturación captura libre',
    pasos: [
      'Captura el RFC y datos fiscales del receptor.',
      'Completa el concepto (producto o servicio), cantidades e importes.',
      'Indica forma de pago y genera la factura. Revisa vista previa si lo deseas.',
    ],
  },
  'facturacion-global': {
    titulo: 'Facturación global',
    pasos: [
      'Selecciona el rango de fechas y los criterios para facturar en lote.',
      'Revisa los registros que se van a facturar y confirma la emisión.',
      'Monitorea el proceso; al final podrás descargar o consultar las facturas generadas.',
    ],
  },
  'facturacion-cancelacion': {
    titulo: 'Cancelación masiva',
    pasos: [
      'Carga o selecciona los CFDIs que deseas cancelar.',
      'Indica el motivo de cancelación según el SAT.',
      'Confirma y ejecuta la cancelación. Revisa el resultado por cada UUID.',
    ],
  },
  'facturacion-intereses': {
    titulo: 'Facturación de intereses',
    pasos: [
      'Completa los datos del cliente y del adeudo que genera intereses.',
      'Indica tasas, periodos e importes según corresponda.',
      'Genera la factura y descarga o envía al cliente.',
    ],
  },
  'facturacion-carta-porte': {
    titulo: 'Carta porte',
    pasos: [
      'Captura datos del emisor, receptor y del traslado (origen, destino, mercancía).',
      'Completa la información del transporte y unidades según el complemento carta porte.',
      'Genera el CFDI con complemento y guarda o envía según necesites.',
    ],
  },
  'facturacion-complemento-pagos': {
    titulo: 'Complemento de pagos',
    pasos: [
      'Indica los datos del comprobante que se complementa.',
      'Registra los pagos (fecha, forma de pago, monto) que recibe el cliente.',
      'Genera el complemento y asocia al CFDI correspondiente.',
    ],
  },
  'facturacion-retencion-pagos': {
    titulo: 'Retención e información de pagos',
    pasos: [
      'Captura los datos del comprobante de retenciones e información de pagos.',
      'Completa impuestos retenidos y trasladados según el SAT.',
      'Genera y timbra el comprobante; descarga o envía según proceda.',
    ],
  },
  'facturacion-motos': {
    titulo: 'Facturación motos',
    pasos: [
      'Completa los datos del cliente y del vehículo (moto).',
      'Indica conceptos, precios e impuestos aplicables.',
      'Genera la factura y descarga o envía al cliente.',
    ],
  },
  'facturacion-monederos': {
    titulo: 'Facturación monederos',
    pasos: [
      'Selecciona o captura la información del monedero y del cliente.',
      'Indica cargos, saldos o movimientos a facturar.',
      'Genera el comprobante y revisa o envía según necesites.',
    ],
  },
  'facturacion-nominas': {
    titulo: 'Facturación nóminas',
    pasos: [
      'Carga o selecciona el periodo y los recibos de nómina a facturar.',
      'Revisa percepciones, deducciones e impuestos.',
      'Genera los CFDIs de nómina y descarga o envía.',
    ],
  },
  'facturacion-carta-factura': {
    titulo: 'Carta factura',
    pasos: [
      'Completa los datos del envío y de la factura asociada.',
      'Indica destinatario, domicilios y descripción de la mercancía.',
      'Genera la carta factura y guarda o envía.',
    ],
  },
};

function scrollToSeccion(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('ring-2', 'ring-[var(--color-primary)]', 'ring-offset-2', 'dark:ring-offset-gray-900');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-[var(--color-primary)]', 'ring-offset-2', 'dark:ring-offset-gray-900');
    }, 2500);
  }
}

export const RUTA_FACTURACION_ARTICULOS = 'facturacion-articulos';

export interface GuiaFacturacionBotProps {
  /** Si es true, el panel se abre solo al entrar en la pantalla (p. ej. en Facturar artículos). */
  autoOpen?: boolean;
  /** Ruta actual; si no es facturacion-articulos se muestra menú genérico con enlace a Facturar. */
  currentPath?: string;
  /** Navegar a otra pantalla (para "Ir a Facturar artículos" en el resto de facturación). */
  onNavigate?: (path: string) => void;
  pasoIds?: readonly string[];
}

export const GuiaFacturacionBot: React.FC<GuiaFacturacionBotProps> = ({
  autoOpen = false,
  currentPath = '',
  onNavigate,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<VistaGuia>('menu');

  const contenidoCompleto = currentPath ? CONTENIDO_COMPLETO_POR_RUTA[currentPath] ?? null : null;
  const tieneGuiaCompleta = !!contenidoCompleto;

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => setAbierto(true), 500);
    return () => clearTimeout(t);
  }, [autoOpen]);

  const irASeccion = useCallback((id: string) => {
    scrollToSeccion(id);
  }, []);

  const abrirYIr = useCallback((id: string) => {
    irASeccion(id);
  }, [irASeccion]);

  const irAPantalla = useCallback(
    (path: string) => {
      onNavigate?.(path);
      setAbierto(false);
    },
    [onNavigate],
  );

  return (
    <>
      {/* Botón flotante del personaje */}
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] dark:focus:ring-offset-gray-900"
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente de facturación'}
        title="¡Estoy aquí para ayudarte!"
      >
        {abierto ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015H9.375V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        )}
      </button>

      {abierto && (
        <div
          className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden"
          role="dialog"
          aria-label="Asistente de facturación"
        >
          {/* Cabecera con personaje */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015H9.375V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold">Asistente de facturación</h3>
                <p className="text-sm opacity-90">¡Estoy aquí para ayudarte!</p>
              </div>
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {vista === 'menu' && tieneGuiaCompleta && contenidoCompleto && (
              <div className="p-3 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  ¿En qué puedo ayudarte?
                </p>
                <button
                  type="button"
                  onClick={() => setVista('pasos')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  📋 Ver pasos
                </button>
                <button
                  type="button"
                  onClick={() => setVista('botones')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  🔘 ¿Qué hace cada botón?
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  Llevarme a…
                </p>
                {contenidoCompleto.seccionesRapidas.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => abrirYIr(s.id)}
                    className="w-full rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-[var(--color-primary)]/15 dark:text-gray-200 dark:hover:bg-[var(--color-primary)]/20"
                  >
                    → {s.label}
                  </button>
                ))}
              </div>
            )}

            {vista === 'menu' && !tieneGuiaCompleta && (() => {
              const guia = GUIA_POR_RUTA[currentPath] ?? {
                titulo: 'Esta pantalla',
                pasos: [
                  'Completa los datos del formulario según lo que se solicita.',
                  'Revisa la información antes de generar o enviar.',
                  'Usa los botones de la pantalla para generar, descargar o enviar según corresponda.',
                ],
              };
              return (
                <div className="p-3 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ¿En qué puedo ayudarte?
                  </p>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Guía: {guia.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sigue estos pasos en orden:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {guia.pasos.map((paso, i) => (
                      <li key={i} className="pl-1">{paso}</li>
                    ))}
                  </ol>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      ¿Prefieres facturar por artículos (productos/servicios)?
                    </p>
                    <button
                      type="button"
                      onClick={() => irAPantalla(RUTA_FACTURACION_ARTICULOS)}
                      className="w-full rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 dark:bg-[var(--color-primary)]/20 dark:hover:bg-[var(--color-primary)]/30"
                    >
                      📋 Ir a Facturar (artículos)
                    </button>
                  </div>
                </div>
              );
            })()}

            {vista === 'pasos' && contenidoCompleto && (
              <div className="p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setVista('menu')}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  ← Volver
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Sigue estos pasos en orden:
                </p>
                {contenidoCompleto.pasos.map((paso) => (
                  <div
                    key={paso.id}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-600"
                  >
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {paso.titulo}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                      {paso.descripcion}
                    </p>
                    <button
                      type="button"
                      onClick={() => irASeccion(paso.id)}
                      className="mt-2 rounded bg-[var(--color-primary)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-dark)]"
                    >
                      Ir aquí
                    </button>
                  </div>
                ))}
              </div>
            )}

            {vista === 'botones' && contenidoCompleto && (
              <div className="p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setVista('menu')}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  ← Volver
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Explicación de los botones del formulario:
                </p>
                {contenidoCompleto.botones.map((b) => (
                  <div
                    key={b.nombre}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-gray-700/30"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {b.nombre}
                    </h4>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {b.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
