import type { AttributeFilterValue, Filters, GeoBounds, Lot, Producer, Product, SortOption } from '@/types/models'
import { getCategoryConfig, getCategoryChildren, getDescendantSlugs, getCategory } from '@/config/categories'
import { convertQuantity, type UnitCode } from '@/config/units'
import { distanceKm, isInBounds, roadDistanceKm } from '@/shared/lib/geo'
import { daysFromNow } from '@/shared/lib/dates'
import { meetsVerification } from '@/features/trust/trustScore'
import { documentStatus, hasValidCertificates } from '@/features/trust/documentStatus'
import { availableLots, hasLotOffer, isLotOnly, lotMeasure, normalizedLotPrice, sellableLots } from '@/features/lots/lotMath'
import type { FacetCount, LotSummary, MapPin, ProducerSummary, SearchContext, SearchResponse, SearchResultItem } from './types'

type FacetKey = 'category' | 'countries' | 'certifications' | 'lot'

function convertPrice(amount: number, from: string, ctx: SearchContext): number {
  const fromRate = ctx.rates[from] ?? 1
  const toRate = ctx.rates[ctx.displayCurrency] ?? 1
  return (amount / fromRate) * toRate
}

function unitPriceIn(item: SearchResultItem, unit: UnitCode | undefined): number | null {
  if (item.displayUnitPrice === null) return null
  if (!unit || unit === item.product.unit) return item.displayUnitPrice
  const productUnitsPerUnit = convertQuantity(1, unit, item.product.unit)
  return productUnitsPerUnit === null ? null : item.displayUnitPrice * productUnitsPerUnit
}

function attributeMatches(product: Product, key: string, filter: AttributeFilterValue): boolean {
  const def = getCategoryConfig(product.categorySlug)?.attributes.find((a) => a.key === key)
  if (!def) return false
  const value = product.attributes[key]
  if (value === undefined) return false
  switch (filter.kind) {
    case 'range':
      return typeof value === 'number' && (filter.min === undefined || value >= filter.min) && (filter.max === undefined || value <= filter.max)
    case 'enum':
      return filter.values.length === 0 || filter.values.includes(String(value))
    case 'boolean':
      return value === filter.value
    case 'text':
      return String(value).toLowerCase().includes(filter.value.toLowerCase())
  }
}

export function hasLotFilters(f: Filters): boolean {
  return (
    f.lotSizeMin !== undefined ||
    f.lotSizeMax !== undefined ||
    f.lotPriceMin !== undefined ||
    f.lotPriceMax !== undefined ||
    f.lotsAvailableMin !== undefined ||
    f.indivisibleOnly ||
    f.lotConditions.length > 0 ||
    f.producedFrom !== undefined ||
    f.producedTo !== undefined
  )
}

function lotMatches(lot: Lot, product: Product, f: Filters, ctx: SearchContext): boolean {
  if (f.lotSizeMin !== undefined || f.lotSizeMax !== undefined) {
    const unit = (f.category ? getCategoryConfig(f.category)?.defaultUnit : undefined) ?? product.unit
    const m = lotMeasure(lot, unit)
    if (m.unit !== unit) return false
    if (f.lotSizeMin !== undefined && m.quantity < f.lotSizeMin) return false
    if (f.lotSizeMax !== undefined && m.quantity > f.lotSizeMax) return false
  }
  if (f.lotPriceMin !== undefined || f.lotPriceMax !== undefined) {
    const price = convertPrice(lot.pricePerLot, product.pricing.currency, ctx)
    if (f.lotPriceMin !== undefined && price < f.lotPriceMin) return false
    if (f.lotPriceMax !== undefined && price > f.lotPriceMax) return false
  }
  if (f.lotsAvailableMin !== undefined && availableLots(lot) < f.lotsAvailableMin) return false
  if (f.indivisibleOnly && lot.divisibility.kind !== 'indivisible') return false
  if (f.lotConditions.length && !f.lotConditions.includes(lot.condition)) return false
  const produced = lot.productionDate?.slice(0, 10)
  if (f.producedFrom && (!produced || produced < f.producedFrom)) return false
  if (f.producedTo && (!produced || produced > f.producedTo)) return false
  return true
}

