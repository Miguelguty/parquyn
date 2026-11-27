# Mi calendario

Carga un Excel con tus actividades fuera de la oficina (reuniones y capacitaciones) y se arma el calendario.
Todo se lee en el navegador: el archivo no se envía a ningún servidor, y los datos se guardan solo en tu
dispositivo (localStorage).

## Formato del Excel

**Descargar formato** (en la pantalla de inicio y en la barra de arriba) baja `formato-calendario.xlsx`: un Excel vacío con
estas columnas en la hoja "Cronograma" y una hoja "Instrucciones" con ejemplos (esa hoja se ignora al cargar). La hoja
Cronograma va sin filas de ejemplo para que no se carguen por error. Lo generan las mismas funciones que la exportación,
así que siempre coincide con lo que la app entiende.

Primera fila con los encabezados (no importan mayúsculas ni tildes) y una fila por actividad. Se reconocen estas
columnas; solo **Fecha** es obligatoria y el resto son opcionales:

| Dependencia | Fecha | Día | Hora | Lugar | Enlace | Teléfono | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |

- **Fecha** acepta celdas de fecha de Excel o texto con el día primero (`3/12/2026`, `3 de diciembre de 2026`, `2026-12-03`).
  También acepta el día de la semana al inicio (`lunes 23 de noviembre`). **Si no trae año** (`23 de noviembre`,
  `23 nov`, `23/11`), usa el año actual y la fila lleva el aviso "La fecha no traía año; usé AAAA".
- **Día** es el día de la semana. Se calcula a partir de la fecha; si lo que escribiste no coincide, se muestra un aviso.
- **Hora** acepta celdas de hora de Excel o texto: `9:00`, `14:30`, `3 PM`, `8:00 AM`, rangos como `9:00 a 11:30` o `10:00 – 12:00`.
  Si no se entiende, la actividad se muestra igual con el texto original y un aviso.
- **Filas sin fecha:** una fila con dependencia pero sin fecha no es un error: va a la lista **Sin fecha**, desde donde
  se le asigna una fecha y pasa al calendario, o se **quita de la lista** (se aplica al instante y se puede **Deshacer** unos segundos; no se toca tu Excel y
  vuelve a aparecer si recargas el original). Un título de sección que empiece por "Sin fecha" se ignora.
- Se lee la primera hoja del archivo. Acepta `.xlsx` y `.xlsm` (las macros no se leen ni se ejecutan).
- Un archivo nuevo reemplaza al anterior.

## Agregar, cambiar o cancelar una actividad

- **+ Agregar actividad** abre el mismo formulario (la dependencia es obligatoria; la fecha viene puesta con el día seleccionado). Las nuevas llevan la etiqueta "Nueva" y dicen "Agregada aquí", porque no vienen del Excel.
- **Editar** permite cambiar dependencia, fecha, hora inicial y final, enlace, teléfono y observación.
  El día de la semana se recalcula con la fecha. La actividad queda marcada como "Editada".
- **Cancelar actividad** no la borra: queda tachada y con la etiqueta "Cancelada", y se puede **Reactivar**.
- **Quitar fecha** devuelve una actividad programada a la lista "Sin fecha" (conserva hora, lugar y demás datos; deja
  de estar cancelada) y se puede volver a programar.
- **Borrar** elimina la actividad del todo (a diferencia de Cancelar, que la deja tachada). Se aplica al instante y aparece un
  aviso abajo con **Deshacer** durante ~10 segundos; pasado ese tiempo ya no se puede recuperar.
- **Borrar todo** (el calendario completo del dispositivo) sí pide confirmación, con los botones "Borrar todo" y "Conservar".
- Los cambios se guardan solo en el dispositivo; **no se escriben de vuelta en el Excel**. Por eso, antes de cargar
  otro Excel, la app avisa si hay cambios (editadas, canceladas o nuevas) que se perderían.

## Diseño y accesibilidad

Revisado con la guía de [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):

- Botones y campos de **44 px** (48 px en pantallas táctiles), con respuesta al toque; separación de 8 px entre ellos.
- Contraste medido (no estimado) en tema claro y oscuro: texto 4,5:1 y bordes de controles 3:1.
- Avisos flotantes abajo (zona segura del teléfono) con **Deshacer**; los errores no se cierran solos.
- Errores de formulario junto al campo, con el foco puesto en él (`aria-invalid` y `aria-describedby`).
- Sin desbordes horizontales a 320 y 375 px, ni con el texto ampliado al 200 %.

