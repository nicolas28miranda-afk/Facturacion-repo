import { useEffect, useState, useCallback } from 'react';
import { tiendaService, Tienda } from '../services/tiendaService';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface UseTiendasOptionsResult {
  options: SelectOption[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook para consultar tiendas del backend y formatearlas como opciones para SelectField
 * Por defecto obtiene tiendas activas. Usa VITE_API_BASE_URL para la URL base del backend.
 */
export function useTiendasOptions(): UseTiendasOptionsResult {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarTiendas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await tiendaService.obtenerTiendasActivas();
      if (resp.success && Array.isArray(resp.data)) {
        const tiendas = resp.data as Tienda[];
        const mapped = tiendas.map(t => ({
          value: t.codigoTienda,
          label: `${t.nombreTienda} (${t.codigoTienda})`
        }));
        setOptions(mapped);
      } else {
        setError(resp.message || 'No fue posible obtener las tiendas');
        setOptions([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTiendas();
  }, [cargarTiendas]);

  return { options, loading, error, refresh: cargarTiendas };
}