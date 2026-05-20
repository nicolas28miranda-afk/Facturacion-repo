import React from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { RfcField } from './RfcField';
import { PAIS_OPTIONS, REGIMEN_FISCAL_OPTIONS, USO_CFDI_OPTIONS } from '../constants';

interface DatosFiscalesData {
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
}

interface DatosFiscalesSectionProps {
  formData: DatosFiscalesData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRfcSearchClick?: () => void;
  isRFCRequired?: boolean;
  isRazonSocialRequired?: boolean;
  isDomicilioFiscalRequired?: boolean;
  isRegimenFiscalRequired?: boolean;
  isUsoCfdiRequired?: boolean;
  isCorreoElectronicoRequired?: boolean;
  // Nuevos controles de estado
  rfcDisabled?: boolean;
  isRegimenFiscalDisabled?: boolean;
  isUsoCfdiDisabled?: boolean;
  // Errores por campo para mostrar mensajes en rojo
  fieldErrors?: Partial<Record<'rfc' | 'correoElectronico' | 'razonSocial' | 'nombre' | 'paterno' | 'materno' | 'domicilioFiscal' | 'regimenFiscal' | 'usoCfdi', string>>;
  // Control de visibilidad basado en tipo de persona (física o moral)
  mostrarRazonSocial?: boolean;
  mostrarNombreCompleto?: boolean;
  // Ocultar campo RFC cuando se usa RfcAutocomplete en otro lugar
  ocultarRFC?: boolean;
}

export const DatosFiscalesSection: React.FC<DatosFiscalesSectionProps> = ({
  formData,
  handleChange,
  onRfcSearchClick,
  isRFCRequired = true,
  isRazonSocialRequired = true,
  isDomicilioFiscalRequired = true,
  isRegimenFiscalRequired = true,
  isUsoCfdiRequired = true,
  isCorreoElectronicoRequired = true,
  rfcDisabled = false,
  isRegimenFiscalDisabled = false,
  isUsoCfdiDisabled = false,
  fieldErrors = {},
  mostrarRazonSocial = true,
  mostrarNombreCompleto = true,
  ocultarRFC = false,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Datos fiscales:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
        {!ocultarRFC && (
          <>
            <RfcField
              label="RFC:"
              namePrefix="rfc"
              values={{
                iniciales: formData.rfcIniciales,
                fecha: formData.rfcFecha,
                homoclave: formData.rfcHomoclave,
              }}
              onChange={handleChange}
              onSearchClick={onRfcSearchClick}
              required={isRFCRequired}
              className="lg:col-span-2"
              disabled={rfcDisabled}
              error={Boolean(fieldErrors.rfc)}
            />
            {fieldErrors.rfc && (
              <div className="lg:col-span-1">
                <p className="text-red-600 text-xs mt-1">{fieldErrors.rfc}</p>
              </div>
            )}
            <div></div>
          </>
        )}
        
        <FormField label="Correo Electrónico:" name="correoElectronico" type="email" value={formData.correoElectronico} onChange={handleChange} required={isCorreoElectronicoRequired} error={Boolean(fieldErrors.correoElectronico)} />
        {fieldErrors.correoElectronico && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.correoElectronico}</p>
          </div>
        )}
        {mostrarRazonSocial && (
          <>
        <FormField label="Razón Social:" name="razonSocial" value={formData.razonSocial} onChange={handleChange} required={isRazonSocialRequired} error={Boolean(fieldErrors.razonSocial)} />
        {fieldErrors.razonSocial && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.razonSocial}</p>
          </div>
        )}
          </>
        )}
        {mostrarNombreCompleto && (
          <>
        <FormField label="Nombre:" name="nombre" value={formData.nombre} onChange={handleChange} />
        {fieldErrors.nombre && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.nombre}</p>
          </div>
        )}
        <FormField label="Paterno:" name="paterno" value={formData.paterno} onChange={handleChange} />
        {fieldErrors.paterno && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.paterno}</p>
          </div>
        )}
        <FormField label="Materno:" name="materno" value={formData.materno} onChange={handleChange} />
        {fieldErrors.materno && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.materno}</p>
          </div>
            )}
          </>
        )}
        <SelectField label="País:" name="pais" value={formData.pais} onChange={handleChange} options={PAIS_OPTIONS} />
        <FormField label="No. Registro Identidad Tributaria:" name="noRegistroIdentidadTributaria" value={formData.noRegistroIdentidadTributaria} onChange={handleChange} />
        <FormField label="Domicilio Fiscal:" name="domicilioFiscal" value={formData.domicilioFiscal} onChange={handleChange} required={isDomicilioFiscalRequired} error={Boolean(fieldErrors.domicilioFiscal)} />
        {fieldErrors.domicilioFiscal && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.domicilioFiscal}</p>
          </div>
        )}
        <SelectField label="Régimen Fiscal:" name="regimenFiscal" value={formData.regimenFiscal} onChange={handleChange} options={REGIMEN_FISCAL_OPTIONS} required={isRegimenFiscalRequired} disabled={isRegimenFiscalDisabled} error={Boolean(fieldErrors.regimenFiscal)} />
        {fieldErrors.regimenFiscal && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.regimenFiscal}</p>
          </div>
        )}
        <SelectField label="Uso CFDI:" name="usoCfdi" value={formData.usoCfdi} onChange={handleChange} options={USO_CFDI_OPTIONS} required={isUsoCfdiRequired} disabled={isUsoCfdiDisabled} error={Boolean(fieldErrors.usoCfdi)} />
        {fieldErrors.usoCfdi && (
          <div className="md:col-span-1 lg:col-span-1">
            <p className="text-red-600 text-xs mt-1">{fieldErrors.usoCfdi}</p>
          </div>
        )}
        {/* Nota: Régimen Fiscal suele deshabilitarse hasta receptor válido */}
        {/* Se aplica disabled mediante prop en SelectField si se requiere */}
      </div>
    </>
  );
};
