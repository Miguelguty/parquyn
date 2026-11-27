import { describe, expect, it } from 'vitest'
import { filasAActividades, parseFecha, parseHora } from './actividades'

const utc = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, min, s, ms))

describe('parseFecha', () => {
  it('lee una fecha de Excel (Date a medianoche UTC) sin correrla de día', () => {
    expect(parseFecha(utc(2026, 12, 1))).toBe('2026-12-01')
  })
  it('lee un número de serie de Excel', () => {
    // 46357 = 1 de diciembre de 2026
    expect(parseFecha(46357)).toBe('2026-12-01')
  })
  it('lee texto día/mes/año (día primero)', () => {
    expect(parseFecha('3/12/2026')).toBe('2026-12-03')
    expect(parseFecha('03-12-2026')).toBe('2026-12-03')
    expect(parseFecha('3.12.26')).toBe('2026-12-03')
  })
  it('lee texto año-mes-día', () => {
    expect(parseFecha('2026-12-03')).toBe('2026-12-03')
  })
  it('lee texto con el mes en palabras', () => {
    expect(parseFecha('3 de diciembre de 2026')).toBe('2026-12-03')
    expect(parseFecha('3 dic 2026')).toBe('2026-12-03')
  })
  it('rechaza fechas que no existen o vacías', () => {
    expect(parseFecha('31/02/2026')).toBeNull()
    expect(parseFecha('hola')).toBeNull()
    expect(parseFecha(null)).toBeNull()
    expect(parseFecha('')).toBeNull()
  })
})

describe('parseHora', () => {
  it('lee una celda de hora de Excel (Date en 1899)', () => {
    expect(parseHora(utc(1899, 12, 30, 9, 0))).toEqual({ inicio: '09:00', fin: null })
  })
  it('redondea al minuto (9:29:59.999 -> 9:30)', () => {
    expect(parseHora(utc(2026, 12, 1, 9, 29, 59, 999))).toEqual({ inicio: '09:30', fin: null })
  })
  it('lee una fracción del día', () => {
    expect(parseHora(0.375)).toEqual({ inicio: '09:00', fin: null })
    expect(parseHora(0.604166666667)).toEqual({ inicio: '14:30', fin: null })
  })
  it('lee textos comunes', () => {
    expect(parseHora('9:00')).toEqual({ inicio: '09:00', fin: null })
    expect(parseHora('14:30')).toEqual({ inicio: '14:30', fin: null })
    expect(parseHora('8:00 AM')).toEqual({ inicio: '08:00', fin: null })
    expect(parseHora('3:00 PM')).toEqual({ inicio: '15:00', fin: null })
    expect(parseHora('3 pm')).toEqual({ inicio: '15:00', fin: null })
    expect(parseHora('12:00 AM')).toEqual({ inicio: '00:00', fin: null })
    expect(parseHora('12:30 PM')).toEqual({ inicio: '12:30', fin: null })
    expect(parseHora('10:15 a. m.')).toEqual({ inicio: '10:15', fin: null })
    expect(parseHora('14h30')).toEqual({ inicio: '14:30', fin: null })
  })
  it('lee un rango de horas', () => {
    expect(parseHora('9:00 - 11:30')).toEqual({ inicio: '09:00', fin: '11:30' })
    expect(parseHora('9:00 a 11:30')).toEqual({ inicio: '09:00', fin: '11:30' })
    expect(parseHora('9:00 AM a 12:00 PM')).toEqual({ inicio: '09:00', fin: '12:00' })
  })
  it('devuelve null si no entiende o está vacío', () => {
    expect(parseHora('por confirmar')).toBeNull()
    expect(parseHora('25:00')).toBeNull()
    expect(parseHora(null)).toBeNull()
    expect(parseHora('')).toBeNull()
  })
})

const ENC = ['Dependencia', 'Fechas', 'Días', 'Hora', 'Enlace', 'Teléfono en enlace', 'Observación']

