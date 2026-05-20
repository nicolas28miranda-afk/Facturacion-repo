import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { CheckboxField } from './CheckboxField';
import { Button } from './Button';
import { DatosFiscalesSection } from './DatosFiscalesSection';
import { TextareaField } from './TextareaField';
import { correoService } from '../services/correoService';
import { 
    PAIS_OPTIONS, 
    REGIMEN_FISCAL_OPTIONS, 
    USO_CFDI_OPTIONS, 
    TIENDA_OPTIONS,
    MEDIO_PAGO_OPTIONS,
    FORMA_PAGO_OPTIONS,
    UNIDAD_MEDIDA_OPTIONS,
    TASA_IVA_OPTIONS
} from '../constants';

interface ConceptoMoto {
  motoElectrica: boolean;
  sku: string;
  cantidad: string;
  unidadMedida: string;
  tipo: string;
  marca: string;
  modelo: string;
  color: string;
  anio: string;
  cilindraje: string;
  numeroSerie: string;
  motor: string;
  repuve: string;
  paisOrigen: string;
  aduana: string;
  fechaEntrada: string;
  pedimento: string;
  descripcionConcepto: string;
  valorUnitario: string;
  descuentoConcepto: string;
  tasaIva: string;
  ivaConcepto: string;
}

interface MotosFormData {
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
  // Boleta
  tiendaBoleta: string;
  terminalBoleta: string;
  numeroBoleta: string;
  // Concepto (single for now)
  concepto: ConceptoMoto;
  // Totales
  medioPago: string;
  formaPago: string;
  descuentoTotal: string;
  subtotal: string;
  ivaTotal: string;
  total: string;
  ivaDesglosadoTotal: boolean;
  // Comentarios
  comentarios: string;
}

const initialConceptoMotoData: ConceptoMoto = {
  motoElectrica: false,
  sku: '',
  cantidad: '1',
  unidadMedida: UNIDAD_MEDIDA_OPTIONS[0]?.value || '',
  tipo: '',
  marca: '',
  modelo: '',
  color: '',
  anio: '',
  cilindraje: '',
  numeroSerie: '',
  motor: '',
  repuve: '',
  paisOrigen: '',
  aduana: '',
  fechaEntrada: '',
  pedimento: '',
  descripcionConcepto: '',
  valorUnitario: '',
  descuentoConcepto: '',
  tasaIva: TASA_IVA_OPTIONS[0]?.value || '',
  ivaConcepto: '',
};

const initialMotosFormData: MotosFormData = {
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
  tiendaBoleta: TIENDA_OPTIONS[0]?.value || '',
  terminalBoleta: '',
  numeroBoleta: '',
  concepto: initialConceptoMotoData,
  medioPago: MEDIO_PAGO_OPTIONS[0]?.value || '',
  formaPago: FORMA_PAGO_OPTIONS[0]?.value || '',
  descuentoTotal: '',
  subtotal: '',
  ivaTotal: '',
  total: '',
  ivaDesglosadoTotal: false,
  comentarios: '',
};

