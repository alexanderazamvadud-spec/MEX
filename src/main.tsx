import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.ts'
import './styles/index.css'
import App from './app/App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('MEX could not start: the #root element is missing from index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
