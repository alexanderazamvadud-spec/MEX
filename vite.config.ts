import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The version shown in Settings > About (MVP-17): from package.json, plus the commit and
// the date of the build, added here so nothing has to be updated by hand.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}

// The site is published by GitHub Pages under https://alexanderazamvadud-spec.github.io/MEX/,
// so every built asset URL must start with /MEX/. The Android app (APK-01) serves the same
// files from the root of its own web view, so its build (`vite build --mode android`, run by
// `npm run build:android`) uses relative URLs and writes to dist-android/ instead of dist/.
export default defineConfig(({ mode }) => {
  const android = mode === 'android'
  return {
    base: android ? './' : '/MEX/',
    build: android ? { outDir: 'dist-android' } : undefined,
    plugins: [react(), tailwindcss()],
    define: {
      __MEX_BUILD__: JSON.stringify({ version, commit: commit(), date: new Date().toISOString().slice(0, 10) }),
    },
  }
})
