import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { 
    PAIS_OPTIONS, 
    REGIMEN_FISCAL_OPTIONS, 
    USO_CFDI_OPTIONS, 
    TIENDA_OPTIONS,
    MEDIO_PAGO_OPTIONS,
    FORMA_PAGO_OPTIONS
} from '../constants';

interface MonederosFormData {
  // Datos Fiscales
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
  // Consultar Boleta
  codigoFacturacion: string;
  tienda: string;
  fechaBoleta: string;
  terminal: string;
  boleta: string;
  // Forma de pago
  medioPago: string;
  formaPago: string;
  iepsDesglosado: boolean;
}

const initialMonederosFormData: MonederosFormData = {
  rfcIniciales: '',
  rfcFecha: '',
  rfcHomoclave: '',
  correoElectronico: '',
  razonSocial: '',
  nombre: '',
  paterno: '',
  materno: '',
  pais: PAIS_OPTIONS[0]?.value || '',
  noRegistroIdentidadTributaria: '',
  domicilioFiscal: '',
  regimenFiscal: REGIMEN_FISCAL_OPTIONS[0]?.value || '',
  usoCfdi: USO_CFDI_OPTIONS[0]?.value || '',
  codigoFacturacion: '',
  tienda: TIENDA_OPTIONS[0]?.value || '',
  fechaBoleta: new Date().toISOString().split('T')[0],
  terminal: '',
  boleta: '',
  medioPago: MEDIO_PAGO_OPTIONS[0]?.value || '',
  formaPago: FORMA_PAGO_OPTIONS[0]?.value || '',
  iepsDesglosado: false,
};

export const FacturacionMonederosPage: React.FC = () => {
  const [formData, setFormData] = useState<MonederosFormData>(initialMonederosFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRfcSearch = () => {
    alert(`Buscando RFC: ${formData.rfcIniciales}${formData.rfcFecha}${formData.rfcHomoclave}`);
  };

  const handleAgregarBoleta = () => {
    alert(`Boleta agregada (simulado): Código ${formData.codigoFacturacion}, Tienda ${formData.tienda}, Fecha ${formData.fechaBoleta}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Facturar Monederos:', formData);
    alert('Facturando Monederos (simulado). Ver consola para datos.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DatosFiscalesSection
        formData={formData}
        handleChange={handleChange}
        onRfcSearchClick={handleRfcSearch}
      />

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Consultar Boleta:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 items-end">
          <FormField label="Código de Facturación:" name="codigoFacturacion" value={formData.codigoFacturacion} onChange={handleChange} />
          <SelectField label="Tienda:" name="tienda" value={formData.tienda} onChange={handleChange} options={TIENDA_OPTIONS} />
          <FormField label="Fecha:" name="fechaBoleta" type="date" value={formData.fechaBoleta} onChange={handleChange} />
          <FormField label="Terminal:" name="terminal" value={formData.terminal} onChange={handleChange} />
          <FormField label="Boleta:" name="boleta" value={formData.boleta} onChange={handleChange} />
          <div className="flex justify-start md:col-start-3 md:justify-end pt-4">
            <Button type="button" onClick={handleAgregarBoleta} variant="primary">
              Agregar
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Forma de pago:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-center">
          <SelectField label="Medio de pago:" name="medioPago" value={formData.medioPago} onChange={handleChange} options={MEDIO_PAGO_OPTIONS} />
          <SelectField label="Forma de pago:" name="formaPago" value={formData.formaPago} onChange={handleChange} options={FORMA_PAGO_OPTIONS} />
        </div>
        <div className="mt-4">
            <CheckboxField label="IEPS desglosado" name="iepsDesglosado" checked={formData.iepsDesglosado} onChange={handleChange} />
        </div>
      </Card>
      {/* A general submit button might be needed if "Agregar" is not the final step */}
      {/* <div className="flex justify-end mt-6">
        <Button type="submit" variant="primary">
          Facturar Monederos
        </Button>
      </div> */}
    </form>
  );
};
