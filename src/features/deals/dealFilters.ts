import type { CurrencyCode, DealStatus } from '@/types/models'
import { CURRENCY_CODES } from '@/config/currencies'

export type DealSort = 'updated_desc' | 'created_desc' | 'amount_desc' | 'amount_asc'
export const DEAL_SORTS: DealSort[] = ['updated_desc', 'created_desc', 'amount_desc', 'amount_asc']
export const DEAL_STATUSES: DealStatus[] = ['quote_request', 'quote_received', 'negotiation', 'order_confirmed', 'in_delivery', 'delivered', 'completed', 'cancelled', 'disputed']

export interface DealFilters {
  q: string
  statuses: DealStatus[]
  counterparty?: string
  category?: string
  from?: string
  to?: string
  min?: number
  max?: number
  currencies: CurrencyCode[]
  sort: DealSort
}

const num = (v: string | null) => (v !== null && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined)
const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)

export function parseDealFilters(p: URLSearchParams): DealFilters {
  return {
    q: p.get('q') ?? '',
    statuses: (p.get('status') ?? '').split(',').filter((s): s is DealStatus => (DEAL_STATUSES as string[]).includes(s)),
    counterparty: p.get('cp') || undefined,
    category: p.get('cat') || undefined,
    from: day(p.get('from')),
    to: day(p.get('to')),
    min: num(p.get('min')),
    max: num(p.get('max')),
    currencies: (p.get('cur') ?? '').split(',').filter((c): c is CurrencyCode => (CURRENCY_CODES as string[]).includes(c)),
    sort: (DEAL_SORTS as string[]).includes(p.get('sort') ?? '') ? (p.get('sort') as DealSort) : 'updated_desc',
  }
}

export function serializeDealFilters(f: DealFilters): URLSearchParams {
  const p = new URLSearchParams()
  const set = (k: string, v: string | number | undefined) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  set('q', f.q.trim())
  set('status', f.statuses.join(','))
  set('cp', f.counterparty)
  set('cat', f.category)
  set('from', f.from)
  set('to', f.to)
  set('min', f.min)
  set('max', f.max)
  set('cur', f.currencies.join(','))
  if (f.sort !== 'updated_desc') set('sort', f.sort)
  return p
}

export const activeDealFilterCount = (f: DealFilters) =>
  f.statuses.length + f.currencies.length + [f.counterparty, f.category, f.from ?? f.to, f.min ?? f.max].filter((v) => v !== undefined).length + (f.q.trim() ? 1 : 0)
