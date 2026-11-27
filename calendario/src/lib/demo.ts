import { filasAActividades, type Resultado } from './actividades'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type Ejemplo = {
  /** Días a partir de hoy. */
  en: number
  hora: string
  dependencia: string
  enlace: string
  telefono: string
  observacion: string
  /** Fuerza un día de la semana equivocado para mostrar cómo se ve un aviso. */
  diaMalEscrito?: boolean
}

const EJEMPLOS: Ejemplo[] = [
  { en: 1, hora: '9:00', dependencia: 'Secretaría de Educación', enlace: 'María Pérez', telefono: '300 123 4567', observacion: 'Capacitación que doy yo. Llevar proyector.' },
  { en: 1, hora: '2:30 PM', dependencia: 'Alcaldía Municipal', enlace: 'Juan Gómez', telefono: '310 555 0101', observacion: 'Reunión de seguimiento' },
  { en: 3, hora: '8:00 AM a 12:00 PM', dependencia: 'Hospital Regional', enlace: 'Ana Ríos', telefono: '320 777 8899', observacion: 'Capacitación que recibo' },
  { en: 6, hora: '15:00', dependencia: 'Gobernación', enlace: 'Luis Mora', telefono: '311 222 3344', observacion: 'Reunión de coordinación', diaMalEscrito: true },
  { en: 9, hora: '10:00', dependencia: 'Universidad Regional', enlace: 'Sofía Herrera', telefono: '312 440 9087', observacion: 'Capacitación que doy yo' },
  { en: 14, hora: '9:30', dependencia: 'Personería Municipal', enlace: 'Carlos Díaz', telefono: '315 888 0022', observacion: 'Reunión' },
]

/** Filas con la misma forma que salen de un Excel, con fechas cercanas a `hoy`. */
export function filasDemo(hoy: Date = new Date()): unknown[][] {
  const encabezado = ['Dependencia', 'Fechas', 'Días', 'Hora', 'Enlace', 'Teléfono en enlace', 'Observación']
  const filas = EJEMPLOS.map((e) => {
    const f = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + e.en))
    const dia = DIAS[(f.getUTCDay() + (e.diaMalEscrito ? 1 : 0)) % 7]
    return [e.dependencia, f, dia, e.hora, e.enlace, e.telefono, e.observacion]
  })
  return [encabezado, ...filas]
}

export function resultadoDemo(hoy?: Date): Resultado {
  return filasAActividades(filasDemo(hoy))
}
