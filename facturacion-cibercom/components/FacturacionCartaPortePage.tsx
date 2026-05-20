import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';
import { ComprobanteAccionesBar } from './ComprobanteAccionesBar';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { TextareaField } from './TextareaField';
import { SelectField } from './SelectField';
import { useEmpresa } from '../context/EmpresaContext';
import { apiUrl, getHeadersWithUsuario } from '../services/api';
import { correoService } from '../services/correoService';
import { facturaService } from '../services/facturaService';
import { EnviarWhatsAppModal } from './EnviarWhatsAppModal';
import {
  WHATSAPP_MENSAJE_BASE_CARTA_PORTE,
  construirMensajeWhatsAppCartaPorte,
} from '../constants/whatsappFacturaMensajeBase';

// Interfaces según XSD CartaPorte31-2.xml
interface DomicilioForm {
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  estado: string;
  pais: string;
  codigoPostal: string;
}

interface UbicacionForm {
  tipoUbicacion: 'Origen' | 'Destino' | 'Intermedia';
  idUbicacion?: string;
  rfcRemitenteDestinatario: string;
  nombreRemitenteDestinatario?: string;
  fechaHoraSalidaLlegada: string;
  tipoEstacion?: string;
  distanciaRecorrida?: string;
  domicilio?: DomicilioForm | null;
}

interface MercanciaForm {
  bienesTransp: string;
  descripcion: string;
  cantidad: string;
  claveUnidad: string;
  pesoEnKg: string;
  valorMercancia?: string;
  moneda?: string;
}

interface AutotransporteForm {
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
  };
  remolques: Array<{ subTipoRem: string; placa: string }>;
}

interface CarroForm {
  tipoCarro: string;
  matriculaCarro: string;
  guiaCarro: string;
  toneladasNetasCarro: string;
}

interface TransporteFerroviarioForm {
  tipoDeServicio: string;
  tipoDeTrafico: string;
  nombreAseg?: string;
  numPolizaSeguro?: string;
  carros: CarroForm[];
}

interface FiguraForm {
  tipoFigura: string;
  nombreFigura: string;
  rfcFigura?: string;
  numLicencia?: string;
  domicilio?: DomicilioForm | null;
}

interface CartaPorteFormData {
  // Datos del receptor
  rfcIniciales: string;
  rfcFecha: string;
  rfcHomoclave: string;
  correoElectronico: string;
  telefono: string;
  razonSocial: string;
  nombre: string;
  paterno: string;
  materno: string;
  pais: string;
  noRegistroIdentidadTributaria: string;
  domicilioFiscal: string;
  regimenFiscal: string;
  usoCfdi: string;
  tipoPersona: 'fisica' | 'moral' | null;
  
  // Información general
  descripcion: string;
  fechaInformacion: string;
  numeroSerie: string;
  precio: string;
  personaAutoriza: string;
  puesto: string;
  tipoTransporte: '01' | '04';
  
  // Complemento Carta Porte
  complemento: {
    version: '3.1';
    transpInternac: 'No';
    totalDistRec: string;
    ubicaciones: UbicacionForm[];
    mercancias: {
      pesoBrutoTotal: string;
      unidadPeso: string;
      numTotalMercancias: string;
      mercancias: MercanciaForm[];
      autotransporte?: AutotransporteForm;
      transporteFerroviario?: TransporteFerroviarioForm;
    };
    figuraTransporte: {
      tiposFigura: FiguraForm[];
    };
  };
}

const TIPO_TRANSPORTE_OPTIONS = [
  { value: '01', label: 'Autotransporte' },
  { value: '04', label: 'Transporte ferroviario' },
];

const SUB_TIPO_REM_OPTIONS = Array.from({ length: 32 }, (_, i) => ({
  value: `CTR${String(i + 1).padStart(3, '0')}`,
  label: `CTR${String(i + 1).padStart(3, '0')}`,
}));

const TIPO_ESTACION_OPTIONS = [
  { value: '01', label: '01 - Estación de origen' },
  { value: '02', label: '02 - Estación intermedia' },
  { value: '03', label: '03 - Estación destino' },
];

const nowLocal = () => new Date().toISOString().slice(0, 16);

const createInitialFormData = (): CartaPorteFormData => ({
  rfcIniciales: '',
  rfcFecha: '',
  rfcHomoclave: '',
  correoElectronico: '',
  telefono: '',
  razonSocial: '',
  nombre: '',
  paterno: '',
  materno: '',
  pais: 'México',
  noRegistroIdentidadTributaria: '',
  domicilioFiscal: '45638',
  regimenFiscal: '605', // Sueldos y Salarios e Ingresos Asimilados a Salarios
  usoCfdi: 'G01', // Adquisición de mercancías
  tipoPersona: null,
  descripcion: '',
  fechaInformacion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  numeroSerie: '',
  precio: '',
  personaAutoriza: '',
  puesto: '',
  tipoTransporte: '01',
  complemento: {
    version: '3.1',
    transpInternac: 'No',
    totalDistRec: '',
    ubicaciones: [
      {
        tipoUbicacion: 'Origen',
        idUbicacion: 'OR000001',
        rfcRemitenteDestinatario: 'CUSC850516316',
        fechaHoraSalidaLlegada: nowLocal(),
        tipoEstacion: '01',
        domicilio: {
          estado: 'Jalisco',
          pais: 'MEX',
          codigoPostal: '45638',
        },
      },
      {
        tipoUbicacion: 'Destino',
        idUbicacion: 'DE000001',
        rfcRemitenteDestinatario: 'CUSC850516316',
        fechaHoraSalidaLlegada: nowLocal(),
        tipoEstacion: '03',
        domicilio: {
          estado: 'Jalisco',
          pais: 'MEX',
          codigoPostal: '45638',
        },
      },
    ],
    mercancias: {
      pesoBrutoTotal: '0.001',
      unidadPeso: 'KGM',
      numTotalMercancias: '1',
      mercancias: [
        {
          bienesTransp: '78101801',
          descripcion: 'Servicio de transporte',
          cantidad: '1.000000',
          claveUnidad: 'H87',
          pesoEnKg: '0.001',
        },
      ],
      autotransporte: {
        permSct: '',
        numPermisoSct: '',
        identificacionVehicular: {
          configVehicular: 'VL', // VL = Vehículo ligero (no requiere remolque)
          pesoBrutoVehicular: '',
          placaVm: '',
          anioModeloVm: '',
        },
        seguros: {
          aseguraRespCivil: '',
          polizaRespCivil: '',
        },
        remolques: [],
      },
    },
    figuraTransporte: {
      tiposFigura: [
        {
          tipoFigura: '01',
          nombreFigura: '',
          rfcFigura: 'CUSC850516316',
          domicilio: {
            estado: 'Jalisco',
            pais: 'MEX',
            codigoPostal: '45638',
          },
        },
      ],
    },
  },
});


