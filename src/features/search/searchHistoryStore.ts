import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/shared/lib/storage'

interface SearchHistoryState {
  recent: string[]
  add: (query: string) => void
  remove: (query: string) => void
  clear: () => void
}

const MAX = 8

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recent: ['NPK 16-16-16', 'tractor', 'Golden Delicious'],
      add: (query) => {
        const q = query.trim()
        if (q.length < 2) return
        set((s) => ({ recent: [q, ...s.recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX) }))
      },
      remove: (query) => set((s) => ({ recent: s.recent.filter((r) => r !== query) })),
      clear: () => set({ recent: [] }),
    }),
    { name: 'sy-search-history', version: 2, storage: createJSONStorage(() => safeStorage), migrate: () => ({ recent: ['NPK 16-16-16', 'tractor', 'Golden Delicious'] }) as SearchHistoryState },
  ),
)
