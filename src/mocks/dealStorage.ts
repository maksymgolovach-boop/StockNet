import type { Deal, Message, PartnershipMeta, Review, Thread } from '@/types/models'
import { isRecord, matches, matching, type Shape } from '@/shared/lib/shape'
import { safeStorage } from '@/shared/lib/storage'

const KEY = 'sy-deals'

interface StoredDeals {
  version: 1
  deals: Record<string, Deal>
  reviews: Review[]
  threads: Thread[]
  messages: Message[]
  partnerMeta: PartnershipMeta[]
}

const empty = (): StoredDeals => ({ version: 1, deals: {}, reviews: [], threads: [], messages: [], partnerMeta: [] })

const DEAL: Shape = {
  id: 'string',
  buyerId: 'string',
  producerId: 'string',
  currency: 'string',
  status: 'string',
  incoterm: 'string',
  requestedDeliveryDate: 'string',
  notes: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  total: 'number',
  deliveryAddress: { street: 'string', city: 'string', country: 'string' },
  lineItems: [{ productId: 'string', productName: 'string', categorySlug: 'string', unit: 'string', quantity: 'number', unitPrice: 'number', subtotal: 'number' }],
  events: [{ id: 'string', status: 'string', at: 'string', actor: 'string' }],
  documents: 'array',
}
const REVIEW: Shape = {
  id: 'string',
  dealId: 'string',
  producerId: 'string',
  buyerId: 'string',
  createdAt: 'string',
  text: 'string',
  contentLang: 'string',
  productIds: 'array',
  ratings: {},
  overall: 'number',
  photoCount: 'number',
  helpfulVotes: 'number',
}
const THREAD: Shape = {
  id: 'string',
  buyerId: 'string',
  producerId: 'string',
  createdAt: 'string',
  lastMessageAt: 'string',
  unreadForBuyer: 'number',
  unreadForProducer: 'number',
}
const MESSAGE: Shape = {
  id: 'string',
  threadId: 'string',
  senderId: 'string',
  senderRole: 'string',
  kind: 'string',
  text: 'string',
  contentLang: 'string',
  sentAt: 'string',
  mockTranslations: {},
  attachments: 'array',
}
const PARTNER_META: Shape = { ownerId: 'string', counterpartyId: 'string', privateNotes: 'string', favorite: 'boolean' }

/** Reads the saved changes, keeping only records that still have the expected shape. */
function read(): StoredDeals {
  try {
    const parsed: unknown = JSON.parse(safeStorage.getItem(KEY) ?? 'null')
    if (!isRecord(parsed) || parsed.version !== 1) return empty()
    const deals = Object.entries(isRecord(parsed.deals) ? parsed.deals : {}).filter(
      ([id, deal]) => matches(deal, DEAL) && (deal as Deal).id === id && (deal as Deal).events.length > 0,
    )
    return {
      version: 1,
      deals: Object.fromEntries(deals) as Record<string, Deal>,
      reviews: matching<Review>(parsed.reviews, REVIEW),
      threads: matching<Thread>(parsed.threads, THREAD),
      messages: matching<Message>(parsed.messages, MESSAGE),
      partnerMeta: matching<PartnershipMeta>(parsed.partnerMeta, PARTNER_META),
    }
  } catch {
    return empty()
  }
}

function update(fn: (data: StoredDeals) => void) {
  const data = read()
  fn(data)
  safeStorage.setItem(KEY, JSON.stringify(data))
}

/** Replaces the item with the same key, or appends it. */
function upsert<T>(list: T[], item: T, sameAs: (a: T, b: T) => boolean) {
  const i = list.findIndex((x) => sameAs(x, item))
  if (i >= 0) list[i] = item
  else list.push(item)
}

const sameId = (a: { id: string }, b: { id: string }) => a.id === b.id
const sameMeta = (a: PartnershipMeta, b: PartnershipMeta) => a.ownerId === b.ownerId && a.counterpartyId === b.counterpartyId

/** Replays deal changes made in this browser over the generated data at start-up. */
export function applyStoredDeals(target: Partial<{ deals: Deal[]; reviews: Review[]; threads: Thread[]; messages: Message[]; partnershipMeta: PartnershipMeta[] }>) {
  const data = read()
  for (const deal of target.deals ? Object.values(data.deals) : []) upsert(target.deals as Deal[], deal, sameId)
  for (const review of target.reviews ? data.reviews : []) if (!target.reviews?.some((x) => x.id === review.id)) target.reviews?.push(review)
  for (const thread of target.threads ? data.threads : []) upsert(target.threads as Thread[], thread, sameId)
  for (const message of target.messages ? data.messages : []) if (!target.messages?.some((x) => x.id === message.id)) target.messages?.push(message)
  for (const meta of target.partnershipMeta ? data.partnerMeta : []) upsert(target.partnershipMeta as PartnershipMeta[], meta, sameMeta)
}

export const persistDeal = (deal: Deal) => update((d) => void (d.deals[deal.id] = deal))

export const persistReview = (review: Review) => update((d) => void (d.reviews = [...d.reviews.filter((r) => r.id !== review.id), review]))

export const persistThread = (thread: Thread, messages: Message[] = []) =>
  update((d) => {
    d.threads = [...d.threads.filter((t) => t.id !== thread.id), thread]
    d.messages = [...d.messages.filter((m) => !messages.some((x) => x.id === m.id)), ...messages]
  })

export const persistPartnerMeta = (meta: PartnershipMeta) => update((d) => void (d.partnerMeta = [...d.partnerMeta.filter((x) => !sameMeta(x, meta)), meta]))

export const clearStoredDeals = () => safeStorage.removeItem(KEY)
