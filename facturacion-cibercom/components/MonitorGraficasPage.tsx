import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';

// Simulación de datos para los gráficos
const generarDatosAleatorios = (cantidad: number, min: number, max: number) => {
  return Array.from({ length: cantidad }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

// Componente para gráfico de barras
const GraficoBarras: React.FC<{ datos: number[], etiquetas: string[], color: string }> = ({ datos, etiquetas, color }) => {
  const alturaMaxima = Math.max(...datos);
  
  return (
    <div className="flex items-end justify-between h-full w-full">
      {datos.map((valor, index) => {
        const alturaRelativa = (valor / alturaMaxima) * 100;
        return (
          <div key={index} className="flex flex-col items-center" style={{ width: `${100 / datos.length}%` }}>
            <div 
              className={`w-3/4 ${color}`} 
              style={{ height: `${alturaRelativa}%` }}
              title={`${etiquetas[index]}: ${valor}`}
            ></div>
            <span className="text-xs mt-2 text-gray-600 dark:text-gray-300 truncate w-full text-center">
              {etiquetas[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Componente para gráfico circular
const GraficoCircular: React.FC<{ datos: number[], etiquetas: string[], colores: string[] }> = ({ datos, etiquetas, colores }) => {
  const total = datos.reduce((acc, curr) => acc + curr, 0);
  let acumulado = 0;
  
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {datos.map((valor, index) => {
            const porcentaje = (valor / total) * 100;
            const anguloInicio = (acumulado / total) * 360;
            acumulado += valor;
            const anguloFin = (acumulado / total) * 360;
            
            // Convertir ángulos a coordenadas para el arco SVG
            const inicioX = 50 + 40 * Math.cos((anguloInicio - 90) * Math.PI / 180);
            const inicioY = 50 + 40 * Math.sin((anguloInicio - 90) * Math.PI / 180);
            const finX = 50 + 40 * Math.cos((anguloFin - 90) * Math.PI / 180);
            const finY = 50 + 40 * Math.sin((anguloFin - 90) * Math.PI / 180);
            
            // Determinar si el arco es mayor que 180 grados
            const largeArcFlag = porcentaje > 50 ? 1 : 0;
            
            return (
              <path 
                key={index}
                d={`M 50 50 L ${inicioX} ${inicioY} A 40 40 0 ${largeArcFlag} 1 ${finX} ${finY} Z`}
                fill={colores[index % colores.length]}
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {total}
        </div>
      </div>
      <div className="ml-4 space-y-1">
        {etiquetas.map((etiqueta, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 mr-2" 
              style={{ backgroundColor: colores[index % colores.length] }}
            ></div>
            <span className="text-xs">{etiqueta}: {datos[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para gráfico de línea
const GraficoLinea: React.FC<{ datos: number[], etiquetas: string[], color: string }> = ({ datos, etiquetas, color }) => {
  const alturaMaxima = Math.max(...datos);
  const puntos = datos.map((valor, index) => {
    const x = (index / (datos.length - 1)) * 100;
    const y = 100 - ((valor / alturaMaxima) * 100);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="h-full w-full relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={puntos}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        {datos.map((valor, index) => {
          const x = (index / (datos.length - 1)) * 100;
          const y = 100 - ((valor / alturaMaxima) * 100);
          return (
            <g key={index}>
              <circle 
                cx={x} 
                cy={y} 
                r="2" 
                fill="white" 
                stroke={color} 
                strokeWidth="1"
              />
              {/* Tooltip personalizado usando elementos SVG text */}
              <text 
                x={x}
                y={y - 5}
                textAnchor="middle"
                fontSize="3"
                fill="#333"
                opacity="0"
                className="hover:opacity-100 transition-opacity duration-200"
              >
                {`${etiquetas[index]}: ${valor}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {etiquetas.map((etiqueta, index) => (
          <span key={index} className="text-xs text-gray-600 dark:text-gray-300">
            {etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
};

export const MonitorGraficasPage: React.FC = () => {
  const [searchDate, setSearchDate] = useState('');
  const [refreshTime, setRefreshTime] = useState('5');
  const [datosGenerados, setDatosGenerados] = useState<{
    generados: { datos: number[], etiquetas: string[] },
    cancelados: { datos: number[], etiquetas: string[] },
    sustituidos: { datos: number[], etiquetas: string[] }
  }>({ 
    generados: { datos: [], etiquetas: [] },
    cancelados: { datos: [], etiquetas: [] },
    sustituidos: { datos: [], etiquetas: [] }
  });

  // Generar datos de ejemplo al cargar o actualizar
  const generarDatos = () => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const tipos = ['Facturas', 'Boletas', 'REPs', 'Notas'];
    
    setDatosGenerados({
      generados: {
        datos: generarDatosAleatorios(12, 50, 200),
        etiquetas: meses
      },
      cancelados: {
        datos: generarDatosAleatorios(4, 10, 50),
        etiquetas: tipos
      },
      sustituidos: {
        datos: generarDatosAleatorios(7, 5, 30),
        etiquetas: dias
      }
    });
  };

  // Generar datos iniciales
  useEffect(() => {
    generarDatos();
    // Establecer un intervalo para actualizar los datos según el tiempo de refresco
    const intervalo = setInterval(() => {
      generarDatos();
    }, parseInt(refreshTime) * 1000);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalo);
  }, [refreshTime]); // Actualizar cuando cambie el tiempo de refresco

  // Colores para los gráficos - no utilizado
  // Colores para los gráficos - no utilizado
  // const colores = [
  //   'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
  //   'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  // ];
  const coloresPie = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-primary dark:text-secondary whitespace-nowrap mb-0">Fecha de Gráficas:</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-primary dark:text-secondary whitespace-nowrap mb-0">Tiempo de refresco:</label>
              <select
                value={refreshTime}
                onChange={(e) => setRefreshTime(e.target.value)}
                className="rounded-lg p-2 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 w-24"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={generarDatos}>Actualizar</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gráfica de Bitácoras Generados</h2>
        <div className="h-64 w-full bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
          {datosGenerados.generados.datos.length > 0 ? (
            <GraficoBarras 
              datos={datosGenerados.generados.datos} 
              etiquetas={datosGenerados.generados.etiquetas} 
              color="bg-blue-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gráfica de Bitácoras Cancelados</h2>
          <div className="h-48 w-full bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            {datosGenerados.cancelados.datos.length > 0 && (
              <GraficoCircular 
                datos={datosGenerados.cancelados.datos} 
                etiquetas={datosGenerados.cancelados.etiquetas} 
                colores={coloresPie}
              />
            )}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gráfica de Bitácoras Sustituidos</h2>
          <div className="h-48 w-full bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            {datosGenerados.sustituidos.datos.length > 0 && (
              <GraficoLinea 
                datos={datosGenerados.sustituidos.datos} 
                etiquetas={datosGenerados.sustituidos.etiquetas} 
                color="#F59E0B"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};