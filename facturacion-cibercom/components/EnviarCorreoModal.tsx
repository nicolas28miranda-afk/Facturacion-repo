import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { FormField } from './FormField';
import { correoService } from '../services/correoService';
import { configuracionCorreoService } from '../services/configuracionCorreoService';

interface EnviarCorreoModalProps {
  isOpen: boolean;
  onClose: () => void;
  facturaUuid: string;
  facturaInfo: string; // Serie + Folio para mostrar al usuario
  correoInicial?: string; // Correo del cliente si está disponible
  rfcReceptor?: string; // RFC del cliente receptor
}

export const EnviarCorreoModal: React.FC<EnviarCorreoModalProps> = ({
  isOpen,
  onClose,
  facturaUuid,
  facturaInfo,
  correoInicial = '',
  rfcReceptor = ''
}) => {
  const [correoReceptor, setCorreoReceptor] = useState(correoInicial);
  const [asunto, setAsunto] = useState('');
  const [mensajeCorreo, setMensajeCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(false);

  // Cargar configuración predeterminada cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarConfiguracionPredeterminada();
    }
  }, [isOpen, facturaUuid, facturaInfo, rfcReceptor]);

  const cargarConfiguracionPredeterminada = async () => {
    setCargandoConfiguracion(true);
    try {
      // Obtener la configuración de mensaje usando el nuevo servicio
      const configuracionMensaje = await configuracionCorreoService.obtenerMensajeParaEnvio();
      
      if (configuracionMensaje) {
        // Construir bloque protegido con variables dinámicas
        const bloqueProtegido = `Estimado(a) cliente,\n\nSe ha generado su factura electrónica.\n\nGracias por su preferencia.\n\nCon los siguientes datos:\nSerie de la factura: {serie}\nFolio de la factura: {folio}\nUUID de la factura: {uuid}\nRFC del emisor: {rfcEmisor}\nRFC del receptor: {rfcReceptor}\n\nAtentamente,\nEquipo de Facturación Cibercom`;

        // Procesar variables en el asunto y bloque protegido
        const asuntoProcesado = configuracionCorreoService.procesarMensaje(configuracionMensaje.asunto, {
          facturaInfo,
          serie: facturaInfo.split('-')[0] || 'A',
          folio: facturaInfo.split('-')[1] || '1',
          uuid: facturaUuid,
          rfcEmisor: 'EEJ920629TE3',
          rfcReceptor: rfcReceptor || ''
        });

        const bloqueProtegidoProcesado = configuracionCorreoService.procesarMensaje(bloqueProtegido, {
          facturaInfo,
          serie: facturaInfo.split('-')[0] || 'A',
          folio: facturaInfo.split('-')[1] || '1',
          uuid: facturaUuid,
          rfcEmisor: 'EEJ920629TE3',
          rfcReceptor: rfcReceptor || ''
        });
        
        // El mensaje personalizado guardado por el usuario
        const mensajePersonalizado = configuracionMensaje.mensaje || '';
        
        // Unir bloque protegido y mensaje personalizado separado por dos saltos de línea
        const mensajeProcesado = `${bloqueProtegidoProcesado}\n\n${mensajePersonalizado}`;
        
        setAsunto(asuntoProcesado);
        setMensajeCorreo(mensajeProcesado);
      } else {
        // Valores por defecto si no hay configuración
        const porDefecto = `Estimado(a) cliente,\n\nSe ha generado su factura electrónica.\n\nGracias por su preferencia.\n\nCon los siguientes datos:\nSerie de la factura: {serie}\nFolio de la factura: {folio}\nUUID de la factura: {uuid}\nRFC del emisor: {rfcEmisor}\nRFC del receptor: {rfcReceptor}\n\nAtentamente,\nEquipo de Facturación Cibercom`;
        const bloqueProtegidoProcesado = configuracionCorreoService.procesarMensaje(porDefecto, {
          facturaInfo,
          serie: facturaInfo.split('-')[0] || 'A',
          folio: facturaInfo.split('-')[1] || '1',
          uuid: facturaUuid,
          rfcEmisor: 'EEJ920629TE3',
          rfcReceptor: rfcReceptor || ''
        });
        setAsunto(`Factura Electrónica - ${facturaInfo}`);
        setMensajeCorreo(`${bloqueProtegidoProcesado}\n\n`);
      }
    } catch (error) {
      console.error('Error al cargar configuración predeterminada:', error);
      // Fallback en caso de error
      const porDefecto = `Estimado(a) cliente,\n\nSe ha generado su factura electrónica.\n\nGracias por su preferencia.\n\nCon los siguientes datos:\nSerie de la factura: {serie}\nFolio de la factura: {folio}\nUUID de la factura: {uuid}\nRFC del emisor: {rfcEmisor}\nRFC del receptor: {rfcReceptor}\n\nAtentamente,\nEquipo de Facturación Cibercom`;
      const bloqueProtegidoProcesado = configuracionCorreoService.procesarMensaje(porDefecto, {
        facturaInfo,
        serie: facturaInfo.split('-')[0] || 'A',
        folio: facturaInfo.split('-')[1] || '1',
        uuid: facturaUuid,
        rfcEmisor: 'EEJ920629TE3',
        rfcReceptor: rfcReceptor || ''
      });
      setAsunto(`Factura Electrónica - ${facturaInfo}`);
      setMensajeCorreo(`${bloqueProtegidoProcesado}\n\n`);
    } finally {
      setCargandoConfiguracion(false);
    }
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correoService.validarEmail(correoReceptor)) {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa un correo electrónico válido' });
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      const response = await correoService.enviarCorreoConPdfAdjunto({
        uuidFactura: facturaUuid,
        correoReceptor: correoReceptor,
        asunto: asunto,
        mensaje: mensajeCorreo
      });
      
      if (response.success) {
        setMensaje({ tipo: 'success', texto: response.message });
        setTimeout(() => {
          onClose();
          setMensaje(null);
        }, 2000);
      } else {
        setMensaje({ tipo: 'error', texto: response.message });
      }
    } catch (error) {
      console.error('Error al enviar correo:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al enviar el correo. Por favor intenta nuevamente.' 
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    if (!enviando && !cargandoConfiguracion) {
      setMensaje(null);
      setCorreoReceptor(correoInicial);
      // Los valores de asunto y mensaje se resetearán cuando se vuelva a abrir el modal
      setAsunto('');
      setMensajeCorreo('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Enviar Factura por Correo
          </h3>
          <button
            onClick={handleClose}
            disabled={enviando || cargandoConfiguracion}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Factura:</strong> {facturaInfo}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>UUID:</strong> {facturaUuid}
          </p>
        </div>

        <form onSubmit={handleEnviar} className="space-y-4">
          <FormField
            label="Correo Electrónico del Destinatario *"
            name="correoReceptor"
            type="email"
            value={correoReceptor}
            onChange={(e) => setCorreoReceptor(e.target.value)}
            required
            placeholder="ejemplo@correo.com"
            disabled={enviando || cargandoConfiguracion}
          />

          <FormField
            label="Asunto *"
            name="asunto"
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
            placeholder={cargandoConfiguracion ? "Cargando configuración..." : "Asunto del correo"}
            disabled={enviando || cargandoConfiguracion}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensaje *
            </label>
            <textarea
              name="mensaje"
              value={mensajeCorreo}
              onChange={(e) => setMensajeCorreo(e.target.value)}
              required
              placeholder={cargandoConfiguracion ? "Cargando configuración..." : "Mensaje del correo"}
              disabled={enviando || cargandoConfiguracion}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium mb-1">💡 Mensaje basado en configuración predefinida</p>
            <p>Puedes modificar el asunto y mensaje antes de enviar. Para cambiar los mensajes predeterminados, ve a Configuración → Mensajes de Correo.</p>
          </div>

          {mensaje && (
            <div className={`p-3 rounded-md text-sm ${
              mensaje.tipo === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={enviando || cargandoConfiguracion}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={enviando || cargandoConfiguracion || !correoReceptor.trim() || !asunto.trim() || !mensajeCorreo.trim()}
              className="flex-1"
            >
              {cargandoConfiguracion ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando...
                </div>
              ) : enviando ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </div>
              ) : (
                'Enviar Correo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};