import React, { useState, useEffect } from 'react';
import { Card } from './Card';
// import { FormField } from './FormField'; // No utilizado
import { Button } from './Button';
import { ProtectedMessageEditor } from './ProtectedMessageEditor';
import { configuracionCorreoService } from '../services/configuracionCorreoService';
import formatoCorreoService from '../services/formatoCorreoService';
import { LogoUploader } from './LogoUploader';
import { logoService } from '../services/logoService';

interface ConfiguracionCorreo {
  asunto: string;
  mensaje: string;
  mensajePersonalizado?: string;
  esPersonalizado: boolean;
}

interface FormatoCorreo {
  id?: number;
  tipoFuente: string;
  tamanoFuente: number;
  esCursiva: boolean;
  esSubrayado: boolean;
  colorTexto: string;
}

export const ConfiguracionCorreoPage: React.FC = () => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionCorreo>({
    asunto: '',
    mensaje: '',
    mensajePersonalizado: '',
    esPersonalizado: false
  });
  
  const [configuracionOriginal, setConfiguracionOriginal] = useState<ConfiguracionCorreo>({
    asunto: '',
    mensaje: '',
    mensajePersonalizado: '',
    esPersonalizado: false
  });

  const [formatoCorreo, setFormatoCorreo] = useState<FormatoCorreo>({
    id: undefined,
    tipoFuente: 'Arial',
    tamanoFuente: 14,
    esCursiva: false,
    esSubrayado: false,
    colorTexto: '#000000'
  });
  const [formatoOriginal, setFormatoOriginal] = useState<FormatoCorreo>({
    id: undefined,
    tipoFuente: 'Arial',
    tamanoFuente: 14,
    esCursiva: false,
    esSubrayado: false,
    colorTexto: '#000000'
  });
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [logo, setLogo] = useState<string>(logoService.obtenerLogo());

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      setCargando(true);
      
      // Cargar configuración de mensaje
      const configMensaje = await configuracionCorreoService.obtenerConfiguracionMensaje();
      if (configMensaje.exitoso && configMensaje.configuracion) {
        // Obtener el mensaje base (protegido) desde el backend
        const mensajeBase = await configuracionCorreoService.obtenerMensajePredeterminado();
        const nuevaConfig = {
          asunto: configMensaje.configuracion.asunto || 'Factura Electrónica',
          // El contenido protegido debe provenir del mensaje predeterminado
          mensaje: configMensaje.configuracion.mensaje || mensajeBase.mensaje || 'Estimado cliente,\n\nSe ha generado su factura electrónica.\n\n{mensajePersonalizado}\n\nDatos de la factura\nSerie: {serie}\nFolio: {folio}\nUUID: {uuid}\nRFC Receptor: {rfcEmisor}\n\nGracias por su preferencia.\n\nAtentamente,\nEquipo de Facturación Cibercom',
          // El mensaje personalizado viene directamente del servicio
          mensajePersonalizado: configMensaje.configuracion.mensajePersonalizado || '',
          esPersonalizado: configMensaje.configuracion.esPersonalizado || false
        };
        setConfiguracion(nuevaConfig);
        setConfiguracionOriginal(nuevaConfig);
      }

      // Cargar configuración de formato
      const configFormatoResponse = await formatoCorreoService.obtenerConfiguracionActiva();
      if (configFormatoResponse.exitoso && configFormatoResponse.configuracion) {
        const cfg = configFormatoResponse.configuracion;
        const nuevoFormato: FormatoCorreo = {
          id: cfg.id,
          tipoFuente: cfg.tipoFuente,
          tamanoFuente: cfg.tamanoFuente,
          esCursiva: cfg.esCursiva,
          esSubrayado: cfg.esSubrayado,
          colorTexto: cfg.colorTexto
        };
        setFormatoCorreo(nuevoFormato);
        setFormatoOriginal(nuevoFormato);
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar las configuraciones' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const initLogo = async () => {
      const backendLogo = await logoService.obtenerLogoActivoBackend();
      if (backendLogo && backendLogo.trim() !== '') {
        setLogo(backendLogo);
        // Mantener copia local para vista previa inmediata
        logoService.guardarLogo(backendLogo);
      } else {
        const savedLogo = logoService.obtenerLogo();
        setLogo(savedLogo);
      }
    };
    initLogo();
  }, []);

  // Función para combinar el mensaje protegido con el mensaje personalizado
  const combinarMensajes = () => {
    const personal = (configuracion.mensajePersonalizado || '').trim();
    let protegido = (configuracion.mensaje || '').trim();
    
    if (personal) {
      // Si hay mensaje personalizado, reemplazar la variable {mensajePersonalizado} con el contenido
      protegido = protegido.replace('{mensajePersonalizado}', personal);
    } else {
      // Si no hay mensaje personalizado, remover la variable {mensajePersonalizado}
      protegido = protegido.replace('{mensajePersonalizado}', '');
    }
    
    // Reemplazar variables de la factura con datos específicos para la vista previa
    protegido = protegido.replace('{serie}', 'A');
    protegido = protegido.replace('{folio}', '1');
    protegido = protegido.replace('{uuid}', 'E75C5FA6-F107-4EA5-A665-4FE383CE30BE');
    protegido = protegido.replace('{rfcEmisor}', 'DEF987654G12');
    protegido = protegido.replace('{facturaInfo}', 'Serie: A, Folio: 1');
    
    return protegido;
  };

  const handleLogoChange = async (logoBase64: string) => {
    setLogo(logoBase64);
    if (logoBase64 && logoBase64.trim() !== '') {
      logoService.guardarLogo(logoBase64);
      try {
        await logoService.guardarLogoBackend(logoBase64);
      } catch (e) {
        console.warn('No se pudo persistir logo en backend en cambio inmediato:', e);
      }
    } else {
      logoService.eliminarLogo();
      try {
        await logoService.guardarLogoBackend('');
      } catch {}
    }
  };

  const handleGuardarConfiguracion = async () => {
    setGuardando(true);
    setMensaje(null);
  
    try {
      // Guardar configuración de mensaje (enviar formato y la parte personalizada en una sola llamada)
      const mensajePersonalizadoSolo = (configuracion.mensajePersonalizado || '').trim();
      const responseMensaje = await configuracionCorreoService.guardarConfiguracionMensaje({
        asunto: configuracion.asunto,
        mensaje: mensajePersonalizadoSolo,
        esPersonalizado: mensajePersonalizadoSolo.length > 0,
        formatoCorreo: {
          ...formatoCorreo
        }
      });
  
      // Persistir logo actual en backend para PDF
      try {
        await logoService.guardarLogoBackend(logo || '');
      } catch (e) {
        console.warn('No se pudo persistir logo en backend al guardar configuración:', e);
      }
  
      if (responseMensaje.exitoso) {
        // Actualizar los originales para reflejar el guardado
        setConfiguracionOriginal({ 
          ...configuracion, 
          mensajePersonalizado: mensajePersonalizadoSolo,
          esPersonalizado: mensajePersonalizadoSolo.length > 0 
        });
        setFormatoOriginal({ ...formatoCorreo });
        setMensaje({ tipo: 'success', texto: 'Configuraciones guardadas correctamente' });
        setTimeout(() => setMensaje(null), 3000);
      } else {
        let mensajeError = responseMensaje.mensaje || 'Error al guardar la configuración del mensaje';
        setMensaje({ tipo: 'error', texto: mensajeError });
      }
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar las configuraciones' });
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurarPredeterminado = async () => {
    try {
      const response = await configuracionCorreoService.restaurarMensajePredeterminado();
      if (response.exitoso && response.configuracion) {
        const nuevaConfig = {
          asunto: response.configuracion.asunto || 'Factura Electrónica - {facturaInfo}',
          mensaje: response.configuracion.mensaje || '',
          mensajePersonalizado: 'Tenga un buen día',
          esPersonalizado: true
        };
        setConfiguracion(nuevaConfig);
        setMensaje({ tipo: 'success', texto: 'Mensaje predeterminado restaurado' });
        setTimeout(() => setMensaje(null), 3000);
      }
    } catch (error) {
      console.error('Error al restaurar mensaje predeterminado:', error);
      setMensaje({ tipo: 'error', texto: 'Error al restaurar el mensaje predeterminado' });
    }
  };

  const handleCancelar = () => {
    setConfiguracion({ ...configuracionOriginal });
    setFormatoCorreo({ ...formatoOriginal });
    setMensaje(null);
  };

  const hayChangios = () => {
    return configuracion.asunto !== configuracionOriginal.asunto ||
           configuracion.mensaje !== configuracionOriginal.mensaje ||
           configuracion.mensajePersonalizado !== configuracionOriginal.mensajePersonalizado ||
           configuracion.esPersonalizado !== configuracionOriginal.esPersonalizado ||
           formatoCorreo.tipoFuente !== formatoOriginal.tipoFuente ||
           formatoCorreo.tamanoFuente !== formatoOriginal.tamanoFuente ||
           formatoCorreo.esCursiva !== formatoOriginal.esCursiva ||
           formatoCorreo.esSubrayado !== formatoOriginal.esSubrayado ||
     
           formatoCorreo.colorTexto !== formatoOriginal.colorTexto;
  };


  if (cargando) {
    return (
      <div className="animate-fadeIn p-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
          Configuración de Mensajes de Correo
        </h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  // Evita template literals complejos dentro del JSX para el bloque de mensaje
  const mensajeClassNameBase = 'mt-4 p-3 rounded-md text-sm ';
  const mensajeColorClass = mensaje?.tipo === 'success'
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  const mensajeClassName = mensajeClassNameBase + mensajeColorClass;

  return (
    <div className="animate-fadeIn p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Configuración de Mensajes de Correo
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <LogoUploader onLogoChange={handleLogoChange} initialLogo={logo} />
          {/* Panel de configuración */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Configurar Mensaje de Facturación
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mensaje Principal (Datos de Factura - Protegido)
                </label>
                <ProtectedMessageEditor
                  value={configuracion.mensaje}
                  onChange={(value) => setConfiguracion({
                    ...configuracion, 
                    mensaje: value,
                    esPersonalizado: true
                  })}
                  placeholder="Contenido del mensaje que se enviará con las facturas"
                  rows={6}
                  required
                  isProtected={true}
                  compact={true}
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mensaje Personalizado (Opcional)
                </label>
                <textarea
                  value={configuracion.mensajePersonalizado || ''}
                  onChange={(e) => setConfiguracion({
                    ...configuracion, 
                    mensajePersonalizado: e.target.value,
                    esPersonalizado: true
                  })}
                  placeholder="Añada un mensaje personalizado (ej. Feliz Navidad, Felices Fiestas, etc.)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            
            {/* Selector de tipo de fuente */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de fuente
              </label>
              <select
                value={formatoCorreo.tipoFuente}
                onChange={e => {
                  const nuevo = {
                    ...formatoCorreo,
                    tipoFuente: e.target.value
                  };
                  setFormatoCorreo(nuevo);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            {/* Input para tamaño de fuente */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tamaño de fuente (px)
              </label>
              <input
                type="number"
                min={8}
                max={48}
                step={1}
                value={formatoCorreo.tamanoFuente}
                onChange={e => {
                  const value = Number(e.target.value);
                  const tamanoSeguro = Number.isFinite(value) && value > 0 ? value : 14;
                  const nuevo = {
                    ...formatoCorreo,
                    tamanoFuente: tamanoSeguro
                  };
                  setFormatoCorreo(nuevo);
                }}
                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Entre 8 y 48 px. Si se deja vacío o inválido, se usará 14 px por defecto.</span>
            </div>
            
            {/* Opciones de estilo de texto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estilo de texto
              </label>
              <div className="flex space-x-4">
                {/* Negrita eliminada */}
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formatoCorreo.esCursiva}
                    onChange={e => {
                      const nuevo = {
                        ...formatoCorreo,
                        esCursiva: e.target.checked
                      };
                      setFormatoCorreo(nuevo);
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  />
                  <span className="ml-2 text-sm italic">Cursiva</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formatoCorreo.esSubrayado}
                    onChange={e => {
                      const nuevo = {
                        ...formatoCorreo,
                        esSubrayado: e.target.checked
                      };
                      setFormatoCorreo(nuevo);
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  />
                  <span className="ml-2 text-sm underline">Subrayado</span>
                </label>
                

              </div>
            </div>

            {/* Selector de color de texto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color de texto
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formatoCorreo.colorTexto || '#000000'}
                  onChange={e => {
                    const nuevo = {
                      ...formatoCorreo,
                      colorTexto: e.target.value
                    };
                    setFormatoCorreo(nuevo);
                  }}
                  className="w-16 h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatoCorreo.colorTexto}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full ${configuracion.esPersonalizado ? 'bg-blue-500' : 'bg-green-500'}`}></span>
              <span>
                {configuracion.esPersonalizado ? 'Mensaje personalizado' : 'Mensaje predeterminado del sistema'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleGuardarConfiguracion}
                disabled={guardando || !hayChangios()}
                className="flex-1"
              >
                {guardando ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
              
              {hayChangios() && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelar}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleRestaurarPredeterminado}
              className="w-full"
            >
              Restaurar Mensaje Predeterminado
            </Button>
          </div>
        </Card>
        </div>

        {/* Panel de vista previa */}
        <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Vista Previa del Mensaje
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vista previa del mensaje final:
              </label>
              <div 
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap min-h-[200px]"
                style={{
                  fontFamily: formatoCorreo.tipoFuente,
                  fontSize: `${formatoCorreo.tamanoFuente}px`,
                  fontStyle: formatoCorreo.esCursiva ? 'italic' : 'normal',
                  textDecoration: formatoCorreo.esSubrayado ? 'underline' : 'none',
                  fontWeight: 'normal',
                  color: formatoCorreo.colorTexto
                }}
              >
                {combinarMensajes() || 'Sin mensaje configurado'}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-2">Variables disponibles:</p>
              <div className="space-y-1">
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{facturaInfo}'}</code> - Serie y folio de la factura</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{serie}'}</code> - Serie de la factura</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{folio}'}</code> - Folio de la factura</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{uuid}'}</code> - UUID de la factura</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{rfcEmisor}'}</code> - RFC del emisor</div>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>

      {mensaje && (
        <div className={mensajeClassName}>
          {mensaje.texto}
        </div>
      )}
    </div>
  );
};