describe('filasAActividades', () => {
  it('convierte una fila en una actividad y calcula el día de la semana', () => {
    const r = filasAActividades([
      ENC,
      ['Alcaldía', utc(2026, 12, 3), 'Jueves', '14:30', 'Juan', '310 555', 'Seguimiento'],
    ])
    expect(r.problemas).toEqual([])
    expect(r.actividades).toHaveLength(1)
    expect(r.actividades[0]).toMatchObject({
      fila: 2,
      dependencia: 'Alcaldía',
      fecha: '2026-12-03',
      dia: 'jueves',
      hora: '14:30',
      horaFin: null,
      enlace: 'Juan',
      telefono: '310 555',
      observacion: 'Seguimiento',
      avisos: [],
    })
  })

  it('reconoce los encabezados sin importar mayúsculas, tildes o espacios', () => {
    const r = filasAActividades([
      ['  DEPENDENCIA ', 'fecha', 'dias', 'HORA', 'enlace', 'telefono', 'observaciones'],
      ['Gobernación', '10/12/2026', 'jueves', '3 PM', 'Luis', '311', 'ok'],
    ])
    expect(r.problemas).toEqual([])
    expect(r.actividades[0]).toMatchObject({ dependencia: 'Gobernación', fecha: '2026-12-10', hora: '15:00' })
  })

  it('avisa cuando el día escrito no coincide con la fecha, y usa el calculado', () => {
    const r = filasAActividades([ENC, ['X', utc(2026, 12, 1), 'Lunes', '9:00', '', '', '']])
    expect(r.actividades[0].dia).toBe('martes')
    expect(r.actividades[0].avisos).toHaveLength(1)
    expect(r.actividades[0].avisos[0]).toMatch(/lunes/i)
    expect(r.actividades[0].avisos[0]).toMatch(/martes/i)
  })

  it('acepta el día sin tilde o abreviado sin dar aviso', () => {
    const r = filasAActividades([
      ENC,
      ['X', utc(2026, 12, 2), 'miercoles', '9:00', '', '', ''],
      ['Y', utc(2026, 12, 2), 'Mié', '9:00', '', '', ''],
    ])
    expect(r.actividades.map((a) => a.avisos)).toEqual([[], []])
  })

  it('no da aviso si la columna Días está vacía', () => {
    const r = filasAActividades([ENC, ['X', utc(2026, 12, 2), null, '9:00', '', '', '']])
    expect(r.actividades[0].avisos).toEqual([])
  })

  it('reporta las filas con fecha ilegible y las deja fuera', () => {
    const r = filasAActividades([ENC, ['X', 'pronto', 'Lunes', '9:00', '', '', ''], ['Y', utc(2026, 12, 2), '', '', '', '', '']])
    expect(r.actividades).toHaveLength(1)
    expect(r.problemas).toHaveLength(1)
    expect(r.problemas[0].fila).toBe(2)
  })

  it('deja la hora como texto con aviso si no la entiende, sin perder la actividad', () => {
    const r = filasAActividades([ENC, ['X', utc(2026, 12, 2), '', 'por confirmar', '', '', '']])
    expect(r.actividades[0].hora).toBeNull()
    expect(r.actividades[0].horaTexto).toBe('por confirmar')
    expect(r.actividades[0].avisos).toHaveLength(1)
  })

  it('ignora filas totalmente vacías', () => {
    const r = filasAActividades([ENC, [null, null, null, null, null, null, null], ['X', utc(2026, 12, 2)]])
    expect(r.actividades).toHaveLength(1)
    expect(r.problemas).toEqual([])
  })

  it('ordena por fecha y luego por hora; las que no tienen hora van al final del día', () => {
    const r = filasAActividades([
      ENC,
      ['C', utc(2026, 12, 3), '', '', '', '', ''],
      ['B', utc(2026, 12, 3), '', '14:00', '', '', ''],
      ['A', utc(2026, 12, 1), '', '9:00', '', '', ''],
      ['D', utc(2026, 12, 3), '', '8:00', '', '', ''],
    ])
    expect(r.actividades.map((a) => a.dependencia)).toEqual(['A', 'D', 'B', 'C'])
  })

  it('falla con un mensaje claro si falta la columna de fechas', () => {
    const r = filasAActividades([['Dependencia', 'Hora'], ['X', '9:00']])
    expect(r.actividades).toEqual([])
    expect(r.problemas[0].fila).toBe(1)
    expect(r.problemas[0].mensaje).toMatch(/fecha/i)
  })

  it('falla con un mensaje claro si el archivo está vacío', () => {
    const r = filasAActividades([])
    expect(r.actividades).toEqual([])
    expect(r.problemas).toHaveLength(1)
  })
})

