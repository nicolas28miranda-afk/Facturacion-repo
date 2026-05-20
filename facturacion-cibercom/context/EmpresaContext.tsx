// src/context/EmpresaContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface EmpresaInfo {
  nombre: string;
  rfc: string;
}

interface EmpresaContextType {
  empresaInfo: EmpresaInfo;
  setEmpresaInfo: React.Dispatch<React.SetStateAction<EmpresaInfo>>;
}

const defaultEmpresaInfo: EmpresaInfo = {
  nombre: 'Empresa Ejemplo S.A. de C.V.',
  rfc: 'EEJ920629TE3',
};

export const EmpresaContext = createContext<EmpresaContextType>({
  empresaInfo: defaultEmpresaInfo,
  setEmpresaInfo: () => {},
});

export const EmpresaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo>(() => {
    const stored = localStorage.getItem('empresaInfo');
    return stored ? JSON.parse(stored) : defaultEmpresaInfo;
  });

  return (
    <EmpresaContext.Provider value={{ empresaInfo, setEmpresaInfo }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => useContext(EmpresaContext);
