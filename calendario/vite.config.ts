import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: el sitio funciona desde cualquier subcarpeta (p. ej. /legacy/calendario/).
  base: './',
  plugins: [react()],
})
