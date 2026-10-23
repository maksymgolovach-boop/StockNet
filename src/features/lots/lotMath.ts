import type { Lot, LotStatus, Product, UnitCode } from '@/types/models'
import { convertQuantity } from '@/config/units'
import { now } from '@/shared/lib/dates'

export interface Measure {
  quantity: number
  unit: UnitCode
}

/** The lot's size in the listing's unit when convertible (content, item size, weight or volume), else in its content unit. */
export function lotMeasure(lot: Pick<Lot, 'content' | 'totalWeightKg' | 'totalVolumeM3'>, unit: UnitCode): Measure {
  const direct = convertQuantity(lot.content.quantity, lot.content.unit, unit)
  if (direct !== null) return { quantity: direct, unit }
  const item = lot.content.itemSize
  if (item) {
    const perItem = convertQuantity(item.quantity, item.unit, unit)
    if (perItem !== null) return { quantity: perItem * lot.content.quantity, unit }
  }
  if (lot.totalWeightKg) {
    const w = convertQuantity(lot.totalWeightKg, 'kg', unit)
    if (w !== null) return { quantity: w, unit }
  }
  if (lot.totalVolumeM3) {
    const v = convertQuantity(lot.totalVolumeM3, 'm3', unit)
    if (v !== null) return { quantity: v, unit }
  }
  return { quantity: lot.content.quantity, unit: lot.content.unit }
}

/** Approximate price per unit of measure, for comparison with measure-based listings. */
export function normalizedLotPrice(lot: Lot, unit: UnitCode): { amount: number; unit: UnitCode } | null {
  const m = lotMeasure(lot, unit)
  return m.quantity > 0 ? { amount: lot.pricePerLot / m.quantity, unit: m.unit } : null
}

export function pricePerLotFor(lot: Pick<Lot, 'pricePerLot' | 'tiers'>, lots: number): number {
  const tier = [...lot.tiers].reverse().find((t) => lots >= t.minLots)
  return tier ? tier.pricePerLot : lot.pricePerLot
}

export const availableLots = (lot: Pick<Lot, 'stockCount' | 'reservedCount'>) => Math.max(0, lot.stockCount - lot.reservedCount)

export const isExpired = (lot: Pick<Lot, 'expiryDate'>, at: Date = now()) => !!lot.expiryDate && new Date(lot.expiryDate) <= at

export function lotStatus(lot: Lot, at: Date = now()): LotStatus {
  if (lot.status === 'archived') return 'archived'
  if (lot.status === 'paused') return 'paused'
  if (isExpired(lot, at)) return 'expired'
  if (availableLots(lot) > 0) return 'available'
  return lot.reservedCount > 0 ? 'reserved' : 'sold'
}

export const isSellable = (lot: Lot, at: Date = now()) => lotStatus(lot, at) === 'available'

export const sellableLots = (product: Pick<Product, 'lots'>, at: Date = now()) => product.lots.filter((l) => isSellable(l, at))

export const hasLotOffer = (product: Pick<Product, 'saleModes' | 'lots'>) => product.saleModes.includes('lot') && sellableLots(product).length > 0

export const isLotOnly = (product: Pick<Product, 'saleModes'>) => product.saleModes.length === 1 && product.saleModes[0] === 'lot'

/** Smallest orderable quantity and step, in lots. */
export function lotQuantityRule(lot: Pick<Lot, 'divisibility' | 'moqLots'>) {
  return lot.divisibility.kind === 'divisible'
    ? { min: lot.divisibility.minSplit, step: lot.divisibility.step, divisible: true }
    : { min: Math.max(1, lot.moqLots), step: 1, divisible: false }
}

export function clampLotQuantity(lot: Lot, qty: number): number {
  const { min, step } = lotQuantityRule(lot)
  const max = availableLots(lot)
  const snapped = Math.round(qty / step) * step
  return Math.round(Math.min(max, Math.max(min, snapped)) * 1000) / 1000
}

/** The cheapest sellable lot by normalized price (falls back to lot price). */
export function bestLot(product: Product): Lot | undefined {
  const lots = sellableLots(product)
  return lots.sort((a, b) => (normalizedLotPrice(a, product.unit)?.amount ?? a.pricePerLot) - (normalizedLotPrice(b, product.unit)?.amount ?? b.pricePerLot))[0]
}