import { aplicarCambios, diaDeLaSemana, ordenar, validarCambios, type Actividad, type Cambios } from './actividades'

const base: Actividad = {
  id: 'fila-2',
  fila: 2,
  dependencia: 'Alcaldía',
  fecha: '2026-12-03',
  dia: 'jueves',
  hora: '14:30',
  horaFin: null,
  horaTexto: '',
  enlace: 'Juan',
  telefono: '310',
  observacion: '',
  avisos: ['En el Excel dice "Lunes" pero el 3/12/2026 cae jueves.'],
}
const cambiosDe = (a: Actividad, extra: Partial<Cambios> = {}): Cambios => ({
  dependencia: a.dependencia,
  fecha: a.fecha,
  hora: a.hora,
  horaFin: a.horaFin,
  lugar: a.lugar ?? '',
  enlace: a.enlace,
  telefono: a.telefono,
  observacion: a.observacion,
  ...extra,
})

describe('diaDeLaSemana', () => {
  it('calcula el día de una fecha AAAA-MM-DD', () => {
    expect(diaDeLaSemana('2026-12-03')).toBe('jueves')
    expect(diaDeLaSemana('2026-12-06')).toBe('domingo')
  })
})

describe('validarCambios', () => {
  it('acepta cambios correctos', () => {
    expect(validarCambios(cambiosDe(base))).toBeNull()
    expect(validarCambios(cambiosDe(base, { hora: null, horaFin: null }))).toBeNull()
    expect(validarCambios(cambiosDe(base, { hora: '09:00', horaFin: '11:00' }))).toBeNull()
  })
  it('exige una fecha válida', () => {
    expect(validarCambios(cambiosDe(base, { fecha: '' }))).toMatch(/fecha/i)
    expect(validarCambios(cambiosDe(base, { fecha: '2026-02-31' }))).toMatch(/fecha/i)
  })
  it('no permite hora final sin hora inicial', () => {
    expect(validarCambios(cambiosDe(base, { hora: null, horaFin: '11:00' }))).toMatch(/inicial/i)
  })
  it('exige que la hora final sea después de la inicial', () => {
    expect(validarCambios(cambiosDe(base, { hora: '11:00', horaFin: '09:00' }))).toMatch(/después/i)
    expect(validarCambios(cambiosDe(base, { hora: '11:00', horaFin: '11:00' }))).toMatch(/después/i)
  })
})

describe('aplicarCambios', () => {
  it('actualiza los campos, recalcula el día y marca la actividad como editada', () => {
    const r = aplicarCambios(base, cambiosDe(base, { fecha: '2026-12-04', dependencia: ' Gobernación ', hora: '10:00' }))
    expect(r).toMatchObject({ fecha: '2026-12-04', dia: 'viernes', dependencia: 'Gobernación', hora: '10:00', editada: true })
  })
  it('conserva el id y el número de fila originales', () => {
    const r = aplicarCambios(base, cambiosDe(base, { fecha: '2026-12-10' }))
    expect(r.id).toBe('fila-2')
    expect(r.fila).toBe(2)
  })
  it('limpia los avisos (la persona ya revisó la fila)', () => {
    expect(aplicarCambios(base, cambiosDe(base)).avisos).toEqual([])
  })
  it('borra el texto de hora original cuando se pone una hora', () => {
    const a = { ...base, hora: null, horaTexto: 'por confirmar' }
    expect(aplicarCambios(a, cambiosDe(a, { hora: '08:00' })).horaTexto).toBe('')
    expect(aplicarCambios(a, cambiosDe(a)).horaTexto).toBe('por confirmar')
  })
  it('no toca el estado de cancelada', () => {
    const a = { ...base, cancelada: true }
    expect(aplicarCambios(a, cambiosDe(a, { observacion: 'x' })).cancelada).toBe(true)
  })
})

