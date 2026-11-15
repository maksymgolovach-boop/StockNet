import { showStartupError } from '@/app/startupError'
import { warmUpLanguage } from '@/features/i18n/warmUp'
import './index.css'

warmUpLanguage()
import('./boot').catch((error: unknown) => {
  console.error('[app] start-up failed', error)
  showStartupError()
})
