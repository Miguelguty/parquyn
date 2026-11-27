/** Entrega un archivo generado al usuario.
 *  - Dentro de claude.ai la página no puede descargar por su cuenta: usa la capacidad `downloads`.
 *  - En un navegador normal, usa una descarga común. */

type Guardador = { save: (peticion: { filename: string; data: Blob }) => Promise<{ status: string }> }
type Entorno = { use?: (nombre: string) => Promise<unknown> }

declare global {
  interface Window {
    claude?: Entorno
  }
}

export type ResultadoDescarga = 'guardado' | 'cancelado' | 'no-disponible' | 'error'

export async function descargar(nombre: string, archivo: Blob): Promise<ResultadoDescarga> {
  const entorno = window.claude
  if (entorno?.use) {
    let guardador: Guardador | null = null
    try {
      guardador = (await entorno.use('downloads')) as Guardador | null
    } catch {
      guardador = null
    }
    // En este visor las descargas directas no funcionan: sin la capacidad no hay cómo entregar el archivo.
    if (!guardador) return 'no-disponible'
    try {
      await guardador.save({ filename: nombre, data: archivo })
      return 'guardado'
    } catch (e) {
      const codigo = (e as { code?: string } | null)?.code
      if (codigo === 'declined') return 'cancelado'
      if (codigo === 'unavailable' || codigo === 'host_unavailable' || codigo === 'not_granted') return 'no-disponible'
      return 'error'
    }
  }

  try {
    const url = URL.createObjectURL(archivo)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    return 'guardado'
  } catch {
    return 'error'
  }
}
