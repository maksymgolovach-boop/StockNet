import type { CurrencyCode } from '@/config/currencies'
import type { LanguageCode } from '@/config/languages'
import type { UnitCode, UnitsSystem } from '@/config/units'
import type { CertificationCode } from '@/config/certifications'

export type { CurrencyCode, CurrencyCode as Currency, LanguageCode, UnitCode, UnitsSystem, CertificationCode }

export type ISODate = string
export type CountryCode = string

export interface GeoPoint {
  lat: number
  lng: number
}

export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

/* ───────────── Categories ───────────── */

interface AttributeBase {
  key: string
  filterable: boolean
  /** shown as a compact spec chip on product cards */
  showOnCard?: boolean
  required?: boolean
}

export interface NumberAttributeDefinition extends AttributeBase {
  type: 'number'
  unit?: string
  min: number
  max: number
  step?: number
}

export interface EnumAttributeDefinition extends AttributeBase {
  type: 'enum'
  options: readonly string[]
  /** translate: i18n `enums.<key>.<option>` · verbatim: codes like "S355J2" · region: ISO country via Intl.DisplayNames */
  display: 'translate' | 'verbatim' | 'region'
}

export interface BooleanAttributeDefinition extends AttributeBase {
  type: 'boolean'
}

export interface TextAttributeDefinition extends AttributeBase {
  type: 'text'
  searchable?: boolean
}

export type AttributeDefinition =
  | NumberAttributeDefinition
  | EnumAttributeDefinition
  | BooleanAttributeDefinition
  | TextAttributeDefinition

export type AttributeType = AttributeDefinition['type']
export type AttributeValue = number | string | boolean

export type DeliveryMode = 'pickup' | 'truck' | 'bulk' | 'cold_chain'
export type Incoterm = 'EXW' | 'FCA' | 'DAP' | 'DDP'

export interface LogisticsProfile {
  deliveryModes: readonly DeliveryMode[]
  coldChain: boolean
  heavyFreight: boolean
  bulk: boolean
  timeLimited: boolean
  maxDeliveryKm?: number
  maxDeliveryHours?: number
  storageTempC?: { min: number; max: number }
  incoterms: readonly Incoterm[]
  /** indicative EUR shipping estimate: base + perKm per full load */
  shippingEstimateEUR: { base: number; perKm: number; loadSize: number }
}

export type SaleMode = 'measure' | 'lot'
export type LotType = 'pallet' | 'bundle' | 'coil_set' | 'truckload' | 'container' | 'crate' | 'mixed' | 'other'
export type LotCondition = 'new' | 'surplus' | 'clearance' | 'b_grade' | 'returned'

export interface LotPolicy {
  allowedSaleModes: readonly SaleMode[]
  lotTypes: readonly LotType[]
  requiresExpiry: boolean
  requiresBatch: boolean
  requiresCertificate: boolean
}

export interface CategoryConfig {
  slug: string
  icon: string
  perishable: boolean
  allowedUnits: readonly UnitCode[]
  defaultUnit: UnitCode
  lots: LotPolicy
  attributes: readonly AttributeDefinition[]
  certifications: readonly CertificationCode[]
  logistics: LogisticsProfile
  children: readonly CategoryNodeConfig[]
}

export interface CategoryNodeConfig {
  slug: string
  /** subcategory-specific overrides, e.g. ready-mix concrete's short delivery range */
  logistics?: Partial<LogisticsProfile>
  children?: readonly CategoryNodeConfig[]
}

/** A resolved node of the category tree (any level). Names come from i18n: `categories.<slug>`. */
export interface Category {
  slug: string
  rootSlug: string
  parentSlug: string | null
  level: 1 | 2 | 3
  path: string[]
  childSlugs: string[]
  icon: string
}

/* ───────────── Currency ───────────── */

export interface ExchangeRates {
  base: CurrencyCode
  rates: Record<CurrencyCode, number>
  updatedAt: ISODate
  indicative: true
}

