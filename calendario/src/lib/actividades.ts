// Convierte las filas de un Excel (columnas: Dependencia, Fechas, Días, Hora,
// Enlace, Teléfono en enlace, Observación) en actividades para el calendario.
// Todo el código de esta pieza es puro (sin pantalla) para poder probarlo.

export type Actividad = {
  id: string
  /** Número de fila en el Excel (1 = encabezado), para que puedas encontrarla. */
  fila: number
  dependencia: string
  /** Fecha en formato AAAA-MM-DD. */
  fecha: string
  /** Día de la semana calculado a partir de la fecha, en minúsculas. */
  dia: string
  /** Hora de inicio "HH:MM" (24 h), o null si no tiene o no se entendió. */
  hora: string | null
  horaFin: string | null
  /** Texto original de la hora cuando no se pudo entender. */
  horaTexto: string
  enlace: string
  telefono: string
  observacion: string
  /** Cosas dudosas de esta fila (por ejemplo, el día no coincide con la fecha). */
  avisos: string[]
}

export type Problema = { fila: number; mensaje: string }
export type Resultado = { actividades: Actividad[]; problemas: Problema[] }

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const sinTildes = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '')
const norm = (v: unknown) => sinTildes(String(v ?? '')).toLowerCase().trim().replace(/\s+/g, ' ')
const dos = (n: number) => String(n).padStart(2, '0')

