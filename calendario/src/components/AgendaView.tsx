import { useState } from 'react'
import type { Actividad } from '../lib/actividades'
import { fechaLarga } from '../lib/formato'
import { ActividadItem } from './ActividadItem'

function agrupar(lista: Actividad[]): [string, Actividad[]][] {
  const grupos: [string, Actividad[]][] = []
  for (const a of lista) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo[0] === a.fecha) ultimo[1].push(a)
    else grupos.push([a.fecha, [a]])
  }
  return grupos
}

export function AgendaView({ actividades, hoy }: { actividades: Actividad[]; hoy: string }) {
  const [verPasadas, setVerPasadas] = useState(false)
  const proximas = actividades.filter((a) => a.fecha >= hoy)
  const pasadas = actividades.filter((a) => a.fecha < hoy)
  const mostradas = verPasadas ? actividades : proximas

  return (
    <section aria-label="Agenda">
      {pasadas.length > 0 && (
        <label className="check">
          <input type="checkbox" checked={verPasadas} onChange={(e) => setVerPasadas(e.target.checked)} />
          Mostrar también las {pasadas.length} ya pasadas
        </label>
      )}
      {mostradas.length === 0 && <p className="muted">No hay actividades próximas.</p>}
      {agrupar(mostradas).map(([fecha, lista]) => (
        <div key={fecha} className="agenda-dia">
          <h2 className={fecha === hoy ? 'es-hoy' : undefined}>
            {fechaLarga(fecha)}
            {fecha === hoy && <span className="etiqueta">Hoy</span>}
          </h2>
          {lista.map((a) => (
            <ActividadItem key={a.id} a={a} />
          ))}
        </div>
      ))}
    </section>
  )
}
