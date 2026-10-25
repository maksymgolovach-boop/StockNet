import { useCallback } from 'react'
import type { Buyer, Producer, Thread } from '@/types/models'
import { sideForThread } from '@/features/company/company'
import { useCompanyIds } from '@/features/dev/devStore'
import { useBuyers, useProducers } from '@/services/queries'

export type Partner = { kind: 'producer'; id: string; name: string; brandHue: number; producer: Producer } | { kind: 'buyer'; id: string; name: string; brandHue: number; buyer: Buyer }

export function usePartners() {
  const { buyerId, producerId } = useCompanyIds()
  const producers = useProducers()
  const buyers = useBuyers()
  const resolve = useCallback(
    (thread: Pick<Thread, 'buyerId' | 'producerId'>): Partner | undefined => {
      const side = sideForThread(thread, { buyerId, producerId })
      if (side === 'buyer') {
        const producer = producers.data?.find((p) => p.id === thread.producerId)
        return producer && { kind: 'producer', id: producer.id, name: producer.name, brandHue: producer.brandHue, producer }
      }
      if (side === 'producer') {
        const buyer = buyers.data?.find((b) => b.id === thread.buyerId)
        return buyer && { kind: 'buyer', id: buyer.id, name: buyer.name, brandHue: buyer.brandHue, buyer }
      }
      return undefined
    },
    [buyerId, producerId, producers.data, buyers.data],
  )
  return { resolve, isPending: producers.isPending || buyers.isPending }
}
