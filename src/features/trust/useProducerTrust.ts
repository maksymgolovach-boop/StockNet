import type { TrustScore } from '@/types/models'
import { useProducers } from '@/services/queries'

/** Full trust breakdown for a producer (search results only carry the summary score). */
export function useProducerTrust(producerId: string): TrustScore | undefined {
  const { data } = useProducers()
  return data?.find((p) => p.id === producerId)?.trust
}
