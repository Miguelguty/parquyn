// Genera public/ejemplo.xlsx: un Excel de ejemplo con las columnas del calendario.
// Uso: node scripts/make-sample.mjs
import writeExcelFile from 'write-excel-file/node'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/ejemplo.xlsx')

const h = (value) => ({ value, fontWeight: 'bold' })
const d = (y, m, day) => ({ value: new Date(Date.UTC(y, m - 1, day)), type: Date, format: 'dd/mm/yyyy' })

const rows = [
  [h('Dependencia'), h('Fechas'), h('Días'), h('Hora'), h('Enlace'), h('Teléfono en enlace'), h('Observación')],
  ['Secretaría de Educación', d(2026, 12, 1), 'Martes', '9:00', 'María Pérez', '300 123 4567', 'Capacitación que doy yo. Llevar proyector.'],
  ['Alcaldía Municipal', d(2026, 12, 3), 'Jueves', '14:30', 'Juan Gómez', '310 555 0101', 'Reunión de seguimiento'],
  ['Hospital Regional', d(2026, 12, 3), 'Jueves', '8:00 AM', 'Ana Ríos', '320 777 8899', 'Capacitación que recibo'],
  ['Gobernación', d(2026, 12, 10), 'Jueves', '3:00 PM', 'Luis Mora', '311 222 3344', ''],
]

await writeExcelFile(rows).toFile(out)
console.log('Escrito', out)
