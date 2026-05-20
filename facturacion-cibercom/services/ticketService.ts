import { apiUrl, getHeadersWithUsuario } from './api';

export interface Ticket {
  idTicket?: number;
  tiendaId?: number;
  codigoTienda?: string;
  terminalId?: number;
  fecha: string; // ISO yyyy-MM-dd
  folio: number;
  total?: number;
  subtotal?: number;
  iva?: number;
  formaPago?: string; // 01, 03, etc.
  rfcCliente?: string;
  nombreCliente?: string;
  status?: number; // 1 activo, 0 cancelado
  idFactura?: number;
}

export interface TicketSearchFilters {
  codigoTienda?: string;
  tiendaId?: number;
  terminalId?: number;
  fecha?: string; // yyyy-MM-dd
  folio?: number;
  status?: number;
  rfcCliente?: string;
}

export interface TicketDetalle {
  idDetalle: number;
  idTicket?: number;
  productoId?: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  precioUnitario?: number;
  descuento?: number;
  subtotal?: number;
  ivaPorcentaje?: number;
  ivaImporte?: number;
  iepsPorcentaje?: number;
  iepsImporte?: number;
  total?: number;
}

class TicketService {
  private baseUrl = apiUrl('/tickets');

  /**
   * Busca tickets en el backend.
   */
  async buscarTickets(filters: TicketSearchFilters): Promise<Ticket[]> {
    try {
      console.log('Buscando tickets con filtros:', filters);
      const resp = await fetch(`${this.baseUrl}/buscar`, {
        method: 'POST',
        headers: getHeadersWithUsuario(),
        body: JSON.stringify(filters)
      });
      
      console.log('Respuesta del servidor - Status:', resp.status, resp.statusText);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Error HTTP:', resp.status, errorText);
        throw new Error(`HTTP ${resp.status}: ${errorText}`);
      }
      
      const data = await resp.json();
      console.log('Datos recibidos del backend:', data);
      
      // El backend devuelve { success, message, data: Ticket[] }
      if (Array.isArray(data)) {
        console.log('Tickets encontrados (array directo):', data.length);
        return data as Ticket[];
      }
      if (data?.data && Array.isArray(data.data)) {
        console.log('Tickets encontrados (data.data):', data.data.length);
        return data.data as Ticket[];
      }
      if (data?.tickets && Array.isArray(data.tickets)) {
        console.log('Tickets encontrados (data.tickets):', data.tickets.length);
        return data.tickets as Ticket[];
      }
      if (data?.resultados && Array.isArray(data.resultados)) {
        console.log('Tickets encontrados (data.resultados):', data.resultados.length);
        return data.resultados as Ticket[];
      }
      
      console.warn('No se encontró array de tickets en la respuesta:', data);
      return [];
    } catch (err) {
      console.error('Error al buscar tickets:', err);
      throw err; // Lanzar el error en lugar de devolver datos simulados
    }
  }

  /**
   * Busca tickets por ID_FACTURA.
   */
  async buscarTicketsPorIdFactura(idFactura: number): Promise<Ticket[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/por-id-factura/${encodeURIComponent(String(idFactura))}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) return data as Ticket[];
      if (data?.data && Array.isArray(data.data)) return data.data as Ticket[];
      if (data?.tickets && Array.isArray(data.tickets)) return data.tickets as Ticket[];
      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Busca tickets por ID_TICKET.
   */
  async buscarTicketsPorIdTicket(idTicket: number): Promise<Ticket[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/por-id-ticket/${encodeURIComponent(String(idTicket))}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) return data as Ticket[];
      if (data?.data && Array.isArray(data.data)) return data.data as Ticket[];
      if (data?.tickets && Array.isArray(data.tickets)) return data.tickets as Ticket[];
      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Busca detalles de tickets por ID_FACTURA.
   */
  async buscarDetallesPorIdFactura(idFactura: number): Promise<TicketDetalle[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/detalles/por-id-factura/${encodeURIComponent(String(idFactura))}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) return data as TicketDetalle[];
      if (data?.data && Array.isArray(data.data)) return data.data as TicketDetalle[];
      if (data?.detalles && Array.isArray(data.detalles)) return data.detalles as TicketDetalle[];
      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Busca detalles de un ticket por ID_TICKET.
   */
  async buscarDetallesPorIdTicket(idTicket: number): Promise<TicketDetalle[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/${encodeURIComponent(String(idTicket))}/detalles`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) return data as TicketDetalle[];
      if (data?.data && Array.isArray(data.data)) return data.data as TicketDetalle[];
      if (data?.detalles && Array.isArray(data.detalles)) return data.detalles as TicketDetalle[];
      return [];
    } catch (err) {
      return [];
    }
  }
}

export const ticketService = new TicketService();
export type { TicketService };