export const FacturacionMotosPage: React.FC = () => {
  const [formData, setFormData] = useState<MotosFormData>(initialMotosFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name.startsWith('concepto.')) {
        const conceptoField = name.split('.')[1] as keyof ConceptoMoto;
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            concepto: {
                ...prev.concepto,
                [conceptoField]: type === 'checkbox' ? checked : value
            }
        }));
    } else if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleRfcSearch = () => alert(`Buscando RFC: ${formData.rfcIniciales}${formData.rfcFecha}${formData.rfcHomoclave}`);
  const handleAgregarBoleta = () => alert('Boleta agregada (simulado)');
  const handleAgregarConcepto = () => alert('Concepto de Moto agregado (simulado).');
  
  const handleFacturar = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Facturar Motos:', formData);
    alert('Facturando Motos (simulado). Ver consola.');
  };
  const handleEnviarCorreo = async () => {
    if (!formData.correoElectronico || !formData.correoElectronico.trim()) {
      alert('Por favor ingresa un correo electrónico válido antes de enviar.');
      return;
    }

    if (!correoService.validarEmail(formData.correoElectronico)) {
      alert('El formato del correo electrónico no es válido.');
      return;
    }

    // En una implementación real, aquí necesitarías el UUID de la factura
    // Por ahora, mostramos un mensaje informativo
    const confirmar = confirm(
      `¿Deseas enviar la factura de motos por correo a: ${formData.correoElectronico}?\n\n` +
      'Nota: Primero debes generar la factura para poder enviarla por correo.'
    );

    if (confirmar) {
      console.log('Enviar por Correo (Motos):', formData);
      alert(
        'Para enviar facturas por correo:\n\n' +
        '1. Primero genera la factura\n' +
        '2. Luego usa el botón "Enviar Correo" en la tabla de facturas\n' +
        '3. O el sistema enviará automáticamente si proporcionas un correo al generar la factura'
      );
    }
  };

  return (
    <form onSubmit={handleFacturar} className="space-y-6">
      <DatosFiscalesSection
        formData={formData}
        handleChange={handleChange}
        onRfcSearchClick={handleRfcSearch}
      />

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Boleta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 items-end">
          <SelectField label="Tienda:" name="tiendaBoleta" value={formData.tiendaBoleta} onChange={handleChange} options={TIENDA_OPTIONS} className="lg:col-span-1"/>
          <FormField label="Terminal:" name="terminalBoleta" value={formData.terminalBoleta} onChange={handleChange} className="lg:col-span-1"/>
          <FormField label="Número de Boleta:" name="numeroBoleta" value={formData.numeroBoleta} onChange={handleChange} className="lg:col-span-1"/>
          <Button type="button" onClick={handleAgregarBoleta} variant="primary" className="lg:self-end">Agregar</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2">Conceptos (Es necesario agregar al menos uno)</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Nota: Actualmente se permite un solo concepto. La funcionalidad para múltiples conceptos será implementada.</p>
        <CheckboxField label="Moto Eléctrica" name="concepto.motoElectrica" checked={formData.concepto.motoElectrica} onChange={handleChange} className="mb-3"/>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            <FormField label="SKU o Clave SAT:" name="concepto.sku" value={formData.concepto.sku} onChange={handleChange} />
            <FormField label="Cantidad:" name="concepto.cantidad" type="number" value={formData.concepto.cantidad} onChange={handleChange} />
            <SelectField label="Unidad de Medida:" name="concepto.unidadMedida" value={formData.concepto.unidadMedida} onChange={handleChange} options={UNIDAD_MEDIDA_OPTIONS} />
            <FormField label="*Tipo:" name="concepto.tipo" value={formData.concepto.tipo} onChange={handleChange} required />
            <FormField label="*Marca:" name="concepto.marca" value={formData.concepto.marca} onChange={handleChange} required />
            <FormField label="*Modelo:" name="concepto.modelo" value={formData.concepto.modelo} onChange={handleChange} required />
            <FormField label="*Color:" name="concepto.color" value={formData.concepto.color} onChange={handleChange} required />
            <FormField label="*Año:" name="concepto.anio" type="number" value={formData.concepto.anio} onChange={handleChange} required maxLength={4} />
            <FormField label="*Cilindraje:" name="concepto.cilindraje" value={formData.concepto.cilindraje} onChange={handleChange} required />
            <FormField label="*Número de serie:" name="concepto.numeroSerie" value={formData.concepto.numeroSerie} onChange={handleChange} required />
            <FormField label="*Motor:" name="concepto.motor" value={formData.concepto.motor} onChange={handleChange} required />
            <FormField label="*REPUVE:" name="concepto.repuve" value={formData.concepto.repuve} onChange={handleChange} required />
            <FormField label="País de Origen:" name="concepto.paisOrigen" value={formData.concepto.paisOrigen} onChange={handleChange} />
            <FormField label="Aduana:" name="concepto.aduana" value={formData.concepto.aduana} onChange={handleChange} />
            <FormField label="Fecha de entrada:" name="concepto.fechaEntrada" type="date" value={formData.concepto.fechaEntrada} onChange={handleChange} />
            <FormField label="Pedimento:" name="concepto.pedimento" value={formData.concepto.pedimento} onChange={handleChange} />
            <TextareaField label="Descripción:" name="concepto.descripcionConcepto" value={formData.concepto.descripcionConcepto} onChange={handleChange} rows={3} className="md:col-span-2 lg:col-span-3"/>
            <FormField label="Valor Unitario:" name="concepto.valorUnitario" type="number" value={formData.concepto.valorUnitario} onChange={handleChange} />
            <FormField label="Descuento:" name="concepto.descuentoConcepto" type="number" value={formData.concepto.descuentoConcepto} onChange={handleChange} />
            <SelectField label="Tasa IVA:" name="concepto.tasaIva" value={formData.concepto.tasaIva} onChange={handleChange} options={TASA_IVA_OPTIONS} />
            <FormField label="IVA:" name="concepto.ivaConcepto" type="number" value={formData.concepto.ivaConcepto} onChange={handleChange} />
        </div>
        <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleAgregarConcepto} variant="primary">Agregar Concepto</Button>
        </div>
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Totales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            <SelectField label="Medio de pago:" name="medioPago" value={formData.medioPago} onChange={handleChange} options={MEDIO_PAGO_OPTIONS} />
            <SelectField label="Forma de pago:" name="formaPago" value={formData.formaPago} onChange={handleChange} options={FORMA_PAGO_OPTIONS} />
            <FormField label="Descuento:" name="descuentoTotal" type="number" value={formData.descuentoTotal} onChange={handleChange} />
            <FormField label="Subtotal:" name="subtotal" type="number" value={formData.subtotal} onChange={handleChange} />
            <FormField label="IVA:" name="ivaTotal" type="number" value={formData.ivaTotal} onChange={handleChange} />
            <FormField label="Total:" name="total" type="number" value={formData.total} onChange={handleChange} />
        </div>
        <div className="mt-4">
            <CheckboxField label="IVA desglosado" name="ivaDesglosadoTotal" checked={formData.ivaDesglosadoTotal} onChange={handleChange} />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Comentarios</h3>
        <TextareaField label="" name="comentarios" value={formData.comentarios} onChange={handleChange} rows={3} />
      </Card>

      <div className="flex justify-end space-x-4 mt-8">
        <Button type="button" onClick={handleEnviarCorreo} variant="secondary">
          Enviar por Correo
        </Button>
        <Button type="submit" variant="primary">
          Facturar
        </Button>
      </div>
    </form>
  );
};