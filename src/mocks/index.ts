import type { Buyer, Deal, DealDispute, Message, PartnershipMeta, Producer, Product, Review, Thread } from '@/types/models'
import { getAnyCategory as getCategory, getCategoryConfig, isActiveRoot } from '@/config/categories'
import { ACTIVE_ROOT_CATEGORIES } from '@/config/scope'
import { CURRENCIES } from '@/config/currencies'
import { computeTrustScore } from '@/features/trust/trustScore'
import { validateAttributes } from '@/features/categories/attributeSchema'
import { monthsBetween, now } from '@/shared/lib/dates'
import { createRng } from '@/shared/lib/random'
import { cityById } from './cities'
import { PRODUCER_SEEDS, verificationChecks } from './producers'
import { CURRENT_BUYER_ID as DEMO_BUYER_ID } from './buyers'
import { BUYER_SEEDS, buildBuyer } from './buyers'
import { TEMPLATE_KEY_BY_PRODUCT, buildProducts } from './products'
import { attachLots, convertDealsToLots, refreshReservations } from './lots'
import { applyStoredLots } from './lotStorage'
import { applyStoredDeals } from './dealStorage'
import { buildDeals } from './deals'
import { buildReviews } from './reviews'
import { buildThreads } from './threads'
import { producerDocuments } from './documents'
import { currentCompany } from './companies'

export { CURRENT_BUYER_ID } from './buyers'
export { COMPANY_SEEDS, CURRENT_COMPANY_ID, currentCompany } from './companies'
export { CITIES, DEFAULT_CITY_ID, cityById } from './cities'
export type { City } from './cities'

export interface MockDatabase {
  products: Product[]
  producers: Producer[]
  buyers: Buyer[]
  deals: Deal[]
  reviews: Review[]
  threads: Thread[]
  messages: Message[]
  partnershipMeta: PartnershipMeta[]
}

const DISPUTE_SEEDS: Record<string, Pick<DealDispute, 'reason' | 'resolution' | 'description'>> = {
  p13: { reason: 'quantity', resolution: 'discount', description: 'Weighbridge at our site shows 24.31 t against 25.00 t on the delivery note. Please credit the difference or send a corrected invoice.' },
  p03: { reason: 'quality', resolution: 'discount', description: 'About 15% of the pepper crates arrived soft, with the temperature logger showing 14 °C during transit. Photos and logger export attached; we ask for a price reduction on the affected crates.' },
  p02: { reason: 'quality', resolution: 'replacement', description: 'Two crates arrived with soft and bruised produce, see photos. We ask for a replacement of these crates with the next delivery.' },
}

/** Generated disputed deals get a dispute record so the dispute panel has real content. */
function synthesizeDisputes(deals: Deal[]) {
  for (const d of deals) {
    if (d.status !== 'disputed' || d.dispute) continue
    const seed = DISPUTE_SEEDS[d.producerId] ?? { reason: 'quality', resolution: 'discount', description: 'Goods do not match the agreed specification.' }
    d.dispute = {
      ...seed,
      productIds: d.lineItems.map((li) => li.productId),
      lotNumbers: d.lineItems.flatMap((li) => (li.lot ? [li.lot.lotNumber] : [])),
      attachments: ['photos-delivery.zip'],
      openedBy: 'buyer',
      openedAt: d.events.find((e) => e.status === 'disputed')?.at ?? d.updatedAt,
      status: 'open',
    }
  }
}

