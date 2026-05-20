/**
 * Script para generar un archivo XLSX template con las columnas:
 * UUID, Folio, Tienda, Fecha
 * 
 * Uso: node generate-template-xlsx.js
 */

import { utils, writeFile } from 'xlsx';

// Crear datos de ejemplo (solo encabezados y filas vacías)
const data = [
  ['UUID', 'Folio', 'Tienda', 'Fecha'], // Encabezados
  // Filas vacías para ejemplo (el usuario puede llenarlas)
  ['', '', '', ''],
  ['', '', '', ''],
  ['', '', '', ''],
];

// Crear workbook y worksheet
const ws = utils.aoa_to_sheet(data);

// Ajustar ancho de columnas
ws['!cols'] = [
  { wch: 40 }, // UUID (más ancho)
  { wch: 15 }, // Folio
  { wch: 15 }, // Tienda
  { wch: 15 }, // Fecha
];

const wb = utils.book_new();
utils.book_append_sheet(wb, ws, 'Datos');

// Guardar el archivo
const filename = 'template_facturas.xlsx';
writeFile(wb, filename);

console.log(`Archivo ${filename} generado exitosamente.`);
console.log('Columnas: UUID, Folio, Tienda, Fecha');

