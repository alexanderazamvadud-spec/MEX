import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.ts'
import './styles/index.css'
import App from './app/App.tsx'
import { initAndroid } from './native/android.ts'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('MEX could not start: the #root element is missing from index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Android app only (APK-01): system bars, back button, external links, keyboard, splash.
initAndroid().catch((error: unknown) => {
  console.error('MEX could not finish the Android start-up.', error)
})
