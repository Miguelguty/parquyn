import { useState, type FormEvent } from 'react'
import { campoDeError, validarCambios, type Cambios, type CampoFormulario } from '../lib/actividades'

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
  const [campoError, setCampoError] = useState<CampoFormulario | null>(null)

  const id = (k: keyof Cambios) => `${idBase}-${k}`
  const idError = `${idBase}-error`
  /** Marca el campo con problema para lectores de pantalla y lo enlaza con el mensaje. */
  const invalido = (k: CampoFormulario) =>
    campoError === k ? { 'aria-invalid': true as const, 'aria-describedby': idError } : {}

  function enviar(e: FormEvent) {
    e.preventDefault()
    const problema = validarCambios(form, { dependenciaObligatoria })
    if (problema) {
      const campo = campoDeError(problema)
      setError(problema)
      setCampoError(campo)
      // El foco va al campo con el problema, no se queda en el botón.
      if (campo) document.getElementById(id(campo))?.focus()
      return
    }
    setError(null)
    setCampoError(null)
    onGuardar(form)
  }

  /** El mensaje va pegado al campo con el problema (no al final del formulario, donde en un celular no se vería). */
  const mensajeDeError = error ? <p id={idError} role="alert" className="error">{error}</p> : null

  const texto = (k: 'dependencia' | 'lugar' | 'enlace' | 'telefono' | 'observacion') => ({
    id: id(k),
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  })

  return (
    <form className="form-actividad" onSubmit={enviar} noValidate>
      <h3>{titulo}</h3>
      <label htmlFor={id('dependencia')}>Dependencia{dependenciaObligatoria ? ' (obligatoria)' : ''}</label>
      <input type="text" {...texto('dependencia')} {...invalido('dependencia')} />
      {campoError === 'dependencia' && mensajeDeError}

      <div className="fila-form">
        <div>
          <label htmlFor={id('fecha')}>Fecha</label>
          <input
            type="date"
            id={id('fecha')}
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
            {...invalido('fecha')}
          />
        </div>
        <div>
          <label htmlFor={id('hora')}>Hora inicial</label>
          <input
            type="time"
            id={id('hora')}
            value={form.hora ?? ''}
            onChange={(e) => setForm({ ...form, hora: e.target.value || null })}
            {...invalido('hora')}
          />
        </div>
        <div>
          <label htmlFor={id('horaFin')}>Hora final</label>
          <input
            type="time"
            id={id('horaFin')}
            value={form.horaFin ?? ''}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value || null })}
            {...invalido('horaFin')}
          />
        </div>
      </div>
      {(campoError === 'fecha' || campoError === 'hora' || campoError === 'horaFin') && mensajeDeError}
      {horaOriginal && !form.hora && <p className="muted">En el Excel la hora decía "{horaOriginal}".</p>}

      <label htmlFor={id('lugar')}>Lugar</label>
      <input type="text" {...texto('lugar')} />
      <label htmlFor={id('enlace')}>Enlace (persona de contacto)</label>
      <input type="text" {...texto('enlace')} />
      <label htmlFor={id('telefono')}>Teléfono</label>
      <input type="tel" {...texto('telefono')} />
      <label htmlFor={id('observacion')}>Observación</label>
      <textarea rows={3} {...texto('observacion')} />

      {!campoError && mensajeDeError}
      <div className="botones-form">
        <button type="submit" className="primario">{textoGuardar}</button>
        <button type="button" onClick={onCerrar}>Cerrar sin guardar</button>
      </div>
    </form>
  )
}
