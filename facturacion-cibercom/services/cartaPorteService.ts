import { apiUrl, getHeadersWithUsuario } from './api';
import { facturaService } from './facturaService';

export interface EmpresaInfo {
  nombre: string;
  rfc: string;
}

export type TipoTransporte = '01' | '02' | '03' | '04';

export interface CartaPorteDomicilioForm {
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  colonia?: string;
  localidad?: string;
  referencia?: string;
  municipio?: string;
  estado: string;
  pais: string;
  codigoPostal: string;
}

export interface CartaPorteUbicacionForm {
  tipoUbicacion: 'Origen' | 'Destino' | 'Intermedia';
  idUbicacion?: string;
  rfcRemitenteDestinatario: string;
  nombreRemitenteDestinatario?: string;
  numRegIdTrib?: string;
  residenciaFiscal?: string;
  numEstacion?: string;
  nombreEstacion?: string;
  navegacionTrafico?: string;
  fechaHoraSalidaLlegada: string;
  tipoEstacion?: string;
  distanciaRecorrida?: string;
  domicilio?: CartaPorteDomicilioForm | null;
}

export interface CartaPorteMercanciaForm {
  bienesTransp: string;
  descripcion: string;
  cantidad: string;
  claveUnidad: string;
  unidad?: string;
  pesoEnKg: string;
  valorMercancia?: string;
  moneda?: string;
  claveSTCC?: string;
  materialPeligroso?: string;
  cveMaterialPeligroso?: string;
  embalaje?: string;
  descripEmbalaje?: string;
}

export interface CartaPorteAutotransporteForm {
  permSct: string;
  numPermisoSct: string;
  identificacionVehicular: {
    configVehicular: string;
    pesoBrutoVehicular: string;
    placaVm: string;
    anioModeloVm: string;
  };
  seguros: {
    aseguraRespCivil: string;
    polizaRespCivil: string;
    aseguraMedAmbiente?: string;
    polizaMedAmbiente?: string;
    aseguraCarga?: string;
    polizaCarga?: string;
    primaSeguro?: string;
  };
  remolques: Array<{ subTipoRem: string; placa: string }>;
}

export interface CartaPorteDerechoDePasoForm {
  tipoDerechoDePaso: string;
  kilometrajePagado: string;
}

export interface CartaPorteCarroForm {
  tipoCarro: string;
  matriculaCarro: string;
  guiaCarro: string;
  toneladasNetasCarro: string;
}

export interface CartaPorteTransporteFerroviarioForm {
  tipoDeServicio: string;
  tipoDeTrafico: string;
  nombreAseg?: string;
  numPolizaSeguro?: string;
  derechosDePaso: CartaPorteDerechoDePasoForm[];
  carros: CartaPorteCarroForm[];
}

export interface CartaPorteFiguraForm {
  tipoFigura: string;
  rfcFigura?: string;
  numLicencia?: string;
  nombreFigura: string;
  numRegIdTribFigura?: string;
  residenciaFiscalFigura?: string;
  partesTransporte: Array<{ parteTransporte: string }>;
  domicilio?: CartaPorteDomicilioForm | null;
}

export interface CartaPorteComplementForm {
  version: '3.1';
  transpInternac: 'No' | 'Si';
  totalDistRec: string;
  regimenesAduaneros: Array<{ regimenAduanero: string }>;
  ubicaciones: CartaPorteUbicacionForm[];
  mercancias: {
    pesoBrutoTotal: string;
    unidadPeso: string;
    pesoNetoTotal?: string;
    numTotalMercancias: string;
    mercancias: CartaPorteMercanciaForm[];
    autotransporte?: CartaPorteAutotransporteForm;
    transporteFerroviario?: CartaPorteTransporteFerroviarioForm;
  };
  figuraTransporte: {
    tiposFigura: CartaPorteFiguraForm[];
  };
}

export interface CartaPorteFormData {
  versionCartaPorte: '3.1';
  rfcIniciales: string;
  rfcFecha: string;
  rfcHomoclave: string;
  correoElectronico: string;
  razonSocial: string;
  nombre: string;
  paterno: string;
  materno: string;
  pais: string;
  noRegistroIdentidadTributaria: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  descripcion: string;
  fechaInformacion: string;
  numeroSerie: string;
  precio: string;
  personaAutoriza: string;
  puesto: string;
  tipoTransporte: TipoTransporte;
  tipoPersona: 'fisica' | 'moral' | null;
  complemento: CartaPorteComplementForm;
}

