import type { Attachment, LanguageCode, Message, PartyRole, Thread } from '@/types/models'
import { db } from '@/mocks'
import { liveNow } from '@/shared/lib/dates'
import { isSameCompany } from '@/mocks/companies'
import { ApiError, NotFoundError, mockRequest } from './client'
import { buildReply, detectIntent } from './chatReplies'

export type ChatEvent =
  | { type: 'message'; message: Message }
  | { type: 'typing'; threadId: string; role: PartyRole; typing: boolean }
  | { type: 'read'; threadId: string; readerRole: PartyRole; readAt: string }
  | { type: 'thread'; thread: Thread }
  | { type: 'deal'; dealId: string }

export interface SendInput {
  threadId: string
  role: PartyRole
  partyId: string
  text: string
  lang: LanguageCode
  attachments: Omit<Attachment, 'id'>[]
}

/**
 * Real-time chat contract. The mock below simulates a WebSocket server in memory; a real
 * implementation would open a socket in `connect`, POST in `send` and forward server frames
 * to the listener as `ChatEvent`s.
 */
export interface ChatTransport {
  connect(role: PartyRole, partyId: string, listener: (event: ChatEvent) => void): () => void
  send(input: SendInput): Promise<Message>
  markRead(threadId: string, role: PartyRole, partyId: string): Promise<void>
  openThread(input: { buyerId: string; producerId: string; productId?: string }): Promise<Thread>
}

interface Connection {
  role: PartyRole
  partyId: string
  listener: (event: ChatEvent) => void
}

const connections = new Set<Connection>()
const pendingReplies = new Map<string, ReturnType<typeof setTimeout>[]>()
let seq = 0

const other = (role: PartyRole): PartyRole => (role === 'buyer' ? 'producer' : 'buyer')
const partyOf = (thread: Thread, role: PartyRole) => (role === 'buyer' ? thread.buyerId : thread.producerId)

function emit(thread: Thread, event: ChatEvent) {
  for (const c of connections) if (partyOf(thread, c.role) === c.partyId) c.listener(structuredClone(event))
}

function findThread(threadId: string, role: PartyRole, partyId: string) {
  const thread = db.threads.find((t) => t.id === threadId && partyOf(t, role) === partyId)
  if (!thread) throw new NotFoundError(`Thread ${threadId}`)
  return thread
}

function languageOf(thread: Thread, role: PartyRole): LanguageCode {
  const own = db.messages.filter((m) => m.threadId === thread.id && m.senderRole === role)
  const last = own[own.length - 1]
  if (last) return last.contentLang
  if (role === 'producer') return db.producers.find((p) => p.id === thread.producerId)?.contentLang ?? 'en'
  const country = db.buyers.find((b) => b.id === thread.buyerId)?.address.country
  return country === 'RO' || country === 'MD' ? 'ro' : country === 'DE' || country === 'AT' ? 'de' : 'en'
}

function push(thread: Thread, message: Message) {
  db.messages.push(message)
  thread.lastMessageAt = message.sentAt
  if (message.senderRole === 'buyer') thread.unreadForProducer += 1
  else thread.unreadForBuyer += 1
  emit(thread, { type: 'message', message })
  emit(thread, { type: 'thread', thread })
}

function markReadInDb(thread: Thread, readerRole: PartyRole) {
  const readAt = liveNow().toISOString()
  for (const m of db.messages) if (m.threadId === thread.id && m.senderRole !== readerRole && !m.readAt) m.readAt = readAt
  if (readerRole === 'buyer') thread.unreadForBuyer = 0
  else thread.unreadForProducer = 0
  emit(thread, { type: 'read', threadId: thread.id, readerRole, readAt })
  emit(thread, { type: 'thread', thread })
}

function scheduleCounterpart(thread: Thread, senderRole: PartyRole, text: string) {
  for (const timer of pendingReplies.get(thread.id) ?? []) clearTimeout(timer)
  const responder = other(senderRole)
  const product = db.products.find((p) => p.id === thread.productId)?.name ?? ''
  const timers = [
    setTimeout(() => markReadInDb(thread, responder), 900),
    setTimeout(() => emit(thread, { type: 'typing', threadId: thread.id, role: responder, typing: true }), 1600),
    setTimeout(() => {
      const lang = languageOf(thread, responder)
      const reply = buildReply(detectIntent(text), responder, product)
      const mockTranslations: Message['mockTranslations'] = {}
      for (const l of ['en', 'de', 'ro'] as const) if (l !== lang) mockTranslations[l] = reply.text[l]
      emit(thread, { type: 'typing', threadId: thread.id, role: responder, typing: false })
      seq += 1
      push(thread, {
        id: `${thread.id}-live${seq}`,
        threadId: thread.id,
        senderId: partyOf(thread, responder),
        senderRole: responder,
        kind: 'text',
        text: reply.text[lang],
        contentLang: lang,
        mockTranslations,
        sentAt: liveNow().toISOString(),
        attachments: reply.attachment ? [{ id: `${thread.id}-live${seq}-a`, ...reply.attachment }] : [],
      })
      pendingReplies.delete(thread.id)
    }, 4200),
  ]
  pendingReplies.set(thread.id, timers)
}

