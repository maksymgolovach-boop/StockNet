import type {
  Address,
  Deal,
  DealDispute,
  DealLineItem,
  DealStatus,
  Incoterm,
  LanguageCode,
  Message,
  Partnership,
  PartnershipMeta,
  PartyRole,
  Review,
  ReviewCriterion,
  Thread,
} from '@/types/models'
import { CURRENCIES } from '@/config/currencies'
import { LANGUAGES } from '@/config/languages'
import { db } from '@/mocks'
import { isSameCompany } from '@/mocks/companies'
import { persistDeal, persistPartnerMeta, persistReview, persistThread } from '@/mocks/dealStorage'
import { refreshReservations } from '@/mocks/lots'
import { persistLot } from '@/mocks/lotStorage'
import { roundPrice } from '@/mocks/products'
import { DOCUMENT_ON, TRANSITIONS, canDispute, type DealActionId } from '@/features/deals/dealRules'
import { availableLots, clampLotQuantity, isSellable, lotQuantityRule, pricePerLotFor } from '@/features/lots/lotMath'
import { tierFor } from '@/features/product/pricing'
import { computeTrustScore } from '@/features/trust/trustScore'
import { DEMO_NOW, liveNow } from '@/shared/lib/dates'
import { avg, round1, round2, round3 } from '@/shared/lib/math'
import { ApiError, NotFoundError, mockRequest } from './client'
import { emitDealChanged, ensureThread, serverPost, threadLanguage } from './chatTransport'

/** Every query is scoped to a party: deal details are only visible to the two parties involved. */
const isParty = (role: PartyRole, partyId: string) => (x: { buyerId: string; producerId: string }) =>
  role === 'buyer' ? x.buyerId === partyId : x.producerId === partyId

export interface ThreadSummary extends Thread {
  lastMessage?: Message
}

export interface QuoteRequestItem {
  productId: string
  mode: 'measure' | 'lot'
  quantity: number
  lotId?: string
}

export interface QuoteRequestInput {
  producerId: string
  items: QuoteRequestItem[]
  deliveryAddress: Address
  incoterm: Incoterm
  requestedDeliveryDate: string
  notes: string
  attachments: string[]
  reorderOf?: string
  lang: LanguageCode
}

export interface DisputeInput extends Pick<DealDispute, 'reason' | 'resolution' | 'description' | 'productIds' | 'attachments'> {}

export interface ReviewInput {
  ratings: Record<ReviewCriterion, number>
  text: string
  lang: LanguageCode
  photoCount: number
}

const toEUR = (amount: number, currency: Deal['currency']) => amount / CURRENCIES[currency].mockRateFromEUR
const convert = (amount: number, from: Deal['currency'], to: Deal['currency']) => (amount / CURRENCIES[from].mockRateFromEUR) * CURRENCIES[to].mockRateFromEUR

function findDeal(role: PartyRole, partyId: string, dealId: string): Deal {
  const d = db.deals.find((x) => x.id === dealId && isParty(role, partyId)(x))
  if (!d) throw new NotFoundError(`Deal ${dealId}`)
  return d
}

function nextDealId(at: Date): string {
  const year = at.getUTCFullYear()
  const max = db.deals.filter((d) => d.id.startsWith(`D-${year}-`)).reduce((m, d) => Math.max(m, Number(d.id.slice(7)) || 0), 0)
  return `D-${year}-${String(max + 1).padStart(4, '0')}`
}

function addDocument(deal: Deal, status: DealStatus, at: string) {
  const type = DOCUMENT_ON[status]
  if (!type || deal.documents.some((d) => d.type === type)) return
  deal.documents.push({ id: `${deal.id}-${type}`, type, fileName: `${type.replace(/_/g, '-')}-${deal.id}.pdf`, issuedAt: at, sizeKb: 90 + deal.documents.length * 37 })
}

/** Physical stock leaves the warehouse on delivery; reservations follow the deal status. */
function settleLots(deal: Deal) {
  for (const li of deal.lineItems) {
    if (!li.lot) continue
    const lot = db.products.find((p) => p.id === li.productId)?.lots.find((l) => l.id === li.lot?.lotId)
    if (!lot) continue
    lot.stockCount = Math.max(0, round3(lot.stockCount - li.quantity))
    lot.updatedAt = liveNow().toISOString()
    persistLot(lot)
  }
}

/** A quote can only be accepted while every lot in it still has enough unreserved stock. */
function assertLotsAvailable(deal: Deal) {
  for (const li of deal.lineItems) {
    if (!li.lot) continue
    const lot = db.products.find((p) => p.id === li.productId)?.lots.find((l) => l.id === li.lot?.lotId)
    if (!lot || !isSellable(lot) || availableLots(lot) < li.quantity) throw new ApiError(`Lot ${li.lot.lotNumber} is no longer available in this quantity`, 409)
  }
}

