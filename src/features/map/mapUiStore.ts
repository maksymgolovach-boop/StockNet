import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/shared/lib/storage'

export type SelectionSource = 'map' | 'list' | 'carousel'

interface MapUiState {
  hoveredProducerId: string | null
  selectedProducerId: string | null
  /** who triggered the last selection, so the other side reacts (scroll list / pan map) */
  selectionSource: SelectionSource | null
  visitedProducerIds: string[]
  setHovered: (id: string | null) => void
  select: (id: string | null, source?: SelectionSource) => void
  markVisited: (id: string) => void
}

/**
 * Shared list ↔ map interaction state. Components subscribe with narrow selectors
 * (e.g. `s.hoveredProducerId === id`) so a hover re-renders only the two affected items.
 */
export const useMapUi = create<MapUiState>()(
  persist(
    (set) => ({
      hoveredProducerId: null,
      selectedProducerId: null,
      selectionSource: null,
      visitedProducerIds: [],
      setHovered: (hoveredProducerId) => set({ hoveredProducerId }),
      select: (selectedProducerId, selectionSource = 'map') => set({ selectedProducerId, selectionSource }),
      markVisited: (id) => set((s) => (s.visitedProducerIds.includes(id) ? s : { visitedProducerIds: [...s.visitedProducerIds, id].slice(-200) })),
    }),
    {
      name: 'sy-map-ui',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ visitedProducerIds: s.visitedProducerIds }),
    },
  ),
)
