import { useMemo } from 'react'
import type { Deal, PartyRole } from '@/types/models'
import { CURRENCIES } from '@/config/currencies'
import { useCompanyIds } from '@/features/dev/devStore'
import { useMyDeals } from '@/services/queries'

export interface PartnerHistory {
  deals: Deal[]
  completed: number
  active: number
  firstAt: string | null
  lastAt: string | null
  totalEUR: number
  onTimeRate: number | null
}

const ACTIVE = new Set(['quote_request', 'quote_received', 'negotiation', 'order_confirmed', 'in_delivery', 'delivered', 'disputed'])

/** The company's private history with one counterparty (only ever computed from the user's own deals). */
export function usePartnerHistory(counterpartyId: string | undefined, side: PartyRole): PartnerHistory | null {
  const { data } = useMyDeals()
  const { buyerId, producerId } = useCompanyIds()
  return useMemo(() => {
    if (!data || !counterpartyId) return null
    const deals = data
      .filter((d) => (side === 'buyer' ? d.buyerId === buyerId && d.producerId === counterpartyId : d.producerId === producerId && d.buyerId === counterpartyId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (!deals.length) return null
    const delivered = deals.filter((d) => d.onTime !== undefined)
    const toEUR = (d: Deal) => d.total / CURRENCIES[d.currency].mockRateFromEUR
    return {
      deals,
      completed: deals.filter((d) => d.status === 'completed').length,
      active: deals.filter((d) => ACTIVE.has(d.status)).length,
      firstAt: deals[deals.length - 1]?.createdAt ?? null,
      lastAt: deals[0]?.createdAt ?? null,
      totalEUR: deals.filter((d) => d.status !== 'cancelled').reduce((s, d) => s + toEUR(d), 0),
      onTimeRate: delivered.length ? delivered.filter((d) => d.onTime).length / delivered.length : null,
    }
  }, [data, counterpartyId, side, buyerId, producerId])
}
