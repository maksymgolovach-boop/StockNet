import { QueryClient, useQuery } from '@tanstack/react-query'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { catalogService } from './catalogService'
import { dealService } from './dealService'
import { mockFxProvider } from './fxService'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ApiError && (error.simulated || error.status === 404)) && count < 2,
    },
  },
})

export const queryKeys = {
  fx: ['fx'] as const,
  categoryStats: ['categories', 'stats'] as const,
  platformStats: ['platform', 'stats'] as const,
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  producers: ['producers'] as const,
  producer: (id: string) => ['producers', id] as const,
  deals: (role: string, id: string) => ['deals', role, id] as const,
  threads: (role: string, id: string) => ['threads', role, id] as const,
  messages: (role: string, id: string, threadId: string) => ['messages', role, id, threadId] as const,
}

export const useFxRates = () => useQuery({ queryKey: queryKeys.fx, queryFn: () => mockFxProvider.getRates(), staleTime: 15 * 60_000 })
export const useCategoryStats = () => useQuery({ queryKey: queryKeys.categoryStats, queryFn: () => catalogService.categoryStats() })
export const usePlatformStats = () => useQuery({ queryKey: queryKeys.platformStats, queryFn: () => catalogService.platformStats() })
export const useProducts = () => useQuery({ queryKey: queryKeys.products, queryFn: () => catalogService.products() })
export const useProducers = () => useQuery({ queryKey: queryKeys.producers, queryFn: () => catalogService.producers() })

export const useProduct = (id: string) => useQuery({ queryKey: queryKeys.product(id), queryFn: () => catalogService.product(id) })
export const useProducer = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.producer(id ?? ''), queryFn: () => catalogService.producer(id ?? ''), enabled: !!id })
export const useProducerReviews = (producerId: string | undefined) =>
  useQuery({ queryKey: ['reviews', producerId], queryFn: () => dealService.reviewsForProducer(producerId ?? ''), enabled: !!producerId })
export const useBuyers = () => useQuery({ queryKey: ['buyers'], queryFn: () => catalogService.buyers() })

export function useMyDeals() {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  return useQuery({ queryKey: queryKeys.deals(role, actorId), queryFn: () => dealService.deals(role, actorId) })
}

export function useMyThreads() {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  return useQuery({ queryKey: queryKeys.threads(role, actorId), queryFn: () => dealService.threads(role, actorId) })
}

export function useThreadMessages(threadId: string | undefined) {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  return useQuery({
    queryKey: queryKeys.messages(role, actorId, threadId ?? ''),
    queryFn: () => dealService.messages(role, actorId, threadId ?? ''),
    enabled: !!threadId,
    staleTime: Infinity,
  })
}
