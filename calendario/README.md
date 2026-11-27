# Mi calendario

Carga un Excel con tus actividades fuera de la oficina (reuniones y capacitaciones) y se arma el calendario.
Todo se lee en el navegador: el archivo no se envía a ningún servidor, y los datos se guardan solo en tu
dispositivo (localStorage).

## Formato del Excel

Primera fila con los encabezados (no importan mayúsculas ni tildes) y una fila por actividad. Se reconocen estas
columnas; solo **Fecha** es obligatoria y el resto son opcionales:

| Dependencia | Fecha | Día | Hora | Lugar | Enlace | Teléfono | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |

- **Fecha** acepta celdas de fecha de Excel o texto con el día primero (`3/12/2026`, `3 de diciembre de 2026`, `2026-12-03`).
- **Día** es el día de la semana. Se calcula a partir de la fecha; si lo que escribiste no coincide, se muestra un aviso.
- **Hora** acepta celdas de hora de Excel o texto: `9:00`, `14:30`, `3 PM`, `8:00 AM`, rangos como `9:00 a 11:30` o `10:00 – 12:00`.
  Si no se entiende, la actividad se muestra igual con el texto original y un aviso.
- **Filas sin fecha:** una fila con dependencia pero sin fecha no es un error: va a la lista **Sin fecha**, desde donde
  se le asigna una fecha y pasa al calendario, o se **quita de la lista** (con confirmación; no se toca tu Excel y
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
- **Borrar** elimina la actividad del todo, con confirmación y sin deshacer (a diferencia de Cancelar, que la deja tachada).
- Los cambios se guardan solo en el dispositivo; **no se escriben de vuelta en el Excel**. Por eso, antes de cargar
  otro Excel, la app avisa si hay cambios (editadas, canceladas o nuevas) que se perderían.

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

## Comandos

```bash
npm install
npm run dev        # desarrollo
npm test           # pruebas de la lógica de lectura (src/lib/actividades.test.ts)
npm run build      # genera dist/ (sitio estático, se puede publicar en cualquier hosting)
npm run ejemplo    # regenera public/ejemplo.xlsx
```

Stack: TypeScript, React, Vite, [read-excel-file](https://www.npmjs.com/package/read-excel-file), Vitest.
