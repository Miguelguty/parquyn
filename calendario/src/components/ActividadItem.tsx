import type { Actividad } from '../lib/actividades'
import { telHref, textoHora } from '../lib/formato'

export function ActividadItem({ a }: { a: Actividad }) {
  const tel = a.telefono ? telHref(a.telefono) : null
  return (
    <article className="actividad">
      <div className="actividad-hora">{textoHora(a)}</div>
      <div className="actividad-cuerpo">
        <h3>{a.dependencia || '(sin dependencia)'}</h3>
        {(a.enlace || a.telefono) && (
          <p>
            {a.enlace && <span>{a.enlace}</span>}
            {a.enlace && a.telefono && ' · '}
            {a.telefono && (tel ? <a href={tel}>{a.telefono}</a> : <span>{a.telefono}</span>)}
          </p>
        )}
        {a.observacion && <p className="observacion">{a.observacion}</p>}
        {a.avisos.map((av) => (
          <p key={av} className="aviso">⚠ {av}</p>
        ))}
        <p className="muted fila">Fila {a.fila} del Excel</p>
      </div>
    </article>
  )
}
