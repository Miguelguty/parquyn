import { useRef, useState, type DragEvent } from 'react'
import { AgendaView } from './components/AgendaView'
import { MesView } from './components/MesView'
import type { Actividad } from './lib/actividades'
import { cargar, guardar, type Datos } from './lib/almacen'
import { MESES, hoyISO } from './lib/formato'
import { resultadoDemo } from './lib/demo'
import { leerExcel } from './lib/leerExcel'

type Vista = 'mes' | 'agenda'

/** En la versión de demostración publicada se abre ya con datos de ejemplo. */
const ABRIR_CON_EJEMPLO = import.meta.env.VITE_ARTIFACT === '1'

function datosEjemplo(): Datos {
  const r = resultadoDemo()
  return { nombre: 'Datos de ejemplo', actividades: r.actividades, problemas: r.problemas, esEjemplo: true }
}

function primerDia(actividades: Actividad[], hoy: string): string | null {
  return actividades.find((a) => a.fecha >= hoy)?.fecha ?? actividades[0]?.fecha ?? null
}

/** Elige el mes que conviene mostrar primero: el de hoy si tiene actividades,
 *  si no el de la próxima actividad, y si no hay próximas, el de la última. */
function mesInicial(actividades: Actividad[], hoy: string): { año: number; mes: number } {
  const delMes = (f: string) => ({ año: +f.slice(0, 4), mes: +f.slice(5, 7) - 1 })
  const m = hoy.slice(0, 7)
  if (actividades.some((a) => a.fecha.startsWith(m))) return delMes(hoy)
  const proxima = actividades.find((a) => a.fecha >= hoy)
  if (proxima) return delMes(proxima.fecha)
  if (actividades.length) return delMes(actividades[actividades.length - 1].fecha)
  return delMes(hoy)
}

