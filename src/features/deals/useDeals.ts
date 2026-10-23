import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PartnershipMeta } from '@/types/models'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { dealService, type DisputeInput, type QuoteRequestInput, type ReviewInput } from '@/services/dealService'
import { queryKeys } from '@/services/queries'
import type { DealActionId } from './dealRules'

export function useDeal(dealId: string) {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  return useQuery({ queryKey: ['deal', role, actorId, dealId], queryFn: () => dealService.deal(role, actorId, dealId), enabled: !!dealId })
}

export function usePartnerships() {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  return useQuery({ queryKey: ['partnerships', role, actorId], queryFn: () => dealService.partnerships(role, actorId) })
}

/** Deal changes ripple into lots (reservations, stock), search, chat, reviews and partners. */
export function useDealMutations() {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  const qc = useQueryClient()
  const onSuccess = () => {
    for (const key of ['deal', 'deals', 'partnerships', 'threads', 'messages', 'producerLots', 'products', 'search', 'reviews', 'producers']) void qc.invalidateQueries({ queryKey: [key] })
    void qc.invalidateQueries({ queryKey: queryKeys.deals(role, actorId) })
  }
  return {
    transition: useMutation({ mutationFn: ({ dealId, action }: { dealId: string; action: DealActionId }) => dealService.transition(role, actorId, dealId, action), onSuccess }),
    createQuote: useMutation({ mutationFn: (input: QuoteRequestInput) => dealService.createQuoteRequest(actorId, input), onSuccess }),
    openDispute: useMutation({ mutationFn: ({ dealId, input }: { dealId: string; input: DisputeInput }) => dealService.openDispute(role, actorId, dealId, input), onSuccess }),
    resolveDispute: useMutation({ mutationFn: ({ dealId, note }: { dealId: string; note: string }) => dealService.resolveDispute(role, actorId, dealId, note), onSuccess }),
    addReview: useMutation({ mutationFn: ({ dealId, input }: { dealId: string; input: ReviewInput }) => dealService.addReview(actorId, dealId, input), onSuccess }),
    setMeta: useMutation({
      mutationFn: ({ counterpartyId, patch }: { counterpartyId: string; patch: Partial<Pick<PartnershipMeta, 'favorite' | 'tag' | 'privateNotes'>> }) => dealService.setPartnerMeta(actorId, counterpartyId, patch),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['partnerships'] }),
    }),
  }
}
