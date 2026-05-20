export interface ClienteDatos {
  rfc: string;
  razonSocial?: string;
  nombre?: string;
  paterno?: string;
  materno?: string;
  pais?: string;
  domicilioFiscal?: string;
  regimenFiscal?: string;
  usoCfdi?: string;
}

export interface ClienteResponse {
  encontrado: boolean;
  cliente?: ClienteDatos | null;
}

class ClienteService {
  private baseUrl = 'http://localhost:8080/api';

  public buildRfc(iniciales: string, fecha: string, homoclave: string): string {
    return `${(iniciales || '').toUpperCase()}${fecha || ''}${(homoclave || '').toUpperCase()}`.trim();
  }

  public async buscarClientePorRFC(rfc: string): Promise<ClienteResponse> {
    const normalized = (rfc || '').toUpperCase();
    if (!normalized) {
      return { encontrado: false, cliente: null };
    }
    try {
      const resp = await fetch(`${this.baseUrl}/clientes/${encodeURIComponent(normalized)}`);
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data) {
        return { encontrado: false, cliente: null };
      }
      const cliente: ClienteDatos | undefined = data?.cliente ? {
        rfc: data.cliente.rfc,
        razonSocial: data.cliente.razonSocial,
        nombre: data.cliente.nombre,
        paterno: data.cliente.paterno,
        materno: data.cliente.materno,
        pais: data.cliente.pais,
        domicilioFiscal: data.cliente.domicilioFiscal,
        regimenFiscal: data.cliente.regimenFiscal,
        usoCfdi: data.cliente.usoCfdi,
      } : undefined;
      return { encontrado: Boolean(data?.encontrado && cliente), cliente: cliente ?? null };
    } catch (e) {
      console.error('Error consultando cliente por RFC', e);
      return { encontrado: false, cliente: null };
    }
  }
}

export const clienteService = new ClienteService();