describe('ordenar', () => {
  it('ordena por fecha y hora sin modificar la lista original', () => {
    const b = { ...base, id: 'fila-3', fila: 3, fecha: '2026-12-01' }
    const original = [base, b]
    expect(ordenar(original).map((x) => x.id)).toEqual(['fila-3', 'fila-2'])
    expect(original.map((x) => x.id)).toEqual(['fila-2', 'fila-3'])
  })
})

import { crearActividad } from './actividades'

describe('validarCambios con dependencia obligatoria', () => {
  it('exige la dependencia solo cuando se pide', () => {
    const vacia = cambiosDe(base, { dependencia: '   ' })
    expect(validarCambios(vacia)).toBeNull()
    expect(validarCambios(vacia, { dependenciaObligatoria: true })).toMatch(/dependencia/i)
    expect(validarCambios(cambiosDe(base), { dependenciaObligatoria: true })).toBeNull()
  })
})

describe('crearActividad', () => {
  const c = cambiosDe(base, { dependencia: ' Contraloría ', fecha: '2026-12-07', hora: '09:00', horaFin: '10:30' })
  const n = crearActividad(c, 'nueva-1', 7)

  it('crea una actividad con día calculado, marcada como nueva y sin avisos', () => {
    expect(n).toMatchObject({
      id: 'nueva-1',
      fila: 7,
      dependencia: 'Contraloría',
      fecha: '2026-12-07',
      dia: 'lunes',
      hora: '09:00',
      horaFin: '10:30',
      horaTexto: '',
      avisos: [],
      nueva: true,
    })
  })
  it('no queda marcada como editada ni cancelada', () => {
    expect(n.editada).toBeUndefined()
    expect(n.cancelada).toBeUndefined()
  })
  it('sin hora inicial no guarda hora final', () => {
    expect(crearActividad(cambiosDe(base, { hora: null, horaFin: '11:00' }), 'n', 1).horaFin).toBeNull()
  })
})

import { asignarFecha } from './actividades'

// Forma del cronograma real: sin Enlace/Teléfono, con Lugar, y una sección "Sin fecha por ahora".
const ENC2 = ['Dependencia', 'Fecha', 'Día', 'Hora', 'Lugar', 'Observaciones']
const cronograma = () =>
  filasAActividades([
    ENC2,
    ['LOCALIDAD 1', utc(2026, 12, 1), 'Martes', '10:00 – 12:00', 'Auditorio', 'Fecha original: 10/12'],
    ['SECRETARÍA DE HACIENDA', utc(2026, 12, 10), 'Jueves', '10:00 – 12:00', null, null],
    [null, null, null, null, null, null],
    ['Sin fecha por ahora (fuera de este cronograma)', null, null, null, null, null],
    ['GEPM', null, null, null, null, null],
    ['CONTROL URBANO', null, null, '10:00 – 12:00', 'Sede norte', 'Pendiente de confirmar'],
  ])