export interface Money {
  amount: number
  currency: CurrencyCode
}

/* ───────────── Trust ───────────── */

export type VerificationLevel = 'unverified' | 'identity' | 'verified' | 'audited'

export type VerificationCheckKind =
  | 'company_registry'
  | 'vat'
  | 'documents'
  | 'site_information'
  | 'third_party_audit'

export interface VerificationCheck {
  kind: VerificationCheckKind
  checkedAt: ISODate
  by: string
}

export interface Verification {
  level: VerificationLevel
  checks: VerificationCheck[]
}

export type TrustFactor =
  | 'verification'
  | 'onTimeDelivery'
  | 'responseTime'
  | 'disputeRate'
  | 'repeatCustomers'
  | 'reviewRating'
  | 'accountAge'

/** Raw, auditable inputs a trust score is computed from. */
export interface TrustInputs {
  verificationLevel: VerificationLevel
  onTimeDeliveryRate: number
  avgResponseHours: number
  disputeRate: number
  repeatCustomerRate: number
  avgRating: number
  accountAgeMonths: number
}

export interface TrustFactorScore {
  factor: TrustFactor
  /** raw value, in the factor's natural unit (rate 0–1, hours, stars, months, level) */
  raw: number | VerificationLevel
  /** normalised 0–100 */
  score: number
  /** weight 0–1, all weights sum to 1 */
  weight: number
  /** score × weight, i.e. points contributed to the total */
  points: number
}

export type TrustScoreBreakdown = Record<TrustFactor, TrustFactorScore>

export interface TrustScore {
  score: number
  band: 'low' | 'fair' | 'good' | 'excellent'
  breakdown: TrustScoreBreakdown
  computedAt: ISODate
}

export type DocumentType =
  | 'certificate'
  | 'test_report'
  | 'datasheet'
  | 'license'
  | 'mill_test_certificate'
  | 'safety_data_sheet'
  | 'declaration_of_performance'
  | 'audit_report'

export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired'

export interface Document {
  id: string
  ownerType: 'producer' | 'product' | 'lot'
  ownerId: string
  type: DocumentType
  title: string
  certification?: CertificationCode
  issuer: string
  issuedAt: ISODate
  expiresAt?: ISODate
  verifiedByPlatform: boolean
  fileName: string
  sizeKb: number
}

/* ───────────── Actors ───────────── */

export type ProducerType =
  | 'farm'
  | 'cooperative'
  | 'food_manufacturer'
  | 'dairy'
  | 'meat_processor'
  | 'steel_mill'
  | 'metal_works'
  | 'cable_maker'
  | 'concrete_plant'
  | 'quarry'
  | 'sawmill'
  | 'chemical_plant'
  | 'machinery_maker'
  | 'machinery_dealer'
  | 'agrochemical_plant'
  | 'seed_company'

export type BuyerType =
  | 'retailer'
  | 'distributor'
  | 'wholesaler'
  | 'contractor'
  | 'manufacturer'
  | 'restaurant_chain'

export interface Address {
  street: string
  postcode: string
  city: string
  region: string
  country: CountryCode
}

export interface Producer {
  id: string
  name: string
  legalName: string
  type: ProducerType
  address: Address
  location: GeoPoint
  deliveryRadiusKm: number
  foundedYear: number
  memberSince: ISODate
  employees: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  spokenLanguages: LanguageCode[]
  contentLang: LanguageCode
  description: string
  rootCategories: string[]
  verification: Verification
  trustInputs: TrustInputs
  trust: TrustScore
  documents: Document[]
  /** public, aggregate-only stats — never counterparties or amounts */
  publicStats: { completedDeals: number; repeatCustomerRate: number; yearsActive: number }
  referenceCustomers: { buyerId: string; visible: boolean }[]
  rating: number
  reviewCount: number
  brandHue: number
}