/** Sellable lots of a product that satisfy the active lot filters. */
export function matchingLots(product: Product, f: Filters, ctx: SearchContext): Lot[] {
  if (!product.saleModes.includes('lot')) return []
  return sellableLots(product).filter((l) => lotMatches(l, product, f, ctx))
}

function summarizeLots(product: Product, lots: Lot[], ctx: SearchContext): LotSummary | null {
  if (!lots.length) return null
  const priced = lots.map((lot) => ({ lot, norm: normalizedLotPrice(lot, product.unit) }))
  priced.sort((a, b) => (a.norm?.amount ?? a.lot.pricePerLot) - (b.norm?.amount ?? b.lot.pricePerLot))
  const best = priced[0] as { lot: Lot; norm: { amount: number; unit: Product['unit'] } | null }
  const m = lotMeasure(best.lot, product.unit)
  return {
    lotId: best.lot.id,
    type: best.lot.type,
    condition: best.lot.condition,
    content: best.lot.content,
    measure: m,
    pricePerLot: convertPrice(best.lot.pricePerLot, product.pricing.currency, ctx),
    normalizedPrice: best.norm ? convertPrice(best.norm.amount, product.pricing.currency, ctx) : null,
    normalizedUnit: best.norm?.unit ?? product.unit,
    lotsAvailable: lots.reduce((n, l) => n + availableLots(l), 0),
    lotRecords: lots.length,
    indivisible: best.lot.divisibility.kind === 'indivisible',
    lotOnly: isLotOnly(product),
  }
}

function passes(item: SearchResultItem, f: Filters, producer: Producer, skip?: FacetKey): boolean {
  const p = item.product
  if (skip !== 'lot') {
    if (f.saleMode === 'measure' && !p.saleModes.includes('measure')) return false
    if (f.saleMode === 'lot' && !item.lot) return false
    if (f.saleMode === 'both' && (!item.lot || !p.saleModes.includes('measure'))) return false
    if (hasLotFilters(f) && !item.lot) return false
  }
  const perishable = getCategoryConfig(p.categorySlug)?.perishable ?? false
  if (skip !== 'category' && f.category && !getDescendantSlugs(f.category).includes(p.categorySlug)) return false
  if (skip !== 'countries' && f.countries.length && !f.countries.includes(p.country)) return false
  if (skip !== 'certifications' && f.certifications.some((c) => !p.certifications.includes(c))) return false
  if (f.radiusKm !== undefined && item.distanceKm > f.radiusKm) return false
  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    const price = unitPriceIn(item, f.priceUnit)
    if (price === null) return false
    if (f.priceMin !== undefined && price < f.priceMin) return false
    if (f.priceMax !== undefined && price > f.priceMax) return false
  }
  if (f.moqMax !== undefined) {
    const lotMoq = item.lot ? item.lot.measure.quantity : Infinity
    const measureMoq = p.saleModes.includes('measure') ? p.moq : Infinity
    if (Math.min(lotMoq, measureMoq) > f.moqMax) return false
  }
  if (f.minRating !== undefined && producer.rating < f.minRating) return false
  if (f.inStock && p.availability.status !== 'in_stock') return false
  if (f.deliveryAvailable && (!item.deliversToUser || item.beyondMaxRange)) return false
  if (f.verificationMin && !meetsVerification(producer.verification.level, f.verificationMin)) return false
  if (f.minTrust !== undefined && producer.trust.score < f.minTrust) return false
  if (f.pastPartnersOnly && item.pastPartnerDeals === 0) return false
  if (f.validCertsOnly && (!hasValidCertificates(producer.documents) || p.documents.some((d) => documentStatus(d) === 'expired'))) return false
  if (f.expiry) {
    if (!p.expiryDate) return false
    const days = daysFromNow(p.expiryDate)
    if (f.expiry === 'lt7' && days >= 7) return false
    if (f.expiry === 'lt30' && days >= 30) return false
    if (f.expiry === 'gt30' && days <= 30) return false
  }
  if (f.leadTime) {
    if (perishable) return false
    const a = p.availability
    if (f.leadTime === 'immediate' && a.status !== 'in_stock') return false
    if (f.leadTime === 'lt1w' && (a.status === 'made_to_order' || a.leadTimeDays > 7)) return false
    if (f.leadTime === 'lt1m' && a.leadTimeDays > 30) return false
    if (f.leadTime === 'made_to_order' && a.status !== 'made_to_order') return false
  }
  for (const [key, filter] of Object.entries(f.attributes)) if (!attributeMatches(p, key, filter)) return false
  return true
}

