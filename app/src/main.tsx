import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import './fonts.css'
import './index.css'
import './premium.css'
import './home.css'
import './pages.css'
import './materials.css'
import './i18n'
import App from './App.tsx'
import { installPrintFit } from './lib/printfit'

installPrintFit()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
