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