export interface Buyer {
  id: string
  name: string
  legalName: string
  type: BuyerType
  address: Address
  location: GeoPoint
  memberSince: ISODate
  verification: Verification
  completedDeals: number
  /** share of invoices paid on or before due date, 0–1 */
  paymentReliability: number
  avgPaymentDays: number
  preferredCategories: string[]
  typicalOrderEUR: { min: number; max: number }
  brandHue: number
}

export interface Company {
  id: string
  name: string
  legalName: string
  buyerId: string
  producerId: string
  brandHue?: number
}

/* ───────────── Products ───────────── */

export type PricingMode = 'fixed' | 'on_request' | 'indexed'

export interface PriceTier {
  minQty: number
  maxQty?: number
  unitPrice: number
}

export interface PriceIndex {
  name: string
  /** reference value used for indicative display, in pricing currency per unit */
  referenceValue: number
  premium: number
  asOf: ISODate
}

export interface Pricing {
  mode: PricingMode
  currency: CurrencyCode
  /** empty for `on_request` */
  tiers: PriceTier[]
  index?: PriceIndex
}

export type AvailabilityStatus = 'in_stock' | 'ships_in' | 'made_to_order' | 'pre_order'

export interface Availability {
  status: AvailabilityStatus
  leadTimeDays: number
  availableFrom?: ISODate
}

export interface Stock {
  quantity: number
  lowThreshold: number
}

export interface MediaRef {
  id: string
  /** decorative tone used by the placeholder renderer */
  tone: number
  variant: number
  /** stock photo URL; the placeholder is shown when absent or when it fails to load */
  url?: string
}

export interface LotTier {
  minLots: number
  maxLots?: number
  pricePerLot: number
}

export type LotDivisibility = { kind: 'indivisible' } | { kind: 'divisible'; step: number; minSplit: number }

export type LotRecordStatus = 'active' | 'paused' | 'archived'
export type LotStatus = 'available' | 'reserved' | 'sold' | 'expired' | 'paused' | 'archived'

export interface Lot {
  id: string
  productId: string
  producerId: string
  lotNumber: string
  type: LotType
  content: { quantity: number; unit: UnitCode; itemSize?: { quantity: number; unit: UnitCode } }
  totalWeightKg?: number
  totalVolumeM3?: number
  pricePerLot: number
  tiers: LotTier[]
  /** identical lots physically in stock (reserved ones included) */
  stockCount: number
  /** server-derived: lots tied up in confirmed, undelivered deals */
  reservedCount: number
  moqLots: number
  divisibility: LotDivisibility
  condition: LotCondition
  productionDate?: ISODate
  expiryDate?: ISODate
  documents: Document[]
  location: { label: string; city: string; country: CountryCode; point: GeoPoint }
  status: LotRecordStatus
  createdAt: ISODate
  updatedAt: ISODate
}

export interface ProductContentTranslation {
  name: string
  description: string
}

export interface Product {
  id: string
  producerId: string
  categorySlug: string
  rootCategorySlug: string
  name: string
  description: string
  contentLang: LanguageCode
  /** stand-in for a translation API; used only by the explicit "Translate" action */
  mockTranslations: Partial<Record<LanguageCode, ProductContentTranslation>>
  keywords: string[]
  location: GeoPoint
  country: CountryCode
  city: string
  unit: UnitCode
  moq: number
  saleModes: SaleMode[]
  lots: Lot[]
  pricing: Pricing
  stock: Stock
  availability: Availability
  /** perishables only */
  expiryDate?: ISODate
  productionDate?: ISODate
  /** overrides the category logistics where needed (e.g. ready-mix) */
  logistics: LogisticsProfile
  attributes: Record<string, AttributeValue>
  certifications: CertificationCode[]
  documents: Document[]
  media: MediaRef[]
  rating: number
  reviewCount: number
  clearance?: { discountPct: number; reason: 'near_expiry' | 'surplus' | 'end_of_line' }
  createdAt: ISODate
}

