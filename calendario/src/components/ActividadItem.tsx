import { useState } from 'react'
import type { Actividad, Cambios } from '../lib/actividades'
import { telHref, textoHora } from '../lib/formato'
import { FormActividad } from './FormActividad'

type Props = {
  a: Actividad
  onGuardar: (id: string, cambios: Cambios) => void
  onCancelada: (id: string, cancelada: boolean) => void
}

const desde = (a: Actividad): Cambios => ({
  dependencia: a.dependencia,
  fecha: a.fecha,
  hora: a.hora,
  horaFin: a.horaFin,
  enlace: a.enlace,
  telefono: a.telefono,
  observacion: a.observacion,
})

export function ActividadItem({ a, onGuardar, onCancelada }: Props) {
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <article className="actividad editando">
        <FormActividad
          titulo={a.nueva ? 'Editar actividad' : `Editar actividad (fila ${a.fila} del Excel)`}
          inicial={desde(a)}
          idBase={a.id}
          horaOriginal={a.horaTexto}
          textoGuardar="Guardar cambios"
          onGuardar={(c) => {
            onGuardar(a.id, c)
            setEditando(false)
          }}
          onCerrar={() => setEditando(false)}
        />
      </article>
    )
  }

  const tel = a.telefono ? telHref(a.telefono) : null
  return (
    <article className={`actividad${a.cancelada ? ' cancelada' : ''}`}>
      <div className="actividad-hora">{textoHora(a)}</div>
      <div className="actividad-cuerpo">
        <h3>
          {a.dependencia || '(sin dependencia)'}
          {a.cancelada && <span className="estado cancel">Cancelada</span>}
          {a.nueva && <span className="estado nueva">Nueva</span>}
          {a.editada && !a.nueva && <span className="estado edit">Editada</span>}
        </h3>
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
        <div className="acciones-act">
          <button type="button" onClick={() => setEditando(true)}>Editar</button>
          <button
            type="button"
            className={a.cancelada ? undefined : 'peligro'}
            onClick={() => onCancelada(a.id, !a.cancelada)}
          >
            {a.cancelada ? 'Reactivar' : 'Cancelar actividad'}
          </button>
          <span className="muted fila">{a.nueva ? 'Agregada aquí' : `Fila ${a.fila} del Excel`}</span>
        </div>
      </div>
    </article>
  )
}
