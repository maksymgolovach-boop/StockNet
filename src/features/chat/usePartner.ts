import type { Buyer, PartyRole, Producer, Thread } from '@/types/models'
import { useBuyers, useProducers } from '@/services/queries'

export type Partner = { kind: 'producer'; id: string; name: string; brandHue: number; producer: Producer } | { kind: 'buyer'; id: string; name: string; brandHue: number; buyer: Buyer }

export function usePartners(role: PartyRole) {
  const producers = useProducers()
  const buyers = useBuyers()
  const resolve = (thread: Pick<Thread, 'buyerId' | 'producerId'>): Partner | undefined => {
    if (role === 'buyer') {
      const producer = producers.data?.find((p) => p.id === thread.producerId)
      return producer && { kind: 'producer', id: producer.id, name: producer.name, brandHue: producer.brandHue, producer }
    }
    const buyer = buyers.data?.find((b) => b.id === thread.buyerId)
    return buyer && { kind: 'buyer', id: buyer.id, name: buyer.name, brandHue: buyer.brandHue, buyer }
  }
  return { resolve, isPending: producers.isPending || buyers.isPending }
}
