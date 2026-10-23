import type { PartyRole, Recommendation, RecommendationReason, RecommendationTuning } from '@/types/models'
import { CURRENCIES, CURRENCY_CODES } from '@/config/currencies'
import { getAllCategories, getDescendantSlugs } from '@/config/categories'
import { db } from '@/mocks'
import { runSearch } from '@/features/search/engine'
import { emptyFilters } from '@/features/search/filtersCodec'
import { meetsVerification } from '@/features/trust/trustScore'
import { ProductSearchIndex, searchCategories, searchProducers } from '@/features/search/searchIndex'
import type { SearchContext, SearchParams, SearchResponse, SearchResultItem, Suggestions } from '@/features/search/types'
import { mockRequest } from './client'

let index: ProductSearchIndex | null = null
const getIndex = () => (index ??= new ProductSearchIndex(db.products, db.producers))

export interface SearchRequestContext {
  location: { lat: number; lng: number }
  displayCurrency: string
  role: PartyRole
  partyId: string
}

function partnerDeals(role: PartyRole, partyId: string): Record<string, number> {
  if (role !== 'buyer') return {}
  const out: Record<string, number> = {}
  for (const d of db.deals) if (d.buyerId === partyId && d.status !== 'cancelled') out[d.producerId] = (out[d.producerId] ?? 0) + 1
  return out
}

export interface RecommendationRequest {
  tuning: RecommendationTuning
  recentSearches: string[]
  savedProductIds: string[]
  savedProducerIds: string[]
  limit: number
}

export interface RecommendationResponse {
  items: (SearchResultItem & { recommendation: Recommendation })[]
}

const REASON_PRIORITY: RecommendationReason['code'][] = ['searched', 'past_partner', 'saved_similar', 'popular_with_type', 'preferred_category', 'nearby']

function contextFor(req: SearchRequestContext): SearchContext {
  return {
    location: req.location,
    displayCurrency: req.displayCurrency,
    partnerDeals: partnerDeals(req.role, req.partyId),
    rates: Object.fromEntries(CURRENCY_CODES.map((c) => [c, CURRENCIES[c].mockRateFromEUR])),
  }
}

/** Scores every listing against the buyer profile, tuning, searches, saved items and deal history. */
function recommend(req: SearchRequestContext, r: RecommendationRequest): RecommendationResponse {
  const ctx = contextFor(req)
  const all = runSearch(db.products, db.producers, null, { filters: emptyFilters(), sort: 'relevance', limit: Infinity }, ctx).items
  const buyer = db.buyers.find((b) => b.id === req.partyId)
  const byId = new Map(db.products.map((p) => [p.id, p]))
  const savedCategories = new Set(r.savedProductIds.map((id) => byId.get(id)?.categorySlug).filter(Boolean))
  const searchHits = r.recentSearches.slice(0, 5).map((term) => ({ term, hits: getIndex().search(term) }))
  const popularRoots = new Map<string, number>()
  if (buyer)
    for (const d of db.deals) {
      const other = db.buyers.find((b) => b.id === d.buyerId)
      if (!other || other.id === buyer.id || other.type !== buyer.type) continue
      for (const li of d.lineItems) {
        const root = byId.get(li.productId)?.rootCategorySlug
        if (root) popularRoots.set(root, (popularRoots.get(root) ?? 0) + 1)
      }
    }
  const topPopular = [...popularRoots.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([root]) => root)
  const scored = all.map((item) => {
    const p = item.product
    const producer = db.producers.find((x) => x.id === p.producerId)
    const reasons: RecommendationReason[] = []
    let score = 0
    const hit = searchHits.find((h) => h.hits?.has(p.id))
    if (hit) {
      score += 4
      reasons.push({ code: 'searched', term: hit.term })
    }
    if (item.pastPartnerDeals > 0) {
      score += (r.tuning.preferPastPartners ? 2.5 : 1) + Math.min(item.pastPartnerDeals, 6) * 0.4
      reasons.push({ code: 'past_partner', dealCount: item.pastPartnerDeals })
    }
    if (savedCategories.has(p.categorySlug) && !r.savedProductIds.includes(p.id)) {
      score += 2
      const ref = r.savedProductIds.find((id) => byId.get(id)?.categorySlug === p.categorySlug)
      if (ref) reasons.push({ code: 'saved_similar', productId: ref })
    }
    if (r.savedProducerIds.includes(p.producerId)) score += 1.5
    if (buyer && topPopular.includes(p.rootCategorySlug)) {
      score += 1
      reasons.push({ code: 'popular_with_type', buyerType: buyer.type })
    }
    if (r.tuning.categories.includes(p.rootCategorySlug)) {
      score += 3
      reasons.push({ code: 'preferred_category', categorySlug: p.rootCategorySlug })
    } else if (r.tuning.categories.length) score -= 3
    if (item.deliversToUser && !item.beyondMaxRange && item.distanceKm < 200) {
      score += 1.5
      reasons.push({ code: 'nearby', distanceKm: item.distanceKm })
    }
    if (item.beyondMaxRange) score -= 4
    const tier = p.pricing.tiers[0]
    if (tier) {
      const moqEUR = (tier.unitPrice * p.moq) / CURRENCIES[p.pricing.currency].mockRateFromEUR
      if (moqEUR > r.tuning.volumeEUR.max) score -= 2
      else if (moqEUR >= r.tuning.volumeEUR.min * 0.1) score += 0.5
    }
    if (r.tuning.certifications.length) score += r.tuning.certifications.every((c) => p.certifications.includes(c)) ? 1.5 : -1
    if (r.tuning.preferVerified && producer) score += meetsVerification(producer.verification.level, 'verified') ? 1 : -2
    reasons.sort((a, b) => REASON_PRIORITY.indexOf(a.code) - REASON_PRIORITY.indexOf(b.code))
    return { ...item, recommendation: { productId: p.id, score: Math.round(score * 100) / 100, reasons } }
  })
  scored.sort((a, b) => b.recommendation.score - a.recommendation.score)
  const perProducer = new Map<string, number>()
  const items = scored.filter((i) => {
    if (i.recommendation.reasons.length === 0) return false
    const n = perProducer.get(i.producer.id) ?? 0
    if (n >= 2) return false
    perProducer.set(i.producer.id, n + 1)
    return true
  })
  return { items: items.slice(0, r.limit) }
}