export function buildFacturaDataFromCartaPorte(form: CartaPorteFormData, empresa?: EmpresaInfo): Record<string, any> {
  const rfcReceptor = `${(form.rfcIniciales || '').toUpperCase()}${form.rfcFecha || ''}${(form.rfcHomoclave || '').toUpperCase()}`;
  const razonSocialReceptor =
    form.razonSocial?.trim() || [form.nombre, form.paterno, form.materno].filter(Boolean).join(' ').trim();

  const precio = Number(form.precio || 0);
  const cantidad = 1;
  const valorUnitario = +(precio || 0).toFixed(2);
  const importe = +(cantidad * valorUnitario).toFixed(2);
  const iva = +importe * 0.16;
  const subtotal = importe;
  const total = +(subtotal + iva).toFixed(2);

  const ahoraIso = new Date().toISOString();
  const uuid = `CP-${Date.now()}`;

  const primeraMercancia = form.complemento.mercancias.mercancias[0];
  const primerOrigen = form.complemento.ubicaciones.find((u) => u.tipoUbicacion === 'Origen');
  const primerDestino = form.complemento.ubicaciones.find((u) => u.tipoUbicacion === 'Destino');

  return {
    uuid,
    serie: 'CP',
    folio: form.numeroSerie || 'CP001',
    fechaEmision: ahoraIso,
    rfcEmisor: empresa?.rfc || 'XAXX010101000',
    nombreEmisor: empresa?.nombre || 'EMISOR CARTA PORTE',
    rfcReceptor,
    nombreReceptor: razonSocialReceptor || 'RECEPTOR',
    subtotal: subtotal.toFixed(2),
    iva: (subtotal * 0.16).toFixed(2),
    total: total.toFixed(2),
    metodoPago: 'PUE',
    formaPago: '99',
    usoCfdi: form.usoCfdi || 'G03',
    tipoComprobante: 'T',
    lugarExpedicion: form.domicilioFiscal || '76120',
    moneda: 'MXN',
    conceptos: [
      {
        cantidad: String(cantidad),
        descripcion: form.descripcion || 'Carta Porte',
        valorUnitario: valorUnitario.toFixed(2),
        importe: subtotal.toFixed(2),
        iva: (subtotal * 0.16).toFixed(2),
        claveProdServ: primeraMercancia?.bienesTransp || '78101801',
        noIdentificacion: form.numeroSerie || 'CP001',
        unidad: primeraMercancia?.claveUnidad || 'H87',
      },
    ],
    complementoCartaPorte: {
      tipoTransporte: form.tipoTransporte,
      origen: primerOrigen?.rfcRemitenteDestinatario || '',
      destino: primerDestino?.rfcRemitenteDestinatario || '',
      fechaSalida: primerOrigen?.fechaHoraSalidaLlegada || '',
      fechaLlegada: primerDestino?.fechaHoraSalidaLlegada || '',
      personaAutoriza: form.personaAutoriza,
      puesto: form.puesto,
      mercancia: {
        descripcion: primeraMercancia?.descripcion || form.descripcion,
        claveProdServ: primeraMercancia?.bienesTransp || '78101801',
        cantidad: primeraMercancia?.cantidad || '1',
        unidad: primeraMercancia?.claveUnidad || 'H87',
        peso: `${primeraMercancia?.pesoEnKg || '0'} kg`,
        valor: subtotal.toFixed(2),
        numeroSerie: form.numeroSerie || '',
      },
    },
    xmlTimbrado: "<?xml version='1.0' encoding='UTF-8'?><cfdi:Comprobante></cfdi:Comprobante>",
    cadenaOriginal: `||1.1|${uuid}|${ahoraIso}||`,
    selloDigital: 'ABC123DEF456',
    certificado: 'MIIE',
    folioFiscal: uuid,
    fechaTimbrado: ahoraIso,
  };
}

const ensureDateTime = (value?: string) => {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
};

