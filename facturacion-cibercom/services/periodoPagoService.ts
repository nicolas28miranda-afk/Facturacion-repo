export type PeriodicidadPago = 'QUINCENAL' | 'MENSUAL';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDDMMYYYY(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function ultimoDiaDelMes(year: number, monthIndex0: number): Date {
  // monthIndex0: 0-11
  return new Date(year, monthIndex0 + 1, 0);
}

export function calcularPeriodoActual(periodicidad: PeriodicidadPago, fechaISO?: string): { inicio: Date; fin: Date; label: string } {
  const ref = fechaISO ? new Date(`${fechaISO}T00:00:00`) : new Date();
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();
  let inicio: Date;
  let fin: Date;

  if (periodicidad === 'MENSUAL') {
    inicio = new Date(y, m, 1);
    fin = ultimoDiaDelMes(y, m);
  } else {
    // QUINCENAL: 1-15 y 16-último día del mes
    if (d <= 15) {
      inicio = new Date(y, m, 1);
      fin = new Date(y, m, 15);
    } else {
      inicio = new Date(y, m, 16);
      fin = ultimoDiaDelMes(y, m);
    }
  }

  const label = `${formatDDMMYYYY(inicio)} al ${formatDDMMYYYY(fin)}`;
  return { inicio, fin, label };
}

export function calcularPeriodoLabel(periodicidad: PeriodicidadPago, fechaISO?: string): string {
  return calcularPeriodoActual(periodicidad, fechaISO).label;
}