import type { Lot, Product, SaleMode } from '@/types/models'
import { safeStorage } from '@/shared/lib/storage'

const KEY = 'sy-lots'

interface StoredLots {
  version: 1
  lots: Record<string, Lot>
  saleModes: Record<string, SaleMode[]>
}

const empty = (): StoredLots => ({ version: 1, lots: {}, saleModes: {} })

function read(): StoredLots {
  try {
    const raw = safeStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as StoredLots
    return parsed.version === 1 && parsed.lots && parsed.saleModes ? parsed : empty()
  } catch {
    return empty()
  }
}

function write(data: StoredLots) {
  safeStorage.setItem(KEY, JSON.stringify(data))
}

/** Producer edits made on the Stock & lots page are replayed over the generated catalogue at start-up. */
export function applyStoredLots(products: Product[]) {
  const data = read()
  const byId = new Map(products.map((p) => [p.id, p]))
  for (const [productId, modes] of Object.entries(data.saleModes)) {
    const p = byId.get(productId)
    if (p && modes.length) p.saleModes = modes
  }
  for (const lot of Object.values(data.lots)) {
    const p = byId.get(lot.productId)
    if (!p) continue
    const i = p.lots.findIndex((l) => l.id === lot.id)
    if (i >= 0) p.lots[i] = lot
    else p.lots.push(lot)
  }
}

export function persistLot(lot: Lot) {
  const data = read()
  data.lots[lot.id] = lot
  write(data)
}

export function persistSaleModes(productId: string, modes: SaleMode[]) {
  const data = read()
  data.saleModes[productId] = modes
  write(data)
}

export function clearStoredLots() {
  safeStorage.removeItem(KEY)
}

export function hasStoredLots() {
  const data = read()
  return Object.keys(data.lots).length + Object.keys(data.saleModes).length > 0
}
