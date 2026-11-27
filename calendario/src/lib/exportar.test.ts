import { readSheet } from 'read-excel-file/universal'
import { describe, expect, it } from 'vitest'
import { filasAActividades, type Actividad, type Pendiente } from './actividades'
import { crearExcel, filasParaExportar } from './exportar'

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

const act = (extra: Partial<Actividad>): Actividad => ({
  id: 'fila-2',
  fila: 2,
  dependencia: 'LOCALIDAD 1',
  fecha: '2026-12-01',
  dia: 'martes',
  hora: '10:00',
  horaFin: '12:00',
  horaTexto: '',
  lugar: '',
  enlace: '',
  telefono: '',
  observacion: '',
  avisos: [],
  ...extra,
})

const pend = (extra: Partial<Pendiente> = {}): Pendiente => ({
  id: 'fila-10',
  fila: 10,
  dependencia: 'GEPM',
  hora: null,
  horaFin: null,
  horaTexto: '',
  lugar: '',
  enlace: '',
  telefono: '',
  observacion: '',
  ...extra,
})

describe('filasParaExportar', () => {
  it('usa las columnas del cronograma y deja fuera las opcionales que están vacías', () => {
    const filas = filasParaExportar([act({ lugar: 'Auditorio', observacion: 'Fecha original: 10/12' })], [])
    expect(filas[0]).toEqual(['Dependencia', 'Fecha', 'Día', 'Hora', 'Lugar', 'Observaciones'])
    expect(filas[1]).toEqual(['LOCALIDAD 1', utc(2026, 12, 1), 'Martes', '10:00 – 12:00', 'Auditorio', 'Fecha original: 10/12'])
  })
  it('sin ningún dato opcional queda solo lo básico', () => {
    expect(filasParaExportar([act({})], [])[0]).toEqual(['Dependencia', 'Fecha', 'Día', 'Hora', 'Observaciones'])
  })
  it('incluye Enlace y Teléfono cuando alguna actividad los tiene', () => {
    const f = filasParaExportar([act({ enlace: 'Ana', telefono: '300 111' })], [])
    expect(f[0]).toEqual(['Dependencia', 'Fecha', 'Día', 'Hora', 'Enlace', 'Teléfono', 'Observaciones'])
  })
  it('agrega la columna Estado solo si hay canceladas', () => {
    const f = filasParaExportar([act({}), act({ id: 'fila-3', fila: 3, cancelada: true })], [])
    expect(f[0]).toContain('Estado')
    expect(f.slice(1).map((r) => r[f[0].indexOf('Estado')])).toEqual(['Programada', 'Cancelada'])
  })
  it('escribe la hora tal como se entiende, o el texto original si no se entendió', () => {
    const f = filasParaExportar(
      [act({ hora: '14:30', horaFin: null }), act({ id: 'x', hora: null, horaFin: null, horaTexto: 'por confirmar' }), act({ id: 'y', hora: null, horaFin: null })],
      [],
    )
    expect(f.slice(1).map((r) => r[3])).toEqual(['14:30', 'por confirmar', null])
  })
  it('pone las filas sin fecha al final, bajo el título de sección', () => {
    const f = filasParaExportar([act({})], [pend({ hora: '10:00', horaFin: '12:00', observacion: 'Por programar' })])
    expect(f[2].every((c) => c === null)).toBe(true)
    expect(f[3][0]).toBe('Sin fecha por ahora (fuera de este cronograma)')
    expect(f[4][0]).toBe('GEPM')
    expect(f[4][1]).toBeNull()
    expect(f[4][3]).toBe('10:00 – 12:00')
    expect(f[4][f[0].length - 1]).toBe('Por programar')
  })
  it('no agrega la sección cuando no hay filas sin fecha', () => {
    expect(filasParaExportar([act({})], [])).toHaveLength(2)
  })
})

describe('ida y vuelta: exportar y volver a cargar no pierde nada', () => {
  const actividades = [
    act({ lugar: 'Auditorio', observacion: 'Fecha original: 10/12' }),
    act({ id: 'fila-3', fila: 3, dependencia: 'HACIENDA', fecha: '2026-12-10', dia: 'jueves', hora: '14:30', horaFin: null, enlace: 'Ana', telefono: '300 111 2222' }),
    act({ id: 'fila-4', fila: 4, dependencia: 'RENTA', fecha: '2026-12-15', dia: 'martes', hora: null, horaFin: null, horaTexto: 'por confirmar', cancelada: true }),
  ]
  const sinFecha = [pend({ hora: '10:00', horaFin: '12:00', lugar: 'Sede norte', observacion: 'Por programar' }), pend({ id: 'fila-11', fila: 11, dependencia: 'PES' })]

  const comparable = (a: Actividad) => ({
    dependencia: a.dependencia, fecha: a.fecha, dia: a.dia, hora: a.hora, horaFin: a.horaFin, horaTexto: a.horaTexto,
    lugar: a.lugar ?? '', enlace: a.enlace, telefono: a.telefono, observacion: a.observacion, cancelada: a.cancelada ?? false,
  })

  it('en filas', () => {
    const r = filasAActividades(filasParaExportar(actividades, sinFecha))
    expect(r.problemas).toEqual([])
    expect(r.actividades.map(comparable)).toEqual(actividades.map(comparable))
    expect(r.sinFecha.map((p) => [p.dependencia, p.hora, p.horaFin, p.lugar, p.observacion])).toEqual(
      sinFecha.map((p) => [p.dependencia, p.hora, p.horaFin, p.lugar, p.observacion]),
    )
  })

  it('a través de un archivo .xlsx real', async () => {
    const blob = await crearExcel(actividades, sinFecha)
    expect(blob.size).toBeGreaterThan(1000)
    const r = filasAActividades((await readSheet(blob)) as unknown[][])
    expect(r.problemas).toEqual([])
    expect(r.actividades.map(comparable)).toEqual(actividades.map(comparable))
    expect(r.sinFecha.map((p) => p.dependencia)).toEqual(['GEPM', 'PES'])
  })
})
