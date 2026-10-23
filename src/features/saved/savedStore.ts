import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/shared/lib/storage'

interface SavedState {
  productIds: string[]
  producerIds: string[]
  toggleProduct: (id: string) => void
  toggleProducer: (id: string) => void
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

/** Saved products and producers (persisted; shown on the dashboard and as hearts on map pins). */
export const useSaved = create<SavedState>()(
  persist(
    (set) => ({
      productIds: ['pr-139', 'pr-157'],
      producerIds: ['p28', 'p27'],
      toggleProduct: (id) => set((s) => ({ productIds: toggle(s.productIds, id) })),
      toggleProducer: (id) => set((s) => ({ producerIds: toggle(s.producerIds, id) })),
    }),
    { name: 'sy-saved', version: 2, storage: createJSONStorage(() => safeStorage), migrate: () => ({ productIds: ['pr-139', 'pr-157'], producerIds: ['p28', 'p27'] }) as SavedState },
  ),
)
