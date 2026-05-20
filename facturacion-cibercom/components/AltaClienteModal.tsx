import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { XMarkIcon } from './icons/XMarkIcon';
import { PAIS_OPTIONS, REGIMEN_FISCAL_OPTIONS, USO_CFDI_OPTIONS } from '../constants';
import { satValidationService } from '../services/satValidationService';
import { codigoPostalService } from '../services/codigoPostalService';

interface AltaClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: ClienteFormData) => Promise<void>;
  rfcInicial?: string;
}

export interface ClienteFormData {
  rfc: string;
  razonSocial: string;
  tipoPersona: 'fisica' | 'moral';
  esNacional: boolean;
  esExtranjero: boolean;
  esPolitico: boolean;
  codigoPostal: string;
  pais: string;
  estado: string;
  municipio: string;
  colonia: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correoElectronico: string;
  telefono?: string;
  regimenFiscal: string;
  usoCfdi: string;
  declaraIeps: boolean;
}


const initialFormData: ClienteFormData = {
  rfc: '',
  razonSocial: '',
  tipoPersona: 'moral',
  esNacional: true,
  esExtranjero: false,
  esPolitico: false,
  codigoPostal: '',
  pais: 'MEX',
  estado: '',
  municipio: '',
  colonia: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  correoElectronico: '',
  telefono: '',
  regimenFiscal: REGIMEN_FISCAL_OPTIONS[0].value,
  usoCfdi: USO_CFDI_OPTIONS[0].value,
  declaraIeps: false,
};

