import writeExcelFile from 'write-excel-file/universal'
import { TITULO_SIN_FECHA, type Actividad, type Pendiente } from './actividades'

type Celda = string | Date | null

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const vacio = (s: string | undefined) => !s || s.trim() === ''

function textoHora(a: { hora: string | null; horaFin: string | null; horaTexto: string }): string | null {
  if (a.hora) return a.horaFin ? `${a.hora} – ${a.horaFin}` : a.hora
  return a.horaTexto || null
}

/** La hoja que se exporta, como filas de celdas (texto, fecha o vacío).
 *  Mismo formato que se carga, para poder volver a cargarla sin perder nada. */
export function filasParaExportar(actividades: Actividad[], sinFecha: Pendiente[]): Celda[][] {
  const hay = (campo: 'lugar' | 'enlace' | 'telefono') =>
    actividades.some((a) => !vacio(a[campo])) || sinFecha.some((p) => !vacio(p[campo]))
  const conLugar = hay('lugar')
  const conEnlace = hay('enlace')
  const conTelefono = hay('telefono')
  const conEstado = actividades.some((a) => a.cancelada)

  const encabezado: string[] = [
    'Dependencia', 'Fecha', 'Día', 'Hora',
    ...(conLugar ? ['Lugar'] : []),
    ...(conEnlace ? ['Enlace'] : []),
    ...(conTelefono ? ['Teléfono'] : []),
    ...(conEstado ? ['Estado'] : []),
    'Observaciones',
  ]

  const fila = (
    d: { dependencia: string; hora: string | null; horaFin: string | null; horaTexto: string; lugar?: string; enlace: string; telefono: string; observacion: string },
    fecha: Date | null,
    dia: string | null,
    estado: string | null,
  ): Celda[] => [
    d.dependencia,
    fecha,
    dia,
    textoHora(d),
    ...(conLugar ? [d.lugar || null] : []),
    ...(conEnlace ? [d.enlace || null] : []),
    ...(conTelefono ? [d.telefono || null] : []),
    ...(conEstado ? [estado] : []),
    d.observacion || null,
  ]

  const filas: Celda[][] = [encabezado]
  for (const a of actividades) {
    const [y, m, d] = a.fecha.split('-').map(Number)
    filas.push(fila(a, new Date(Date.UTC(y, m - 1, d)), mayuscula(a.dia), a.cancelada ? 'Cancelada' : 'Programada'))
  }

  if (sinFecha.length > 0) {
    const vacia = (): Celda[] => encabezado.map(() => null)
    filas.push(vacia())
    const titulo = vacia()
    titulo[0] = TITULO_SIN_FECHA
    filas.push(titulo)
    for (const p of sinFecha) filas.push(fila(p, null, null, null))
  }
  return filas
}

const ANCHOS: Record<string, number> = {
  Dependencia: 34, Fecha: 12, Día: 12, Hora: 16, Lugar: 24, Enlace: 22, Teléfono: 16, Estado: 12, Observaciones: 40,
}

/** Genera el archivo .xlsx. */
export async function crearExcel(actividades: Actividad[], sinFecha: Pendiente[]): Promise<Blob> {
  const filas = filasParaExportar(actividades, sinFecha)
  const datos = filas.map((fila, i) =>
    fila.map((v) => {
      if (i === 0) return { value: v as string, fontWeight: 'bold' as const }
      if (v instanceof Date) return { value: v, type: Date, format: 'dd/mm/yyyy' }
      return v === null ? null : { value: v }
    }),
  )
  const columns = filas[0].map((nombre) => ({ width: ANCHOS[nombre as string] ?? 16 }))
  return writeExcelFile(datos, { sheet: 'Cronograma', columns }).toBlob()
}

/** Nombre sugerido para el archivo, p. ej. calendario-2026-11-27.xlsx */
export function nombreArchivo(hoy: string): string {
  return `calendario-${hoy}.xlsx`
}

const ENCABEZADOS_FORMATO = ['Dependencia', 'Fecha', 'Día', 'Hora', 'Lugar', 'Enlace', 'Teléfono', 'Observaciones']

/** Filas de la hoja de instrucciones: columna, qué poner, ejemplo. */
const INSTRUCCIONES: [string, string, string][] = [
  ['Dependencia', 'Nombre de la dependencia. Si la dejas vacía, la actividad se muestra como "(sin dependencia)".', 'Secretaría de Educación'],
  ['Fecha', 'Fecha de la actividad. Escríbela como 3/12/2026 (día primero) o 3 de diciembre de 2026. Si no escribes el año (23 de noviembre), la app usa el año actual y te lo avisa. Si todavía no tiene fecha, déjala vacía: la actividad queda en la lista "Sin fecha" hasta que la programes (necesita al menos la dependencia).', '3/12/2026'],
  ['Día', 'Opcional. La app lo calcula a partir de la fecha. Si lo escribes y no coincide, te avisa.', 'Jueves'],
  ['Hora', 'Una hora (9:00, 14:30, 3 PM) o un rango.', '10:00 – 12:00'],
  ['Lugar', 'Opcional.', 'Auditorio principal'],
  ['Enlace', 'Opcional. Persona de contacto.', 'María Pérez'],
  ['Teléfono', 'Opcional.', '300 123 4567'],
  ['Observaciones', 'Opcional. Cualquier nota.', 'Llevar proyector'],
]

/** Excel vacío con las columnas que entiende la app, listo para llenar y volver a cargar.
 *  La hoja "Cronograma" va sin filas de ejemplo (para que no se carguen por error); los ejemplos van en "Instrucciones". */
export async function crearFormato(): Promise<Blob> {
  const negrita = (value: string) => ({ value, fontWeight: 'bold' as const })
  const texto = (value: string) => ({ value, wrap: true, alignVertical: 'top' as const })

  const cronograma = [ENCABEZADOS_FORMATO.map(negrita)]
  const instrucciones = [
    [negrita('Cómo llenar la hoja "Cronograma"'), null, null],
    [texto('Una fila por actividad. No cambies los títulos de la primera fila; las columnas opcionales se pueden dejar vacías.'), null, null],
    [texto('Solo se lee la primera hoja (Cronograma). Esta hoja de instrucciones se ignora. Se aceptan archivos .xlsx y .xlsm.'), null, null],
    [texto('Para dejar una actividad cancelada, agrega una columna llamada Estado y escribe Cancelada en su fila.'), null, null],
    [null, null, null],
    [negrita('Columna'), negrita('Qué poner'), negrita('Ejemplo')],
    ...INSTRUCCIONES.map(([c, q, e]) => [texto(c), texto(q), texto(e)]),
  ]

  return writeExcelFile(
    [
      { data: cronograma, sheet: 'Cronograma', columns: ENCABEZADOS_FORMATO.map((n) => ({ width: ANCHOS[n] ?? 16 })) },
      { data: instrucciones, sheet: 'Instrucciones', columns: [{ width: 18 }, { width: 70 }, { width: 24 }] },
    ],
  ).toBlob()
}

export const NOMBRE_FORMATO = 'formato-calendario.xlsx'
