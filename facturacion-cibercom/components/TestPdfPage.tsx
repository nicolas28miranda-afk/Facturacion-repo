import React, { useState, useContext } from 'react';
import { facturaService } from '../services/facturaService';
import { apiUrl } from '../services/api';
import { ThemeContext } from '../App';

const TestPdfPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { customColors, logoUrl } = useContext(ThemeContext);

  const generarPDFPrueba = async () => {
    setLoading(true);
    setMessage('Generando PDF de prueba...');
    
    try {
      // Obtener configuración de logos del backend como fallback
      const backendLogo = await facturaService.obtenerConfiguracionLogos();
      
      if (!backendLogo.exitoso) {
        throw new Error('No se pudo obtener la configuración de logos');
      }

      // Datos de factura de prueba
      const facturaDataPrueba = {
        uuid: 'TEST-UUID-' + Date.now(),
        serie: 'TEST',
        folio: '001',
        nombreEmisor: 'Empresa de Prueba',
        nombreReceptor: 'Cliente de Prueba',
        rfcEmisor: 'TEST123456789',
        rfcReceptor: 'XEXX010101000',
        fechaEmision: new Date().toISOString(),
        importe: 1000.00,
        subtotal: 862.07,
        iva: 137.93,
        conceptos: [{
          descripcion: 'Producto de prueba',
          cantidad: 1,
          unidad: 'PZA',
          precioUnitario: 1000.00,
          importe: 1000.00
        }],
        metodoPago: 'PUE',
        formaPago: '01',
        usoCFDI: 'G01'
      };

      // Preparar logoConfig priorizando colores del tema actual
      const logoConfigFinal = {
        logoUrl: logoUrl || backendLogo.logoUrl,
        logoBase64: backendLogo.logoBase64,
        customColors: customColors || backendLogo.customColors
      };

      // Generar PDF
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facturaData: facturaDataPrueba,
          logoConfig: logoConfigFinal
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar PDF en el servidor');
      }

      // Descargar el PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${facturaDataPrueba.serie}-${facturaDataPrueba.folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('PDF generado y descargado correctamente.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const abrirPDFEnNuevaPestana = async () => {
    setLoading(true);
    setMessage('Generando PDF para abrir en nueva pestaña...');
    
    try {
      // Obtener configuración de logos del backend como fallback
      const backendLogo = await facturaService.obtenerConfiguracionLogos();
      
      if (!backendLogo.exitoso) {
        throw new Error('No se pudo obtener la configuración de logos');
      }

      // Datos de factura de prueba
      const facturaDataPrueba = {
        uuid: 'TEST-UUID-' + Date.now(),
        serie: 'TEST',
        folio: '001',
        nombreEmisor: 'Empresa de Prueba',
        nombreReceptor: 'Cliente de Prueba',
        rfcEmisor: 'TEST123456789',
        rfcReceptor: 'XEXX010101000',
        fechaEmision: new Date().toISOString(),
        importe: 1000.00,
        subtotal: 862.07,
        iva: 137.93,
        conceptos: [{
          descripcion: 'Producto de prueba',
          cantidad: 1,
          unidad: 'PZA',
          precioUnitario: 1000.00,
          importe: 1000.00
        }],
        metodoPago: 'PUE',
        formaPago: '01',
        usoCFDI: 'G01'
      };

      // Preparar logoConfig priorizando colores del tema actual
      const logoConfigFinal = {
        logoUrl: logoUrl || backendLogo.logoUrl,
        logoBase64: backendLogo.logoBase64,
        customColors: customColors || backendLogo.customColors
      };

      // Generar PDF
      const response = await fetch(apiUrl('/factura/generar-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          facturaData: facturaDataPrueba,
          logoConfig: logoConfigFinal
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar PDF en el servidor');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setMessage('PDF generado y abierto en nueva pestaña.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const probarEndpointLogo = async () => {
    setLoading(true);
    setMessage('Probando endpoint de logo...');
    
    try {
      const backendLogo = await facturaService.obtenerConfiguracionLogos();
      
      if (backendLogo.exitoso) {
        setMessage(`Logo obtenido: ${backendLogo.logoBase64?.length || 0} caracteres, URL: ${backendLogo.logoUrl}`);
      } else {
        setMessage(`Error obteniendo logo: ${backendLogo.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <button
          onClick={generarPDFPrueba}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Generar y descargar PDF
        </button>
        <button
          onClick={abrirPDFEnNuevaPestana}
          disabled={loading}
          className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-dark"
        >
          Abrir PDF en nueva pestaña
        </button>
        <button
          onClick={probarEndpointLogo}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Probar endpoint de logo
        </button>
      </div>
      {message && (
        <div className="mt-2 text-sm text-gray-700">{message}</div>
      )}
    </div>
  );
};

export default TestPdfPage;