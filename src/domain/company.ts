import type { Deal, Partnership, PartyRole, Thread } from '@/types/models'

export type CompanyIds = { buyerId: string; producerId: string }

/** Which side of the deal the company is on. Returns undefined if the company is not a party. */
export function sideForDeal(d: Pick<Deal, 'buyerId' | 'producerId'>, ids: CompanyIds): PartyRole | undefined {
  if (d.buyerId === ids.buyerId) return 'buyer'
  if (d.producerId === ids.producerId) return 'producer'
  return undefined
}

/** Which side of the thread the company is on. */
export function sideForThread(t: Pick<Thread, 'buyerId' | 'producerId'>, ids: CompanyIds): PartyRole | undefined {
  if (t.buyerId === ids.buyerId) return 'buyer'
  if (t.producerId === ids.producerId) return 'producer'
  return undefined
}

/** Build a thread-shaped object that resolves the counterparty of a partnership. */
export function threadForPartnership(p: Pick<Partnership, 'ownerRole' | 'counterpartyId'>, ids: CompanyIds) {
  return p.ownerRole === 'buyer'
    ? { buyerId: ids.buyerId, producerId: p.counterpartyId }
    : { buyerId: p.counterpartyId, producerId: ids.producerId }
}

export function unionById<T extends { id: string }>(...lists: (T[] | undefined)[]): T[] {
  const out = new Map<string, T>()
  for (const list of lists) for (const item of list ?? []) if (!out.has(item.id)) out.set(item.id, item)
  return [...out.values()]
}