/* ───────────── Deals & partnerships ───────────── */

export type DealStatus =
  | 'quote_request'
  | 'quote_received'
  | 'negotiation'
  | 'order_confirmed'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type PartyRole = 'buyer' | 'producer'

export interface DealLineItem {
  productId: string
  /** snapshot at deal time */
  productName: string
  categorySlug: string
  quantity: number
  unit: UnitCode
  unitPrice: number
  subtotal: number
  /** lot sale: quantity counts lots, unitPrice is per lot */
  lot?: { lotId: string; lotNumber: string; type: LotType }
}

export interface DealEvent {
  id: string
  status: DealStatus
  at: ISODate
  actor: PartyRole | 'platform'
  noteKey?: string
}

export type DealDocumentType =
  | 'quote'
  | 'order_confirmation'
  | 'invoice'
  | 'delivery_note'
  | 'certificate'
  | 'dispute_report'

export interface DealDocument {
  id: string
  type: DealDocumentType
  fileName: string
  issuedAt: ISODate
  sizeKb: number
}

export type DisputeReason = 'quality' | 'quantity' | 'late' | 'damaged' | 'wrong_product' | 'documents'
export type DisputeResolution = 'refund' | 'replacement' | 'discount' | 'return'

export interface DealDispute {
  reason: DisputeReason
  resolution: DisputeResolution
  description: string
  productIds: string[]
  /** lot numbers concerned, for traceability */
  lotNumbers: string[]
  attachments: string[]
  openedBy: PartyRole
  openedAt: ISODate
  status: 'open' | 'resolved'
  resolvedAt?: ISODate
  resolutionNote?: string
}

export interface Deal {
  id: string
  buyerId: string
  producerId: string
  /** locked transaction currency */
  currency: CurrencyCode
  lineItems: DealLineItem[]
  total: number
  incoterm: Incoterm
  deliveryAddress: Address
  requestedDeliveryDate: ISODate
  deliveredAt?: ISODate
  onTime?: boolean
  status: DealStatus
  events: DealEvent[]
  threadId?: string
  notes: string
  documents: DealDocument[]
  dispute?: DealDispute
  /** file names attached to the quote request (UI only) */
  attachments?: string[]
  /** set when the deal was created with "Reorder" */
  reorderOf?: string
  reviewId?: string
  createdAt: ISODate
  updatedAt: ISODate
}

export interface PartnershipMeta {
  ownerId: string
  counterpartyId: string
  favorite: boolean
  tag?: string
  privateNotes: string
}

export interface Partnership extends PartnershipMeta {
  ownerRole: PartyRole
  firstDealAt: ISODate
  lastDealAt: ISODate
  dealCount: number
  completedCount: number
  /** in each deal's own currency, converted to EUR at the indicative rate */
  totalVolumeEUR: number
  onTimeRate: number | null
  avgRatingGiven: number | null
  disputeCount: number
  activeCount: number
  status: 'active' | 'dormant'
  volumeByQuarter: { quarter: string; volumeEUR: number }[]
}

/* ───────────── Reviews ───────────── */

export type ReviewCriterion = 'quality' | 'conformity' | 'delivery' | 'communication' | 'value'

export interface Review {
  id: string
  dealId: string
  producerId: string
  buyerId: string
  productIds: string[]
  /** lot numbers bought in the reviewed deal, for traceability */
  lotNumbers?: string[]
  verifiedDeal: true
  createdAt: ISODate
  ratings: Record<ReviewCriterion, number>
  overall: number
  text: string
  contentLang: LanguageCode
  photoCount: number
  reply?: { text: string; createdAt: ISODate }
  helpfulVotes: number
}

/* ───────────── Chat ───────────── */