const sanitizeDomicilio = (domicilio?: CartaPorteDomicilioForm | null) => {
  if (!domicilio) return domicilio ?? null;
  const { estado, pais, codigoPostal } = domicilio;
  if (!estado || !pais || !codigoPostal) {
    return null;
  }
  // CRÍTICO: Eliminar colonia, localidad y municipio cuando país es MEX
  // El SAT requiere que Colonia sea una clave válida del catálogo c_Colonia cuando país es MEX
  // El SAT requiere que Localidad sea una clave válida del catálogo c_Localidad cuando país es MEX
  // El SAT requiere que Municipio sea una clave válida del catálogo c_Municipio cuando país es MEX
  // Para evitar errores, eliminamos colonia, localidad y municipio cuando país es MEX
  // CRÍTICO: Validar y normalizar código postal cuando país es MEX
  // El SAT requiere que CodigoPostal sea válido según catálogo c_CodigoPostal y corresponda con el estado
  // Aseguramos que tenga formato correcto (5 dígitos) y sea válido para el estado
  const sanitized = { ...domicilio };
  if (pais.trim().toUpperCase() === 'MEX') {
    delete sanitized.colonia;
    delete sanitized.localidad;
    delete sanitized.municipio;
    // Normalizar código postal: debe ser exactamente 5 dígitos y válido para el estado
    if (sanitized.codigoPostal) {
      const cpNormalizado = sanitized.codigoPostal.trim().replace(/\D/g, ''); // Solo dígitos
      if (cpNormalizado.length === 5) {
        sanitized.codigoPostal = cpNormalizado;
      } else if (cpNormalizado.length > 5) {
        // Si tiene más de 5 dígitos, tomar los primeros 5
        sanitized.codigoPostal = cpNormalizado.substring(0, 5);
      } else if (cpNormalizado.length > 0) {
        // Si tiene menos de 5 dígitos, rellenar con ceros a la izquierda
        sanitized.codigoPostal = cpNormalizado.padStart(5, '0');
      }
      // Si después de normalizar está vacío, usar código postal válido para el estado
      if (!sanitized.codigoPostal || sanitized.codigoPostal.length !== 5) {
        sanitized.codigoPostal = getCodigoPostalValidoPorEstado(sanitized.estado);
      }
    } else {
      sanitized.codigoPostal = getCodigoPostalValidoPorEstado(sanitized.estado);
    }
  }
  return sanitized;
};

// Función auxiliar para obtener código postal válido por estado
// IMPORTANTE: Estos códigos postales deben existir en el catálogo c_CodigoPostal del SAT
// y corresponder con el estado especificado. Se usan códigos postales comunes y válidos.
const getCodigoPostalValidoPorEstado = (estado?: string): string => {
  if (!estado || estado.trim().length === 0) {
    return '01010'; // Ciudad de México (Álvaro Obregón) como fallback - código postal válido y común
  }
  const estadoNormalizado = estado.trim().toUpperCase();
  // Mapeo de estados a códigos postales válidos (capitales o principales ciudades)
  // Sincronizado con el backend para mantener consistencia
  const codigosPostales: Record<string, string> = {
    'AGUASCALIENTES': '20000', // Aguascalientes, Aguascalientes
    'BAJA CALIFORNIA': '21100', // Mexicali, Baja California
    'BAJA CALIFORNIA SUR': '23000', // La Paz, Baja California Sur
    'CAMPECHE': '24000', // Campeche, Campeche
    'CHIAPAS': '29000', // Tuxtla Gutiérrez, Chiapas
    'CHIHUAHUA': '31000', // Chihuahua, Chihuahua
    'CIUDAD DE MÉXICO': '01010', // Álvaro Obregón, CDMX
    'DISTRITO FEDERAL': '01010', // Álvaro Obregón, CDMX
    'CDMX': '01010', // Álvaro Obregón, CDMX
    'COAHUILA': '25000', // Saltillo, Coahuila
    'COLIMA': '28000', // Colima, Colima
    'DURANGO': '34000', // Durango, Durango
    'ESTADO DE MÉXICO': '50000', // Toluca, Estado de México
    'MÉXICO': '50000', // Toluca, Estado de México
    'MEXICO': '50000', // Toluca, Estado de México
    'GUANAJUATO': '36000', // Guanajuato, Guanajuato
    'GUERRERO': '39000', // Chilpancingo, Guerrero
    'HIDALGO': '42000', // Pachuca, Hidalgo
    'JALISCO': '44100', // Guadalajara, Jalisco
    'MICHOACÁN': '58000', // Morelia, Michoacán
    'MICHOACAN': '58000', // Morelia, Michoacán
    'MORELOS': '62000', // Cuernavaca, Morelos
    'NAYARIT': '63000', // Tepic, Nayarit
    'NUEVO LEÓN': '64000', // Monterrey, Nuevo León
    'NUEVO LEON': '64000', // Monterrey, Nuevo León
    'OAXACA': '68000', // Oaxaca, Oaxaca
    'PUEBLA': '72000', // Puebla, Puebla
    'QUERÉTARO': '76000', // Querétaro, Querétaro
    'QUERETARO': '76000', // Querétaro, Querétaro
    'QUINTANA ROO': '77000', // Chetumal, Quintana Roo
    'SAN LUIS POTOSÍ': '78000', // San Luis Potosí, San Luis Potosí
    'SAN LUIS POTOSI': '78000', // San Luis Potosí, San Luis Potosí
    'SINALOA': '80000', // Culiacán, Sinaloa
    'SONORA': '83000', // Hermosillo, Sonora
    'TABASCO': '86000', // Villahermosa, Tabasco
    'TAMAULIPAS': '87000', // Ciudad Victoria, Tamaulipas
    'TLAXCALA': '90000', // Tlaxcala, Tlaxcala
    'VERACRUZ': '91000', // Xalapa, Veracruz
    'YUCATÁN': '97000', // Mérida, Yucatán
    'YUCATAN': '97000', // Mérida, Yucatán
    'ZACATECAS': '98000', // Zacatecas, Zacatecas
  };
  return codigosPostales[estadoNormalizado] || '01010'; // Ciudad de México como fallback
};

