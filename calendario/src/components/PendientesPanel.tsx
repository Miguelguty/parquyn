import { useState } from 'react'
import type { Cambios, Pendiente } from '../lib/actividades'
import { textoHora } from '../lib/formato'
import { FormActividad } from './FormActividad'

type Props = {
  pendientes: Pendiente[]
  onAsignar: (id: string, cambios: Cambios) => void
  onQuitar: (id: string) => void
}

/** Filas del Excel que todavía no tienen fecha. Al asignarla pasan al calendario. */
export function PendientesPanel({ pendientes, onAsignar, onQuitar }: Props) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  if (pendientes.length === 0) return null

  return (
    <details className="sin-fecha">
      <summary>Sin fecha ({pendientes.length}): toca para programarlas</summary>
      <p className="muted">Filas del Excel que todavía no tienen fecha. Cuando las programes, asígnales una y pasan al calendario.</p>
      {pendientes.map((p) =>
        abierto === p.id ? (
          <article key={p.id} className="actividad editando">
            <FormActividad
              titulo={`Asignar fecha a ${p.dependencia}`}
              inicial={{
                dependencia: p.dependencia,
                fecha: '',
                hora: p.hora,
                horaFin: p.horaFin,
                lugar: p.lugar,
                enlace: p.enlace,
                telefono: p.telefono,
                observacion: p.observacion,
              }}
              idBase={p.id}
              horaOriginal={p.horaTexto}
              textoGuardar="Asignar fecha"
              onGuardar={(c) => {
                onAsignar(p.id, c)
                setAbierto(null)
              }}
              onCerrar={() => setAbierto(null)}
            />
          </article>
        ) : (
          <article key={p.id} className="actividad">
            <div className="actividad-hora">{textoHora(p)}</div>
            <div className="actividad-cuerpo">
              <h3>{p.dependencia}</h3>
              {p.lugar && <p>Lugar: {p.lugar}</p>}
              {p.observacion && <p className="observacion">{p.observacion}</p>}
              <div className="acciones-act">
                <button type="button" className="primario" onClick={() => setAbierto(p.id)}>Asignar fecha</button>
                {confirmando === p.id ? (
                  <span className="confirmar" role="group" aria-label={`Confirmar quitar ${p.dependencia}`}>
                    <span>¿Quitar "{p.dependencia}" de la lista?</span>
                    <button
                      type="button"
                      className="peligro"
                      onClick={() => {
                        onQuitar(p.id)
                        setConfirmando(null)
                      }}
                    >
                      Sí, quitar
                    </button>
                    <button type="button" onClick={() => setConfirmando(null)}>No</button>
                  </span>
                ) : (
                  <button type="button" className="peligro" onClick={() => setConfirmando(p.id)}>Quitar de la lista</button>
                )}
                <span className="muted fila">Fila {p.fila} del Excel</span>
              </div>
            </div>
          </article>
        ),
      )}
    </details>
  )
}