describe('cronograma real (Lugar y filas sin fecha)', () => {
  it('lee la columna Lugar y las horas con rayita larga', () => {
    const r = cronograma()
    expect(r.actividades[0]).toMatchObject({ lugar: 'Auditorio', hora: '10:00', horaFin: '12:00', avisos: [] })
    expect(r.actividades[1].lugar).toBe('')
  })
  it('manda a "sin fecha" las filas con dependencia pero sin fecha, sin tratarlas como error', () => {
    const r = cronograma()
    expect(r.problemas).toEqual([])
    expect(r.sinFecha.map((p) => p.dependencia)).toEqual(['GEPM', 'CONTROL URBANO'])
  })
  it('ignora el título de la sección "Sin fecha por ahora"', () => {
    expect(cronograma().sinFecha.some((p) => /sin fecha/i.test(p.dependencia))).toBe(false)
  })
  it('conserva en las filas sin fecha los datos que sí traen', () => {
    expect(cronograma().sinFecha[1]).toMatchObject({
      id: 'fila-7',
      fila: 7,
      hora: '10:00',
      horaFin: '12:00',
      lugar: 'Sede norte',
      observacion: 'Pendiente de confirmar',
    })
  })
  it('una fecha ilegible sigue siendo un problema, no una fila "sin fecha"', () => {
    const r = filasAActividades([ENC2, ['X', 'pronto', '', '', '', '']])
    expect(r.problemas).toHaveLength(1)
    expect(r.sinFecha).toEqual([])
  })
  it('una fila sin dependencia ni fecha pero con otros datos es un problema', () => {
    const r = filasAActividades([ENC2, [null, null, null, '9:00', null, 'huérfana']])
    expect(r.problemas).toHaveLength(1)
    expect(r.sinFecha).toEqual([])
  })
  it('todas las respuestas traen la lista sinFecha, incluso cuando falla', () => {
    expect(filasAActividades([]).sinFecha).toEqual([])
    expect(filasAActividades([['Dependencia', 'Hora']]).sinFecha).toEqual([])
  })
})

describe('asignarFecha', () => {
  const pendiente = cronograma().sinFecha[1]
  const c: Cambios = {
    dependencia: 'CONTROL URBANO',
    fecha: '2026-12-22',
    hora: '10:00',
    horaFin: '12:00',
    lugar: 'Sede norte',
    enlace: '',
    telefono: '',
    observacion: 'Pendiente de confirmar',
  }
  it('convierte la fila sin fecha en una actividad con día calculado, conservando id y fila', () => {
    const a = asignarFecha(pendiente, c)
    expect(a).toMatchObject({ id: 'fila-7', fila: 7, fecha: '2026-12-22', dia: 'martes', lugar: 'Sede norte', editada: true })
    expect(a.avisos).toEqual([])
  })
  it('exige elegir una fecha', () => {
    expect(validarCambios({ ...c, fecha: '' })).toBe('Elige una fecha.')
  })
})

import { quitarFecha } from './actividades'

describe('quitarFecha', () => {
  const a: Actividad = {
    ...base,
    id: 'fila-9',
    fila: 9,
    lugar: 'Auditorio',
    hora: '10:00',
    horaFin: '12:00',
    observacion: 'Fecha original: 10/12',
    avisos: ['algún aviso'],
    editada: true,
    cancelada: true,
  }
  const p = quitarFecha(a)

  it('devuelve una fila sin fecha conservando lo demás', () => {
    expect(p).toEqual({
      id: 'fila-9',
      fila: 9,
      dependencia: 'Alcaldía',
      hora: '10:00',
      horaFin: '12:00',
      horaTexto: '',
      lugar: 'Auditorio',
      enlace: 'Juan',
      telefono: '310',
      observacion: 'Fecha original: 10/12',
    })
  })
  it('no arrastra fecha, día, avisos ni estados de la actividad', () => {
    for (const campo of ['fecha', 'dia', 'avisos', 'editada', 'cancelada', 'nueva']) expect(campo in p).toBe(false)
  })
  it('una actividad nueva sigue marcada como nueva', () => {
    expect(quitarFecha({ ...a, nueva: true }).nueva).toBe(true)
  })
  it('se puede volver a programar y conserva id y fila', () => {
    const otra = asignarFecha(p, {
      dependencia: p.dependencia, fecha: '2026-12-22', hora: p.hora, horaFin: p.horaFin,
      lugar: p.lugar, enlace: p.enlace, telefono: p.telefono, observacion: p.observacion,
    })
    expect(otra).toMatchObject({ id: 'fila-9', fila: 9, fecha: '2026-12-22', dia: 'martes', hora: '10:00', lugar: 'Auditorio' })
    expect(otra.cancelada).toBeUndefined()
  })
  it('una nueva que vuelve a programarse sigue siendo nueva', () => {
    expect(asignarFecha(quitarFecha({ ...a, nueva: true }), {
      dependencia: 'X', fecha: '2026-12-22', hora: null, horaFin: null, lugar: '', enlace: '', telefono: '', observacion: '',
    }).nueva).toBe(true)
  })
})

