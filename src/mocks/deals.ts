import type { CurrencyCode, Deal, DealDocument, DealEvent, DealLineItem, DealStatus, Incoterm, Product } from '@/types/models'
import { CURRENCIES } from '@/config/currencies'
import { addDays, now } from '@/shared/lib/dates'
import { createRng, type Rng } from '@/shared/lib/random'
import { BUYER_SEEDS } from './buyers'
import { cityById } from './cities'
import { PRODUCER_SEEDS } from './producers'
import { roundPrice } from './products'

interface Relationship {
  buyerId: string
  producerId: string
  count: number
  currency: CurrencyCode
  since: string
  /** statuses for the most recent deals, newest first; older deals are completed */
  recent?: DealStatus[]
  cancelled?: number
}

export const RELATIONSHIPS: Relationship[] = [
  { buyerId: 'b01', producerId: 'p10', count: 7, currency: 'RON', since: '2023-03-06', recent: ['in_delivery'] },
  { buyerId: 'b01', producerId: 'p17', count: 6, currency: 'RON', since: '2023-05-15', recent: ['order_confirmed'], cancelled: 1 },
  { buyerId: 'b01', producerId: 'p14', count: 5, currency: 'RON', since: '2023-08-21', recent: ['negotiation'] },
  { buyerId: 'b01', producerId: 'p22', count: 3, currency: 'RON', since: '2024-04-02', recent: ['delivered'] },
  { buyerId: 'b01', producerId: 'p11', count: 2, currency: 'EUR', since: '2025-02-10', recent: ['quote_received'] },
  { buyerId: 'b01', producerId: 'p13', count: 1, currency: 'USD', since: '2025-11-03', recent: ['disputed'] },
  { buyerId: 'b01', producerId: 'p20', count: 2, currency: 'RON', since: '2024-06-12' },
  { buyerId: 'b01', producerId: 'p15', count: 1, currency: 'EUR', since: '2026-10-09', recent: ['quote_request'] },
  { buyerId: 'b01', producerId: 'p25', count: 1, currency: 'RON', since: '2024-09-23' },
  { buyerId: 'b02', producerId: 'p01', count: 5, currency: 'RON', since: '2023-02-14', recent: ['in_delivery'] },
  { buyerId: 'b02', producerId: 'p05', count: 4, currency: 'RON', since: '2023-06-01' },
  { buyerId: 'b02', producerId: 'p08', count: 4, currency: 'RON', since: '2023-09-11', recent: ['order_confirmed'] },
  { buyerId: 'b02', producerId: 'p02', count: 2, currency: 'RON', since: '2024-05-20', recent: ['disputed'] },
  { buyerId: 'b03', producerId: 'p09', count: 4, currency: 'EUR', since: '2022-11-03' },
  { buyerId: 'b03', producerId: 'p06', count: 4, currency: 'EUR', since: '2023-01-09', recent: ['quote_received'] },
  { buyerId: 'b03', producerId: 'p04', count: 2, currency: 'EUR', since: '2024-03-18' },
  { buyerId: 'b04', producerId: 'p11', count: 4, currency: 'EUR', since: '2022-09-01', recent: ['in_delivery'] },
  { buyerId: 'b04', producerId: 'p18', count: 3, currency: 'EUR', since: '2023-04-24' },
  { buyerId: 'b04', producerId: 'p23', count: 3, currency: 'EUR', since: '2023-10-02', cancelled: 1 },
  { buyerId: 'b05', producerId: 'p03', count: 3, currency: 'EUR', since: '2023-09-04' },
  { buyerId: 'b05', producerId: 'p07', count: 2, currency: 'EUR', since: '2024-01-22', recent: ['negotiation'] },
  { buyerId: 'b06', producerId: 'p14', count: 3, currency: 'RON', since: '2023-03-27' },
  { buyerId: 'b06', producerId: 'p16', count: 3, currency: 'USD', since: '2024-03-05', recent: ['delivered'] },
  { buyerId: 'b06', producerId: 'p13', count: 2, currency: 'USD', since: '2024-07-15' },
  { buyerId: 'b06', producerId: 'p24', count: 1, currency: 'EUR', since: '2025-05-12' },
  { buyerId: 'b05', producerId: 'p28', count: 4, currency: 'EUR', since: '2023-10-02', recent: ['order_confirmed'] },
  { buyerId: 'b05', producerId: 'p29', count: 3, currency: 'EUR', since: '2024-02-19' },
  { buyerId: 'b02', producerId: 'p26', count: 1, currency: 'RON', since: '2025-08-04' },
  { buyerId: 'b07', producerId: 'p28', count: 7, currency: 'RON', since: '2023-02-20', recent: ['in_delivery'] },
  { buyerId: 'b07', producerId: 'p26', count: 4, currency: 'RON', since: '2023-06-12', recent: ['order_confirmed'], cancelled: 1 },
  { buyerId: 'b07', producerId: 'p29', count: 5, currency: 'EUR', since: '2023-09-04', recent: ['negotiation'] },
  { buyerId: 'b06', producerId: 'p01', count: 5, currency: 'RON', since: '2024-03-11', recent: ['delivered'] },
  { buyerId: 'b07', producerId: 'p27', count: 2, currency: 'EUR', since: '2025-03-17', recent: ['quote_received'] },
  { buyerId: 'b07', producerId: 'p03', count: 2, currency: 'EUR', since: '2025-06-02', recent: ['disputed'] },
  { buyerId: 'b07', producerId: 'p02', count: 3, currency: 'RON', since: '2024-07-22' },
  { buyerId: 'b07', producerId: 'p04', count: 1, currency: 'EUR', since: '2026-10-10', recent: ['quote_request'] },
]