const AVAILABILITY_RANK = { in_stock: 0, ships_in: 1, pre_order: 2, made_to_order: 3 } as const

function compare(sort: SortOption, hasQuery: boolean) {
  return (a: SearchResultItem, b: SearchResultItem): number => {
    const nullsLast = (x: number | null, y: number | null, dir: 1 | -1) =>
      x === null && y === null ? 0 : x === null ? 1 : y === null ? -1 : (x - y) * dir
    switch (sort) {
      case 'price_asc':
        return nullsLast(a.displayUnitPrice, b.displayUnitPrice, 1)
      case 'price_desc':
        return nullsLast(a.displayUnitPrice, b.displayUnitPrice, -1)
      case 'distance':
        return a.distanceKm - b.distanceKm
      case 'expiry':
        return nullsLast(a.product.expiryDate ? Date.parse(a.product.expiryDate) : null, b.product.expiryDate ? Date.parse(b.product.expiryDate) : null, 1)
      case 'availability':
        return AVAILABILITY_RANK[a.product.availability.status] - AVAILABILITY_RANK[b.product.availability.status] || a.product.availability.leadTimeDays - b.product.availability.leadTimeDays
      case 'newest':
        return b.product.createdAt.localeCompare(a.product.createdAt)
      case 'rating':
        return b.producer.rating - a.producer.rating || b.producer.reviewCount - a.producer.reviewCount
      case 'trust':
        return b.producer.trustScore - a.producer.trustScore
      case 'lot_price_asc':
        return nullsLast(a.lot?.pricePerLot ?? null, b.lot?.pricePerLot ?? null, 1)
      case 'normalized_asc':
        return nullsLast(a.comparablePrice, b.comparablePrice, 1)
      case 'relevance': {
        const boost = (i: SearchResultItem) =>
          (hasQuery ? i.score : 0) * 100 - Math.min(i.pastPartnerDeals, 5) * 2 - i.producer.trustScore / 10 + Math.min(i.distanceKm, 1500) / 150
        return boost(a) - boost(b)
      }
    }
  }
}

function count<T>(items: T[], key: (item: T) => string | string[]): FacetCount[] {
  const m = new Map<string, number>()
  for (const item of items) for (const v of [key(item)].flat()) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m].map(([value, c]) => ({ value, count: c })).sort((a, b) => b.count - a.count)
}

export function summarizeProducer(p: Producer): ProducerSummary {
  return {
    id: p.id,
    name: p.name,
    city: p.address.city,
    country: p.address.country,
    verification: p.verification.level,
    trustScore: p.trust.score,
    rating: p.rating,
    reviewCount: p.reviewCount,
    deliveryRadiusKm: p.deliveryRadiusKm,
  }
}