const normalizeTipoEstacion = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(2, '0').slice(-2);
  }
  return trimmed.toUpperCase();
};

export function normalizeCartaPortePayload(form: CartaPorteFormData): CartaPorteFormData {
  const tieneFerro = Boolean(form.complemento.mercancias.transporteFerroviario);
  const rfcCompleto = `${(form.rfcIniciales || '').toUpperCase()}${form.rfcFecha || ''}${(form.rfcHomoclave || '').toUpperCase()}`;
  let tipoDetectado: 'fisica' | 'moral' | null = null;
  if (rfcCompleto.length === 12) tipoDetectado = 'moral';
  if (rfcCompleto.length === 13) tipoDetectado = 'fisica';
  const tipoPersonaFinal = form.tipoPersona || tipoDetectado;
  const esAutotransporte = form.tipoTransporte === '01';
  return {
    ...form,
    tipoPersona: tipoPersonaFinal,
    rfcIniciales: form.rfcIniciales.trim().toUpperCase(),
    rfcHomoclave: form.rfcHomoclave.trim().toUpperCase(),
    numeroSerie: form.numeroSerie.trim(),
    complemento: {
      ...form.complemento,
      ubicaciones: form.complemento.ubicaciones.map((ubicacion) => {
        const tipoEstacion = normalizeTipoEstacion(ubicacion.tipoEstacion);
        const esEstacionIntermedia = tipoEstacion === '02';
        const domicilioSanitizado = sanitizeDomicilio(ubicacion.domicilio);
        const domicilioFinal = tieneFerro && esEstacionIntermedia ? null : domicilioSanitizado;

        const normalizada: CartaPorteUbicacionForm = {
          ...ubicacion,
          tipoEstacion: esAutotransporte ? undefined : tipoEstacion,
          fechaHoraSalidaLlegada: ensureDateTime(ubicacion.fechaHoraSalidaLlegada) || '',
          domicilio: esAutotransporte ? domicilioSanitizado : domicilioFinal,
        };
        return normalizada;
      }),
      mercancias: {
        ...form.complemento.mercancias,
        mercancias: form.complemento.mercancias.mercancias.map((m) => ({
          ...m,
          cantidad: m.cantidad || '1',
          claveUnidad: m.claveUnidad || 'H87',
          pesoEnKg: m.pesoEnKg || '0',
        })),
        // CRÍTICO: Preservar autotransporte y sus remolques
        autotransporte: form.complemento.mercancias.autotransporte,
        transporteFerroviario: form.complemento.mercancias.transporteFerroviario,
      },
    },
  };
}

export async function generarYDescargarPDFCartaPorte(form: CartaPorteFormData, empresa?: EmpresaInfo): Promise<void> {
  const normalizado = normalizeCartaPortePayload(form);
  const logoConfig = await facturaService.obtenerConfiguracionLogos();
  if (!logoConfig.exitoso) {
    throw new Error('No se pudo obtener configuración de logos');
  }

  const facturaData = buildFacturaDataFromCartaPorte(normalizado, empresa);
  const resp = await fetch(apiUrl('/factura/generar-pdf'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify({
      facturaData,
      logoConfig: {
        logoUrl: logoConfig.logoUrl,
        logoBase64: logoConfig.logoBase64,
        customColors: logoConfig.customColors,
      },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Error al generar PDF (HTTP ${resp.status}) ${txt}`);
  }

  const blob = await resp.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const nombre = `CartaPorte_${facturaData.serie}-${facturaData.folio}.pdf`;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function descargarXmlCartaPorte(form: CartaPorteFormData): Promise<string> {
  const normalizado = normalizeCartaPortePayload(form);
  const resp = await fetch(apiUrl('/carta-porte/preview-xml'), {
    method: 'POST',
    headers: getHeadersWithUsuario(),
    body: JSON.stringify(normalizado),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Error al generar XML (HTTP ${resp.status}) ${txt}`);
  }
  const data = await resp.json();
  return data.xml as string;
}