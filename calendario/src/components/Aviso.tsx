import { useEffect, useRef, useState } from 'react'

export type AvisoDatos = {
  id: number
  tipo: 'ok' | 'error'
  texto: string
  /** Si existe, el aviso muestra "Deshacer" y lo llama. */
  deshacer?: () => void
}

/** Aviso flotante abajo, donde está el dedo. Los de éxito se cierran solos (más tiempo si hay "Deshacer"),
 *  se detienen mientras tengan el foco del teclado, y los errores se quedan hasta que se cierren.
 *  No se detiene con el cursor encima: si el puntero queda quieto donde aparece, el aviso no se iría nunca. */
export function Aviso({ aviso, onCerrar }: { aviso: AvisoDatos; onCerrar: () => void }) {
  const [pausado, setPausado] = useState(false)
  const cerrar = useRef(onCerrar)
  useEffect(() => {
    cerrar.current = onCerrar
  })

  useEffect(() => {
    if (aviso.tipo === 'error' || pausado) return
    const t = window.setTimeout(() => cerrar.current(), aviso.deshacer ? 10000 : 7000)
    return () => window.clearTimeout(t)
  }, [aviso.id, aviso.tipo, aviso.deshacer, pausado])

  return (
    <div
      className={`aviso-cuerpo ${aviso.tipo}`}
      role={aviso.tipo === 'error' ? 'alert' : undefined}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className="aviso-texto">{aviso.texto}</span>
      {aviso.deshacer && (
        <button type="button" className="aviso-accion" onClick={aviso.deshacer}>
          Deshacer
        </button>
      )}
      <button type="button" className="aviso-cerrar" aria-label="Cerrar aviso" onClick={onCerrar}>
        ×
      </button>
    </div>
  )
}
