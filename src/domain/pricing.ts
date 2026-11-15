import type { PriceTier } from '@/types/models'

/** The volume tier that applies to a quantity (tiers are sorted by minQty); below the first tier, the first tier. */
export function tierFor(tiers: readonly PriceTier[], quantity: number): PriceTier | undefined {
  return tiers.findLast((t) => quantity >= t.minQty) ?? tiers[0]
}