/** One pin per producer with ≥1 match; the label shows the cheapest matching offer. */
export function buildPins(items: SearchResultItem[]): MapPin[] {
  const groups = new Map<string, SearchResultItem[]>()
  for (const item of items) groups.set(item.producer.id, [...(groups.get(item.producer.id) ?? []), item])
  return [...groups.values()].map((group) => {
    const sorted = [...group].sort((a, b) => (a.comparablePrice ?? Infinity) - (b.comparablePrice ?? Infinity))
    const best = sorted[0] as SearchResultItem
    return {
      producerId: best.producer.id,
      location: best.product.location,
      count: group.length,
      minPrice: best.comparablePrice,
      unit: best.product.unit,
      lotPrice: best.lot?.lotOnly ? best.lot.pricePerLot : null,
      best,
    }
  })
}

export interface RunSearchOptions {
  filters: Filters
  sort: SortOption
  limit: number
  bounds?: GeoBounds
  producerId?: string
  excludeProductId?: string
}

export function runSearch(
  products: Product[],
  producers: Producer[],
  textScores: Map<string, number> | null,
  { filters, sort, limit, bounds, producerId, excludeProductId }: RunSearchOptions,
  ctx: SearchContext,
): SearchResponse {
  const byId = new Map(producers.map((p) => [p.id, p]))
  const candidates: { item: SearchResultItem; producer: Producer }[] = []
  for (const product of products) {
    if ((producerId && product.producerId !== producerId) || product.id === excludeProductId) continue
    const score = textScores ? textScores.get(product.id) : 0
    const producer = byId.get(product.producerId)
    if (score === undefined || !producer) continue
    const distance = distanceKm(ctx.location, product.location)
    const tier = product.saleModes.includes('measure') ? product.pricing.tiers[0] : undefined
    const maxKm = product.logistics.timeLimited ? product.logistics.maxDeliveryKm : undefined
    const lot = summarizeLots(product, matchingLots(product, filters, ctx), ctx)
    const measurePrice = tier ? convertPrice(tier.unitPrice, product.pricing.currency, ctx) : null
    const lotUnitPrice = lot && lot.normalizedUnit === product.unit ? lot.normalizedPrice : null
    const comparable = [measurePrice, lotUnitPrice].filter((v): v is number => v !== null)
    candidates.push({
      producer,
      item: {
        product,
        producer: summarizeProducer(producer),
        distanceKm: Math.round(distance),
        displayUnitPrice: measurePrice ?? lotUnitPrice,
        comparablePrice: comparable.length ? Math.min(...comparable) : null,
        lot,
        pastPartnerDeals: ctx.partnerDeals[producer.id] ?? 0,
        deliversToUser: distance <= producer.deliveryRadiusKm,
        beyondMaxRange: maxKm !== undefined && roadDistanceKm(ctx.location, product.location) > maxKm,
        score,
      },
    })
  }
  const matching = candidates.filter((c) => passes(c.item, filters, c.producer)).map((c) => c.item)
  matching.sort(compare(sort, textScores !== null))

  const without = (key: FacetKey) => candidates.filter((c) => passes(c.item, filters, c.producer, key)).map((c) => c.item)
  const parent = filters.category && getCategory(filters.category) ? filters.category : null
  const children = getCategoryChildren(parent)
  const categoryBase = without('category')
  const categories = children
    .map((c) => {
      const slugs = new Set(getDescendantSlugs(c.slug))
      return { value: c.slug, count: categoryBase.filter((i) => slugs.has(i.product.categorySlug)).length }
    })
    .filter((c) => c.count > 0 || parent !== null)

  const listed = bounds ? matching.filter((i) => isInBounds(i.product.location, bounds)) : matching

  return {
    items: listed.slice(0, limit),
    total: listed.length,
    unboundedTotal: matching.length,
    pins: buildPins(matching),
    facets: {
      categories,
      countries: count(without('countries'), (i) => i.product.country),
      certifications: count(without('certifications'), (i) => i.product.certifications),
      saleModes: (() => {
        const base = without('lot')
        const lot = base.filter((i) => hasLotOffer(i.product))
        return {
          measure: base.filter((i) => i.product.saleModes.includes('measure')).length,
          lot: lot.length,
          both: lot.filter((i) => i.product.saleModes.includes('measure')).length,
        }
      })(),
    },
  }
}