/** The status a deal had before its dispute was opened; resolving the dispute returns it there. */
function statusBeforeDispute(deal: Deal): DealStatus {
  const disputedAt = deal.events.findLastIndex((e) => e.status === 'disputed')
  const previous = deal.events.slice(0, disputedAt < 0 ? undefined : disputedAt).findLast((e) => e.status !== 'disputed')
  return previous?.status ?? (deal.deliveredAt ? 'completed' : 'order_confirmed')
}

function applyTransition(deal: Deal, to: DealStatus, actor: PartyRole, noteKey?: string) {
  const at = liveNow().toISOString()
  deal.events.push({ id: `${deal.id}-ev${deal.events.length}-${Date.now().toString(36)}`, status: to, at, actor, noteKey })
  deal.status = to
  deal.updatedAt = at
  addDocument(deal, to, at)
  if (to === 'delivered') {
    deal.deliveredAt = at
    deal.onTime = new Date(at) <= new Date(deal.requestedDeliveryDate)
    settleLots(deal)
  }
  refreshReservations(db.products, db.deals)
  persistDeal(deal)
  emitDealChanged(deal)
}

const intlLocale = (lang: LanguageCode) => LANGUAGES[lang].intlLocale
const money = (amount: number, currency: string, lang: LanguageCode) => new Intl.NumberFormat(intlLocale(lang), { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)

function rfqMessage(deal: Deal): Record<LanguageCode, string> {
  const lines = (l: LanguageCode) => deal.lineItems.map((li) => `• ${li.productName}: ${li.lot ? `${li.quantity} × ${l === 'de' ? 'Los' : 'lot'} ${li.lot.lotNumber}` : `${li.quantity} ${li.unit}`}`).join('\n')
  const date = (l: LanguageCode) => new Intl.DateTimeFormat(intlLocale(l), { dateStyle: 'medium' }).format(new Date(deal.requestedDeliveryDate))
  return {
    en: `Quote request ${deal.id}:\n${lines('en')}\nDelivery ${deal.incoterm} ${deal.deliveryAddress.city} by ${date('en')}.${deal.notes ? `\nNote: ${deal.notes}` : ''}`,
    de: `Angebotsanfrage ${deal.id}:\n${lines('de')}\nLieferung ${deal.incoterm} ${deal.deliveryAddress.city} bis ${date('de')}.${deal.notes ? `\nHinweis: ${deal.notes}` : ''}`,
    ro: `Cerere de ofertă ${deal.id}:\n${lines('ro')}\nLivrare ${deal.incoterm} ${deal.deliveryAddress.city} până la ${date('ro')}.${deal.notes ? `\nNotă: ${deal.notes}` : ''}`,
  }
}

function quoteMessage(deal: Deal): Record<LanguageCode, string> {
  return {
    en: `Thank you for request ${deal.id}. Our quote is attached: ${money(deal.total, deal.currency, 'en')} ${deal.incoterm}, valid for 14 days.`,
    de: `Danke für Ihre Anfrage ${deal.id}. Unser Angebot liegt bei: ${money(deal.total, deal.currency, 'de')} ${deal.incoterm}, 14 Tage gültig.`,
    ro: `Vă mulțumim pentru cererea ${deal.id}. Oferta noastră este atașată: ${money(deal.total, deal.currency, 'ro')} ${deal.incoterm}, valabilă 14 zile.`,
  }
}

const autoQuotes = new Map<string, ReturnType<typeof setTimeout>>()

/** Simulates the producer answering a new quote request a few seconds later. */
function scheduleAutoQuote(dealId: string, threadId: string) {
  autoQuotes.set(
    dealId,
    setTimeout(() => {
      autoQuotes.delete(dealId)
      const deal = db.deals.find((d) => d.id === dealId)
      const thread = db.threads.find((t) => t.id === threadId)
      if (!deal || deal.status !== 'quote_request' || !thread) return
      applyTransition(deal, 'quote_received', 'producer', 'auto_quote')
      const message = serverPost(thread, 'producer', quoteMessage(deal), threadLanguage(thread, 'producer'), [{ fileName: `quote-${deal.id}.pdf`, kind: 'pdf', sizeKb: 148 }])
      persistThread(thread, [message])
    }, 6000),
  )
}

/**
 * Quote requests created in this browser are saved, but the reply timer is not. After a reload, any request
 * created during a demo session (so after the fixed demo date) that is still waiting gets its auto-quote again.
 */
function resumePendingQuotes() {
  for (const deal of db.deals) {
    if (deal.status === 'quote_request' && deal.threadId && new Date(deal.createdAt) >= DEMO_NOW) scheduleAutoQuote(deal.id, deal.threadId)
  }
}

function buildLineItem(input: QuoteRequestItem, producerId: string, currency: Deal['currency']): DealLineItem {
  const product = db.products.find((p) => p.id === input.productId && p.producerId === producerId)
  if (!product) throw new ApiError(`Product ${input.productId} is not sold by this producer`, 422)
  if (input.mode === 'lot') {
    const lot = product.lots.find((l) => l.id === input.lotId)
    if (!lot || !isSellable(lot)) throw new ApiError(`Lot is no longer available`, 409)
    const qty = clampLotQuantity(lot, input.quantity)
    if (qty !== input.quantity || qty < lotQuantityRule(lot).min) throw new ApiError('Invalid lot quantity', 422)
    const unitPrice = roundPrice(convert(pricePerLotFor(lot, qty), product.pricing.currency, currency))
    return { productId: product.id, productName: product.name, categorySlug: product.categorySlug, quantity: qty, unit: product.unit, unitPrice, subtotal: round2(unitPrice * qty), lot: { lotId: lot.id, lotNumber: lot.lotNumber, type: lot.type } }
  }
  if (!product.saleModes.includes('measure')) throw new ApiError('This product is sold by lot only', 422)
  if (input.quantity < product.moq) throw new ApiError('Quantity below MOQ', 422)
  const tier = tierFor(product.pricing.tiers, input.quantity)
  const unitPrice = tier ? roundPrice(convert(tier.unitPrice, product.pricing.currency, currency)) : 0
  return { productId: product.id, productName: product.name, categorySlug: product.categorySlug, quantity: input.quantity, unit: product.unit, unitPrice, subtotal: round2(unitPrice * input.quantity) }
}

function quarterKey(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

function lastQuarters(n: number, at: Date): string[] {
  const out: string[] = []
  let y = at.getUTCFullYear()
  let q = Math.floor(at.getUTCMonth() / 3) + 1
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-Q${q}`)
    q -= 1
    if (q === 0) {
      q = 4
      y -= 1
    }
  }
  return out
}

function partnershipsFor(role: PartyRole, partyId: string): Partnership[] {
  const mine = db.deals.filter(isParty(role, partyId))
  const groups = new Map<string, Deal[]>()
  for (const d of mine) {
    const cp = role === 'buyer' ? d.producerId : d.buyerId
    groups.set(cp, [...(groups.get(cp) ?? []), d])
  }
  const now = liveNow()
  const quarters = lastQuarters(8, now)
  return [...groups.entries()].map(([counterpartyId, deals]) => {
    const sorted = [...deals].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const valid = sorted.filter((d) => d.status !== 'cancelled')
    const delivered = sorted.filter((d) => d.onTime !== undefined)
    const ratings = db.reviews.filter((r) => (role === 'buyer' ? r.buyerId === partyId && r.producerId === counterpartyId : r.producerId === partyId && r.buyerId === counterpartyId))
    const meta = db.partnershipMeta.find((m) => m.ownerId === partyId && m.counterpartyId === counterpartyId) ?? { ownerId: partyId, counterpartyId, favorite: false, privateNotes: '' }
    const byQuarter = new Map<string, number>()
    for (const d of valid) byQuarter.set(quarterKey(d.createdAt), (byQuarter.get(quarterKey(d.createdAt)) ?? 0) + toEUR(d.total, d.currency))
    const lastDealAt = sorted[sorted.length - 1]?.createdAt ?? now.toISOString()
    const activeCount = sorted.filter((d) => !['completed', 'cancelled'].includes(d.status)).length
    const recent = now.getTime() - new Date(lastDealAt).getTime() < 180 * 86_400_000
    return {
      ...meta,
      ownerRole: role,
      firstDealAt: sorted[0]?.createdAt ?? lastDealAt,
      lastDealAt,
      dealCount: sorted.length,
      completedCount: sorted.filter((d) => d.status === 'completed').length,
      totalVolumeEUR: Math.round(valid.reduce((s, d) => s + toEUR(d.total, d.currency), 0)),
      onTimeRate: delivered.length ? delivered.filter((d) => d.onTime).length / delivered.length : null,
      avgRatingGiven: ratings.length ? round1(avg(ratings.map((r) => r.overall))) : null,
      disputeCount: sorted.filter((d) => d.dispute).length,
      activeCount,
      status: activeCount > 0 || recent ? 'active' : 'dormant',
      volumeByQuarter: quarters.map((quarter) => ({ quarter, volumeEUR: Math.round(byQuarter.get(quarter) ?? 0) })),
    } satisfies Partnership
  })
}

function refreshRatings(producerId: string) {
  const producer = db.producers.find((p) => p.id === producerId)
  if (!producer) return
  const rs = db.reviews.filter((r) => r.producerId === producerId)
  producer.reviewCount = rs.length
  producer.rating = rs.length ? round1(avg(rs.map((r) => r.overall))) : producer.rating
  producer.trustInputs = { ...producer.trustInputs, avgRating: producer.rating }
  producer.trust = computeTrustScore(producer.trustInputs, liveNow().toISOString())
  for (const product of db.products.filter((p) => p.producerId === producerId)) {
    const pr = rs.filter((r) => r.productIds.includes(product.id))
    product.reviewCount = pr.length
    product.rating = round1(avg(pr.map((r) => r.overall)))
  }
}

export interface DealService {
  deals(role: PartyRole, partyId: string): Promise<Deal[]>
  deal(role: PartyRole, partyId: string, dealId: string): Promise<Deal>
  reviewsForProducer(producerId: string): Promise<Review[]>
  threads(role: PartyRole, partyId: string): Promise<ThreadSummary[]>
  messages(role: PartyRole, partyId: string, threadId: string): Promise<Message[]>
  transition(role: PartyRole, partyId: string, dealId: string, action: DealActionId): Promise<Deal>
  createQuoteRequest(buyerId: string, input: QuoteRequestInput): Promise<Deal>
  openDispute(role: PartyRole, partyId: string, dealId: string, input: DisputeInput): Promise<Deal>
  resolveDispute(role: PartyRole, partyId: string, dealId: string, note: string): Promise<Deal>
  addReview(buyerId: string, dealId: string, input: ReviewInput): Promise<Review>
  partnerships(role: PartyRole, partyId: string): Promise<Partnership[]>
  setPartnerMeta(partyId: string, counterpartyId: string, patch: Partial<Pick<PartnershipMeta, 'favorite' | 'tag' | 'privateNotes'>>): Promise<PartnershipMeta>
}

export const dealService: DealService = {
  deals: (role, partyId) => mockRequest(() => db.deals.filter(isParty(role, partyId))),
  deal: (role, partyId, dealId) => mockRequest(() => findDeal(role, partyId, dealId)),
  reviewsForProducer: (producerId) => mockRequest(() => db.reviews.filter((r) => r.producerId === producerId)),
  threads: (role, partyId) =>
    mockRequest(() =>
      db.threads
        .filter(isParty(role, partyId))
        .map((t) => ({ ...t, lastMessage: db.messages.findLast((m) => m.threadId === t.id) }))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    ),
  messages: (role, partyId, threadId) =>
    mockRequest(() => {
      const thread = db.threads.find((t) => t.id === threadId && isParty(role, partyId)(t))
      if (!thread) throw new NotFoundError(`Thread ${threadId}`)
      return db.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    }),
  transition: (role, partyId, dealId, action) =>
    mockRequest(() => {
      const deal = findDeal(role, partyId, dealId)
      const t = TRANSITIONS[deal.status].find((x) => x.action === action && x.actor === role)
      if (!t) throw new ApiError(`Action ${action} is not allowed in status ${deal.status}`, 409)
      if (t.to === 'order_confirmed') assertLotsAvailable(deal)
      if (action === 'sendQuote') {
        const timer = autoQuotes.get(dealId)
        if (timer) clearTimeout(timer)
      }
      applyTransition(deal, t.to, role, action)
      return deal
    }),
  createQuoteRequest: (buyerId, input) =>
    mockRequest(() => {
      const buyer = db.buyers.find((b) => b.id === buyerId)
      if (!buyer) throw new NotFoundError('Buyer')
      if (isSameCompany(buyerId, input.producerId)) throw new ApiError('A company cannot request a quote from itself', 422)
      if (!input.items.length) throw new ApiError('A quote request needs at least one item', 422)
      const first = db.products.find((p) => p.id === input.items[0]?.productId)
      if (!first) throw new NotFoundError('Product')
      const currency = first.pricing.currency
      const lineItems = input.items.map((item) => buildLineItem(item, input.producerId, currency))
      const at = liveNow()
      const id = nextDealId(at)
      const thread = ensureThread({ buyerId, producerId: input.producerId, productId: first.id })
      const deal: Deal = {
        id,
        buyerId,
        producerId: input.producerId,
        currency,
        lineItems,
        total: round2(lineItems.reduce((s, li) => s + li.subtotal, 0)),
        incoterm: input.incoterm,
        deliveryAddress: input.deliveryAddress,
        requestedDeliveryDate: input.requestedDeliveryDate,
        status: 'quote_request',
        events: [{ id: `${id}-ev0`, status: 'quote_request', at: at.toISOString(), actor: 'buyer', noteKey: input.reorderOf ? 'reorder' : 'rfq_created' }],
        threadId: thread.id,
        notes: input.notes,
        documents: [],
        attachments: input.attachments,
        reorderOf: input.reorderOf,
        createdAt: at.toISOString(),
        updatedAt: at.toISOString(),
      }
      db.deals.unshift(deal)
      thread.dealId = id
      const message = serverPost(thread, 'buyer', rfqMessage(deal), input.lang, input.attachments.map((fileName) => ({ fileName, kind: /\.(png|jpe?g|webp)$/i.test(fileName) ? 'image' : /\.(dwg|dxf|step|stp)$/i.test(fileName) ? 'drawing' : 'pdf', sizeKb: 120 })))
      persistThread(thread, [message])
      persistDeal(deal)
      scheduleAutoQuote(id, thread.id)
      return deal
    }),
  openDispute: (role, partyId, dealId, input) =>
    mockRequest(() => {
      const deal = findDeal(role, partyId, dealId)
      if (!canDispute(deal, role)) throw new ApiError('This deal cannot be disputed', 409)
      if (input.description.trim().length < 20) throw new ApiError('Description too short', 422)
      const at = liveNow().toISOString()
      deal.dispute = {
        ...input,
        lotNumbers: deal.lineItems.filter((li) => input.productIds.includes(li.productId) && li.lot).map((li) => li.lot?.lotNumber ?? ''),
        openedBy: role,
        openedAt: at,
        status: 'open',
      }
      applyTransition(deal, 'disputed', role, 'dispute_opened')
      return deal
    }),
  resolveDispute: (role, partyId, dealId, note) =>
    mockRequest(() => {
      const deal = findDeal(role, partyId, dealId)
      if (role !== 'buyer') throw new ApiError('Only the buyer can mark a dispute as resolved', 403)
      if (deal.status !== 'disputed' || !deal.dispute) throw new ApiError('No open dispute', 409)
      deal.dispute = { ...deal.dispute, status: 'resolved', resolvedAt: liveNow().toISOString(), resolutionNote: note }
      applyTransition(deal, statusBeforeDispute(deal), role, 'dispute_resolved')
      return deal
    }),
  addReview: (buyerId, dealId, input) =>
    mockRequest(() => {
      const deal = findDeal('buyer', buyerId, dealId)
      if (deal.status !== 'completed' || deal.reviewId) throw new ApiError('Only completed deals without a review can be reviewed', 409)
      const values = Object.values(input.ratings)
      if (values.some((v) => v < 1 || v > 5)) throw new ApiError('Ratings must be 1–5', 422)
      const review: Review = {
        id: `rv-${dealId}`,
        dealId,
        producerId: deal.producerId,
        buyerId,
        productIds: deal.lineItems.map((li) => li.productId),
        lotNumbers: deal.lineItems.flatMap((li) => (li.lot ? [li.lot.lotNumber] : [])),
        verifiedDeal: true,
        createdAt: liveNow().toISOString(),
        ratings: input.ratings,
        overall: round1(avg(values)),
        text: input.text.trim(),
        contentLang: input.lang,
        photoCount: input.photoCount,
        helpfulVotes: 0,
      }
      db.reviews.push(review)
      deal.reviewId = review.id
      persistReview(review)
      persistDeal(deal)
      refreshRatings(deal.producerId)
      return review
    }),
  partnerships: (role, partyId) => mockRequest(() => partnershipsFor(role, partyId).sort((a, b) => b.lastDealAt.localeCompare(a.lastDealAt))),
  setPartnerMeta: (partyId, counterpartyId, patch) =>
    mockRequest(
      () => {
        const i = db.partnershipMeta.findIndex((m) => m.ownerId === partyId && m.counterpartyId === counterpartyId)
        const base: PartnershipMeta = i >= 0 ? (db.partnershipMeta[i] as PartnershipMeta) : { ownerId: partyId, counterpartyId, favorite: false, privateNotes: '' }
        const next: PartnershipMeta = { ...base, ...patch, privateNotes: (patch.privateNotes ?? base.privateNotes).slice(0, 2000) }
        if (i >= 0) db.partnershipMeta[i] = next
        else db.partnershipMeta.push(next)
        persistPartnerMeta(next)
        return next
      },
      { latencyFactor: 0.4 },
    ),
}

resumePendingQuotes()
