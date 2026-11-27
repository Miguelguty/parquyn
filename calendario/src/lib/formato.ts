import type { Actividad } from './actividades'

const dos = (n: number) => String(n).padStart(2, '0')

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
/** La semana empieza en lunes. */
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const iso = (a: number, m: number, d: number) => `${a}-${dos(m + 1)}-${dos(d)}`

/** Fecha de hoy según el reloj del equipo, como AAAA-MM-DD. */
export function hoyISO(): string {
  const d = new Date()
  return iso(d.getFullYear(), d.getMonth(), d.getDate())
}

/** "14:30" -> "2:30 PM" */
export function formatHora(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const sufijo = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${dos(m)} ${sufijo}`
}

export function textoHora(a: Actividad): string {
  if (a.hora) return a.horaFin ? `${formatHora(a.hora)} – ${formatHora(a.horaFin)}` : formatHora(a.hora)
  return a.horaTexto || 'Sin hora'
}

/** "2026-12-03" -> "jueves 3 de diciembre de 2026" */
export function fechaLarga(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const dia = DIAS_LARGOS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${dia} ${d} de ${MESES[m - 1].toLowerCase()} de ${y}`
}

/** Enlace para llamar desde el celular; null si no hay dígitos suficientes. */
export function telHref(telefono: string): string | null {
  const limpio = telefono.replace(/[^\d+]/g, '')
  return limpio.replace(/\D/g, '').length >= 5 ? `tel:${limpio}` : null
}
