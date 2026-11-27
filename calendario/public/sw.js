// Service worker de "Mi calendario": permite abrir la app sin conexión después de la primera visita.
// Si cambias la estrategia, sube el número de CACHE para que los equipos borren lo guardado.
const CACHE = 'calendario-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const nombre of await caches.keys()) if (nombre !== CACHE) await caches.delete(nombre)
      await self.clients.claim()
    })(),
  )
})

async function guardar(peticion, respuesta) {
  if (!respuesta.ok) return
  const cache = await caches.open(CACHE)
  await cache.put(peticion, respuesta)
}

self.addEventListener('fetch', (event) => {
  const peticion = event.request
  if (peticion.method !== 'GET') return
  const url = new URL(peticion.url)
  if (url.origin !== self.location.origin) return

  // Archivos con código en el nombre (assets/index-AbC123.js): no cambian de contenido, se sirven guardados.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(peticion).then(
        (guardado) =>
          guardado ||
          fetch(peticion).then((respuesta) => {
            event.waitUntil(guardar(peticion, respuesta.clone()))
            return respuesta
          }),
      ),
    )
    return
  }

  // La página y demás archivos: primero la red (así siempre se ve la versión nueva); sin red, lo guardado.
  event.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        event.waitUntil(guardar(peticion, respuesta.clone()))
        return respuesta
      })
      .catch(async () => {
        const guardado = await caches.match(peticion)
        if (guardado) return guardado
        if (peticion.mode === 'navigate') {
          // La dirección exacta puede no estar guardada (con o sin /index.html): se prueba la raíz y el index.
          for (const destino of [self.registration.scope, new URL('./index.html', self.registration.scope).href]) {
            const inicio = await caches.match(destino)
            if (inicio) return inicio
          }
        }
        return Response.error()
      }),
  )
})