/** Lot-only perishables carry the earliest sellable lot expiry, so expiry badges and filters stay meaningful. */
export function syncLotOnlyFields(products: Product[]) {
  for (const p of products) {
    if (p.saleModes.includes('measure') || !p.expiryDate) continue
    const live = p.lots.filter((l) => l.status === 'active' && l.expiryDate && new Date(l.expiryDate) > now()).map((l) => l.expiryDate as string)
    const all = p.lots.map((l) => l.expiryDate).filter((d): d is string => !!d)
    const pick = (live.length ? live : all).sort()[0]
    if (pick) p.expiryDate = pick
  }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const round1 = (n: number) => Math.round(n * 10) / 10

function buildDatabase(): MockDatabase {
  const products = buildProducts()
  attachLots(products, (p) => TEMPLATE_KEY_BY_PRODUCT.get(p.id))
  const byProducer = new Map<string, Product[]>()
  const isExtra = (p: Product) => TEMPLATE_KEY_BY_PRODUCT.get(p.id)?.match(/^[xr]-/) != null
  for (const p of products) if (!isExtra(p)) byProducer.set(p.producerId, [...(byProducer.get(p.producerId) ?? []), p])

  const deals = buildDeals(byProducer)
  convertDealsToLots(deals, products)
  synthesizeDisputes(deals)
  applyStoredDeals({ deals })
  applyStoredLots(products)
  refreshReservations(products, deals)
  syncLotOnlyFields(products)
  const reviews = buildReviews(deals)
  for (const r of reviews) {
    const lotNumbers = deals.find((d) => d.id === r.dealId)?.lineItems.flatMap((li) => (li.lot ? [li.lot.lotNumber] : []))
    if (lotNumbers?.length) r.lotNumbers = lotNumbers
  }
  applyStoredDeals({ reviews })
  const { threads, messages } = buildThreads(products, deals)
  applyStoredDeals({ threads, messages })
  const rng = createRng(99)

  for (const product of products) {
    const rs = reviews.filter((r) => r.productIds.includes(product.id))
    product.rating = round1(avg(rs.map((r) => r.overall)))
    product.reviewCount = rs.length
  }

  const producers: Producer[] = PRODUCER_SEEDS.map((seed) => {
    const city = cityById(seed.cityId)
    const rs = reviews.filter((r) => r.producerId === seed.id)
    const completed = deals.filter((d) => d.producerId === seed.id && d.status === 'completed')
    const avgRating = rs.length ? round1(avg(rs.map((r) => r.overall))) : 4.2
    const trustInputs = {
      verificationLevel: seed.level,
      onTimeDeliveryRate: seed.onTime,
      avgResponseHours: seed.responseHours,
      disputeRate: seed.disputeRate,
      repeatCustomerRate: seed.repeatRate,
      avgRating,
      accountAgeMonths: monthsBetween(new Date(seed.memberSince), now()),
    }
    const buyerIds = [...new Set(completed.map((d) => d.buyerId))]
    return {
      id: seed.id,
      name: seed.name,
      legalName: seed.legalName,
      type: seed.type,
      address: { street: seed.street, postcode: city.postcode, city: city.name, region: city.region, country: city.country },
      location: { lat: city.point.lat + seed.offset[0], lng: city.point.lng + seed.offset[1] },
      deliveryRadiusKm: seed.deliveryRadiusKm,
      foundedYear: seed.foundedYear,
      memberSince: seed.memberSince,
      employees: seed.employees,
      spokenLanguages: seed.spokenLanguages,
      contentLang: seed.contentLang,
      description: seed.description,
      rootCategories: seed.rootCategories,
      verification: { level: seed.level, checks: verificationChecks(seed) },
      trustInputs,
      trust: computeTrustScore(trustInputs, now().toISOString()),
      documents: producerDocuments(seed, rng),
      publicStats: {
        completedDeals: seed.historicDeals + completed.length,
        repeatCustomerRate: seed.repeatRate,
        yearsActive: now().getFullYear() - seed.foundedYear,
      },
      referenceCustomers: buyerIds.map((buyerId, i) => ({ buyerId, visible: i % 2 === 0 })),
      rating: avgRating,
      reviewCount: rs.length,
      brandHue: seed.brandHue,
    }
  })

  const buyers = BUYER_SEEDS.map((seed) =>
    buildBuyer(seed, 9 + deals.filter((d) => d.buyerId === seed.id && d.status === 'completed').length),
  )

  const partnershipMeta: PartnershipMeta[] = [
    { ownerId: 'b01', counterpartyId: 'p10', favorite: true, tag: 'primary_supplier', privateNotes: 'Framework price for rebar renegotiated each January. Contact: dl. Popescu, logistics.' },
    { ownerId: 'b01', counterpartyId: 'p17', favorite: true, tag: 'local_supplier', privateNotes: 'Pump must be booked 48 h ahead for slabs above 80 m³.' },
    { ownerId: 'b01', counterpartyId: 'p14', favorite: false, tag: 'preferred', privateNotes: 'Ask for drum deposit refund on every 5th order.' },
    { ownerId: 'b01', counterpartyId: 'p22', favorite: false, privateNotes: '' },
    { ownerId: 'b01', counterpartyId: 'p13', favorite: false, tag: 'under_review', privateNotes: 'Weight discrepancy on last delivery — dispute open.' },
    { ownerId: 'b07', counterpartyId: 'p28', favorite: true, tag: 'primary_supplier', privateNotes: 'Seasonal price for CAN and urea fixed every February. Contact: dna Pop, sales.' },
    { ownerId: 'b07', counterpartyId: 'p26', favorite: true, tag: 'local_supplier', privateNotes: 'Mobile service within 24 h; ask for spare-parts kit with every new machine.' },
    { ownerId: 'b07', counterpartyId: 'p29', favorite: false, tag: 'preferred', privateNotes: 'Seed orders must be confirmed before 15 January for spring delivery.' },
    { ownerId: 'b07', counterpartyId: 'p03', favorite: false, tag: 'under_review', privateNotes: 'Cold-chain issue on last pepper delivery — dispute open.' },
  ]

  applyStoredDeals({ partnershipMeta })
  return inScope({ products, producers, buyers, deals, reviews, threads, messages, partnershipMeta })
}

function inScope(data: MockDatabase): MockDatabase {
  const products = data.products.filter((p) => isActiveRoot(p.rootCategorySlug))
  const productIds = new Set(products.map((p) => p.id))
  const producerIds = new Set(products.map((p) => p.producerId))
  const producers = data.producers.filter((p) => producerIds.has(p.id)).map((p) => ({ ...p, rootCategories: p.rootCategories.filter(isActiveRoot) }))
  const deals = data.deals.filter((d) => producerIds.has(d.producerId) && d.lineItems.every((li) => productIds.has(li.productId)))
  const dealIds = new Set(deals.map((d) => d.id))
  const reviews = data.reviews.filter((r) => dealIds.has(r.dealId) && producerIds.has(r.producerId))
  const threads = data.threads.filter((t) => producerIds.has(t.producerId)).map((t) => (t.dealId && !dealIds.has(t.dealId) ? { ...t, dealId: undefined } : t))
  const threadIds = new Set(threads.map((t) => t.id))
  const messages = data.messages.filter((m) => threadIds.has(m.threadId))
  const buyerIds = new Set([DEMO_BUYER_ID, ...deals.map((d) => d.buyerId), ...threads.map((t) => t.buyerId)])
  const buyers = data.buyers.filter((b) => buyerIds.has(b.id)).map((b) => ({ ...b, preferredCategories: b.preferredCategories.filter(isActiveRoot) }))
  const partnershipMeta = data.partnershipMeta.filter((m) => producerIds.has(m.counterpartyId) || producerIds.has(m.ownerId))
  return { products, producers, buyers, deals, reviews, threads, messages, partnershipMeta }
}

export const db: MockDatabase = buildDatabase()

/** Structural checks of the mock dataset against the category configs and the spec's volume targets. */
export function validateMockData(data: MockDatabase = db): string[] {
  const issues: string[] = []
  for (const p of data.products) {
    const config = getCategoryConfig(p.categorySlug)
    if (!config || !getCategory(p.categorySlug)) {
      issues.push(`${p.id}: unknown category ${p.categorySlug}`)
      continue
    }
    for (const msg of validateAttributes(p.attributes, config)) issues.push(`${p.id} (${p.name}): ${msg}`)
    if (!config.allowedUnits.includes(p.unit)) issues.push(`${p.id}: unit ${p.unit} not allowed in ${config.slug}`)
    for (const c of p.certifications) if (!config.certifications.includes(c)) issues.push(`${p.id}: cert ${c} not in ${config.slug}`)
    if (config.perishable && !p.expiryDate) issues.push(`${p.id}: perishable without expiryDate`)
    if (!(p.pricing.currency in CURRENCIES)) issues.push(`${p.id}: bad currency`)
    if (p.pricing.mode !== 'on_request' && p.pricing.tiers.length === 0) issues.push(`${p.id}: priced product without tiers`)
    for (const mode of p.saleModes) if (!config.lots.allowedSaleModes.includes(mode)) issues.push(`${p.id}: sale mode ${mode} not allowed in ${config.slug}`)
    if (p.saleModes.includes('lot') && p.lots.length === 0) issues.push(`${p.id}: lot listing without lots`)
    for (const lot of p.lots) {
      if (!config.lots.lotTypes.includes(lot.type)) issues.push(`${lot.id}: lot type ${lot.type} not allowed in ${config.slug}`)
      if (config.lots.requiresExpiry && !lot.expiryDate) issues.push(`${lot.id}: expiry date required`)
      if (config.lots.requiresBatch && !lot.lotNumber) issues.push(`${lot.id}: batch number required`)
      if (config.lots.requiresCertificate && lot.documents.length === 0) issues.push(`${lot.id}: certificate required`)
      if (lot.pricePerLot <= 0 || lot.stockCount < 0) issues.push(`${lot.id}: bad price or stock`)
    }
  }
  const lotListings = data.products.filter((p) => p.saleModes.includes('lot'))
  const lots = lotListings.flatMap((p) => p.lots)
  const perishableLots = lotListings.filter((p) => getCategoryConfig(p.categorySlug)?.perishable)
  const countries = new Set(data.producers.map((p) => p.address.country))
  const roots = new Set(data.products.map((p) => p.rootCategorySlug))
  const dealCurrencies = new Set(data.deals.map((d) => d.currency))
  const checks: [boolean, string][] = [
    [data.products.length >= 100, `products ${data.products.length} < 100`],
    [roots.size === ACTIVE_ROOT_CATEGORIES.length, `root categories ${roots.size} != ${ACTIVE_ROOT_CATEGORIES.length}`],
    [data.producers.length >= 25, `producers ${data.producers.length} < 25`],
    [countries.size >= 3, `producer countries ${countries.size} < 3`],
    [data.buyers.some((b) => b.id === DEMO_BUYER_ID), 'demo buyer missing'],
    [data.threads.length >= 15, `threads ${data.threads.length} < 15`],
    [data.deals.length >= 30, `deals ${data.deals.length} < 30`],
    [data.reviews.length >= 25, `reviews ${data.reviews.length} < 25`],
    [dealCurrencies.size >= 2, `deal currencies ${[...dealCurrencies].join(',')}`],
    [data.reviews.every((r) => data.deals.find((d) => d.id === r.dealId)?.status === 'completed'), 'review without completed deal'],
    [data.deals.every((d) => d.lineItems.length > 0), 'deal without line items'],
    [lotListings.length >= 25, `lot listings ${lotListings.length} < 25`],
    [perishableLots.length > 0 && perishableLots.length < lotListings.length, 'lot listings must span perishable and non-perishable'],
    [lotListings.some((p) => new Set(p.lots.map((l) => l.expiryDate)).size >= 2 && p.lots.every((l) => l.expiryDate)), 'no product with several lots of different expiry'],
    [lots.some((l) => l.divisibility.kind === 'indivisible' && l.stockCount === 1), 'no single indivisible lot'],
    [lots.some((l) => l.divisibility.kind === 'divisible'), 'no partially divisible lot'],
    [lots.some((l) => l.type === 'mixed' && l.condition === 'clearance'), 'no clearance mixed lot'],
    [lotListings.some((p) => p.saleModes.includes('measure')), 'no listing offering both modes'],
    [data.deals.filter((d) => d.lineItems.some((li) => li.lot)).length >= 3, 'fewer than 3 deals with lot line items'],
  ]
  const company = currentCompany
  const selfPairs = [
    data.deals.some((d) => d.buyerId === company.buyerId && d.producerId === company.producerId),
    data.threads.some((t) => t.buyerId === company.buyerId && t.producerId === company.producerId),
    data.partnershipMeta.some((m) => m.ownerId === company.buyerId && m.counterpartyId === company.producerId),
  ]
  checks.push([!selfPairs.some(Boolean), 'company trades with itself (buyer and producer identity overlap)'])
  for (const [ok, msg] of checks) if (!ok) issues.push(msg)
  return issues
}

if (import.meta.env?.DEV) {
  const issues = validateMockData()
  if (issues.length) console.error('[mocks] dataset issues:\n' + issues.join('\n'))
}