## Exportar a Excel

**Exportar a Excel** descarga un `.xlsx` con todo el calendario tal como está ahora (incluye lo editado, lo agregado,
lo cancelado y lo asignado), en el mismo formato que se carga:

- Columnas: Dependencia, Fecha (celdas de fecha reales), Día, Hora, Lugar, Enlace, Teléfono, Estado, Observaciones.
  Lugar, Enlace y Teléfono solo aparecen si alguna fila los usa; **Estado** ("Programada" o "Cancelada") solo si hay canceladas.
- Las filas sin fecha van al final, bajo el título "Sin fecha por ahora (fuera de este cronograma)".
- **Se puede volver a cargar sin perder nada** (hay pruebas que exportan, releen el archivo y comparan).
- Antes de reemplazar un Excel con cambios sin exportar, la app ofrece "Exportar antes".
- Dentro de claude.ai la descarga usa la capacidad `downloads` de los artefactos (la página la declara al publicarse);
  en un navegador normal es una descarga común.

## Publicar en un servidor

La app es un sitio estático (sin servidor propio). `npm run build` genera `dist/` con rutas relativas, así que funciona
desde cualquier subcarpeta, por ejemplo `https://mi-servidor/legacy/calendario/`.

### En el devserver, con Docker (script `deploy-calendario.sh`)

Como root, dentro del devserver (no necesita Node: el sitio se construye en un contenedor):

```bash
git clone -b ccr-f550b3df-dqncno https://github.com/Miguelguty/parquyn.git /tmp/parquyn-calendario
bash /tmp/parquyn-calendario/calendario/deploy-calendario.sh
```

- **Por defecto** levanta un contenedor nginx en el puerto `8089` (`PORT=8090 bash deploy-calendario.sh` para otro).
- **Si ya tienes una carpeta `legacy` servida por la web**, copia ahí el sitio:
  `LEGACY_DIR=/ruta/de/legacy bash deploy-calendario.sh` deja `.../legacy/calendario/index.html` y no toca las demás
  carpetas (solo reemplaza `calendario/assets`).
- Es re-ejecutable: para actualizar, vuelve a correr el mismo comando (hace `git pull`, reconstruye y publica).
- Variables opcionales: `BRANCH`, `PORT`, `APP_DIR` (por defecto `/opt/calendario`), `REPO_URL`, `NODE_IMAGE`, `LEGACY_DIR`.

### A mano

1. `npm install && npm run build`
2. Copia el **contenido** de `dist/` (`index.html`, `favicon.svg` y la carpeta `assets/`) a la carpeta que el servidor
   publica.

Los datos que cargas se guardan en el navegador de **cada dispositivo** (localStorage, ligado al nombre del sitio):
el celular y el computador no comparten calendario. Para pasar datos de uno a otro, usa **Exportar a Excel** y
**Cargar otro Excel**.

## Instalar como app (PWA)

La app es instalable y, después de abrirla una vez con conexión, abre también sin conexión (service worker en
`public/sw.js`, manifiesto en `public/manifest.webmanifest`). Requiere abrirla por **HTTPS** (o `localhost`).

- **Android (Chrome):** abre la dirección, menú ⋮ → **Instalar app** (o "Agregar a la pantalla principal"). Chrome genera
  un paquete Android propio (WebAPK) con el icono del calendario.
- **Computador (Chrome o Edge):** icono de instalar en la barra de direcciones.
- **iPhone (Safari):** Compartir → **Añadir a pantalla de inicio** (no probado).

Cuando publiques una versión nueva, la página se actualiza sola al abrirla con conexión (primero va a la red).
Si cambias la estrategia de caché de `sw.js`, sube el número de `CACHE` dentro del archivo.

## Comandos

```bash
npm install
npm run dev        # desarrollo
npm test           # pruebas de la lógica de lectura (src/lib/actividades.test.ts)
npm run build      # genera dist/ (sitio estático, se puede publicar en cualquier hosting)
```

Stack: TypeScript, React, Vite, [read-excel-file](https://www.npmjs.com/package/read-excel-file), Vitest.
