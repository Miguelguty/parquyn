import { describe, expect, it } from 'vitest'
import { resultadoDemo } from './demo'

describe('resultadoDemo', () => {
  const hoy = new Date(2026, 10, 27) // 27 de noviembre de 2026 (hora local)
  const r = resultadoDemo(hoy)

  it('produce todas las actividades sin filas descartadas', () => {
    expect(r.problemas).toEqual([])
    expect(r.actividades).toHaveLength(6)
  })
  it('deja las dependencias sin fecha en su propia lista, sin tratarlas como error', () => {
    expect(r.sinFecha.map((p) => p.dependencia)).toEqual(['Secretaría del Interior', 'Control Urbano'])
  })
  it('lee el lugar', () => {
    expect(r.actividades.find((a) => a.dependencia === 'Hospital Regional')?.lugar).toBe('Sala de juntas')
  })
  it('todas caen después de hoy', () => {
    expect(r.actividades.every((a) => a.fecha > '2026-11-27')).toBe(true)
  })
  it('incluye exactamente un aviso de día mal escrito', () => {
    const conAviso = r.actividades.filter((a) => a.avisos.length > 0)
    expect(conAviso).toHaveLength(1)
    expect(conAviso[0].dependencia).toBe('Gobernación')
  })
  it('incluye un rango de horas', () => {
    expect(r.actividades.some((a) => a.horaFin !== null)).toBe(true)
  })
})
