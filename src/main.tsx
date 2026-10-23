import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initI18n, setDocumentLanguage } from '@/features/i18n/i18n'
import { usePreferences } from '@/features/settings/preferencesStore'
import { App } from '@/app/App'
import './index.css'

const language = usePreferences.getState().language
initI18n(language)
setDocumentLanguage(language)

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
