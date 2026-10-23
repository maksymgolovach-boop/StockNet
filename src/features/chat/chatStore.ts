import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/shared/lib/storage'

interface ChatUiState {
  typing: Record<string, boolean>
  panelOpen: boolean
  setTyping: (threadId: string, typing: boolean) => void
  togglePanel: () => void
}

export const useChatUi = create<ChatUiState>()(
  persist(
    (set) => ({
      typing: {},
      panelOpen: true,
      setTyping: (threadId, typing) => set((s) => ({ typing: { ...s.typing, [threadId]: typing } })),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
    }),
    { name: 'sy-chat', storage: createJSONStorage(() => safeStorage), partialize: (s) => ({ panelOpen: s.panelOpen }) },
  ),
)