export const FacturacionCartaPortePage: React.FC = () => {
  const { empresaInfo } = useEmpresa();
  const [formData, setFormData] = useState<CartaPorteFormData>(createInitialFormData);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [guardandoBD, setGuardandoBD] = useState(false);
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'moral' | null>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      razonSocial: empresaInfo?.nombre || prev.razonSocial,
      complemento: {
        ...prev.complemento,
        ubicaciones: prev.complemento.ubicaciones.map((u, idx) =>
          idx === 0
            ? {
                ...u,
                rfcRemitenteDestinatario: empresaInfo?.rfc || u.rfcRemitenteDestinatario,
                nombreRemitenteDestinatario: empresaInfo?.nombre || u.nombreRemitenteDestinatario,
              }
            : u
        ),
      },
    }));
  }, [empresaInfo]);

  useEffect(() => {
    const rfc = `${formData.rfcIniciales}${formData.rfcFecha}${formData.rfcHomoclave}`.trim().toUpperCase();
    let nuevoTipo: 'fisica' | 'moral' | null = null;
    if (rfc.length === 12) nuevoTipo = 'moral';
    if (rfc.length === 13) nuevoTipo = 'fisica';
    if (nuevoTipo !== tipoPersona) {
      setTipoPersona(nuevoTipo);
      setFormData((prev) => {
        const next = { ...prev, tipoPersona: nuevoTipo };
        if (nuevoTipo === 'moral') {
          next.nombre = '';
          next.paterno = '';
          next.materno = '';
        } else if (nuevoTipo === 'fisica') {
          next.razonSocial = '';
        }
        return next;
      });
    }
  }, [formData.rfcIniciales, formData.rfcFecha, formData.rfcHomoclave, tipoPersona]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateUbicacion = (index: number, updates: Partial<UbicacionForm>) => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        ubicaciones: prev.complemento.ubicaciones.map((u, idx) => (idx === index ? { ...u, ...updates } : u)),
      },
    }));
  };

  const addUbicacion = () => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        ubicaciones: [
          ...prev.complemento.ubicaciones,
          {
            tipoUbicacion: 'Intermedia',
            idUbicacion: `UBI-${Date.now()}`,
            rfcRemitenteDestinatario: '',
            fechaHoraSalidaLlegada: nowLocal(),
            tipoEstacion: '02',
            domicilio: null,
          },
        ],
      },
    }));
  };

  const removeUbicacion = (index: number) => {
    if (formData.complemento.ubicaciones.length <= 2) return;
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        ubicaciones: prev.complemento.ubicaciones.filter((_, idx) => idx !== index),
      },
    }));
  };

  const updateMercancia = (index: number, updates: Partial<MercanciaForm>) => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          mercancias: prev.complemento.mercancias.mercancias.map((m, idx) => (idx === index ? { ...m, ...updates } : m)),
        },
      },
    }));
  };

  const addMercancia = () => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          mercancias: [
            ...prev.complemento.mercancias.mercancias,
            {
              bienesTransp: '',
              descripcion: '',
              cantidad: '1',
              claveUnidad: 'H87',
              pesoEnKg: '0',
            },
          ],
        },
      },
    }));
  };

  const removeMercancia = (index: number) => {
    if (formData.complemento.mercancias.mercancias.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          mercancias: prev.complemento.mercancias.mercancias.filter((_, idx) => idx !== index),
        },
      },
    }));
  };

  const updateAutotransporte = (updates: Partial<AutotransporteForm>) => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          autotransporte: { ...prev.complemento.mercancias.autotransporte!, ...updates },
        },
      },
    }));
  };

  const updateTransporteFerroviario = (updates: Partial<TransporteFerroviarioForm>) => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          transporteFerroviario: { ...prev.complemento.mercancias.transporteFerroviario!, ...updates },
        },
      },
    }));
  };

  const updateFigura = (index: number, updates: Partial<FiguraForm>) => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        figuraTransporte: {
          tiposFigura: prev.complemento.figuraTransporte.tiposFigura.map((f, idx) => (idx === index ? { ...f, ...updates } : f)),
        },
      },
    }));
  };

  const addFigura = () => {
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        figuraTransporte: {
          tiposFigura: [
            ...prev.complemento.figuraTransporte.tiposFigura,
            {
              tipoFigura: '01',
              nombreFigura: '',
              domicilio: {
                estado: 'Jalisco',
                pais: 'MEX',
                codigoPostal: '44100',
              },
            },
          ],
        },
      },
    }));
  };

  const addRemolque = () => {
    if (!formData.complemento.mercancias.autotransporte) return;
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          autotransporte: {
            ...prev.complemento.mercancias.autotransporte!,
            remolques: [
              ...prev.complemento.mercancias.autotransporte!.remolques,
              {
                subTipoRem: '',
                placa: '',
              },
            ],
          },
        },
      },
    }));
  };

  const removeRemolque = (index: number) => {
    if (!formData.complemento.mercancias.autotransporte) return;
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        mercancias: {
          ...prev.complemento.mercancias,
          autotransporte: {
            ...prev.complemento.mercancias.autotransporte!,
            remolques: prev.complemento.mercancias.autotransporte!.remolques.filter((_, idx) => idx !== index),
          },
        },
      },
    }));
  };

  const removeFigura = (index: number) => {
    if (formData.complemento.figuraTransporte.tiposFigura.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      complemento: {
        ...prev.complemento,
        figuraTransporte: {
          tiposFigura: prev.complemento.figuraTransporte.tiposFigura.filter((_, idx) => idx !== index),
        },
      },
    }));
  };

  const handleTipoTransporteChange = (value: string) => {
    setFormData((prev) => {
      const next = { ...prev, tipoTransporte: value as '01' | '04' };
      if (value === '01') {
        if (!next.complemento.mercancias.autotransporte) {
          next.complemento.mercancias.autotransporte = {
            permSct: '',
            numPermisoSct: '',
            identificacionVehicular: {
              configVehicular: 'VL', // VL = Vehículo ligero (no requiere remolque)
              pesoBrutoVehicular: '',
              placaVm: '',
              anioModeloVm: '',
            },
            seguros: {
              aseguraRespCivil: '',
              polizaRespCivil: '',
            },
            remolques: [],
          };
        }
        next.complemento.mercancias.transporteFerroviario = undefined;
      } else if (value === '04') {
        if (!next.complemento.mercancias.transporteFerroviario) {
          next.complemento.mercancias.transporteFerroviario = {
            tipoDeServicio: 'TS01',
            tipoDeTrafico: 'TT01',
            carros: [
              {
                tipoCarro: 'TC01',
                matriculaCarro: '',
                guiaCarro: '',
                toneladasNetasCarro: '',
              },
            ],
          };
        }
      }
      return next;
    });
  };

  const cargarEjemplo = () => {
    const ejemplo = createInitialFormData();
    
    // Datos del receptor de la imagen proporcionada
    ejemplo.rfcIniciales = 'CUSC';
    ejemplo.rfcFecha = '850516';
    ejemplo.rfcHomoclave = '316';
    ejemplo.correoElectronico = 'cesar.cruz@ejemplo.com';
    ejemplo.nombre = 'CESAR OSBALDO';
    ejemplo.paterno = 'CRUZ';
    ejemplo.materno = 'SOLORZANO';
    ejemplo.razonSocial = '';
    ejemplo.tipoPersona = 'fisica';
    ejemplo.pais = 'México';
    ejemplo.noRegistroIdentidadTributaria = '';
    ejemplo.domicilioFiscal = '45638'; // Código postal válido
    ejemplo.regimenFiscal = '605'; // Sueldos y Salarios e Ingresos Asimilados a Salarios
    ejemplo.usoCfdi = 'G01'; // Adquisición de mercancías
    
    // Información general
    ejemplo.descripcion = 'Servicio de transporte terrestre de productos alimenticios';
    ejemplo.fechaInformacion = new Date().toISOString().split('T')[0].replace(/-/g, '');
    ejemplo.numeroSerie = 'CP' + new Date().getFullYear() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    ejemplo.precio = '45000';
    ejemplo.personaAutoriza = 'CESAR OSBALDO CRUZ SOLORZANO';
    ejemplo.puesto = 'Coordinador de Logística';
    ejemplo.tipoTransporte = '01';
    
    // Ubicaciones con datos válidos para Finkok - usando CPs validados del catálogo SAT
    ejemplo.complemento.ubicaciones = [
      {
        tipoUbicacion: 'Origen',
        idUbicacion: 'ORIGEN1',
        rfcRemitenteDestinatario: 'CUSC850516316',
        nombreRemitenteDestinatario: empresaInfo?.nombre || 'EMPRESA DISTRIBUIDORA SA DE CV',
        fechaHoraSalidaLlegada: new Date().toISOString().slice(0, 16),
        tipoEstacion: '01',
        domicilio: {
          calle: 'Avenida Juarez',
          numeroExterior: '100',
          estado: 'Jalisco',
          pais: 'MEX',
          codigoPostal: '45638',
        },
      },
      {
        tipoUbicacion: 'Destino',
        idUbicacion: 'DESTINO1',
        rfcRemitenteDestinatario: 'CUSC850516316',
        nombreRemitenteDestinatario: 'CESAR OSBALDO CRUZ SOLORZANO',
        fechaHoraSalidaLlegada: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16),
        tipoEstacion: '03',
        distanciaRecorrida: '250.00',
        domicilio: {
          calle: 'Avenida Insurgentes',
          numeroExterior: '500',
          estado: 'Jalisco',
          pais: 'MEX',
          codigoPostal: '45638',
        },
      },
    ];
    ejemplo.complemento.totalDistRec = '250.00';
    
    // Mercancías con claves válidas del catálogo SAT para Finkok
    ejemplo.complemento.mercancias = {
      pesoBrutoTotal: '2850.500',
      unidadPeso: 'KGM',
      numTotalMercancias: '2',
      mercancias: [
        {
          bienesTransp: '78101801', // Clave válida: Servicios de autotransporte
          descripcion: 'Productos alimenticios envasados',
          cantidad: '120.500000',
          claveUnidad: 'H87', // Clave válida: Pieza
          pesoEnKg: '1450.250',
          valorMercancia: '25000',
          moneda: 'MXN',
        },
        {
          bienesTransp: '78101801',
          descripcion: 'Bebidas embotelladas',
          cantidad: '180.250000',
          claveUnidad: 'H87',
          pesoEnKg: '1400.250',
          valorMercancia: '20000',
          moneda: 'MXN',
        },
      ],
      autotransporte: {
        permSct: 'TPAF01', // Permiso válido: Autotransporte Federal
        numPermisoSct: 'SCT' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
        identificacionVehicular: {
          configVehicular: 'VL', // VL = Vehículo ligero (no requiere remolque)
          pesoBrutoVehicular: '38500.00',
          placaVm: 'ABC' + String(Math.floor(Math.random() * 1000)).padStart(3, '0') + 'X',
          anioModeloVm: String(new Date().getFullYear() - 2),
        },
        seguros: {
          aseguraRespCivil: 'GRUPO NACIONAL PROVINCIAL SA',
          polizaRespCivil: 'GNP' + String(Math.floor(Math.random() * 10000000)).padStart(10, '0'),
        },
        remolques: [],
      },
    };
    
    // Figura de transporte con datos válidos
    ejemplo.complemento.figuraTransporte = {
      tiposFigura: [
        {
          tipoFigura: '01', // Transportista
          nombreFigura: empresaInfo?.nombre || 'TRANSPORTES Y LOGISTICA INTEGRAL SA DE CV',
          rfcFigura: 'CUSC850516316',
          numLicencia: 'LT' + String(Math.floor(Math.random() * 10000000)).padStart(10, '0'),
          domicilio: {
            calle: 'Avenida Lopez Mateos',
            numeroExterior: '2500',
            estado: 'Jalisco',
            pais: 'MEX',
            codigoPostal: '45638',
          },
        },
      ],
    };
    
    setFormData(ejemplo);
    setTipoPersona('fisica');
  };

  const validarFormulario = (): boolean => {
    if (!formData.rfcIniciales || !formData.rfcFecha || !formData.rfcHomoclave) {
      alert('RFC es requerido');
      return false;
    }
    if (!formData.correoElectronico) {
      alert('Correo electrónico es requerido');
      return false;
    }
    if (tipoPersona === 'moral' && !formData.razonSocial) {
      alert('Razón social es requerida');
      return false;
    }
    if (tipoPersona === 'fisica' && (!formData.nombre || !formData.paterno)) {
      alert('Nombre y apellido paterno son requeridos');
      return false;
    }
    if (!formData.domicilioFiscal || !formData.regimenFiscal || !formData.usoCfdi) {
      alert('Complete los datos fiscales');
      return false;
    }
    if (!formData.descripcion || !formData.numeroSerie || !formData.precio) {
      alert('Complete la información general');
      return false;
    }
    if (formData.complemento.ubicaciones.length < 2) {
      alert('Capture al menos una ubicación de origen y una de destino');
      return false;
    }
    if (formData.complemento.mercancias.mercancias.length === 0) {
      alert('Capture al menos una mercancía');
      return false;
    }
    if (formData.tipoTransporte === '01' && !formData.complemento.mercancias.autotransporte) {
      alert('Complete la información de Autotransporte');
      return false;
    }
    if (formData.tipoTransporte === '04' && !formData.complemento.mercancias.transporteFerroviario) {
      alert('Complete la información de Transporte Ferroviario');
      return false;
    }
    return true;
  };

  const [uuidCartaPorteTimbrada, setUuidCartaPorteTimbrada] = useState<string>('');
  const [modalWhatsApp, setModalWhatsApp] = useState<{
    isOpen: boolean;
    facturaUuid: string;
    facturaInfo: string;
    telefonoInicial: string;
  }>({
    isOpen: false,
    facturaUuid: '',
    facturaInfo: '',
    telefonoInicial: '',
  });

  const abrirModalWhatsApp = () => {
    if (!uuidCartaPorteTimbrada?.trim()) {
      alert('Primero debes timbrar y guardar la carta porte para enviarla por WhatsApp.');
      return;
    }
    const serie = (formData.numeroSerie || '').trim();
    const facturaInfo = serie
      ? `Carta porte (serie ${serie})`
      : `Carta porte (UUID ${uuidCartaPorteTimbrada})`;
    setModalWhatsApp({
      isOpen: true,
      facturaUuid: uuidCartaPorteTimbrada,
      facturaInfo,
      telefonoInicial: (formData.telefono || '').trim(),
    });
  };

  const cerrarModalWhatsApp = () => {
    setModalWhatsApp({
      isOpen: false,
      facturaUuid: '',
      facturaInfo: '',
      telefonoInicial: '',
    });
  };

  const handleVistaPrevia = async () => {
    try {
      if (!validarFormulario()) return;
      
      // CRÍTICO: Normalizar el payload para preservar remolques y otros datos
      const { normalizeCartaPortePayload } = await import('../services/cartaPorteService');
      const formDataConVersion = { ...formData, versionCartaPorte: '3.1' as const } as any;
      const formDataNormalizado = normalizeCartaPortePayload(formDataConVersion);
      
      const payload = {
        versionComplemento: '3.1',
        rfcIniciales: formDataNormalizado.rfcIniciales,
        rfcFecha: formDataNormalizado.rfcFecha,
        rfcHomoclave: formDataNormalizado.rfcHomoclave,
        correoElectronico: formDataNormalizado.correoElectronico,
        razonSocial: formDataNormalizado.razonSocial,
        nombre: formDataNormalizado.nombre,
        paterno: formDataNormalizado.paterno,
        materno: formDataNormalizado.materno,
        domicilioFiscal: formDataNormalizado.domicilioFiscal,
        regimenFiscal: formDataNormalizado.regimenFiscal,
        usoCfdi: formDataNormalizado.usoCfdi,
        descripcion: formDataNormalizado.descripcion,
        fechaInformacion: formDataNormalizado.fechaInformacion,
        numeroSerie: formDataNormalizado.numeroSerie,
        precio: formDataNormalizado.precio,
        personaAutoriza: formDataNormalizado.personaAutoriza,
        puesto: formDataNormalizado.puesto,
        tipoTransporte: formDataNormalizado.tipoTransporte,
        tipoPersona: formDataNormalizado.tipoPersona,
        complemento: formDataNormalizado.complemento,
      };

      const response = await fetch(apiUrl('/carta-porte/preview-pdf'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error en vista previa:', error);
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar vista previa: ${mensaje}`);
    }
  };

  const handleGuardarEnBD = async () => {
    if (!validarFormulario()) return;
    try {
      setGuardandoBD(true);
      // CRÍTICO: Normalizar el payload para preservar remolques y otros datos
      const { normalizeCartaPortePayload } = await import('../services/cartaPorteService');
      const formDataConVersion = { ...formData, versionCartaPorte: '3.1' as const } as any;
      const formDataNormalizado = normalizeCartaPortePayload(formDataConVersion);
      
      const payload = {
        versionCartaPorte: '3.1',
        rfcIniciales: formDataNormalizado.rfcIniciales,
        rfcFecha: formDataNormalizado.rfcFecha,
        rfcHomoclave: formDataNormalizado.rfcHomoclave,
        correoElectronico: formDataNormalizado.correoElectronico,
        razonSocial: formDataNormalizado.razonSocial,
        nombre: formDataNormalizado.nombre,
        paterno: formDataNormalizado.paterno,
        materno: formDataNormalizado.materno,
        domicilioFiscal: formDataNormalizado.domicilioFiscal,
        regimenFiscal: formDataNormalizado.regimenFiscal,
        usoCfdi: formDataNormalizado.usoCfdi,
        descripcion: formDataNormalizado.descripcion,
        fechaInformacion: formDataNormalizado.fechaInformacion,
        numeroSerie: formDataNormalizado.numeroSerie,
        precio: formDataNormalizado.precio,
        personaAutoriza: formDataNormalizado.personaAutoriza,
        puesto: formDataNormalizado.puesto,
        tipoTransporte: formDataNormalizado.tipoTransporte,
        tipoPersona: formDataNormalizado.tipoPersona,
        complemento: formDataNormalizado.complemento,
      };
      
      const response = await fetch(apiUrl('/carta-porte/guardar'), {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      const uuidObtenido = result.uuid || '';
      
      // Guardar el UUID para evitar timbrados duplicados
      if (uuidObtenido) {
        setUuidCartaPorteTimbrada(uuidObtenido);
      }
      
      alert(`Carta Porte timbrada exitosamente\nUUID: ${uuidObtenido || 'N/A'}`);
      
      if (confirm('¿Desea enviar los archivos timbrados al correo del receptor?')) {
        handleEnviarCorreo(uuidObtenido);
      }
    } catch (err) {
      console.error('Error guardando Carta Porte:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardandoBD(false);
    }
  };

  const handleEnviarCorreo = async (uuidPrevio?: string) => {
    if (!validarFormulario()) return;
    try {
      setEnviandoCorreo(true);
      const correo = formData.correoElectronico?.trim();
      if (!correo || !correoService.validarEmail(correo)) {
        alert('Capture un correo electrónico válido');
        return;
      }

      // CRÍTICO: Normalizar el payload para preservar remolques y otros datos (siempre necesario para XML)
      const { normalizeCartaPortePayload } = await import('../services/cartaPorteService');
      const formDataConVersion = { ...formData, versionCartaPorte: '3.1' as const } as any;
      const formDataNormalizado = normalizeCartaPortePayload(formDataConVersion);

      const payload = {
        versionCartaPorte: '3.1',
        rfcIniciales: formDataNormalizado.rfcIniciales,
        rfcFecha: formDataNormalizado.rfcFecha,
        rfcHomoclave: formDataNormalizado.rfcHomoclave,
        correoElectronico: formDataNormalizado.correoElectronico,
        razonSocial: formDataNormalizado.razonSocial,
        nombre: formDataNormalizado.nombre,
        paterno: formDataNormalizado.paterno,
        materno: formDataNormalizado.materno,
        domicilioFiscal: formDataNormalizado.domicilioFiscal,
        regimenFiscal: formDataNormalizado.regimenFiscal,
        usoCfdi: formDataNormalizado.usoCfdi,
        descripcion: formDataNormalizado.descripcion,
        fechaInformacion: formDataNormalizado.fechaInformacion,
        numeroSerie: formDataNormalizado.numeroSerie,
        precio: formDataNormalizado.precio,
        personaAutoriza: formDataNormalizado.personaAutoriza,
        puesto: formDataNormalizado.puesto,
        tipoTransporte: formDataNormalizado.tipoTransporte,
        tipoPersona: formDataNormalizado.tipoPersona,
        complemento: formDataNormalizado.complemento,
      };

      // CRÍTICO: Si ya se timbró antes, usar ese UUID. NO timbrar de nuevo.
      let uuidCartaPorte = uuidPrevio || uuidCartaPorteTimbrada;
      
      if (!uuidCartaPorte || uuidCartaPorte.trim() === '') {
        const guardarResponse = await fetch(apiUrl('/carta-porte/guardar'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!guardarResponse.ok) {
          throw new Error('Error al timbrar la Carta Porte');
        }

        const guardarData = await guardarResponse.json();
        uuidCartaPorte = guardarData?.uuid || '';
        
        if (uuidCartaPorte) {
          setUuidCartaPorteTimbrada(uuidCartaPorte);
        }
      }
      
      // Usar el método correcto que genera el PDF internamente con la lógica de Carta Porte
      const asunto = `Carta Porte CP-${formData.numeroSerie}`;
      const mensaje = 'Estimado(a),\n\nAdjuntamos la Carta Porte generada.\n\nSaludos.';
      
      // El servicio obtendrá el logoBase64 desde localStorage si no se proporciona
      await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: uuidCartaPorte,
        correoReceptor: correo,
        asunto,
        mensaje,
      });

      alert('Carta Porte enviada por correo exitosamente');
    } catch (err) {
      console.error('Error enviando correo:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const handleDescargarPdfCartaPorte = async () => {
    const uuid = (uuidCartaPorteTimbrada || '').trim();
    if (!uuid) {
      alert('Primero timbra y guarda la carta porte para descargar el PDF.');
      return;
    }
    try {
      await facturaService.generarYDescargarPDF(uuid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar PDF');
    }
  };

  const handleDescargarXmlTimbrado = async () => {
    const uuid = (uuidCartaPorteTimbrada || '').trim();
    if (!uuid) {
      alert('Primero timbra y guarda la carta porte para descargar el XML.');
      return;
    }
    try {
      await facturaService.generarYDescargarXML(uuid);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar XML');
    }
  };

  return (
    <>
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Card id="guia-cp-datos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Número de Serie"
            name="numeroSerie"
            value={formData.numeroSerie}
            onChange={handleChange}
            required
          />
          <FormField
            label="Precio"
            name="precio"
            type="number"
            value={formData.precio}
            onChange={handleChange}
            required
          />
          <FormField
            label="Fecha (AAAAMMDD)"
            name="fechaInformacion"
            value={formData.fechaInformacion}
            onChange={handleChange}
            required
          />
        </div>
      </Card>

      <div id="guia-cp-datos-fiscales">
        <DatosFiscalesSection
          formData={formData}
          handleChange={handleChange}
          onRfcSearchClick={() => {}}
          mostrarRazonSocial={tipoPersona === 'moral' || tipoPersona === null}
          mostrarNombreCompleto={tipoPersona === 'fisica' || tipoPersona === null}
        />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Teléfono para WhatsApp"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="527331565237"
          />
        </div>
      </div>

      <Card id="guia-cp-info-general">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información general</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextareaField
            label="Descripción"
            name="descripcion"
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
            required
          />
          <FormField
            label="Persona que autoriza"
            name="personaAutoriza"
            value={formData.personaAutoriza}
            onChange={handleChange}
            required
          />
          <FormField
            label="Puesto"
            name="puesto"
            value={formData.puesto}
            onChange={handleChange}
            required
          />
        </div>
      </Card>

      <Card id="guia-cp-ubicaciones">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ubicaciones</h3>
        <div className="space-y-4">
          {formData.complemento.ubicaciones.map((ubicacion, index) => (
            <Card key={ubicacion.idUbicacion || index}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">
                  Ubicación {index + 1} ({ubicacion.tipoUbicacion})
                </h4>
                {formData.complemento.ubicaciones.length > 2 && (
                  <Button type="button" variant="neutral" onClick={() => removeUbicacion(index)}>
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  label="Tipo de Ubicación"
                  name={`ubicacion-tipo-${index}`}
                  value={ubicacion.tipoUbicacion}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateUbicacion(index, { tipoUbicacion: e.target.value as 'Origen' | 'Destino' | 'Intermedia' })}
                  options={[
                    { value: 'Origen', label: 'Origen' },
                    { value: 'Destino', label: 'Destino' },
                    { value: 'Intermedia', label: 'Intermedia' },
                  ]}
                />
                <FormField
                  label="ID Ubicación"
                  name={`ubicacion-id-${index}`}
                  value={ubicacion.idUbicacion || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUbicacion(index, { idUbicacion: e.target.value })}
                />
                <FormField
                  label="RFC Remitente/Destinatario"
                  name={`ubicacion-rfc-${index}`}
                  value={ubicacion.rfcRemitenteDestinatario}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUbicacion(index, { rfcRemitenteDestinatario: e.target.value })}
                  required
                />
                <FormField
                  label="Nombre"
                  name={`ubicacion-nombre-${index}`}
                  value={ubicacion.nombreRemitenteDestinatario || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUbicacion(index, { nombreRemitenteDestinatario: e.target.value })}
                />
                <FormField
                  label="Fecha / Hora"
                  type="datetime-local"
                  name={`ubicacion-fecha-${index}`}
                  value={ubicacion.fechaHoraSalidaLlegada}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUbicacion(index, { fechaHoraSalidaLlegada: e.target.value })}
                  required
                />
                {formData.tipoTransporte === '04' && (
                  <SelectField
                    label="Tipo de estación"
                    name={`ubicacion-tipoEstacion-${index}`}
                    value={ubicacion.tipoEstacion || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateUbicacion(index, { tipoEstacion: e.target.value })}
                    options={TIPO_ESTACION_OPTIONS}
                  />
                )}
                <FormField
                  label="Distancia Recorrida"
                  name={`ubicacion-distancia-${index}`}
                  type="number"
                  value={ubicacion.distanciaRecorrida || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUbicacion(index, { distanciaRecorrida: e.target.value })}
                />
              </div>
              {ubicacion.domicilio && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    label="Calle"
                    name={`dom-calle-${index}`}
                    value={ubicacion.domicilio.calle || ''}
                    onChange={(e) =>
                      updateUbicacion(index, {
                        domicilio: { ...ubicacion.domicilio!, calle: e.target.value },
                      })
                    }
                  />
                  <FormField
                    label="Estado"
                    name={`dom-estado-${index}`}
                    value={ubicacion.domicilio.estado}
                    onChange={(e) =>
                      updateUbicacion(index, {
                        domicilio: { ...ubicacion.domicilio!, estado: e.target.value },
                      })
                    }
                    required
                  />
                  <FormField
                    label="Código Postal"
                    name={`dom-cp-${index}`}
                    value={ubicacion.domicilio.codigoPostal}
                    onChange={(e) =>
                      updateUbicacion(index, {
                        domicilio: { ...ubicacion.domicilio!, codigoPostal: e.target.value },
                      })
                    }
                    required
                  />
                  <FormField
                    label="País"
                    name={`dom-pais-${index}`}
                    value={ubicacion.domicilio.pais}
                    onChange={(e) =>
                      updateUbicacion(index, {
                        domicilio: { ...ubicacion.domicilio!, pais: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button type="button" variant="neutral" onClick={addUbicacion}>
            Agregar ubicación intermedia
          </Button>
        </div>
      </Card>

      <Card id="guia-cp-mercancias">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Mercancías</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FormField
            label="Peso Bruto Total (kg)"
            name="pesoBrutoTotal"
            type="number"
            value={formData.complemento.mercancias.pesoBrutoTotal}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                complemento: {
                  ...prev.complemento,
                  mercancias: { ...prev.complemento.mercancias, pesoBrutoTotal: e.target.value },
                },
              }))
            }
          />
          <FormField
            label="Total de Mercancías"
            name="numTotalMercancias"
            type="number"
            value={formData.complemento.mercancias.numTotalMercancias}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                complemento: {
                  ...prev.complemento,
                  mercancias: { ...prev.complemento.mercancias, numTotalMercancias: e.target.value },
                },
              }))
            }
          />
        </div>
        <div className="space-y-4">
          {formData.complemento.mercancias.mercancias.map((mercancia, index) => (
            <Card key={`mercancia-${index}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Mercancía {index + 1}</h4>
                {formData.complemento.mercancias.mercancias.length > 1 && (
                  <Button type="button" variant="neutral" onClick={() => removeMercancia(index)}>
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Clave BienesTransp"
                  name={`mercancia-bienes-${index}`}
                  value={mercancia.bienesTransp}
                  onChange={(e) => updateMercancia(index, { bienesTransp: e.target.value })}
                  required
                />
                <FormField
                  label="Descripción"
                  name={`mercancia-descripcion-${index}`}
                  value={mercancia.descripcion}
                  onChange={(e) => updateMercancia(index, { descripcion: e.target.value })}
                  required
                />
                <FormField
                  label="Cantidad"
                  type="number"
                  name={`mercancia-cantidad-${index}`}
                  value={mercancia.cantidad}
                  onChange={(e) => updateMercancia(index, { cantidad: e.target.value })}
                  required
                />
                <FormField
                  label="Clave Unidad"
                  name={`mercancia-clave-${index}`}
                  value={mercancia.claveUnidad}
                  onChange={(e) => updateMercancia(index, { claveUnidad: e.target.value })}
                  required
                />
                <FormField
                  label="Peso En Kg"
                  type="number"
                  name={`mercancia-peso-${index}`}
                  value={mercancia.pesoEnKg}
                  onChange={(e) => updateMercancia(index, { pesoEnKg: e.target.value })}
                  required
                />
                <FormField
                  label="Valor Mercancía"
                  type="number"
                  name={`mercancia-valor-${index}`}
                  value={mercancia.valorMercancia || ''}
                  onChange={(e) => updateMercancia(index, { valorMercancia: e.target.value })}
                />
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button type="button" variant="neutral" onClick={addMercancia}>
            Agregar mercancía
          </Button>
        </div>
      </Card>

      <Card id="guia-cp-transporte">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SelectField
            label="Tipo de Transporte"
            name="tipoTransporte"
            value={formData.tipoTransporte}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTipoTransporteChange(e.target.value)}
            options={TIPO_TRANSPORTE_OPTIONS}
          />
        </div>
        {formData.tipoTransporte === '01' && formData.complemento.mercancias.autotransporte && (
          <div className="space-y-4">
            <h4 className="font-semibold">Autotransporte</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Permiso SCT"
                name="autotransporte-permiso"
                value={formData.complemento.mercancias.autotransporte.permSct}
                onChange={(e) => updateAutotransporte({ permSct: e.target.value })}
                required
              />
              <FormField
                label="Número Permiso SCT"
                name="autotransporte-numpermiso"
                value={formData.complemento.mercancias.autotransporte.numPermisoSct}
                onChange={(e) => updateAutotransporte({ numPermisoSct: e.target.value })}
                required
              />
              <FormField
                label="Config. Vehicular"
                name="autotransporte-config"
                value={formData.complemento.mercancias.autotransporte.identificacionVehicular.configVehicular}
                onChange={(e) =>
                  updateAutotransporte({
                    identificacionVehicular: {
                      ...formData.complemento.mercancias.autotransporte!.identificacionVehicular,
                      configVehicular: e.target.value,
                    },
                  })
                }
                required
              />
              <FormField
                label="Placa"
                name="autotransporte-placa"
                value={formData.complemento.mercancias.autotransporte.identificacionVehicular.placaVm}
                onChange={(e) =>
                  updateAutotransporte({
                    identificacionVehicular: {
                      ...formData.complemento.mercancias.autotransporte!.identificacionVehicular,
                      placaVm: e.target.value,
                    },
                  })
                }
                required
              />
              <FormField
                label="Peso Bruto Vehicular"
                type="number"
                name="autotransporte-peso"
                value={formData.complemento.mercancias.autotransporte.identificacionVehicular.pesoBrutoVehicular}
                onChange={(e) =>
                  updateAutotransporte({
                    identificacionVehicular: {
                      ...formData.complemento.mercancias.autotransporte!.identificacionVehicular,
                      pesoBrutoVehicular: e.target.value,
                    },
                  })
                }
                required
              />
              <FormField
                label="Año Modelo"
                name="autotransporte-anio"
                value={formData.complemento.mercancias.autotransporte.identificacionVehicular.anioModeloVm}
                onChange={(e) =>
                  updateAutotransporte({
                    identificacionVehicular: {
                      ...formData.complemento.mercancias.autotransporte!.identificacionVehicular,
                      anioModeloVm: e.target.value,
                    },
                  })
                }
                required
              />
              <FormField
                label="Aseguradora RC"
                name="autotransporte-aseguradora"
                value={formData.complemento.mercancias.autotransporte.seguros.aseguraRespCivil}
                onChange={(e) =>
                  updateAutotransporte({
                    seguros: {
                      ...formData.complemento.mercancias.autotransporte!.seguros,
                      aseguraRespCivil: e.target.value,
                    },
                  })
                }
                required
              />
              <FormField
                label="Póliza RC"
                name="autotransporte-poliza"
                value={formData.complemento.mercancias.autotransporte.seguros.polizaRespCivil}
                onChange={(e) =>
                  updateAutotransporte({
                    seguros: {
                      ...formData.complemento.mercancias.autotransporte!.seguros,
                      polizaRespCivil: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            {/* Sección de Remolques - Requerida cuando ConfigVehicular requiere remolque (ej: C2, C3) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold">Remolques</h5>
                <Button type="button" variant="neutral" onClick={addRemolque}>
                  Agregar remolque
                </Button>
              </div>
              {formData.complemento.mercancias.autotransporte.remolques.length === 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                  Si su ConfigVehicular requiere remolque (ej: C2, C3), debe agregar al menos un remolque.
                </p>
              )}
              <div className="space-y-3">
                {formData.complemento.mercancias.autotransporte.remolques.map((remolque, index) => (
                  <div key={`remolque-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded">
                    <SelectField
                      label="Subtipo Remolque"
                      name={`remolque-subtipo-${index}`}
                      value={remolque.subTipoRem}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        updateAutotransporte({
                          remolques: formData.complemento.mercancias.autotransporte!.remolques.map((r, idx) =>
                            idx === index ? { ...r, subTipoRem: e.target.value } : r
                          ),
                        })
                      }
                      options={SUB_TIPO_REM_OPTIONS}
                      required
                    />
                    <FormField
                      label="Placa"
                      name={`remolque-placa-${index}`}
                      value={remolque.placa}
                      onChange={(e) =>
                        updateAutotransporte({
                          remolques: formData.complemento.mercancias.autotransporte!.remolques.map((r, idx) =>
                            idx === index ? { ...r, placa: e.target.value } : r
                          ),
                        })
                      }
                      required
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="neutral"
                        onClick={() => removeRemolque(index)}
                        className="w-full"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {formData.tipoTransporte === '04' && formData.complemento.mercancias.transporteFerroviario && (
          <div className="space-y-4">
            <h4 className="font-semibold">Transporte ferroviario</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Tipo de Servicio"
                name="ferro-servicio"
                value={formData.complemento.mercancias.transporteFerroviario.tipoDeServicio}
                onChange={(e) => updateTransporteFerroviario({ tipoDeServicio: e.target.value })}
                required
              />
              <FormField
                label="Tipo de Tráfico"
                name="ferro-trafico"
                value={formData.complemento.mercancias.transporteFerroviario.tipoDeTrafico}
                onChange={(e) => updateTransporteFerroviario({ tipoDeTrafico: e.target.value })}
                required
              />
            </div>
            <h5 className="font-semibold">Carros</h5>
            <div className="space-y-3">
              {formData.complemento.mercancias.transporteFerroviario.carros.map((carro, index) => (
                <div key={`carro-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-3 rounded">
                  <FormField
                    label="Tipo Carro"
                    name={`ferro-carro-tipo-${index}`}
                    value={carro.tipoCarro}
                    onChange={(e) =>
                      updateTransporteFerroviario({
                        carros: formData.complemento.mercancias.transporteFerroviario!.carros.map((c, idx) =>
                          idx === index ? { ...c, tipoCarro: e.target.value } : c
                        ),
                      })
                    }
                    required
                  />
                  <FormField
                    label="Matrícula"
                    name={`ferro-carro-matricula-${index}`}
                    value={carro.matriculaCarro}
                    onChange={(e) =>
                      updateTransporteFerroviario({
                        carros: formData.complemento.mercancias.transporteFerroviario!.carros.map((c, idx) =>
                          idx === index ? { ...c, matriculaCarro: e.target.value } : c
                        ),
                      })
                    }
                    required
                  />
                  <FormField
                    label="Guía"
                    name={`ferro-carro-guia-${index}`}
                    value={carro.guiaCarro}
                    onChange={(e) =>
                      updateTransporteFerroviario({
                        carros: formData.complemento.mercancias.transporteFerroviario!.carros.map((c, idx) =>
                          idx === index ? { ...c, guiaCarro: e.target.value } : c
                        ),
                      })
                    }
                    required
                  />
                  <FormField
                    label="Toneladas Netas"
                    type="number"
                    name={`ferro-carro-toneladas-${index}`}
                    value={carro.toneladasNetasCarro}
                    onChange={(e) =>
                      updateTransporteFerroviario({
                        carros: formData.complemento.mercancias.transporteFerroviario!.carros.map((c, idx) =>
                          idx === index ? { ...c, toneladasNetasCarro: e.target.value } : c
                        ),
                      })
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card id="guia-cp-figuras">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Figuras de transporte</h3>
        <div className="space-y-4">
          {formData.complemento.figuraTransporte.tiposFigura.map((figura, index) => (
            <Card key={`figura-${index}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Figura {index + 1}</h4>
                {formData.complemento.figuraTransporte.tiposFigura.length > 1 && (
                  <Button type="button" variant="neutral" onClick={() => removeFigura(index)}>
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Tipo Figura"
                  name={`figura-tipo-${index}`}
                  value={figura.tipoFigura}
                  onChange={(e) => updateFigura(index, { tipoFigura: e.target.value })}
                  required
                />
                <FormField
                  label="Nombre"
                  name={`figura-nombre-${index}`}
                  value={figura.nombreFigura}
                  onChange={(e) => updateFigura(index, { nombreFigura: e.target.value })}
                  required
                />
                <FormField
                  label="RFC"
                  name={`figura-rfc-${index}`}
                  value={figura.rfcFigura || ''}
                  onChange={(e) => updateFigura(index, { rfcFigura: e.target.value })}
                />
                <FormField
                  label="Número Licencia"
                  name={`figura-licencia-${index}`}
                  value={figura.numLicencia || ''}
                  onChange={(e) => updateFigura(index, { numLicencia: e.target.value })}
                />
              </div>
              {figura.domicilio && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    label="Calle"
                    name={`figura-calle-${index}`}
                    value={figura.domicilio.calle || ''}
                    onChange={(e) =>
                      updateFigura(index, {
                        domicilio: { ...figura.domicilio!, calle: e.target.value },
                      })
                    }
                  />
                  <FormField
                    label="Estado"
                    name={`figura-estado-${index}`}
                    value={figura.domicilio.estado}
                    onChange={(e) =>
                      updateFigura(index, {
                        domicilio: { ...figura.domicilio!, estado: e.target.value },
                      })
                    }
                    required
                  />
                  <FormField
                    label="Código Postal"
                    name={`figura-cp-${index}`}
                    value={figura.domicilio.codigoPostal}
                    onChange={(e) =>
                      updateFigura(index, {
                        domicilio: { ...figura.domicilio!, codigoPostal: e.target.value },
                      })
                    }
                    required
                  />
                  <FormField
                    label="País"
                    name={`figura-pais-${index}`}
                    value={figura.domicilio.pais}
                    onChange={(e) =>
                      updateFigura(index, {
                        domicilio: { ...figura.domicilio!, pais: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button type="button" variant="neutral" onClick={addFigura}>
            Agregar figura
          </Button>
        </div>
      </Card>

      <ComprobanteAccionesBar
        id="guia-cp-generar"
        className="mt-4"
        showCancel={false}
        extraRow1Left={
          <Button type="button" variant="neutral" onClick={cargarEjemplo} disabled={guardandoBD || enviandoCorreo} className="w-full sm:w-auto whitespace-nowrap">
            Cargar ejemplo
          </Button>
        }
        onVistaPrevia={handleVistaPrevia}
        vistaPreviaDisabled={guardandoBD || enviandoCorreo}
        onGenerar={handleGuardarEnBD}
        generarLabel={guardandoBD ? 'Emitiendo…' : 'Emitir carta porte'}
        generarDisabled={guardandoBD || enviandoCorreo}
        tieneUuid={Boolean((uuidCartaPorteTimbrada || '').trim())}
        postEmisionHint="Después de emitir la carta porte"
        onDescargarXml={handleDescargarXmlTimbrado}
        onDescargarPdf={handleDescargarPdfCartaPorte}
        onEnviarCorreo={() => void handleEnviarCorreo()}
        onEnviarWhatsApp={abrirModalWhatsApp}
        correoDisabled={enviandoCorreo || guardandoBD}
        whatsappDisabled={guardandoBD || enviandoCorreo}
      />

        </form>

    <EnviarWhatsAppModal
      isOpen={modalWhatsApp.isOpen}
      onClose={cerrarModalWhatsApp}
      facturaUuid={modalWhatsApp.facturaUuid}
      facturaInfo={modalWhatsApp.facturaInfo}
      telefonoInicial={modalWhatsApp.telefonoInicial}
      tituloModal="Enviar Carta Porte por WhatsApp"
      etiquetaDocumento="Carta porte"
      mensajeBase={WHATSAPP_MENSAJE_BASE_CARTA_PORTE}
      construirMensaje={construirMensajeWhatsAppCartaPorte}
      notaArchivos="Se enviarán el PDF y el XML de la carta porte al número indicado."
    />
    </>
  );
};
