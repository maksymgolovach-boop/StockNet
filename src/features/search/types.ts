import type { Filters, GeoBounds, GeoPoint, LotCondition, LotType, Product, SortOption, UnitCode, VerificationLevel } from '@/types/models'

export type ResultsView = 'list' | 'grid' | 'map'

export interface SearchParams {
  filters: Filters
  sort: SortOption
  limit: number
  /** restricts the result list (not the pins) to a map area */
  bounds?: GeoBounds
  producerId?: string
  excludeProductId?: string
}

export interface SearchContext {
  location: { lat: number; lng: number }
  /** producerId → number of deals the current party has with that producer */
  partnerDeals: Record<string, number>
  /** EUR-based rates used for price filtering and sorting in the display currency */
  rates: Record<string, number>
  displayCurrency: string
}

export interface ProducerSummary {
  id: string
  name: string
  city: string
  country: string
  verification: VerificationLevel
  trustScore: number
  rating: number
  reviewCount: number
  deliveryRadiusKm: number
}

export interface LotSummary {
  lotId: string
  type: LotType
  condition: LotCondition
  content: { quantity: number; unit: UnitCode; itemSize?: { quantity: number; unit: UnitCode } }
  /** lot size in the listing unit when convertible */
  measure: { quantity: number; unit: UnitCode }
  /** best lot price in the display currency */
  pricePerLot: number
  /** approx. price per measure unit in the display currency */
  normalizedPrice: number | null
  normalizedUnit: UnitCode
  /** sellable lots (sum over matching lot records) */
  lotsAvailable: number
  lotRecords: number
  indivisible: boolean
  lotOnly: boolean
}

export interface SearchResultItem {
  product: Product
  producer: ProducerSummary
  distanceKm: number
  /** MOQ-tier unit price in the display currency; null for price on request */
  displayUnitPrice: number | null
  /** cheapest price per measure unit across sale modes (normalized for lots), display currency */
  comparablePrice: number | null
  lot: LotSummary | null
  pastPartnerDeals: number
  deliversToUser: boolean
  /** time-sensitive product whose max delivery range is exceeded */
  beyondMaxRange: boolean
  score: number
}

export interface FacetCount {
  value: string
  count: number
}

export interface MapPin {
  producerId: string
  location: GeoPoint
  /** number of matching products from this producer */
  count: number
  /** cheapest matching MOQ-tier price in the display currency; null if all on request */
  minPrice: number | null
  unit: UnitCode
  /** set when the best offer is lot-only: its price per lot in the display currency */
  lotPrice: number | null
  best: SearchResultItem
}

export interface SearchResponse {
  items: SearchResultItem[]
  total: number
  /** matches before the map-area restriction */
  unboundedTotal: number
  pins: MapPin[]
  facets: {
    categories: FacetCount[]
    countries: FacetCount[]
    certifications: FacetCount[]
    saleModes: { measure: number; lot: number; both: number }
  }
}

export interface Suggestions {
  products: { id: string; name: string; producerName: string; categorySlug: string }[]
  categories: { slug: string; productCount: number }[]
  producers: { id: string; name: string; city: string; country: string }[]
}
