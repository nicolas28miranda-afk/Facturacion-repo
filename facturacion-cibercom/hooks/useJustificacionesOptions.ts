import { useEffect, useState, useCallback } from 'react';
import { justificacionService } from '../services/justificacionService';
// Usar la interfaz local en lugar de importar
interface SelectOption {
  value: string | number;
  label: string;
}

export function useJustificacionesOptions() {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await justificacionService.listar();
      const opts: SelectOption[] = list.map(j => ({
        value: String(j.id),
        label: j.descripcion,
      }));
      setOptions(opts);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar justificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, error, refresh: load };
}