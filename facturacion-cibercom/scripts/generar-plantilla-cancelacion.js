// Script para generar plantilla de cancelación masiva
// Ejecutar con: node scripts/generar-plantilla-cancelacion.js

const XLSX = require('xlsx');

// Crear workbook
const wb = XLSX.utils.book_new();

// Datos de ejemplo
const datos = [
  ['UUID', 'FOLIO', 'TIENDA', 'FECHA'],
  ['12345678-1234-1234-1234-123456789012', 'FAC-001', 'S001', '2024-01-15'],
  ['23456789-2345-2345-2345-234567890123', 'FAC-002', 'S002', '2024-01-16'],
  ['34567890-3456-3456-3456-345678901234', 'FAC-003', 'S003', '2024-01-17'],
];

// Crear worksheet
const ws = XLSX.utils.aoa_to_sheet(datos);

// Ajustar ancho de columnas
ws['!cols'] = [
  { wch: 40 }, // UUID
  { wch: 15 }, // FOLIO
  { wch: 10 }, // TIENDA
  { wch: 12 }, // FECHA
];

// Agregar worksheet al workbook
XLSX.utils.book_append_sheet(wb, ws, 'Cancelaciones');

// Guardar archivo
XLSX.writeFile(wb, 'plantilla_cancelacion_masiva.xlsx');

console.log('✅ Plantilla creada: plantilla_cancelacion_masiva.xlsx');
console.log('\n📋 Columnas requeridas:');
console.log('  - UUID: UUID de la factura a cancelar (obligatorio)');
console.log('  - FOLIO: Folio de la factura (obligatorio)');
console.log('  - TIENDA: Código de la tienda (obligatorio)');
console.log('  - FECHA: Fecha de la factura en formato YYYY-MM-DD (obligatorio)');
console.log('\n💡 Puedes abrir el archivo en Excel, llenar con tus UUIDs y guardarlo.');
