import React, { useState } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { FileInputField } from './FileInputField';
import { TIENDA_OPTIONS } from '../constants';
import { ticketService, Ticket, TicketDetalle } from '../services/ticketService';

interface ConsultaIndividualFormData {
  tienda: string;
  fecha: string;
  terminal: string; // opcional, numérico si aplica
  folio: string;
}

const initialIndividualFormData: ConsultaIndividualFormData = {
  tienda: TIENDA_OPTIONS[0]?.value || '',
  fecha: new Date().toISOString().split('T')[0],
  terminal: '',
  folio: '',
};

export const ConsultasBoletasPage: React.FC = () => {
  const [individualFormData, setIndividualFormData] = useState<ConsultaIndividualFormData>(initialIndividualFormData);
  const [massFile, setMassFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [detallesPorTicket, setDetallesPorTicket] = useState<Record<number, TicketDetalle[]>>({});
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleIndividualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIndividualFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setMassFile(file);
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBuscando(true);
    setMostrarResultados(false);
    try {
      const folioNum = parseInt(individualFormData.folio, 10);
      if (isNaN(folioNum)) {
        setErrorMsg('Ingresa un folio de ticket válido (numérico).');
        setBuscando(false);
        return;
      }
      const terminalNum = individualFormData.terminal ? parseInt(individualFormData.terminal, 10) : undefined;
      const filtros = {
        codigoTienda: individualFormData.tienda && individualFormData.tienda !== 'Todas' ? individualFormData.tienda : undefined,
        fecha: individualFormData.fecha || undefined,
        terminalId: terminalNum && !isNaN(terminalNum) ? terminalNum : undefined,
        folio: folioNum,
      };
      const lista = await ticketService.buscarTickets(filtros);
      setTickets(lista);
      setMostrarResultados(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al consultar tickets');
    } finally {
      setBuscando(false);
    }
  };

  const handleMassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (massFile) {
      console.log('Consultando Boletas Masiva, Archivo:', massFile.name);
      setErrorMsg(null);
      setBuscando(true);
      setMostrarResultados(false);
      try {
        // TODO: Implementar procesamiento masivo de archivo
        // Por ahora, solo mostramos un mensaje
        setErrorMsg('Funcionalidad de consulta masiva pendiente de implementar');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error al procesar archivo masivo');
      } finally {
        setBuscando(false);
      }
    } else {
      alert('Por favor, seleccione un archivo para la consulta masiva.');
    }
  };
  
  const fileHelpText = "El archivo debe ser .xlsx o .csv y contener los datos de los tickets a consultar.";

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  };

  return (
    <div className="space-y-8">
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          --Ingresa los datos para consulta de tickets--
        </h3>
        <form onSubmit={handleIndividualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-2 items-end">
            <SelectField label="Tienda:" name="tienda" value={individualFormData.tienda} onChange={handleIndividualChange} options={TIENDA_OPTIONS} className="lg:col-span-1" />
            <FormField label="Fecha:" name="fecha" type="date" value={individualFormData.fecha} onChange={handleIndividualChange} className="lg:col-span-1" />
            <FormField label="Terminal (ID opcional):" name="terminal" value={individualFormData.terminal} onChange={handleIndividualChange} className="lg:col-span-1" />
            <FormField label="Folio de ticket:" name="folio" value={individualFormData.folio} onChange={handleIndividualChange} className="lg:col-span-1" />
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-2 items-end">
            <div className="lg:col-span-4"></div>
            <div className="flex justify-start lg:justify-end pt-1">
                <Button type="submit" variant="primary">
                    {buscando ? 'Consultando...' : 'Consultar'}
                </Button>
            </div>
          </div>
          {errorMsg && (
            <div className="text-red-600 dark:text-red-400 text-sm mt-2">{errorMsg}</div>
          )}
        </form>
      </Card>

      <Card>
        <form onSubmit={handleMassSubmit} className="space-y-4">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Consulta Masiva
            </h3>
          <FileInputField
            label="Archivo para Consulta Masiva:"
            name="consultaMasivaFile"
            onChange={handleFileChange}
            accept=".xlsx, .csv"
            helpText={fileHelpText}
          />
          <div className="mt-4 flex justify-start">
            <Button type="submit" variant="primary">
              Consulta Masiva
            </Button>
          </div>
        </form>
      </Card>

      {!mostrarResultados ? (
        <div className="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md min-h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          Los resultados de la consulta de tickets aparecerán aquí.
        </div>
      ) : (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Resultados de la búsqueda
          </h3>
          
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron tickets que coincidan con los criterios de búsqueda.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tienda</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Terminal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Folio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subtotal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estatus</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tickets.map((t) => (
                      <React.Fragment key={t.idTicket ?? `${t.codigoTienda}-${t.folio}`}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{t.codigoTienda || ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{t.fecha || ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{t.terminalId ?? ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{t.folio ?? ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs" title={t.nombreCliente || t.rfcCliente || ''}>
                            {t.nombreCliente || t.rfcCliente || ''}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(t.subtotal ?? 0)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(t.iva ?? 0)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatearMoneda(t.total ?? 0)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              t.status === 1 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : t.status === 0
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {t.status === 1 ? 'Activo' : t.status === 0 ? 'Cancelado' : 'Desconocido'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={async () => {
                                if (!t.idTicket) return;
                                const detalles = await ticketService.buscarDetallesPorIdTicket(t.idTicket);
                                setDetallesPorTicket(prev => ({ ...prev, [t.idTicket!]: detalles }));
                              }}
                            >
                              Ver detalles
                            </Button>
                          </td>
                        </tr>
                        {/* Detalles */}
                        {t.idTicket && Array.isArray(detallesPorTicket[t.idTicket]) && detallesPorTicket[t.idTicket]?.length > 0 && (
                          <tr>
                            <td colSpan={10} className="px-4 py-3">
                              <div className="table-wrap">
                                <table className="min-w-full border">
                                  <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Descripción</th>
                                      <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cantidad</th>
                                      <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unidad</th>
                                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Precio</th>
                                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subtotal</th>
                                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IVA</th>
                                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detallesPorTicket[t.idTicket].map((d) => (
                                      <tr key={d.idDetalle} className="border-t">
                                        <td className="px-2 py-1">{d.descripcion ?? ''}</td>
                                        <td className="px-2 py-1 text-center">{d.cantidad ?? ''}</td>
                                        <td className="px-2 py-1 text-center">{d.unidad ?? ''}</td>
                                        <td className="px-2 py-1 text-right">{formatearMoneda(d.precioUnitario ?? 0)}</td>
                                        <td className="px-2 py-1 text-right">{formatearMoneda(d.subtotal ?? 0)}</td>
                                        <td className="px-2 py-1 text-right">{formatearMoneda(d.ivaImporte ?? 0)}</td>
                                        <td className="px-2 py-1 text-right">{formatearMoneda(d.total ?? 0)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {tickets.length} tickets
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};
