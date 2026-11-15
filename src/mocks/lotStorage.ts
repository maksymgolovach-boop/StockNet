import type { Lot, Product, SaleMode } from '@/types/models'
import { isRecord, matches, type Shape } from '@/shared/lib/shape'
import { safeStorage } from '@/shared/lib/storage'

const KEY = 'sy-lots'

interface StoredLots {
  version: 1
  lots: Record<string, Lot>
  saleModes: Record<string, SaleMode[]>
}

const empty = (): StoredLots => ({ version: 1, lots: {}, saleModes: {} })

const LOT: Shape = {
  id: 'string',
  productId: 'string',
  producerId: 'string',
  lotNumber: 'string',
  type: 'string',
  condition: 'string',
  status: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  content: { quantity: 'number', unit: 'string' },
  pricePerLot: 'number',
  stockCount: 'number',
  reservedCount: 'number',
  moqLots: 'number',
  tiers: [{ minLots: 'number', pricePerLot: 'number' }],
  divisibility: { kind: 'string' },
  documents: 'array',
  location: { label: 'string', city: 'string', country: 'string', point: { lat: 'number', lng: 'number' } },
}
const SALE_MODES: SaleMode[] = ['measure', 'lot']
const isSaleModes = (value: unknown): value is SaleMode[] =>
  Array.isArray(value) && value.every((mode) => SALE_MODES.includes(mode))

/** Reads the saved lot edits, keeping only records that still have the expected shape. */
function read(): StoredLots {
  try {
    const parsed: unknown = JSON.parse(safeStorage.getItem(KEY) ?? 'null')
    if (!isRecord(parsed) || parsed.version !== 1) return empty()
    const lots = Object.entries(isRecord(parsed.lots) ? parsed.lots : {}).filter(
      ([id, lot]) => matches(lot, LOT) && (lot as Lot).id === id,
    )
    const saleModes = Object.entries(isRecord(parsed.saleModes) ? parsed.saleModes : {}).filter(([, modes]) =>
      isSaleModes(modes),
    )
    return {
      version: 1,
      lots: Object.fromEntries(lots) as Record<string, Lot>,
      saleModes: Object.fromEntries(saleModes) as Record<string, SaleMode[]>,
    }
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