export const LIFECYCLE: DealStatus[] = [
  'quote_request',
  'quote_received',
  'negotiation',
  'order_confirmed',
  'in_delivery',
  'delivered',
  'completed',
]

const ACTOR: Record<DealStatus, DealEvent['actor']> = {
  quote_request: 'buyer',
  quote_received: 'producer',
  negotiation: 'buyer',
  order_confirmed: 'producer',
  in_delivery: 'producer',
  delivered: 'producer',
  completed: 'platform',
  cancelled: 'buyer',
  disputed: 'buyer',
}

const STEP_DAYS: Record<DealStatus, [number, number]> = {
  quote_request: [0, 0],
  quote_received: [1, 3],
  negotiation: [1, 4],
  order_confirmed: [1, 5],
  in_delivery: [2, 9],
  delivered: [1, 3],
  completed: [3, 10],
  cancelled: [2, 6],
  disputed: [1, 4],
}

function pathTo(status: DealStatus): DealStatus[] {
  if (status === 'cancelled') return ['quote_request', 'quote_received', 'negotiation', 'cancelled']
  if (status === 'disputed') return ['quote_request', 'quote_received', 'order_confirmed', 'in_delivery', 'delivered', 'disputed']
  return LIFECYCLE.slice(0, LIFECYCLE.indexOf(status) + 1)
}

function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  return (amount / CURRENCIES[from].mockRateFromEUR) * CURRENCIES[to].mockRateFromEUR
}

function lineItems(products: Product[], currency: CurrencyCode, maxEUR: number, rng: Rng): DealLineItem[] {
  const priced = products.filter((p) => p.pricing.tiers.length > 0)
  const pool = [...priced]
  const n = Math.min(pool.length, rng.chance(0.55) ? 1 : rng.chance(0.6) ? 2 : 3)
  const items: DealLineItem[] = []
  for (let i = 0; i < n; i++) {
    const product = pool.splice(rng.int(0, pool.length - 1), 1)[0]
    if (!product) break
    const baseTier = product.pricing.tiers[0]
    if (!baseTier) continue
    const moqEUR = convert(baseTier.unitPrice * product.moq, product.pricing.currency, 'EUR')
    const maxMultiple = Math.max(1, Math.min(9, Math.floor(maxEUR / n / moqEUR)))
    const quantity = product.moq * rng.int(1, maxMultiple)
    const tier = [...product.pricing.tiers].reverse().find((t) => quantity >= t.minQty) ?? baseTier
    const unitPrice = roundPrice(convert(tier.unitPrice, product.pricing.currency, currency))
    items.push({
      productId: product.id,
      productName: product.name,
      categorySlug: product.categorySlug,
      quantity,
      unit: product.unit,
      unitPrice,
      subtotal: Math.round(unitPrice * quantity * 100) / 100,
    })
  }
  return items
}

function dealDocuments(id: string, events: DealEvent[], rootSlugs: string[]): DealDocument[] {
  const at = (s: DealStatus) => events.find((e) => e.status === s)?.at
  const docs: DealDocument[] = []
  const push = (type: DealDocument['type'], when: string | undefined, size: number) => {
    if (when) docs.push({ id: `${id}-${type}`, type, fileName: `${id}_${type}.pdf`, issuedAt: when, sizeKb: size })
  }
  push('quote', at('quote_received'), 140)
  push('order_confirmation', at('order_confirmed'), 95)
  push('delivery_note', at('delivered'), 60)
  push('invoice', at('delivered'), 110)
  if (rootSlugs.some((s) => ['metals', 'cables', 'concrete', 'aggregates', 'timber'].includes(s))) push('certificate', at('delivered'), 420)
  push('dispute_report', at('disputed'), 820)
  return docs
}

const NOTES = [
  'Unloading with site crane, access via north gate.',
  'Please call the site manager 30 minutes before arrival.',
  'Deliver in two drops if one truck is not possible.',
  'Pallets to be returned on next delivery.',
  '',
  '',
]

