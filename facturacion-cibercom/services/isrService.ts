// Calcula la deducción de ISR mensual a partir de la tabla ANUAL 2025 (imagen proporcionada).
// Estrategia: anualizar percepciones (percepción mensual * 12),
// aplicar cuota fija + porcentaje sobre excedente del límite inferior, y prorratear a mensual.

export type PeriodoCalculo = 'MENSUAL' | 'ANUAL';

interface TramoISR {
  limInf: number;      // Límite inferior ANUAL
  limSup: number;      // Límite superior ANUAL (Infinity para último tramo)
  cuotaFija: number;   // Cuota fija ANUAL
  tasa: number;        // Porcentaje sobre excedente (decimal), ANUAL
}

// Tabla ISR 2025 (Personas físicas residentes en México) - ANUAL
// Fuente: tabla de la imagen proporcionada por el usuario
const TABLA_ISR_2025_ANUAL: TramoISR[] = [
  { limInf: 0,         limSup: 123_580.80,  cuotaFija: 0.00,       tasa: 0.0192 },
  { limInf: 123_580.81, limSup: 249_243.12, cuotaFija: 2_376.28,   tasa: 0.0640 },
  { limInf: 249_243.13, limSup: 392_840.52, cuotaFija: 10_997.58,  tasa: 0.1088 },
  { limInf: 392_840.53, limSup: 750_000.00, cuotaFija: 34_067.58,  tasa: 0.1600 },
  { limInf: 750_000.01, limSup: 1_000_000.00, cuotaFija: 108_067.58, tasa: 0.1792 },
  { limInf: 1_000_000.01, limSup: Infinity, cuotaFija: 166_067.58, tasa: 0.3192 },
];

function encontrarTramoISRAnual(baseGravableAnual: number): TramoISR {
  for (const tramo of TABLA_ISR_2025_ANUAL) {
    if (baseGravableAnual >= tramo.limInf && baseGravableAnual <= tramo.limSup) {
      return tramo;
    }
  }
  // Por seguridad, si no se encuentra (no debería ocurrir), usar último tramo
  return TABLA_ISR_2025_ANUAL[TABLA_ISR_2025_ANUAL.length - 1];
}

export function calcularISRAnual(baseGravableAnual: number): number {
  if (!isFinite(baseGravableAnual) || baseGravableAnual <= 0) return 0;
  const tramo = encontrarTramoISRAnual(baseGravableAnual);
  const excedente = Math.max(0, baseGravableAnual - tramo.limInf);
  const impuesto = tramo.cuotaFija + excedente * tramo.tasa;
  return Math.max(0, impuesto);
}

// Deducción mensual de ISR basada en percepciones mensuales usando la tabla anual
export function calcularDeduccionISR(percepcionMensual: number, periodo: PeriodoCalculo = 'MENSUAL'): number {
  if (!isFinite(percepcionMensual) || percepcionMensual <= 0) return 0;
  if (periodo === 'ANUAL') {
    // Si la percepción ya es anual
    return calcularISRAnual(percepcionMensual);
  }
  const baseAnual = percepcionMensual * 12;
  const impuestoAnual = calcularISRAnual(baseAnual);
  const deduccionMensual = impuestoAnual / 12;
  return Math.max(0, deduccionMensual);
}

// Helper para formatear a cadena con dos decimales
export function formatMoney2(value: number): string {
  if (!isFinite(value)) return '0.00';
  return Number(value).toFixed(2);
}