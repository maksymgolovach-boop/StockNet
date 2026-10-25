import { QueryClient, useQueries, useQuery } from '@tanstack/react-query'
import type { PartyRole } from '@/types/models'
import { useCompanyIds } from '@/features/dev/devStore'
import { unionById } from '@/features/company/company'
import { catalogService } from './catalogService'
import { dealService, type ThreadSummary } from './dealService'
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
  const { buyerId, producerId } = useCompanyIds()
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.deals('buyer', buyerId), queryFn: () => dealService.deals('buyer', buyerId) },
      { queryKey: queryKeys.deals('producer', producerId), queryFn: () => dealService.deals('producer', producerId) },
    ],
  })
  const data = results.some((r) => r.data) ? unionById(...results.map((r) => r.data)) : undefined
  const isPending = results.some((r) => r.isPending)
  const error = results.find((r) => r.error)?.error ?? null
  const refetch = () => Promise.all(results.map((r) => r.refetch()))
  return { data, isPending, error, refetch }
}

export type CompanyThread = ThreadSummary & { mySide: PartyRole }

export function useMyThreads() {
  const { buyerId, producerId } = useCompanyIds()
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.threads('buyer', buyerId), queryFn: () => dealService.threads('buyer', buyerId) },
      { queryKey: queryKeys.threads('producer', producerId), queryFn: () => dealService.threads('producer', producerId) },
    ],
  })
  const tag = (list: ThreadSummary[] | undefined, mySide: PartyRole) => list?.map((t) => ({ ...t, mySide }))
  const data = results.some((r) => r.data)
    ? unionById<CompanyThread>(tag(results[0]?.data, 'buyer'), tag(results[1]?.data, 'producer'))
    : undefined
  const isPending = results.some((r) => r.isPending)
  const isFetching = results.some((r) => r.isFetching)
  const error = results.find((r) => r.error)?.error ?? null
  const refetch = () => Promise.all(results.map((r) => r.refetch()))
  return { data, isPending, isFetching, error, refetch }
}

export function useThreadMessages(threadId: string | undefined, side: PartyRole, actorId: string) {
  return useQuery({
    queryKey: queryKeys.messages(side, actorId, threadId ?? ''),
    queryFn: () => dealService.messages(side, actorId, threadId ?? ''),
    enabled: !!threadId,
    staleTime: Infinity,
  })
}