export interface SearchService {
  search(params: SearchParams, ctx: SearchRequestContext): Promise<SearchResponse>
  suggest(query: string): Promise<Suggestions>
  partnerDeals(role: PartyRole, partyId: string): Promise<Record<string, number>>
  recommend(ctx: SearchRequestContext, req: RecommendationRequest): Promise<RecommendationResponse>
}

/**
 * Mock search endpoint. In production this is a single GET /search with the URL query string;
 * filtering, facet counts and sorting move to the server unchanged in shape.
 */
export const searchService: SearchService = {
  search: (params, req) =>
    mockRequest(() => {
      const ctx: SearchContext = {
        location: req.location,
        displayCurrency: req.displayCurrency,
        partnerDeals: partnerDeals(req.role, req.partyId),
        rates: Object.fromEntries(CURRENCY_CODES.map((c) => [c, CURRENCIES[c].mockRateFromEUR])),
      }
      const scores = getIndex().search(params.filters.q)
      return runSearch(db.products, db.producers, scores, params, ctx)
    }),
  suggest: (query) =>
    mockRequest(
      () => {
        const scores = getIndex().search(query)
        const products = scores
          ? [...scores].sort((a, b) => a[1] - b[1]).slice(0, 5).map(([id]) => db.products.find((p) => p.id === id)).filter((p) => p !== undefined)
          : []
        const counts = (slug: string) => {
          const slugs = new Set(getDescendantSlugs(slug))
          return db.products.filter((p) => slugs.has(p.categorySlug)).length
        }
        const known = new Set(getAllCategories().map((c) => c.slug))
        return {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            producerName: db.producers.find((x) => x.id === p.producerId)?.name ?? '',
            categorySlug: p.categorySlug,
          })),
          categories: searchCategories(query)
            .filter((s) => known.has(s))
            .slice(0, 4)
            .map((slug) => ({ slug, productCount: counts(slug) })),
          producers: searchProducers(db.producers, query)
            .slice(0, 3)
            .map((p) => ({ id: p.id, name: p.name, city: p.address.city, country: p.address.country })),
        }
      },
      { latencyFactor: 0.35 },
    ),
  partnerDeals: (role, partyId) => mockRequest(() => partnerDeals(role, partyId), { latencyFactor: 0.3 }),
  recommend: (ctx, req) => mockRequest(() => recommend(ctx, req)),
}
