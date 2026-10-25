import { clearStoredDeals } from '@/mocks/dealStorage'
import { clearStoredLots } from '@/mocks/lotStorage'

/** Demo only: drops the lot and deal edits saved in this browser and reloads the generated data. */
export function resetDemoData() {
  clearStoredLots()
  clearStoredDeals()
  window.location.reload()
}
