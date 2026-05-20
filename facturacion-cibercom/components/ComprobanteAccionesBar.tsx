import React from 'react';
import { Button } from './Button';

export interface ComprobanteAccionesBarProps {
  id?: string;
  className?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  showCancel?: boolean;
  onVistaPrevia: () => void;
  vistaPreviaDisabled?: boolean;
  vistaPreviaTitle?: string;
  onGenerar?: () => void;
  generarType?: 'submit' | 'button';
  generarLabel: string;
  generarDisabled?: boolean;
  generarTitle?: string;
  tieneUuid: boolean;
  postEmisionHint?: string;
  onDescargarXml?: () => void;
  onDescargarPdf?: () => void;
  onEnviarCorreo?: () => void;
  onEnviarWhatsApp?: () => void;
  xmlDisabled?: boolean;
  pdfDisabled?: boolean;
  correoDisabled?: boolean;
  whatsappDisabled?: boolean;
  xmlTitle?: string;
  pdfTitle?: string;
  correoTitle?: string;
  whatsappTitle?: string;
  correoLabel?: string;
  extraRow1Right?: React.ReactNode;
  extraRow1Left?: React.ReactNode;
  extraRow2?: React.ReactNode;
  headerRow2?: React.ReactNode;
  showPostSection?: boolean;
}

const btnClass = 'w-full sm:w-auto whitespace-nowrap';

export const ComprobanteAccionesBar: React.FC<ComprobanteAccionesBarProps> = ({
  id,
  className = '',
  onCancel,
  cancelLabel = 'Cancelar',
  showCancel = true,
  onVistaPrevia,
  vistaPreviaDisabled = false,
  vistaPreviaTitle,
  onGenerar,
  generarType = 'button',
  generarLabel,
  generarDisabled = false,
  generarTitle,
  tieneUuid,
  postEmisionHint = 'Después de emitir el comprobante',
  onDescargarXml,
  onDescargarPdf,
  onEnviarCorreo,
  onEnviarWhatsApp,
  xmlDisabled,
  pdfDisabled,
  correoDisabled,
  whatsappDisabled,
  xmlTitle,
  pdfTitle,
  correoTitle,
  whatsappTitle,
  correoLabel = 'Enviar por Correo',
  extraRow1Right,
  extraRow1Left,
  extraRow2,
  headerRow2,
  showPostSection = true,
}) => {
  const postDisabled = !tieneUuid;
  const postTitle = postDisabled ? 'Emita el comprobante primero' : undefined;

  const xmlOff = xmlDisabled ?? postDisabled;
  const pdfOff = pdfDisabled ?? postDisabled;
  const correoOff = correoDisabled ?? postDisabled;
  const whatsappOff = whatsappDisabled ?? postDisabled;

  return (
    <div id={id} className={`mt-8 space-y-3 ${className}`.trim()}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {showCancel && onCancel && (
            <Button type="button" onClick={onCancel} variant="neutral" className={btnClass}>
              {cancelLabel}
            </Button>
          )}
          {extraRow1Left}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2">
          <Button
            type="button"
            onClick={onVistaPrevia}
            variant="secondary"
            disabled={vistaPreviaDisabled}
            title={vistaPreviaTitle}
            className={btnClass}
          >
            Vista Previa
          </Button>
          <Button
            type={generarType}
            variant="primary"
            onClick={generarType === 'button' ? onGenerar : undefined}
            disabled={generarDisabled}
            title={generarTitle}
            className={btnClass}
          >
            {generarLabel}
          </Button>
          {extraRow1Right}
        </div>
      </div>

      {showPostSection && (onDescargarXml || onDescargarPdf || onEnviarCorreo || onEnviarWhatsApp) && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
          {headerRow2 ?? (
            <span className="text-xs text-gray-500 dark:text-gray-400 sm:mr-auto w-full sm:w-auto">
              {postEmisionHint}
            </span>
          )}
          {onDescargarXml && (
            <Button
              type="button"
              onClick={onDescargarXml}
              variant="secondary"
              disabled={xmlOff}
              title={xmlTitle ?? (xmlOff ? postTitle : undefined)}
              className={btnClass}
            >
              Descargar XML
            </Button>
          )}
          {onDescargarPdf && (
            <Button
              type="button"
              onClick={onDescargarPdf}
              variant="secondary"
              disabled={pdfOff}
              title={pdfTitle ?? (pdfOff ? postTitle : undefined)}
              className={btnClass}
            >
              Descargar PDF
            </Button>
          )}
          {onEnviarCorreo && (
            <Button
              type="button"
              onClick={onEnviarCorreo}
              variant="secondary"
              disabled={correoOff}
              title={correoTitle ?? (correoOff ? postTitle : undefined)}
              className={btnClass}
            >
              {correoLabel}
            </Button>
          )}
          {onEnviarWhatsApp && (
            <Button
              type="button"
              onClick={onEnviarWhatsApp}
              variant="secondary"
              disabled={whatsappOff}
              title={whatsappTitle ?? (whatsappOff ? postTitle : undefined)}
              className={btnClass}
            >
              Enviar por WhatsApp
            </Button>
          )}
          {extraRow2}
        </div>
      )}
    </div>
  );
};
