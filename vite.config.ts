import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The site is published by GitHub Pages under https://alexanderazamvadud-spec.github.io/MEX/,
// so every built asset URL must start with /MEX/.
export default defineConfig({
  base: '/MEX/',
  plugins: [react(), tailwindcss()],
})
