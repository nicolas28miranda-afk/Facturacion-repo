// facturacion-cibercom/components/ProfileSelectorPage.tsx
import React, { useState } from 'react';
import { Button } from './Button';

interface ProfileSelectorPageProps {
  profiles: string[];
  onSelect: (profile: string) => void;
}

export const ProfileSelectorPage: React.FC<ProfileSelectorPageProps> = ({ profiles, onSelect }) => {
  const [selected, setSelected] = useState(profiles[0] || '');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Selección de Perfil/Ubicación</h2>
        <select
          className="w-full mb-4 p-2 border rounded"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {profiles.map(profile => (
            <option key={profile} value={profile}>{profile}</option>
          ))}
        </select>
        <Button className="w-full" onClick={() => onSelect(selected)}>
          Aceptar
        </Button>
      </div>
    </div>
  );
};