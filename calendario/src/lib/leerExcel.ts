import { readSheet } from 'read-excel-file/universal'
import { filasAActividades, type Resultado } from './actividades'

/** Lee la primera hoja de un .xlsx y la convierte en actividades.
 *  Todo ocurre en el navegador: el archivo no se envía a ningún servidor. */
export async function leerExcel(archivo: File): Promise<Resultado> {
  const filas = await readSheet(archivo)
  return filasAActividades(filas as unknown[][])
}