export function buildDeals(productsByProducer: Map<string, Product[]>): Deal[] {
  const rng = createRng(77)
  const producers = new Map(PRODUCER_SEEDS.map((p) => [p.id, p]))
  const buyers = new Map(BUYER_SEEDS.map((b) => [b.id, b]))
  const deals: Deal[] = []

  for (const rel of RELATIONSHIPS) {
    const producer = producers.get(rel.producerId)
    const buyer = buyers.get(rel.buyerId)
    if (!producer || !buyer) throw new Error(`Bad relationship ${rel.buyerId}/${rel.producerId}`)
    const catalog = (productsByProducer.get(rel.producerId) ?? []).filter((p) => buyer.preferredCategories.includes(p.rootCategorySlug))
    const products = catalog.length ? catalog : productsByProducer.get(rel.producerId) ?? []
    const since = new Date(`${rel.since}T08:00:00Z`)
    const span = now().getTime() - since.getTime()
    const city = cityById(buyer.cityId)

    const statuses: DealStatus[] = Array.from({ length: rel.count }, () => 'completed')
    rel.recent?.forEach((s, i) => (statuses[rel.count - 1 - i] = s))
    for (let c = 0; c < (rel.cancelled ?? 0); c++) statuses[Math.max(0, rel.count - 2 - c - (rel.recent?.length ?? 0) + 1)] = 'cancelled'

    statuses.forEach((status, i) => {
      const isRecentActive = rel.recent !== undefined && i >= rel.count - rel.recent.length
      const fraction = rel.count === 1 ? 0.35 : (i / (rel.count - 1)) * 0.9
      let start = new Date(since.getTime() + span * fraction + rng.int(0, 12) * 86_400_000)
      const path = pathTo(status)
      if (isRecentActive) start = addDays(now(), -rng.int(path.length * 2, path.length * 4))
      let cursor = start
      let events: DealEvent[] = path.map((s, k) => {
        if (k > 0) cursor = addDays(cursor, rng.int(...STEP_DAYS[s]))
        return { id: `ev-${deals.length}-${k}`, status: s, at: cursor.toISOString(), actor: ACTOR[s] }
      })
      const lastAt = new Date(events[events.length - 1]?.at ?? start)
      const latestAllowed = addDays(now(), -rng.float(0.05, isRecentActive ? 2.5 : 6, 2))
      if (lastAt > latestAllowed) {
        const shift = lastAt.getTime() - latestAllowed.getTime()
        events = events.map((e) => ({ ...e, at: new Date(new Date(e.at).getTime() - shift).toISOString() }))
        start = new Date(start.getTime() - shift)
      }

      const items = lineItems(products, rel.currency, buyer.typicalOrderEUR.max, rng)
      const total = Math.round(items.reduce((sum, li) => sum + li.subtotal, 0) * 100) / 100
      const id = `tmp-${deals.length}`

      const confirmedAt = events.find((e) => e.status === 'order_confirmed')?.at
      const requested = confirmedAt ? addDays(new Date(confirmedAt), rng.int(5, 14)) : addDays(new Date(events[0]?.at ?? start), rng.int(14, 30))
      const deliveredAt = events.find((e) => e.status === 'delivered')?.at
      const onTime = deliveredAt ? rng.chance(producer.onTime) : undefined
      const deliveredFinal =
        deliveredAt && onTime === false ? addDays(requested, rng.int(1, 4)).toISOString() : deliveredAt && onTime ? addDays(requested, -rng.int(0, 2)).toISOString() : deliveredAt
      const logistics = products[0]?.logistics
      const incoterm: Incoterm = logistics?.incoterms.includes('DAP') ? 'DAP' : 'EXW'
      const last = events[events.length - 1]

      deals.push({
        id,
        buyerId: rel.buyerId,
        producerId: rel.producerId,
        currency: rel.currency,
        lineItems: items,
        total,
        incoterm,
        deliveryAddress: { street: buyer.street, postcode: city.postcode, city: city.name, region: city.region, country: city.country },
        requestedDeliveryDate: requested.toISOString(),
        deliveredAt: deliveredFinal,
        onTime,
        status,
        events,
        notes: rng.pick(NOTES),
        documents: dealDocuments(id, events, [...new Set(items.map((li) => products.find((p) => p.id === li.productId)?.rootCategorySlug ?? ''))]),
        createdAt: events[0]?.at ?? start.toISOString(),
        updatedAt: last?.at ?? start.toISOString(),
      })
    })
  }
  return assignIds(deals).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Deal numbers are sequential per year in creation order, like a real ERP. */
function assignIds(deals: Deal[]): Deal[] {
  const seqByYear = new Map<number, number>()
  return [...deals]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((d) => {
      const year = new Date(d.createdAt).getUTCFullYear()
      const seq = (seqByYear.get(year) ?? 0) + 1
      seqByYear.set(year, seq)
      const id = `D-${year}-${String(seq).padStart(4, '0')}`
      return {
        ...d,
        id,
        events: d.events.map((e, k) => ({ ...e, id: `${id}-ev${k}` })),
        documents: d.documents.map((doc) => ({ ...doc, id: doc.id.replace(d.id, id), fileName: doc.fileName.replace(d.id, id) })),
      }
    })
}
