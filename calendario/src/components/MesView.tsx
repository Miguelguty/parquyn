import { useMemo } from 'react'
import type { Actividad, Cambios } from '../lib/actividades'
import { DIAS_SEMANA, MESES, fechaLarga, iso } from '../lib/formato'
import { ActividadItem } from './ActividadItem'

type Props = {
  actividades: Actividad[]
  año: number
  mes: number // 0-11
  hoy: string
  seleccionado: string | null
  onSeleccionar: (fecha: string) => void
  onGuardar: (id: string, cambios: Cambios) => void
  onCancelada: (id: string, cancelada: boolean) => void
  onQuitarFecha: (id: string) => void
  onBorrar: (id: string) => void
}

export function MesView({ actividades, año, mes, hoy, seleccionado, onSeleccionar, onGuardar, onCancelada, onQuitarFecha, onBorrar }: Props) {
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
      <div className="mes-grid">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="mes-cab" aria-hidden="true">{d}</div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} className="mes-celda vacia" />
          const f = iso(año, mes, dia)
          const lista = porDia.get(f) ?? []
          const activas = lista.filter((x) => !x.cancelada).length
          const clases = [
            'mes-celda',
            f === hoy && 'hoy',
            f === seleccionado && 'sel',
            activas > 0 && 'con',
            lista.length > 0 && activas === 0 && 'solo-canceladas',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={f}
              type="button"
              className={clases}
              aria-pressed={f === seleccionado}
              aria-label={`${fechaLarga(f)}${lista.length ? `, ${activas} actividad${activas === 1 ? '' : 'es'}${lista.length > activas ? `, ${lista.length - activas} cancelada${lista.length - activas === 1 ? '' : 's'}` : ''}` : ''}`}
              onClick={() => onSeleccionar(f)}
            >
              <span className="num">{dia}</span>
              {lista.slice(0, 2).map((a) => (
                <span key={a.id} className={`chip${a.cancelada ? ' cancelada' : ''}`}>{a.dependencia || '(sin dependencia)'}</span>
              ))}
              {lista.length > 2 && <span className="chip mas">+{lista.length - 2} más</span>}
              {activas > 0 && <span className="cuenta">{activas}</span>}
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
              delDia.map((a) => <ActividadItem key={a.id} a={a} onGuardar={onGuardar} onCancelada={onCancelada} onQuitarFecha={onQuitarFecha} onBorrar={onBorrar} />)
            )}
          </>
        ) : (
          <p className="muted">Toca un día para ver sus actividades.</p>
        )}
      </div>
    </section>
  )
}
