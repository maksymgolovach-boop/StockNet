import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '@/shared/lib/storage'

interface DevState {
  /** Whether the dev menu button is shown. Always on in development; in a published build only after ?dev=1. */
  menuEnabled: boolean
  simulateErrors: boolean
  latencyMs: number
  setSimulateErrors: (on: boolean) => void
  setLatency: (ms: number) => void
}

/** Demo-only controls: the dev menu switch, error injection and API latency. */
export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      menuEnabled: false,
      simulateErrors: false,
      latencyMs: 350,
      setSimulateErrors: (simulateErrors) => set({ simulateErrors }),
      setLatency: (latencyMs) => set({ latencyMs }),
    }),
    {
      name: 'sy-dev',
      version: 4,
      storage: createJSONStorage(() => safeStorage),
      migrate: (s) => {
        const prev = s as Partial<DevState>
        return {
          menuEnabled: prev.menuEnabled ?? false,
          simulateErrors: prev.simulateErrors ?? false,
          latencyMs: prev.latencyMs ?? 350,
        } as DevState
      },
    },
  ),
)