function texto(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function fechaValida(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${dos(m)}-${dos(d)}`
}

/** Devuelve la fecha como "AAAA-MM-DD", o null si no se entiende. Las fechas
 *  de texto se leen con el día primero (3/12/2026 = 3 de diciembre). */
export function parseFecha(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null

  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null
    // Excel entrega las fechas como medianoche UTC: se leen con métodos UTC
    // para que la zona horaria del equipo no las corra de día.
    return fechaValida(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate())
  }

  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 1 || v > 2958465) return null
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000)
    return fechaValida(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
  }

  const s = norm(v)
  if (!s) return null

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[t ].*)?$/.exec(s)
  if (m) return fechaValida(+m[1], +m[2], +m[3])

  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/.exec(s)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return fechaValida(y, +m[2], +m[1])
  }

  m = /^(\d{1,2})\s*(?:de\s+)?([a-z]+)\.?\s*(?:de(?:l)?\s+)?(\d{4})$/.exec(s)
  if (m) {
    const palabra = m[2] === 'setiembre' ? 'septiembre' : m[2]
    const idx = palabra.length >= 3 ? MESES.findIndex((n) => n.startsWith(palabra)) : -1
    if (idx >= 0) return fechaValida(+m[3], idx + 1, +m[1])
  }

  return null
}

function aHHMM(totalMin: number): string {
  const t = ((Math.round(totalMin) % 1440) + 1440) % 1440
  return `${dos(Math.floor(t / 60))}:${dos(t % 60)}`
}

function parseUnaHora(s: string): string | null {
  const m = /^(\d{1,2})(?:([:.h])(\d{2}))?\s*(h|hs|hrs|horas)?\s*(am|pm)?$/.exec(s)
  if (!m) return null
  const [, hh, sep, mm, sufijo, mer] = m
  // Un número suelto ("9") es ambiguo: se exige ":", "h" o am/pm.
  if (!sep && !sufijo && !mer) return null
  let h = +hh
  const min = mm ? +mm : 0
  if (min > 59) return null
  if (mer) {
    if (h < 1 || h > 12) return null
    if (mer === 'am') h = h === 12 ? 0 : h
    else h = h === 12 ? 12 : h + 12
  } else if (h > 23) {
    return null
  }
  return `${dos(h)}:${dos(min)}`
}

/** Entiende una hora o un rango de horas. Devuelve null si no la entiende. */
export function parseHora(v: unknown): { inicio: string; fin: string | null } | null {
  if (v === null || v === undefined || v === '') return null

  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null
    const min =
      v.getUTCHours() * 60 + v.getUTCMinutes() + v.getUTCSeconds() / 60 + v.getUTCMilliseconds() / 60000
    return { inicio: aHHMM(min), fin: null }
  }

  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 0) return null
    const frac = v - Math.floor(v)
    // Entero >= 1 (por ejemplo, solo una fecha) no trae hora.
    if (v >= 1 && frac === 0) return null
    if (v < 1 && v === 0) return { inicio: '00:00', fin: null }
    return { inicio: aHHMM(frac * 1440), fin: null }
  }

  const s = norm(v).replace(/\b([ap])\s*\.?\s*m\b\.?/g, '$1m')
  if (!s) return null
  const partes = s.split(/\s+(?:a|al|hasta)\s+|\s*[-–—]\s*/).map((p) => p.trim())
  if (partes.length === 1) {
    const inicio = parseUnaHora(partes[0])
    return inicio ? { inicio, fin: null } : null
  }
  if (partes.length === 2) {
    const inicio = parseUnaHora(partes[0])
    const fin = parseUnaHora(partes[1])
    return inicio && fin ? { inicio, fin } : null
  }
  return null
}

type Campo = 'dependencia' | 'fecha' | 'dia' | 'hora' | 'enlace' | 'telefono' | 'observacion'

function campoDeEncabezado(h: unknown): Campo | null {
  const n = norm(h)
  if (!n) return null
  if (n.startsWith('dependencia')) return 'dependencia'
  if (n.startsWith('fecha')) return 'fecha'
  if (n.startsWith('dia')) return 'dia'
  if (n.startsWith('hora')) return 'hora'
  if (n.startsWith('tel') || n.startsWith('celular')) return 'telefono'
  if (n.startsWith('enlace')) return 'enlace'
  if (n.startsWith('observacion') || n.startsWith('nota')) return 'observacion'
  return null
}

const filaVacia = (fila: unknown[]) => fila.every((c) => c === null || c === undefined || texto(c) === '')

/** Revisa si el día escrito en el Excel coincide con el que cae la fecha. */
function avisoDia(escrito: string, fecha: string, calculado: string): string | null {
  const n = norm(escrito).replace(/\./g, '')
  if (!n) return null
  const [y, m, d] = fecha.split('-').map(Number)
  const conocido = DIAS.some((x) => norm(x).startsWith(n.slice(0, 3)) && n.length >= 3)
  if (!conocido) return `No entendí el día "${escrito}"; usé el que corresponde a la fecha (${calculado}).`
  if (norm(calculado).startsWith(n.slice(0, 3))) return null
  return `En el Excel dice "${escrito}" pero el ${d}/${m}/${y} cae ${calculado}.`
}

/** Punto de entrada: recibe las filas tal como salen del Excel (primera hoja). */
export function filasAActividades(filas: unknown[][]): Resultado {
  if (filas.length === 0) {
    return { actividades: [], problemas: [{ fila: 1, mensaje: 'El archivo está vacío.' }] }
  }

  // El encabezado suele ser la fila 1, pero se busca en las primeras 10 por si hay un título arriba.
  let filaEnc = -1
  for (let i = 0; i < Math.min(filas.length, 10); i++) {
    if (filas[i].some((c) => campoDeEncabezado(c) === 'fecha')) {
      filaEnc = i
      break
    }
  }
  if (filaEnc < 0) {
    const vistas = filas[0].map(texto).filter(Boolean).join(', ') || '(ninguna)'
    return {
      actividades: [],
      problemas: [
        { fila: 1, mensaje: `No encontré la columna "Fechas". Las columnas que vi son: ${vistas}.` },
      ],
    }
  }

  const col: Partial<Record<Campo, number>> = {}
  filas[filaEnc].forEach((c, i) => {
    const campo = campoDeEncabezado(c)
    if (campo && col[campo] === undefined) col[campo] = i
  })
  const celda = (fila: unknown[], campo: Campo): unknown =>
    col[campo] === undefined ? null : fila[col[campo]]

  const actividades: Actividad[] = []
  const problemas: Problema[] = []

  for (let i = filaEnc + 1; i < filas.length; i++) {
    const fila = filas[i]
    if (filaVacia(fila)) continue
    const nFila = i + 1

    const fecha = parseFecha(celda(fila, 'fecha'))
    if (!fecha) {
      const crudo = celda(fila, 'fecha')
      const t = crudo instanceof Date ? crudo.toISOString() : texto(crudo)
      problemas.push({
        fila: nFila,
        mensaje: t ? `No pude leer la fecha "${t}".` : 'La fecha está vacía.',
      })
      continue
    }

    const [y, m, d] = fecha.split('-').map(Number)
    const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
    const avisos: string[] = []

    const diaEscrito = texto(celda(fila, 'dia'))
    const a = diaEscrito ? avisoDia(diaEscrito, fecha, dia) : null
    if (a) avisos.push(a)

    const horaCruda = celda(fila, 'hora')
    const h = parseHora(horaCruda)
    let horaTexto = ''
    if (!h && texto(horaCruda) !== '') {
      horaTexto = texto(horaCruda)
      avisos.push(`No entendí la hora "${horaTexto}"; la dejé como texto.`)
    }

    actividades.push({
      id: `${nFila}-${fecha}`,
      fila: nFila,
      dependencia: texto(celda(fila, 'dependencia')),
      fecha,
      dia,
      hora: h ? h.inicio : null,
      horaFin: h ? h.fin : null,
      horaTexto,
      enlace: texto(celda(fila, 'enlace')),
      telefono: texto(celda(fila, 'telefono')),
      observacion: texto(celda(fila, 'observacion')),
      avisos,
    })
  }

  actividades.sort(
    (p, q) =>
      p.fecha.localeCompare(q.fecha) ||
      (p.hora ?? '99:99').localeCompare(q.hora ?? '99:99') ||
      p.fila - q.fila,
  )

  return { actividades, problemas }
}