export const AltaClienteModal: React.FC<AltaClienteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rfcInicial = '',
}) => {
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [colonias, setColonias] = useState<string[]>([]);
  const [cargandoCP, setCargandoCP] = useState(false);
  const [validandoSAT, setValidandoSAT] = useState(false);
  const [errorSAT, setErrorSAT] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen && rfcInicial) {
      setFormData(prev => ({ ...prev, rfc: rfcInicial.toUpperCase() }));
      detectarTipoPersona(rfcInicial);
    } else if (!isOpen) {
      // Resetear formulario al cerrar
      setFormData(initialFormData);
      setColonias([]);
      setErrorSAT(null);
    }
  }, [isOpen, rfcInicial]);

  const detectarTipoPersona = (rfc: string) => {
    const rfcUpper = rfc.toUpperCase().trim();
    if (rfcUpper.length === 12) {
      setFormData(prev => ({ ...prev, tipoPersona: 'moral' }));
    } else if (rfcUpper.length === 13) {
      setFormData(prev => ({ ...prev, tipoPersona: 'fisica' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Detectar tipo de persona cuando cambia el RFC
    if (name === 'rfc') {
      detectarTipoPersona(value);
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => {
      const updates: Partial<ClienteFormData> = { [name]: checked };
      
      // Si es extranjero, no puede ser nacional
      if (name === 'esExtranjero' && checked) {
        updates.esNacional = false;
      }
      // Si es nacional, no puede ser extranjero
      if (name === 'esNacional' && checked) {
        updates.esExtranjero = false;
      }
      
      return { ...prev, ...updates };
    });
  };

  // Validar RFC con SAT (solo para nacionales)
  const validarRFCConSAT = async (rfc: string): Promise<boolean> => {
    if (!formData.esNacional) return true; // No validar si es extranjero
    
    setValidandoSAT(true);
    setErrorSAT(null);
    
    try {
      // El backend requiere nombre, rfc, codigoPostal y regimenFiscal
      const nombreParaValidar = formData.tipoPersona === 'moral' 
        ? formData.razonSocial 
        : `${formData.nombre || ''} ${formData.apellidoPaterno || ''} ${formData.apellidoMaterno || ''}`.trim();
      
      const response = await satValidationService.validarDatosSat({
        nombre: nombreParaValidar || 'Validación RFC',
        rfc: rfc.toUpperCase().trim(),
        codigoPostal: formData.codigoPostal || '00000',
        regimenFiscal: formData.regimenFiscal || '601',
      });
      
      if (response.valido) {
        // Si hay datos validados del SAT, auto-rellenar
        if (response.datosValidados) {
          setFormData(prev => ({
            ...prev,
            regimenFiscal: response.datosValidados?.regimenFiscal || prev.regimenFiscal,
            codigoPostal: response.datosValidados?.codigoPostal || prev.codigoPostal,
          }));
        }
        setValidandoSAT(false);
        return true;
      } else {
        const mensajeError = response.errores && response.errores.length > 0
          ? response.errores.join(', ')
          : (response.mensaje || 'El RFC no es válido según el SAT o los datos no coinciden');
        setErrorSAT(mensajeError);
        setValidandoSAT(false);
        return false;
      }
    } catch (error) {
      console.error('Error al validar RFC con SAT:', error);
      setErrorSAT('Error al conectar con el servicio de validación del SAT');
      setValidandoSAT(false);
      return false;
    }
  };

  // Cargar datos de código postal
  const cargarDatosCP = async (cp: string) => {
    if (!cp || cp.length !== 5) {
      setColonias([]);
      setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
      return;
    }

    setCargandoCP(true);
    try {
      const data = await codigoPostalService.obtenerDatosCP(cp);
      if (data) {
        setFormData(prev => ({
          ...prev,
          estado: data.estado || '',
          municipio: data.municipio || '',
          colonia: '',
        }));
        setColonias(data.colonias || []);
      } else {
        setColonias([]);
        setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
      }
    } catch (error) {
      console.error('Error al cargar código postal:', error);
      setColonias([]);
    } finally {
      setCargandoCP(false);
    }
  };

  // Manejar cambio de código postal
  const handleCodigoPostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData(prev => ({ ...prev, codigoPostal: cp }));
    
    if (cp.length === 5) {
      cargarDatosCP(cp);
    } else {
      setColonias([]);
      setFormData(prev => ({ ...prev, estado: '', municipio: '', colonia: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.rfc.trim()) {
      alert('El RFC es obligatorio');
      return;
    }

    if (!formData.razonSocial.trim() && formData.tipoPersona === 'moral') {
      alert('La Razón Social es obligatoria para personas morales');
      return;
    }

    if (!formData.codigoPostal || formData.codigoPostal.length !== 5) {
      alert('El Código Postal es obligatorio y debe tener 5 dígitos');
      return;
    }

    if (!formData.correoElectronico.trim()) {
      alert('El Correo Electrónico es obligatorio');
      return;
    }

    // Validar RFC con SAT si es nacional
    if (formData.esNacional) {
      const rfcValido = await validarRFCConSAT(formData.rfc);
      if (!rfcValido) {
        return; // El error ya se muestra en el estado
      }
    }

    // Si es extranjero, usar RFC genérico
    if (formData.esExtranjero) {
      setFormData(prev => ({ ...prev, rfc: 'XEXX010101000' }));
    }

    setGuardando(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente. Intente nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Alta de Cliente
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* RFC y Tipo de Persona */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="rfc"
                  label="RFC *"
                  value={formData.rfc}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    handleChange({ ...e, target: { ...e.target, value } } as any);
                  }}
                  required
                  disabled={formData.esExtranjero}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Persona *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="fisica"
                        checked={formData.tipoPersona === 'fisica'}
                        onChange={() => setFormData(prev => ({ ...prev, tipoPersona: 'fisica' }))}
                        className="mr-2"
                      />
                      Física
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="moral"
                        checked={formData.tipoPersona === 'moral'}
                        onChange={() => setFormData(prev => ({ ...prev, tipoPersona: 'moral' }))}
                        className="mr-2"
                      />
                      Moral
                    </label>
                  </div>
                </div>
              </div>

              {/* Nacional/Extranjero */}
              <div className="flex gap-4">
                <CheckboxField
                  name="esNacional"
                  label="Nacional"
                  checked={formData.esNacional}
                  onChange={(e) => handleCheckboxChange('esNacional', e.target.checked)}
                />
                <CheckboxField
                  name="esExtranjero"
                  label="Extranjera"
                  checked={formData.esExtranjero}
                  onChange={(e) => handleCheckboxChange('esExtranjero', e.target.checked)}
                />
                <CheckboxField
                  name="esPolitico"
                  label="P. Político"
                  checked={formData.esPolitico}
                  onChange={(e) => handleCheckboxChange('esPolitico', e.target.checked)}
                />
              </div>

              {validandoSAT && (
                <div className="text-blue-600 dark:text-blue-400 text-sm">
                  Validando RFC con SAT...
                </div>
              )}

              {errorSAT && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {errorSAT}
                </div>
              )}

              {/* Razón Social o Nombre */}
              {formData.tipoPersona === 'moral' ? (
                <FormField
                  name="razonSocial"
                  label="Razón Social *"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  required
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name="nombre"
                    label="Nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                  />
                  <FormField
                    name="apellidoPaterno"
                    label="Apellido Paterno"
                    value={formData.apellidoPaterno || ''}
                    onChange={handleChange}
                  />
                  <FormField
                    name="apellidoMaterno"
                    label="Apellido Materno"
                    value={formData.apellidoMaterno || ''}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Código Postal y Dirección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="codigoPostal"
                  label="Código Postal *"
                  value={formData.codigoPostal}
                  onChange={handleCodigoPostalChange}
                  required
                  maxLength={5}
                />
                {cargandoCP && (
                  <div className="text-sm text-gray-500">Cargando datos...</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  name="pais"
                  label="País"
                  value={formData.pais}
                  onChange={handleChange}
                  options={PAIS_OPTIONS}
                />
                <FormField
                  name="estado"
                  label="Estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="municipio"
                  label="Municipio/Delegación"
                  value={formData.municipio}
                  onChange={handleChange}
                  disabled
                />
                <SelectField
                  name="colonia"
                  label="Colonia"
                  value={formData.colonia}
                  onChange={handleChange}
                  options={colonias.map(c => ({ value: c, label: c }))}
                  disabled={colonias.length === 0}
                />
              </div>

              <FormField
                name="calle"
                label="Calle"
                value={formData.calle}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="numeroExterior"
                  label="Número exterior"
                  value={formData.numeroExterior}
                  onChange={handleChange}
                  placeholder="Ej: 123, MZ 5, LT 10"
                />
                <FormField
                  name="numeroInterior"
                  label="Número interior"
                  value={formData.numeroInterior}
                  onChange={handleChange}
                  placeholder="Ej: EDIF A, DEP 101"
                />
              </div>

              {/* Datos de Contacto */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-4 text-gray-900 dark:text-white">
                  Datos de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="correoElectronico"
                    label="Correo Electrónico *"
                    type="email"
                    value={formData.correoElectronico}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    name="telefono"
                    label="Teléfono para WhatsApp"
                    value={formData.telefono || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Régimen Fiscal y Uso CFDI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  name="regimenFiscal"
                  label="Régimen Fiscal *"
                  value={formData.regimenFiscal}
                  onChange={handleChange}
                  options={REGIMEN_FISCAL_OPTIONS}
                  required
                />
                <SelectField
                  name="usoCfdi"
                  label="Uso CFDI *"
                  value={formData.usoCfdi}
                  onChange={handleChange}
                  options={USO_CFDI_OPTIONS}
                  required
                />
              </div>

              <CheckboxField
                name="declaraIeps"
                label="Declaro IEPS **"
                checked={formData.declaraIeps}
                onChange={(e) => handleCheckboxChange('declaraIeps', e.target.checked)}
              />

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Los campos marcados con: * son obligatorios, **Aplica sólo para vinos y licores.
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" onClick={onClose} variant="neutral">
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

