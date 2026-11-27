import { useState, type FormEvent } from 'react'
import { validarCambios, type Cambios } from '../lib/actividades'

type Props = {
  titulo: string
  inicial: Cambios
  /** Prefijo para los id de los campos (debe ser distinto por formulario). */
  idBase: string
  /** Texto original de la hora en el Excel, si no se pudo entender. */
  horaOriginal?: string
  dependenciaObligatoria?: boolean
  textoGuardar: string
  onGuardar: (cambios: Cambios) => void
  onCerrar: () => void
}

export function FormActividad({
  titulo,
  inicial,
  idBase,
  horaOriginal,
  dependenciaObligatoria,
  textoGuardar,
  onGuardar,
  onCerrar,
}: Props) {
  const [form, setForm] = useState<Cambios>(inicial)
  const [error, setError] = useState<string | null>(null)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const problema = validarCambios(form, { dependenciaObligatoria })
    if (problema) {
      setError(problema)
      return
    }
    onGuardar(form)
  }

  const id = (k: keyof Cambios) => `${idBase}-${k}`
  const texto = (k: 'dependencia' | 'enlace' | 'telefono' | 'observacion') => ({
    id: id(k),
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  })

  return (
    <form className="form-actividad" onSubmit={enviar} noValidate>
      <h3>{titulo}</h3>
      <label htmlFor={id('dependencia')}>Dependencia</label>
      <input type="text" {...texto('dependencia')} />

      <div className="fila-form">
        <div>
          <label htmlFor={id('fecha')}>Fecha</label>
          <input
            type="date"
            id={id('fecha')}
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor={id('hora')}>Hora inicial</label>
          <input
            type="time"
            id={id('hora')}
            value={form.hora ?? ''}
            onChange={(e) => setForm({ ...form, hora: e.target.value || null })}
          />
        </div>
        <div>
          <label htmlFor={id('horaFin')}>Hora final</label>
          <input
            type="time"
            id={id('horaFin')}
            value={form.horaFin ?? ''}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value || null })}
          />
        </div>
      </div>
      {horaOriginal && !form.hora && <p className="muted">En el Excel la hora decía "{horaOriginal}".</p>}

      <label htmlFor={id('enlace')}>Enlace (persona de contacto)</label>
      <input type="text" {...texto('enlace')} />
      <label htmlFor={id('telefono')}>Teléfono</label>
      <input type="tel" {...texto('telefono')} />
      <label htmlFor={id('observacion')}>Observación</label>
      <textarea rows={3} {...texto('observacion')} />

      {error && <p role="alert" className="error">{error}</p>}
      <div className="botones-form">
        <button type="submit" className="primario">{textoGuardar}</button>
        <button type="button" onClick={onCerrar}>Cerrar sin guardar</button>
      </div>
    </form>
  )
}
