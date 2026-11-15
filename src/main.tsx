import { showStartupError } from '@/app/startupError'
import './index.css'

import('./boot').catch((error: unknown) => {
  console.error('[app] start-up failed', error)
  showStartupError()
})
