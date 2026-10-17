import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relative asset paths: the same build works on GitHub Pages (served from /web_evolution_simulator/)
  // and inside the Android app (served from the root)
  base: './',
})
