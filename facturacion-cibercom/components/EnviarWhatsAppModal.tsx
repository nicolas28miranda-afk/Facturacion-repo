import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { FormField } from './FormField';
import { whatsappService } from '../services/whatsappService';
import {
  WHATSAPP_MENSAJE_BASE_FACTURA,
  construirMensajeWhatsAppFactura,
} from '../constants/whatsappFacturaMensajeBase';

interface EnviarWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  facturaUuid: string;
  facturaInfo: string;
  telefonoInicial?: string;
  /** Título del modal (por defecto: factura) */
  tituloModal?: string;
  /** Etiqueta del comprobante en el resumen (por defecto: Factura) */
  etiquetaDocumento?: string;
  /** Texto base del mensaje de chat (antes del opcional) */
  mensajeBase?: string;
  construirMensaje?: (extraOpcional: string) => string;
  /** Texto del pie sobre archivos adjuntos */
  notaArchivos?: string;
}

export const EnviarWhatsAppModal: React.FC<EnviarWhatsAppModalProps> = ({
  isOpen,
  onClose,
  facturaUuid,
  facturaInfo,
  telefonoInicial = '',
  tituloModal = 'Enviar Factura por WhatsApp',
  etiquetaDocumento = 'Factura',
  mensajeBase = WHATSAPP_MENSAJE_BASE_FACTURA,
  construirMensaje = construirMensajeWhatsAppFactura,
  notaArchivos = 'Se enviarán el PDF y el XML de la factura al número indicado.',
}) => {
  const [numeroDestino, setNumeroDestino] = useState(telefonoInicial);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNumeroDestino(telefonoInicial);
      setMensaje('');
      setMensajeEstado(null);
    }
  }, [isOpen, telefonoInicial]);

  const handleEnviar = async () => {
    if (!whatsappService.validarNumero(numeroDestino)) {
      setMensajeEstado({
        tipo: 'error',
        texto: 'Ingresa solo dígitos con código de país (México: a veces 521… para móvil; en pruebas Meta suele usar 52 + 10 dígitos, p. ej. 527331565237). Sin + ni espacios.',
      });
      return;
    }

    setEnviando(true);
    setMensajeEstado(null);

    try {
      const response = await whatsappService.enviarFactura({
        uuidFactura: facturaUuid,
        numeroDestino: numeroDestino,
        mensaje: construirMensaje(mensaje),
      });

      if (response.success) {
        setMensajeEstado({ tipo: 'success', texto: response.message });
        setTimeout(() => {
          onClose();
          setMensajeEstado(null);
        }, 2000);
      } else {
        setMensajeEstado({ tipo: 'error', texto: response.message });
      }
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error);
      setMensajeEstado({
        tipo: 'error',
        texto: 'Error al enviar. Verifica que WhatsApp esté configurado en el servidor.',
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    if (!enviando) {
      setMensajeEstado(null);
      setNumeroDestino(telefonoInicial);
      setMensaje('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3
            id="whatsapp-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {tituloModal}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{etiquetaDocumento}:</strong> {facturaInfo}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>UUID:</strong> {facturaUuid}
          </p>
        </div>

        <div className="space-y-4">
          <FormField
            label="Número de WhatsApp (formato internacional) *"
            name="numeroDestino"
            type="tel"
            value={numeroDestino}
            onChange={(e) => setNumeroDestino(e.target.value)}
            required
            placeholder="527331565237"
            disabled={enviando}
          />

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Usa el mismo formato que en Meta (API de WhatsApp, campo Para). Ej.: México 527331565237 o 5217331565237 según cómo esté dado de alta el número de prueba.
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium mb-1">Mensaje de texto que se enviará junto con el PDF:</p>
            <p className="whitespace-pre-wrap">{mensajeBase}</p>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Si en el backend está desactivada la plantilla previa de Meta, el cliente recibe directamente este texto y los archivos (Meta solo lo permite cuando aplica la ventana de conversación o las reglas de tu cuenta).
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mensaje adicional (opcional)
            </label>
            <textarea
              name="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Añadir un mensaje extra (ej: Felices fiestas, Gracias por su compra, etc.)"
              disabled={enviando}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            {notaArchivos}
          </div>

          {mensajeEstado && (
            <div
              className={`p-3 rounded-md text-sm ${
                mensajeEstado.tipo === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {mensajeEstado.texto}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={enviando}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleEnviar()}
              disabled={enviando || !numeroDestino.trim()}
              className="flex-1"
            >
              {enviando ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enviando...
                </div>
              ) : (
                'Enviar por WhatsApp'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
