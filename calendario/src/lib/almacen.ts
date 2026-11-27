import type { Actividad, Problema } from './actividades'

export type Datos = {
  nombre: string
  actividades: Actividad[]
  problemas: Problema[]
}

const CLAVE = 'calendario-actividades-v1'

/** Guarda en este dispositivo (localStorage) para no tener que volver a cargar el Excel. */
export function guardar(datos: Datos | null): void {
  try {
    if (datos) localStorage.setItem(CLAVE, JSON.stringify(datos))
    else localStorage.removeItem(CLAVE)
  } catch {
    // Si el navegador no deja guardar (modo privado, etc.), la app sigue funcionando sin memoria.
  }
}

export function cargar(): Datos | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const d = JSON.parse(crudo) as Datos
    if (!d || !Array.isArray(d.actividades) || !Array.isArray(d.problemas)) return null
    return d
  } catch {
    return null
  }
}