export default function App() {
  const hoy = hoyISO()
  const [datos, setDatos] = useState<Datos | null>(() => cargar() ?? (ABRIR_CON_EJEMPLO ? datosEjemplo() : null))
  const [vista, setVista] = useState<Vista>('mes')
  const [cursor, setCursor] = useState(() => mesInicial(datos?.actividades ?? [], hoy))
  const [seleccionado, setSeleccionado] = useState<string | null>(() => primerDia(datos?.actividades ?? [], hoy))
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  async function procesar(archivo: File) {
    setError(null)
    setCargando(true)
    try {
      const r = await leerExcel(archivo)
      const nuevo: Datos = { nombre: archivo.name, actividades: r.actividades, problemas: r.problemas }
      setDatos(nuevo)
      guardar(nuevo)
      setCursor(mesInicial(r.actividades, hoy))
      setSeleccionado(primerDia(r.actividades, hoy))
      setConfirmandoBorrar(false)
    } catch {
      setError(
        'No pude abrir ese archivo. Tiene que ser un Excel .xlsx. Si es un .xls antiguo, ábrelo en Excel y guárdalo como .xlsx.',
      )
    } finally {
      setCargando(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault()
    setArrastrando(false)
    const archivo = e.dataTransfer.files[0]
    if (archivo) void procesar(archivo)
  }

  function mover(delta: number) {
    setCursor(({ año, mes }) => {
      const d = new Date(Date.UTC(año, mes + delta, 1))
      return { año: d.getUTCFullYear(), mes: d.getUTCMonth() }
    })
  }

  function irAHoy() {
    setCursor({ año: +hoy.slice(0, 4), mes: +hoy.slice(5, 7) - 1 })
    setSeleccionado(hoy)
  }

  function verEjemplo() {
    const ejemplo = datosEjemplo()
    setDatos(ejemplo)
    setCursor(mesInicial(ejemplo.actividades, hoy))
    setSeleccionado(primerDia(ejemplo.actividades, hoy))
    setError(null)
  }

  function borrar() {
    setDatos(null)
    guardar(null)
    setSeleccionado(null)
    setError(null)
    setConfirmandoBorrar(false)
  }

  const avisosCuenta = datos ? datos.actividades.filter((a) => a.avisos.length > 0).length : 0

  const selector = (
    <input
      ref={entrada}
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) void procesar(f)
      }}
    />
  )

  if (!datos) {
    return (
      <main className="contenedor">
        <h1>Mi calendario</h1>
        {selector}
        <div
          className={`soltar${arrastrando ? ' activo' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
        >
          <p className="grande">Carga tu Excel y se arma el calendario</p>
          <button type="button" className="primario" onClick={() => entrada.current?.click()} disabled={cargando}>
            {cargando ? 'Leyendo…' : 'Elegir archivo Excel (.xlsx)'}
          </button>
          <p className="muted">o suéltalo aquí</p>
          <p>
            <button type="button" onClick={verEjemplo}>Ver con datos de ejemplo</button>
          </p>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <section className="ayuda">
          <h2>¿Cómo debe ser el Excel?</h2>
          <p>
            Una fila por actividad, con estas columnas en la primera fila: <strong>Dependencia, Fechas, Días, Hora,
            Enlace, Teléfono en enlace, Observación</strong>. No importan las mayúsculas ni las tildes.
          </p>
          {!ABRIR_CON_EJEMPLO && (
            <p>
              <a href={`${import.meta.env.BASE_URL}ejemplo.xlsx`} download>Descargar un Excel de ejemplo</a>
            </p>
          )}
          <p className="muted">
            Tu archivo se lee en este mismo dispositivo y no se envía a ningún servidor. Las fechas escritas como
            texto se leen con el día primero (3/12/2026 es 3 de diciembre).
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="contenedor">
      <header className="barra">
        <div>
          <h1>Mi calendario</h1>
          <p className="muted">
            {datos.actividades.length} actividad{datos.actividades.length === 1 ? '' : 'es'} · {datos.nombre}
          </p>
          {datos.esEjemplo && (
            <p className="ejemplo">
              Estás viendo datos de ejemplo con fechas cercanas a hoy. Carga tu Excel para ver los tuyos.
            </p>
          )}
        </div>
        <div className="acciones">
          {selector}
          <button type="button" className={datos.esEjemplo ? 'primario' : undefined} onClick={() => entrada.current?.click()} disabled={cargando}>
            {cargando ? 'Leyendo…' : datos.esEjemplo ? 'Cargar mi Excel' : 'Cargar otro Excel'}
          </button>
          {datos.esEjemplo ? (
            <button type="button" onClick={borrar}>Salir del ejemplo</button>
          ) : confirmandoBorrar ? (
            <span className="confirmar" role="group" aria-label="Confirmar borrado">
              <span>¿Borrar del dispositivo? Tu Excel no se toca.</span>
              <button type="button" className="peligro" onClick={borrar}>Sí, borrar</button>
              <button type="button" onClick={() => setConfirmandoBorrar(false)}>No</button>
            </span>
          ) : (
            <button type="button" className="peligro" onClick={() => setConfirmandoBorrar(true)}>Borrar</button>
          )}
        </div>
      </header>

      {error && <p role="alert" className="error">{error}</p>}

      {(datos.problemas.length > 0 || avisosCuenta > 0) && (
        <details className="revisar" open={datos.problemas.length > 0}>
          <summary>
            ⚠ Revisar el Excel:
            {datos.problemas.length > 0 && ` ${datos.problemas.length} fila${datos.problemas.length === 1 ? '' : 's'} sin cargar`}
            {datos.problemas.length > 0 && avisosCuenta > 0 && ','}
            {avisosCuenta > 0 && ` ${avisosCuenta} con avisos`}
          </summary>
          {datos.problemas.length > 0 && (
            <>
              <p className="muted">Estas filas no aparecen en el calendario:</p>
              <ul>
                {datos.problemas.map((p, i) => (
                  <li key={i}>Fila {p.fila}: {p.mensaje}</li>
                ))}
              </ul>
            </>
          )}
          {avisosCuenta > 0 && <p className="muted">Las filas con avisos sí aparecen; el aviso sale en su tarjeta.</p>}
        </details>
      )}

      <nav className="controles" aria-label="Vista">
        <div className="pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={vista === 'mes'} onClick={() => setVista('mes')}>Mes</button>
          <button type="button" role="tab" aria-selected={vista === 'agenda'} onClick={() => setVista('agenda')}>Agenda</button>
        </div>
        {vista === 'mes' && (
          <div className="meses">
            <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button>
            <strong aria-live="polite">{MESES[cursor.mes]} {cursor.año}</strong>
            <button type="button" onClick={() => mover(1)} aria-label="Mes siguiente">›</button>
            <button type="button" onClick={irAHoy}>Hoy</button>
          </div>
        )}
      </nav>

      {vista === 'mes' ? (
        <MesView
          actividades={datos.actividades}
          año={cursor.año}
          mes={cursor.mes}
          hoy={hoy}
          seleccionado={seleccionado}
          onSeleccionar={setSeleccionado}
        />
      ) : (
        <AgendaView actividades={datos.actividades} hoy={hoy} />
      )}
    </main>
  )
}
