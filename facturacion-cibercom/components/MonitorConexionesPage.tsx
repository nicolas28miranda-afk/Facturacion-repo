import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

type StoreStatus = {
  id: string;
  name: string;
  online: boolean;
  lastSeen?: string;
};

const statusColors = {
  online: 'bg-green-500 border-green-600',
  offline: 'bg-red-500 border-red-600',
};

export const MonitorConexionesPage: React.FC = () => {
  const [stores, setStores] = useState<StoreStatus[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiBase =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_API_URL) ||
    'http://localhost:8080';

  const totals = useMemo(() => {
    const online = stores.filter((s) => s.online).length;
    return { online, offline: stores.length - online, total: stores.length };
  }, [stores]);

  const loadStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
         const resp = await fetch(`${apiBase}/api/logs/stores/status?simulate=true`, {
        headers: { Accept: 'application/json' },
      });
      const raw = await resp.text();
      if (!resp.ok) throw new Error(raw || 'Respuesta no exitosa del backend');
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error('El backend no devolvió JSON. Revisa VITE_API_URL o que el endpoint esté arriba. Respuesta: ' + raw.slice(0, 200));
      }
      const merged: StoreStatus[] = [...(data.online || []), ...(data.offline || [])];
      setStores(merged);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || 'No se pudo obtener el estado de las tiendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
    const id = setInterval(loadStatuses, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Monitor de Conexiones
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Semáforo de 5 tiendas. Verde = conectada, Rojo = sin conexión.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-700">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-200">
                  Online {totals.online}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-700">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-200">
                  Offline {totals.offline}
                </span>
              </div>
              <Button
                variant="primary"
                onClick={loadStatuses}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Actualizando...' : 'Actualizar semáforo'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stores.map((store) => {
              const online = store.online;
              const lastSeen = store.lastSeen ? new Date(store.lastSeen).toLocaleString() : null;
              return (
                <div
                  key={store.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    online
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-4 w-4 rounded-full border ${online ? statusColors.online : statusColors.offline}`}
                      aria-label={online ? 'En línea' : 'Desconectada'}
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {store.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {store.id}
                      </div>
                      {lastSeen && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Último visto: {lastSeen}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      online
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-100'
                    }`}
                  >
                    {online ? 'Conectada' : 'Sin conexión'}
                  </span>
                </div>
              );
            })}
            {!loading && stores.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Sin datos de tiendas para mostrar.
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Última actualización: {lastUpdated.toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MonitorConexionesPage;
