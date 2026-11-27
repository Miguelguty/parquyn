# Mi calendario

Carga un Excel con tus actividades fuera de la oficina (reuniones y capacitaciones) y se arma el calendario.
Todo se lee en el navegador: el archivo no se envía a ningún servidor, y los datos se guardan solo en tu
dispositivo (localStorage).

## Formato del Excel

Primera fila con los encabezados (no importan mayúsculas ni tildes) y una fila por actividad:

| Dependencia | Fechas | Días | Hora | Enlace | Teléfono en enlace | Observación |
| --- | --- | --- | --- | --- | --- | --- |

- **Fechas** es la única columna obligatoria. Acepta celdas de fecha de Excel o texto con el día primero
  (`3/12/2026`, `3 de diciembre de 2026`, `2026-12-03`).
- **Días** es el día de la semana. Se calcula a partir de la fecha; si lo que escribiste no coincide, se muestra un aviso.
- **Hora** acepta celdas de hora de Excel o texto: `9:00`, `14:30`, `3 PM`, `8:00 AM`, rangos como `9:00 a 11:30`.
  Si no se entiende, la actividad se muestra igual con el texto original y un aviso.
- Se lee la primera hoja del archivo. Solo `.xlsx`.
- Un archivo nuevo reemplaza al anterior.

## Cambiar o cancelar una actividad

- **Editar** permite cambiar dependencia, fecha, hora inicial y final, enlace, teléfono y observación.
  El día de la semana se recalcula con la fecha. La actividad queda marcada como "Editada".
- **Cancelar actividad** no la borra: queda tachada y con la etiqueta "Cancelada", y se puede **Reactivar**.
- Los cambios se guardan solo en el dispositivo; **no se escriben de vuelta en el Excel**. Por eso, antes de cargar
  otro Excel, la app avisa si hay cambios que se perderían.

## Comandos

```bash
npm install
npm run dev        # desarrollo
npm test           # pruebas de la lógica de lectura (src/lib/actividades.test.ts)
npm run build      # genera dist/ (sitio estático, se puede publicar en cualquier hosting)
npm run ejemplo    # regenera public/ejemplo.xlsx
```

Stack: TypeScript, React, Vite, [read-excel-file](https://www.npmjs.com/package/read-excel-file), Vitest.
