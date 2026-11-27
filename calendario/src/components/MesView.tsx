import { useMemo } from 'react'
import type { Actividad } from '../lib/actividades'
import { DIAS_SEMANA, MESES, fechaLarga, iso } from '../lib/formato'
import { ActividadItem } from './ActividadItem'

type Props = {
  actividades: Actividad[]
  año: number
  mes: number // 0-11
  hoy: string
  seleccionado: string | null
  onSeleccionar: (fecha: string) => void
}

export function MesView({ actividades, año, mes, hoy, seleccionado, onSeleccionar }: Props) {
  const porDia = useMemo(() => {
    const mapa = new Map<string, Actividad[]>()
    for (const a of actividades) {
      const lista = mapa.get(a.fecha)
      if (lista) lista.push(a)
      else mapa.set(a.fecha, [a])
    }
    return mapa
  }, [actividades])

  const vacios = (new Date(Date.UTC(año, mes, 1)).getUTCDay() + 6) % 7 // lunes = 0
  const diasEnMes = new Date(Date.UTC(año, mes + 1, 0)).getUTCDate()
  const celdas: (number | null)[] = [
    ...Array<null>(vacios).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const delDia = seleccionado ? (porDia.get(seleccionado) ?? []) : []

  return (
    <section aria-label={`Calendario de ${MESES[mes]} ${año}`}>
      <div className="mes-grid" role="grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="mes-cab" role="columnheader">{d}</div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} className="mes-celda vacia" />
          const f = iso(año, mes, dia)
          const lista = porDia.get(f) ?? []
          const clases = ['mes-celda', f === hoy && 'hoy', f === seleccionado && 'sel', lista.length && 'con']
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={f}
              type="button"
              className={clases}
              aria-pressed={f === seleccionado}
              aria-label={`${fechaLarga(f)}${lista.length ? `, ${lista.length} actividad${lista.length > 1 ? 'es' : ''}` : ''}`}
              onClick={() => onSeleccionar(f)}
            >
              <span className="num">{dia}</span>
              {lista.slice(0, 2).map((a) => (
                <span key={a.id} className="chip">{a.dependencia || '(sin dependencia)'}</span>
              ))}
              {lista.length > 2 && <span className="chip mas">+{lista.length - 2} más</span>}
              {lista.length > 0 && <span className="cuenta">{lista.length}</span>}
            </button>
          )
        })}
      </div>

      <div className="dia-panel" aria-live="polite">
        {seleccionado ? (
          <>
            <h2>{fechaLarga(seleccionado)}</h2>
            {delDia.length === 0 ? (
              <p className="muted">No hay actividades este día.</p>
            ) : (
              delDia.map((a) => <ActividadItem key={a.id} a={a} />)
            )}
          </>
        ) : (
          <p className="muted">Toca un día para ver sus actividades.</p>
        )}
      </div>
    </section>
  )
}
