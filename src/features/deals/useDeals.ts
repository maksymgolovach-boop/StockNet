import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import type { Partnership, PartnershipMeta, PartyRole } from '@/types/models'
import { useCompanyIds } from '@/features/dev/devStore'
import { dealService, type DisputeInput, type QuoteRequestInput, type ReviewInput } from '@/services/dealService'
import type { DealActionId } from './dealRules'

export function useDeal(dealId: string) {
  const { buyerId, producerId } = useCompanyIds()
  const results = useQueries({
    queries: [
      { queryKey: ['deal', 'buyer', buyerId, dealId], queryFn: () => dealService.deal('buyer', buyerId, dealId), enabled: !!dealId },
      { queryKey: ['deal', 'producer', producerId, dealId], queryFn: () => dealService.deal('producer', producerId, dealId), enabled: !!dealId },
    ],
  })
  const index = results.findIndex((r) => r.data)
  const winning = index >= 0 ? results[index] : results[0]
  const side: PartyRole | undefined = index === 0 ? 'buyer' : index === 1 ? 'producer' : undefined
  const error = results.every((r) => r.error) ? (results[0]?.error ?? null) : null
  const isPending = results.some((r) => r.isPending)
  const refetch = () => Promise.all(results.map((r) => r.refetch()))
  return { ...winning, data: winning?.data, error, isPending, refetch, side }
}

export function usePartnerships() {
  const { buyerId, producerId } = useCompanyIds()
  const results = useQueries({
    queries: [
      { queryKey: ['partnerships', 'buyer', buyerId], queryFn: () => dealService.partnerships('buyer', buyerId) },
      { queryKey: ['partnerships', 'producer', producerId], queryFn: () => dealService.partnerships('producer', producerId) },
    ],
  })
  const merged = new Map<string, Partnership>()
  for (const p of results.flatMap((r) => r.data ?? [])) {
    const key = `${p.ownerRole}:${p.counterpartyId}`
    if (!merged.has(key)) merged.set(key, p)
  }
  const data = results.some((r) => r.data) ? [...merged.values()] : undefined
  const isPending = results.some((r) => r.isPending)
  const error = results.find((r) => r.error)?.error ?? null
  const refetch = () => Promise.all(results.map((r) => r.refetch()))
  return { data, isPending, error, refetch }
}

/** Deal changes ripple into lots (reservations, stock), search, chat, reviews and partners. */
export function useDealMutations() {
  const { buyerId, producerId } = useCompanyIds()
  const qc = useQueryClient()
  const actorFor = (side: PartyRole) => (side === 'buyer' ? buyerId : producerId)
  const onSuccess = () => {
    for (const key of ['deal', 'deals', 'partnerships', 'threads', 'messages', 'producerLots', 'products', 'search', 'reviews', 'producers']) void qc.invalidateQueries({ queryKey: [key] })
  }
  return {
    transition: useMutation({
      mutationFn: ({ dealId, action, side }: { dealId: string; action: DealActionId; side: PartyRole }) => dealService.transition(side, actorFor(side), dealId, action),
      onSuccess,
    }),
    createQuote: useMutation({ mutationFn: (input: QuoteRequestInput) => dealService.createQuoteRequest(buyerId, input), onSuccess }),
    openDispute: useMutation({
      mutationFn: ({ dealId, input, side }: { dealId: string; input: DisputeInput; side: PartyRole }) => dealService.openDispute(side, actorFor(side), dealId, input),
      onSuccess,
    }),
    resolveDispute: useMutation({
      mutationFn: ({ dealId, note, side }: { dealId: string; note: string; side: PartyRole }) => dealService.resolveDispute(side, actorFor(side), dealId, note),
      onSuccess,
    }),
    addReview: useMutation({ mutationFn: ({ dealId, input }: { dealId: string; input: ReviewInput }) => dealService.addReview(buyerId, dealId, input), onSuccess }),
    setMeta: useMutation({
      mutationFn: ({ counterpartyId, patch, side }: { counterpartyId: string; patch: Partial<Pick<PartnershipMeta, 'favorite' | 'tag' | 'privateNotes'>>; side: PartyRole }) =>
        dealService.setPartnerMeta(actorFor(side), counterpartyId, patch),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['partnerships'] }),
    }),
  }
}