import { leerFecha } from './actividades'

describe('fechas escritas sin año', () => {
  it('parseFecha sigue exigiendo el año (no adivina)', () => {
    expect(parseFecha('23 de noviembre')).toBeNull()
    expect(parseFecha('23/11')).toBeNull()
  })
  it('leerFecha usa el año indicado y avisa que lo puso', () => {
    expect(leerFecha('23 de noviembre', 2026)).toEqual({ fecha: '2026-11-23', sinAño: true })
    expect(leerFecha('23 nov', 2026)).toEqual({ fecha: '2026-11-23', sinAño: true })
    expect(leerFecha('23/11', 2026)).toEqual({ fecha: '2026-11-23', sinAño: true })
    expect(leerFecha('5 de enero', 2027)).toEqual({ fecha: '2027-01-05', sinAño: true })
  })
  it('si no se indica un año por defecto, no inventa uno', () => {
    expect(leerFecha('23 de noviembre')).toBeNull()
  })
  it('acepta el día de la semana al principio', () => {
    expect(leerFecha('lunes 23 de noviembre', 2026)).toEqual({ fecha: '2026-11-23', sinAño: true })
    expect(leerFecha('Lunes, 23 de noviembre de 2026', 2000)).toEqual({ fecha: '2026-11-23', sinAño: false })
    expect(leerFecha('mié 25 nov', 2026)).toEqual({ fecha: '2026-11-25', sinAño: true })
  })
  it('una fecha con año nunca queda marcada como sin año', () => {
    expect(leerFecha('3 de diciembre de 2026', 2000)).toEqual({ fecha: '2026-12-03', sinAño: false })
    expect(leerFecha('3/12/2026', 2000)).toEqual({ fecha: '2026-12-03', sinAño: false })
    expect(leerFecha(utc(2026, 12, 3), 2000)).toEqual({ fecha: '2026-12-03', sinAño: false })
  })
  it('rechaza lo que no existe aunque falte el año', () => {
    expect(leerFecha('31 de febrero', 2026)).toBeNull()
    expect(leerFecha('30 de noviembrr', 2026)).toBeNull()
    expect(leerFecha('pronto', 2026)).toBeNull()
  })

  const ENC3 = ['Dependencia', 'Fecha', 'Día', 'Hora']
  it('al leer el Excel, las filas sin año entran con aviso del año usado', () => {
    const r = filasAActividades(
      [ENC3, ['LOCALIDAD 1', '23 de noviembre', 'Lunes', '10:00 – 12:00'], ['LOCALIDAD 2', '24 de noviembre', '', '']],
      { añoPorDefecto: 2026 },
    )
    expect(r.problemas).toEqual([])
    expect(r.actividades.map((a) => a.fecha)).toEqual(['2026-11-23', '2026-11-24'])
    expect(r.actividades[0].avisos).toEqual(['La fecha no traía año; usé 2026.'])
    expect(r.actividades[0].dia).toBe('lunes')
  })
  it('el aviso del año se suma al del día mal escrito, sin taparlo', () => {
    const r = filasAActividades([ENC3, ['X', '23 de noviembre', 'Martes', '']], { añoPorDefecto: 2026 })
    expect(r.actividades[0].avisos).toHaveLength(2)
    expect(r.actividades[0].avisos[0]).toMatch(/año/)
    expect(r.actividades[0].avisos[1]).toMatch(/martes/i)
  })
  it('con año explícito no hay aviso', () => {
    const r = filasAActividades([ENC3, ['X', '23 de noviembre de 2026', '', '']], { añoPorDefecto: 2030 })
    expect(r.actividades[0].avisos).toEqual([])
    expect(r.actividades[0].fecha).toBe('2026-11-23')
  })
  it('una fecha ilegible explica cómo escribirla', () => {
    const r = filasAActividades([ENC3, ['X', 'la otra semana', '', '']], { añoPorDefecto: 2026 })
    expect(r.problemas[0].mensaje).toMatch(/3\/12\/2026/)
  })
})
