import React, { useState } from 'react';
import { Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

const ITextPdfTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [logoTest, setLogoTest] = useState<TestResult | null>(null);

  const API_BASE_URL = 'http://localhost:8080/api/itext';

  const testLogo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/test-logo`);
      const data = await response.json();
      
      setLogoTest({
        success: data.exitoso,
        message: data.mensaje,
        details: data
      });
    } catch (error) {
      setLogoTest({
        success: false,
        message: `Error al probar logo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTestPdf = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch(`${API_BASE_URL}/generar-pdf-prueba`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'factura-itext-prueba.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTestResult({
        success: true,
        message: `PDF generado exitosamente con iText. Tamaño: ${(blob.size / 1024).toFixed(2)} KB`
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCustomPdf = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const customData = {
        facturaData: {
          uuid: `CUSTOM-${Date.now()}`,
          serie: 'CUST',
          folio: '001',
          nombreEmisor: 'Cibercom Soluciones',
          nombreReceptor: 'Cliente Personalizado',
          rfcEmisor: 'CIBE123456789',
          rfcReceptor: 'CLIE987654321',
          fechaEmision: new Date().toISOString(),
          importe: 2500.0,
          subtotal: 2155.17,
          iva: 344.83,
          metodoPago: 'PUE',
          formaPago: '03',
          usoCFDI: 'G03'
        },
        logoConfig: {
          logoUrl: '/images/Logo Cibercom.png',
          customColors: {
            primary: '#1d4ed8',
            primaryDark: '#1e40af',
            secondary: '#3b82f6',
            background: '#ffffff',
            text: '#1f2937'
          }
        }
      };
      
      const response = await fetch(`${API_BASE_URL}/generar-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customData)
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'factura-itext-personalizada.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTestResult({
        success: true,
        message: `PDF personalizado generado exitosamente. Tamaño: ${(blob.size / 1024).toFixed(2)} KB`
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error al generar PDF personalizado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FileText className="text-blue-600" />
          Prueba de PDF con iText
        </h1>
        <p className="text-gray-600">
          Nueva implementación de generación de PDFs usando iText con mejor manejo de logos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testLogo}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle size={20} />
          Probar Logo
        </button>
        
        <button
          onClick={generateTestPdf}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={20} />
          PDF de Prueba
        </button>
        
        <button
          onClick={generateCustomPdf}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText size={20} />
          PDF Personalizado
        </button>
      </div>

      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Procesando...</span>
          </div>
        </div>
      )}

      {logoTest && (
        <div className={`mb-4 p-4 rounded-lg border ${
          logoTest.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {logoTest.success ? (
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                logoTest.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Resultado de Prueba de Logo
              </h3>
              <p className={logoTest.success ? 'text-green-700' : 'text-red-700'}>
                {logoTest.message}
              </p>
              {logoTest.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Ver detalles
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(logoTest.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div className={`mb-4 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Resultado de Generación de PDF
              </h3>
              <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Información Técnica</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Backend:</strong> Spring Boot con iText 7</li>
          <li>• <strong>Endpoint base:</strong> {API_BASE_URL}</li>
          <li>• <strong>Funcionalidades:</strong> Generación de PDF con logos, colores personalizados</li>
          <li>• <strong>Formato:</strong> PDF/A compatible con facturación electrónica</li>
        </ul>
      </div>
    </div>
  );
};

export default ITextPdfTest;