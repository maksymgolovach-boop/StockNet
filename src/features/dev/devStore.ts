import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Company } from '@/types/models'
import type { CompanyIds } from '@/features/company/company'
import { currentCompany } from '@/mocks/companies'
import { safeStorage } from '@/shared/lib/storage'

interface DevState {
  companyId: string
  simulateErrors: boolean
  latencyMs: number
  setSimulateErrors: (on: boolean) => void
  setLatency: (ms: number) => void
}

/** Demo-only controls: company identity, error injection and API latency. */
export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      companyId: currentCompany.id,
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
          companyId: currentCompany.id,
          simulateErrors: prev.simulateErrors ?? false,
          latencyMs: prev.latencyMs ?? 350,
        } as DevState
      },
    },
  ),
)

/** The logged-in company. */
export function useCompany(): Company {
  return currentCompany
}

/** The company's party ids, used to derive sides. */
export function useCompanyIds(): CompanyIds {
  return { buyerId: currentCompany.buyerId, producerId: currentCompany.producerId }
}

/** True when the producer is the logged-in company's own seller identity. */
export function useIsOwnProducer(producerId: string | undefined): boolean {
  return !!producerId && producerId === currentCompany.producerId
}