/** Server-side: finds or creates the buyer–producer thread and pins the product. */
export function ensureThread({ buyerId, producerId, productId }: { buyerId: string; producerId: string; productId?: string }): Thread {
  if (!db.producers.some((p) => p.id === producerId) || !db.buyers.some((b) => b.id === buyerId)) throw new NotFoundError('Partner')
  if (isSameCompany(buyerId, producerId)) throw new ApiError('A company cannot open a conversation with itself', 422)
  const existing = db.threads.find((t) => t.buyerId === buyerId && t.producerId === producerId)
  const validProduct = productId && db.products.some((p) => p.id === productId && p.producerId === producerId) ? productId : undefined
  if (existing) {
    if (validProduct && existing.productId !== validProduct) {
      existing.productId = validProduct
      emit(existing, { type: 'thread', thread: existing })
    }
    return existing
  }
  const at = liveNow().toISOString()
  const thread: Thread = {
    id: `t-${buyerId}-${producerId}`,
    buyerId,
    producerId,
    productId: validProduct ?? db.products.find((p) => p.producerId === producerId)?.id,
    createdAt: at,
    lastMessageAt: at,
    unreadForBuyer: 0,
    unreadForProducer: 0,
  }
  db.threads.push(thread)
  emit(thread, { type: 'thread', thread })
  return thread
}

/** Server-side: posts a message (with mock translations) and notifies connected clients. */
export function serverPost(thread: Thread, role: PartyRole, text: Record<LanguageCode, string>, lang: LanguageCode, attachments: Omit<Attachment, 'id'>[] = []): Message {
  seq += 1
  const mockTranslations: Message['mockTranslations'] = {}
  for (const l of ['en', 'de', 'ro'] as const) if (l !== lang) mockTranslations[l] = text[l]
  const message: Message = {
    id: `${thread.id}-srv${Date.now().toString(36)}${seq}`,
    threadId: thread.id,
    senderId: partyOf(thread, role),
    senderRole: role,
    kind: 'text',
    text: text[lang],
    contentLang: lang,
    mockTranslations,
    sentAt: liveNow().toISOString(),
    attachments: attachments.map((a, i) => ({ id: `${thread.id}-srv${seq}-a${i}`, ...a })),
  }
  push(thread, message)
  return message
}

/** Server-side: tells both parties' open sessions that a deal changed. */
export function emitDealChanged(deal: { id: string; buyerId: string; producerId: string }) {
  for (const c of connections) if ((c.role === 'buyer' ? deal.buyerId : deal.producerId) === c.partyId) c.listener({ type: 'deal', dealId: deal.id })
}

export const threadLanguage = (thread: Thread, role: PartyRole) => languageOf(thread, role)

export const mockChatTransport: ChatTransport = {
  connect(role, partyId, listener) {
    const connection = { role, partyId, listener }
    connections.add(connection)
    return () => connections.delete(connection)
  },
  send: (input) =>
    mockRequest(
      () => {
        const thread = findThread(input.threadId, input.role, input.partyId)
        seq += 1
        const message: Message = {
          id: `${thread.id}-live${seq}`,
          threadId: thread.id,
          senderId: input.partyId,
          senderRole: input.role,
          kind: 'text',
          text: input.text,
          contentLang: input.lang,
          mockTranslations: {},
          sentAt: liveNow().toISOString(),
          attachments: input.attachments.map((a, i) => ({ id: `${thread.id}-live${seq}-a${i}`, ...a })),
        }
        push(thread, message)
        scheduleCounterpart(thread, input.role, input.text)
        return message
      },
      { latencyFactor: 0.4 },
    ),
  markRead: (threadId, role, partyId) =>
    mockRequest(
      () => {
        const thread = findThread(threadId, role, partyId)
        const unread = role === 'buyer' ? thread.unreadForBuyer : thread.unreadForProducer
        if (unread > 0 || db.messages.some((m) => m.threadId === threadId && m.senderRole !== role && !m.readAt)) markReadInDb(thread, role)
      },
      { latencyFactor: 0.2 },
    ),
  openThread: (input) => mockRequest(() => ensureThread(input)),
}

export const chatTransport: ChatTransport = mockChatTransport
