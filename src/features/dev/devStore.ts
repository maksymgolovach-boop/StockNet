import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PartyRole } from '@/types/models'
import { safeStorage } from '@/shared/lib/storage'

interface DevState {
  role: PartyRole
  buyerId: string
  producerId: string
  simulateErrors: boolean
  latencyMs: number
  setRole: (role: PartyRole) => void
  setSimulateErrors: (on: boolean) => void
  setLatency: (ms: number) => void
}

/** Demo-only controls: role preview (buyer ↔ producer), error injection and API latency. */
export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      role: 'buyer',
      buyerId: 'b07',
      producerId: 'p01',
      simulateErrors: false,
      latencyMs: 350,
      setRole: (role) => set({ role }),
      setSimulateErrors: (simulateErrors) => set({ simulateErrors }),
      setLatency: (latencyMs) => set({ latencyMs }),
    }),
    { name: 'sy-dev', version: 2, storage: createJSONStorage(() => safeStorage), migrate: (s) => ({ ...(s as object), buyerId: 'b07', producerId: 'p01' }) as DevState },
  ),
)

/** The id of the party the UI is currently acting as. */
export function useActorId(): string {
  return useDevStore((s) => (s.role === 'buyer' ? s.buyerId : s.producerId))
}
