import { db } from '@/mocks'
import { clearStoredDeals } from '@/mocks/dealStorage'
import { clearStoredLots } from '@/mocks/lotStorage'

/** Demo only: drops the lot and deal edits saved in this browser and reloads the generated data. */
export function resetDemoData() {
  clearStoredLots()
  clearStoredDeals()
  window.location.reload()
}

/** Demo only: how many records of each kind the generated data holds. */
export const demoDataCounts = (): [string, number][] =>
  (['products', 'producers', 'buyers', 'deals', 'reviews', 'threads'] as const).map((kind) => [kind, db[kind].length])

/** Demo only: the name of a buyer or producer, shown next to its id. */
export const partyName = (id: string): string =>
  [...db.buyers, ...db.producers].find((party) => party.id === id)?.name ?? id
