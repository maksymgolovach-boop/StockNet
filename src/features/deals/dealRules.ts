import type { Deal, DealDocumentType, DealStatus, PartyRole } from '@/types/models'
import { liveNow } from '@/shared/lib/dates'

export type DealActionId = 'sendQuote' | 'decline' | 'acceptQuote' | 'negotiate' | 'cancel' | 'dispatch' | 'markDelivered' | 'confirmReceipt' | 'complete'

export interface DealTransition {
  action: DealActionId
  to: DealStatus
  actor: PartyRole
  tone: 'primary' | 'secondary' | 'danger'
}

export const LIFECYCLE: DealStatus[] = ['quote_request', 'quote_received', 'negotiation', 'order_confirmed', 'in_delivery', 'delivered', 'completed']

export const TRANSITIONS: Record<DealStatus, DealTransition[]> = {
  quote_request: [
    { action: 'sendQuote', to: 'quote_received', actor: 'producer', tone: 'primary' },
    { action: 'decline', to: 'cancelled', actor: 'producer', tone: 'danger' },
    { action: 'cancel', to: 'cancelled', actor: 'buyer', tone: 'danger' },
  ],
  quote_received: [
    { action: 'acceptQuote', to: 'order_confirmed', actor: 'buyer', tone: 'primary' },
    { action: 'negotiate', to: 'negotiation', actor: 'buyer', tone: 'secondary' },
    { action: 'cancel', to: 'cancelled', actor: 'buyer', tone: 'danger' },
  ],
  negotiation: [
    { action: 'sendQuote', to: 'quote_received', actor: 'producer', tone: 'primary' },
    { action: 'acceptQuote', to: 'order_confirmed', actor: 'buyer', tone: 'primary' },
    { action: 'cancel', to: 'cancelled', actor: 'buyer', tone: 'danger' },
  ],
  order_confirmed: [
    { action: 'dispatch', to: 'in_delivery', actor: 'producer', tone: 'primary' },
    { action: 'cancel', to: 'cancelled', actor: 'buyer', tone: 'danger' },
  ],
  in_delivery: [
    { action: 'markDelivered', to: 'delivered', actor: 'producer', tone: 'primary' },
    { action: 'confirmReceipt', to: 'delivered', actor: 'buyer', tone: 'primary' },
  ],
  delivered: [{ action: 'complete', to: 'completed', actor: 'buyer', tone: 'primary' }],
  completed: [],
  cancelled: [],
  disputed: [],
}

export const ACTIVE_STATUSES = new Set<DealStatus>(['quote_request', 'quote_received', 'negotiation', 'order_confirmed', 'in_delivery', 'delivered', 'disputed'])
export const OPEN_QUOTE_STATUSES = new Set<DealStatus>(['quote_request', 'quote_received', 'negotiation'])

export const DOCUMENT_ON: Partial<Record<DealStatus, DealDocumentType>> = {
  quote_received: 'quote',
  order_confirmed: 'order_confirmation',
  in_delivery: 'delivery_note',
  delivered: 'invoice',
  disputed: 'dispute_report',
}

export const transitionsFor = (deal: Pick<Deal, 'status'>, role: PartyRole) => TRANSITIONS[deal.status].filter((t) => t.actor === role)

const DISPUTE_WINDOW_DAYS = 30

/** Buyers can dispute from order confirmation until 30 days after delivery. */
export function canDispute(deal: Deal, role: PartyRole, at: Date = liveNow()): boolean {
  if (role !== 'buyer' || deal.dispute) return false
  if (['order_confirmed', 'in_delivery', 'delivered'].includes(deal.status)) return true
  if (deal.status !== 'completed' || !deal.deliveredAt) return false
  return at.getTime() - new Date(deal.deliveredAt).getTime() <= DISPUTE_WINDOW_DAYS * 86_400_000
}
