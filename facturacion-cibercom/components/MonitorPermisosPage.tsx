import React, { useState } from 'react';
import { Card } from './Card';
import { Select } from './common/Select';
import { Button } from './Button';

export const MonitorPermisosPage: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [permissionValues, setPermissionValues] = useState<Record<string, string>>({});

  const profiles = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'usuario_cancelado', label: 'Usuario Cancelado' },
    { value: 'jefe_credito', label: 'Jefe de Crédito' },
    { value: 'operador_credito', label: 'Operador de Crédito' },
    { value: 'usuario_consulta', label: 'Usuario de Consulta' },
    { value: 'jefe_credito_avanzado', label: 'Jefe de Crédito Avanzado' },
    { value: 'operador_credito_avanzado', label: 'Operador de Crédito Avanzado' },
    { value: 'produccion', label: 'Producción' },
    { value: 'soporte_operativo', label: 'Soporte Operativo Crédito' },
    { value: 'usuario_consulta_ci', label: 'Usuario de Consulta CI' },
    { value: 'ventas_institucionales', label: 'Ventas Institucionales' },
  ];

  const permissions = [
    { id: 'graficas', label: 'Permiso de Gráficas' },
    { id: 'bitacoras', label: 'Permiso de Bitácoras' },
    { id: 'permisos', label: 'Permiso de Permisos' },
    { id: 'disponibilidad', label: 'Permiso de Disponibilidad' },
    { id: 'logs', label: 'Permiso de Logs' },
    { id: 'decodificador', label: 'Permiso del decodificador de facturas' },
  ];

  const handlePermissionChange = (permissionId: string, value: string) => {
    setPermissionValues(prev => ({
      ...prev,
      [permissionId]: value
    }));
  };

  const handleUpdatePermissions = () => {
    console.log('Updating permissions:', {
      profile: selectedProfile,
      permissions: permissionValues
    });
    // Aquí iría la llamada a la API
  };

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Lista de Permisos</h1>
        <form className="space-y-6">
          <div className="mb-6">
            <label className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Perfil:</label>
            <Select
              value={selectedProfile}
              onChange={(value) => setSelectedProfile(value)}
              options={[
                { value: '', label: 'Seleccionar perfil' },
                ...profiles
              ]}
              className="w-64"
            />
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
            <div className="bg-primary dark:bg-secondary text-white p-3 grid grid-cols-2 rounded-t-lg">
              <div>Permiso</div>
              <div className="text-right">Valor</div>
            </div>
            {permissions.map((permission) => (
              <div 
                key={permission.id}
                className="grid grid-cols-2 p-3 items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="text-primary dark:text-secondary">{permission.label}</div>
                <div className="text-right">
                  <Select
                    value={permissionValues[permission.id] || ''}
                    onChange={(value) => handlePermissionChange(permission.id, value)}
                    options={[
                      { value: 'permitido', label: 'Permitido' },
                      { value: 'denegado', label: 'Denegado' }
                    ]}
                    className="w-32 ml-auto"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button type="button" variant="primary" onClick={handleUpdatePermissions}>
              Actualizar Permisos
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};