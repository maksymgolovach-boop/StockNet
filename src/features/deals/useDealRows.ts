import { useMemo } from 'react'
import type { Deal } from '@/types/models'
import { getCategory } from '@/config/categories'
import { sideForDeal } from '@/features/company/company'
import { useCurrency } from '@/features/currency/useCurrency'
import { usePartners, type Partner } from '@/features/chat/usePartner'
import { useCompanyIds } from '@/features/dev/devStore'
import { normalize } from '@/features/search/normalize'
import { useMyDeals } from '@/services/queries'
import type { DealFilters } from './dealFilters'

export interface DealRow {
  deal: Deal
  partner: Partner | undefined
  counterpartyId: string
  /** total in the display currency (null while rates load) */
  displayTotal: number | null
  rootCategories: string[]
}

export function useDealRows(filters: DealFilters) {
  const { buyerId, producerId } = useCompanyIds()
  const deals = useMyDeals()
  const { resolve, isPending: partnersPending } = usePartners()
  const { convert } = useCurrency()

  const all: DealRow[] = useMemo(
    () =>
      (deals.data ?? []).map((deal) => {
        const side = sideForDeal(deal, { buyerId, producerId })!
        return {
          deal,
          partner: resolve(deal),
          counterpartyId: side === 'buyer' ? deal.producerId : deal.buyerId,
          displayTotal: convert(deal.total, deal.currency),
          rootCategories: [...new Set(deal.lineItems.map((li) => getCategory(li.categorySlug)?.rootSlug ?? li.categorySlug))],
        }
      }),
    [deals.data, resolve, buyerId, producerId, convert],
  )

  const rows = useMemo(() => {
    const q = normalize(filters.q)
    const out = all.filter(({ deal, partner, counterpartyId, displayTotal, rootCategories }) => {
      if (filters.statuses.length && !filters.statuses.includes(deal.status)) return false
      if (filters.counterparty && counterpartyId !== filters.counterparty) return false
      if (filters.category && !rootCategories.includes(filters.category)) return false
      const created = deal.createdAt.slice(0, 10)
      if (filters.from && created < filters.from) return false
      if (filters.to && created > filters.to) return false
      if (filters.min !== undefined && (displayTotal ?? 0) < filters.min) return false
      if (filters.max !== undefined && (displayTotal ?? 0) > filters.max) return false
      if (filters.currencies.length && !filters.currencies.includes(deal.currency)) return false
      if (q) {
        const hay = normalize([deal.id, partner?.name ?? '', ...deal.lineItems.map((li) => `${li.productName} ${li.lot?.lotNumber ?? ''}`)].join(' '))
        if (!hay.includes(q)) return false
      }
      return true
    })
    const by = {
      updated_desc: (a: DealRow, b: DealRow) => b.deal.updatedAt.localeCompare(a.deal.updatedAt),
      created_desc: (a: DealRow, b: DealRow) => b.deal.createdAt.localeCompare(a.deal.createdAt),
      amount_desc: (a: DealRow, b: DealRow) => (b.displayTotal ?? 0) - (a.displayTotal ?? 0),
      amount_asc: (a: DealRow, b: DealRow) => (a.displayTotal ?? 0) - (b.displayTotal ?? 0),
    }[filters.sort]
    return out.sort(by)
  }, [all, filters])

  return { all, rows, isPending: deals.isPending || partnersPending, error: deals.error, refetch: deals.refetch }
}