export interface Attachment {
  id: string
  fileName: string
  kind: 'image' | 'pdf' | 'drawing' | 'spreadsheet'
  sizeKb: number
  previewUrl?: string
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  senderRole: PartyRole
  kind: 'text' | 'system'
  text: string
  contentLang: LanguageCode
  mockTranslations: Partial<Record<LanguageCode, string>>
  sentAt: ISODate
  readAt?: ISODate
  attachments: Attachment[]
}

export interface Thread {
  id: string
  buyerId: string
  producerId: string
  productId?: string
  dealId?: string
  createdAt: ISODate
  lastMessageAt: ISODate
  unreadForBuyer: number
  unreadForProducer: number
}

/* ───────────── Search, map, recommendations ───────────── */

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'distance'
  | 'expiry'
  | 'availability'
  | 'newest'
  | 'rating'
  | 'trust'
  | 'lot_price_asc'
  | 'normalized_asc'

export type ExpiryPreset = 'lt7' | 'lt30' | 'gt30'
export type LeadTimePreset = 'immediate' | 'lt1w' | 'lt1m' | 'made_to_order'

export type AttributeFilterValue =
  | { kind: 'range'; min?: number; max?: number }
  | { kind: 'enum'; values: string[] }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'text'; value: string }

export interface Filters {
  q: string
  category?: string
  countries: CountryCode[]
  radiusKm?: number
  priceMin?: number
  priceMax?: number
  priceUnit?: UnitCode
  certifications: CertificationCode[]
  moqMax?: number
  minRating?: number
  inStock: boolean
  deliveryAvailable: boolean
  verificationMin?: VerificationLevel
  minTrust?: number
  pastPartnersOnly: boolean
  validCertsOnly: boolean
  expiry?: ExpiryPreset
  leadTime?: LeadTimePreset
  saleMode?: SaleModeFilter
  lotSizeMin?: number
  lotSizeMax?: number
  lotPriceMin?: number
  lotPriceMax?: number
  lotsAvailableMin?: number
  indivisibleOnly: boolean
  lotConditions: LotCondition[]
  producedFrom?: string
  producedTo?: string
  attributes: Record<string, AttributeFilterValue>
}

export type SaleModeFilter = 'measure' | 'lot' | 'both'

export interface MapViewport {
  center: GeoPoint
  zoom: number
  bounds?: GeoBounds
  searchAsMove: boolean
}

export type RecommendationReason =
  | { code: 'searched'; term: string }
  | { code: 'past_partner'; dealCount: number }
  | { code: 'popular_with_type'; buyerType: BuyerType }
  | { code: 'preferred_category'; categorySlug: string }
  | { code: 'saved_similar'; productId: string }
  | { code: 'nearby'; distanceKm: number }

export interface Recommendation {
  productId: string
  score: number
  reasons: RecommendationReason[]
}

/* ───────────── User ───────────── */

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserLocation {
  label: string
  point: GeoPoint
  source: 'geolocation' | 'manual' | 'default'
}

export interface RecommendationTuning {
  categories: string[]
  volumeEUR: { min: number; max: number }
  certifications: CertificationCode[]
  preferVerified: boolean
  preferPastPartners: boolean
}

export interface UserPreferences {
  language: LanguageCode
  /** null = follow the language's default currency */
  currency: CurrencyCode | null
  units: UnitsSystem
  theme: ThemePreference
  location: UserLocation
  radiusKm: number
  notifications: {
    newMessages: boolean
    quoteUpdates: boolean
    dealStatus: boolean
    expiringDocuments: boolean
    priceDrops: boolean
    emailDigest: 'off' | 'daily' | 'weekly'
  }
  privacy: {
    /** producer view: list opted-in customers on the public profile */
    showReferenceCustomers: boolean
    showDealCountPublicly: boolean
    /** buyer view: producers may name this company as a reference customer */
    allowListedAsReference?: boolean
  }
  recommendations: RecommendationTuning
}
