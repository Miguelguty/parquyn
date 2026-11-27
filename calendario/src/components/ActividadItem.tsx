import { useState, type FormEvent } from 'react'
import { validarCambios, type Actividad, type Cambios } from '../lib/actividades'
import { telHref, textoHora } from '../lib/formato'

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
  const [form, setForm] = useState<Cambios>(() => desde(a))
  const [error, setError] = useState<string | null>(null)

  function abrir() {
    setForm(desde(a))
    setError(null)
    setEditando(true)
  }

  function guardar(e: FormEvent) {
    e.preventDefault()
    const problema = validarCambios(form)
    if (problema) {
      setError(problema)
      return
    }
    onGuardar(a.id, form)
    setEditando(false)
  }

  const campo = (k: keyof Cambios) => `${a.id}-${k}`
  const texto = (k: 'dependencia' | 'enlace' | 'telefono' | 'observacion') => ({
    id: campo(k),
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  })

  if (editando) {
    return (
      <article className="actividad editando">
        <form className="form-actividad" onSubmit={guardar} noValidate>
          <h3>Editar actividad (fila {a.fila} del Excel)</h3>
          <label htmlFor={campo('dependencia')}>Dependencia</label>
          <input type="text" {...texto('dependencia')} />

          <div className="fila-form">
            <div>
              <label htmlFor={campo('fecha')}>Fecha</label>
              <input
                type="date"
                id={campo('fecha')}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor={campo('hora')}>Hora inicial</label>
              <input
                type="time"
                id={campo('hora')}
                value={form.hora ?? ''}
                onChange={(e) => setForm({ ...form, hora: e.target.value || null })}
              />
            </div>
            <div>
              <label htmlFor={campo('horaFin')}>Hora final</label>
              <input
                type="time"
                id={campo('horaFin')}
                value={form.horaFin ?? ''}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value || null })}
              />
            </div>
          </div>
          {a.horaTexto && !form.hora && (
            <p className="muted">En el Excel la hora decía "{a.horaTexto}".</p>
          )}

          <label htmlFor={campo('enlace')}>Enlace (persona de contacto)</label>
          <input type="text" {...texto('enlace')} />
          <label htmlFor={campo('telefono')}>Teléfono</label>
          <input type="tel" {...texto('telefono')} />
          <label htmlFor={campo('observacion')}>Observación</label>
          <textarea rows={3} {...texto('observacion')} />

          {error && <p role="alert" className="error">{error}</p>}
          <div className="botones-form">
            <button type="submit" className="primario">Guardar cambios</button>
            <button type="button" onClick={() => setEditando(false)}>Cerrar sin guardar</button>
          </div>
        </form>
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
          {a.editada && <span className="estado edit">Editada</span>}
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
          <button type="button" onClick={abrir}>Editar</button>
          <button
            type="button"
            className={a.cancelada ? undefined : 'peligro'}
            onClick={() => onCancelada(a.id, !a.cancelada)}
          >
            {a.cancelada ? 'Reactivar' : 'Cancelar actividad'}
          </button>
          <span className="muted fila">Fila {a.fila} del Excel</span>
        </div>
      </div>
    </article>
  )
}
