import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LotRecordStatus } from '@/types/models'
import { useActorId } from '@/features/dev/devStore'
import { lotService, type LotInput } from '@/services/lotService'

export function useProducerLots() {
  const producerId = useActorId()
  return useQuery({ queryKey: ['producerLots', producerId], queryFn: () => lotService.producerLots(producerId) })
}

export function useProducerProducts() {
  const producerId = useActorId()
  return useQuery({ queryKey: ['producerProducts', producerId], queryFn: () => lotService.producerProducts(producerId) })
}

/** Every lot change refreshes the producer's table and every buyer-facing view of the catalogue. */
export function useLotMutations() {
  const producerId = useActorId()
  const qc = useQueryClient()
  const onSuccess = () => {
    for (const key of ['producerLots', 'producerProducts', 'products', 'search', 'producers']) void qc.invalidateQueries({ queryKey: [key] })
  }
  return {
    create: useMutation({ mutationFn: (input: LotInput) => lotService.create(producerId, input), onSuccess }),
    update: useMutation({ mutationFn: ({ lotId, input }: { lotId: string; input: LotInput }) => lotService.update(producerId, lotId, input), onSuccess }),
    duplicate: useMutation({ mutationFn: (lotId: string) => lotService.duplicate(producerId, lotId), onSuccess }),
    setStock: useMutation({ mutationFn: ({ lotId, stock }: { lotId: string; stock: number }) => lotService.setStock(producerId, lotId, stock), onSuccess }),
    setStatus: useMutation({ mutationFn: ({ lotId, status }: { lotId: string; status: LotRecordStatus }) => lotService.setStatus(producerId, lotId, status), onSuccess }),
  }
}
