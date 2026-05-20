import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { Button } from './Button';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { TextareaField } from './TextareaField';
import { PAIS_OPTIONS, REGIMEN_FISCAL_OPTIONS, USO_CFDI_OPTIONS } from '../constants';

interface CartaFacturaFormData {
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
}

const initialCartaFacturaFormData: CartaFacturaFormData = {
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
  descripcion: '',
  fechaInformacion: new Date().toISOString().split('T')[0].replace(/-/g, ''), // YYYYMMDD format
  numeroSerie: '',
  precio: '',
  personaAutoriza: '',
  puesto: '',
};

export const FacturacionCartaFacturaPage: React.FC = () => {
  const [formData, setFormData] = useState<CartaFacturaFormData>(initialCartaFacturaFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRfcSearch = () => {
    alert(`Buscando RFC: ${formData.rfcIniciales}${formData.rfcFecha}${formData.rfcHomoclave}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Generar Carta Factura:', formData);
    alert('Generando Carta Factura (simulado). Ver consola para datos.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DatosFiscalesSection
        formData={formData}
        handleChange={handleChange}
        onRfcSearchClick={handleRfcSearch}
      />

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Información:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <TextareaField label="Descripción:" name="descripcion" value={formData.descripcion} onChange={handleChange} rows={4} className="md:col-span-2" required />
          <FormField label="Fecha:" name="fechaInformacion" value={formData.fechaInformacion} onChange={handleChange} placeholder="AAAAMMDD" maxLength={8} required />
          <FormField label="Número de Serie:" name="numeroSerie" value={formData.numeroSerie} onChange={handleChange} required />
          <FormField label="Precio:" name="precio" type="number" value={formData.precio} onChange={handleChange} required />
          <FormField label="Persona que autoriza:" name="personaAutoriza" value={formData.personaAutoriza} onChange={handleChange} required />
          <FormField label="Puesto:" name="puesto" value={formData.puesto} onChange={handleChange} required />
        </div>
      </Card>

      <div className="flex justify-end mt-6">
        <Button type="submit" variant="primary">
          GENERAR CARTA FACTURA
        </Button>
      </div>
    </form>
  );
};
