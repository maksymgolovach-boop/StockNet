import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CurrencyCode, LanguageCode, ThemePreference, UnitsSystem, UserLocation, UserPreferences } from '@/types/models'
import { DEFAULT_LANGUAGE, LANGUAGES, isLanguageCode } from '@/config/languages'
import { safeStorage } from '@/shared/lib/storage'

function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase()
    if (isLanguageCode(base)) return base
  }
  return DEFAULT_LANGUAGE
}

export const DEFAULT_LOCATION: UserLocation = {
  label: 'Iași, RO',
  point: { lat: 47.1585, lng: 27.6014 },
  source: 'default',
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: detectLanguage(),
  currency: null,
  units: 'metric',
  theme: 'system',
  location: DEFAULT_LOCATION,
  radiusKm: 250,
  notifications: {
    newMessages: true,
    quoteUpdates: true,
    dealStatus: true,
    expiringDocuments: true,
    priceDrops: false,
    emailDigest: 'weekly',
  },
  privacy: { showReferenceCustomers: true, showDealCountPublicly: true, allowListedAsReference: true },
  recommendations: {
    categories: ['agri-machinery', 'agro-inputs', 'fresh-produce'],
    volumeEUR: { min: 3_000, max: 90_000 },
    certifications: [],
    preferVerified: true,
    preferPastPartners: true,
  },
}

interface PreferencesActions {
  setLanguage: (language: LanguageCode) => void
  setCurrency: (currency: CurrencyCode | null) => void
  setUnits: (units: UnitsSystem) => void
  setTheme: (theme: ThemePreference) => void
  setLocation: (location: UserLocation) => void
  setRadius: (km: number) => void
  update: (patch: Partial<UserPreferences>) => void
  reset: () => void
}

export const usePreferences = create<UserPreferences & PreferencesActions>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setUnits: (units) => set({ units }),
      setTheme: (theme) => set({ theme }),
      setLocation: (location) => set({ location }),
      setRadius: (radiusKm) => set({ radiusKm }),
      update: (patch) => set(patch),
      reset: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'sy-preferences',
      version: 2,
      migrate: (s) => {
        const prev = s as UserPreferences
        return { ...prev, recommendations: DEFAULT_PREFERENCES.recommendations, location: prev.location?.source === 'default' ? DEFAULT_LOCATION : prev.location } as UserPreferences & PreferencesActions
      },
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ setLanguage: _a, setCurrency: _b, setUnits: _c, setTheme: _d, setLocation: _e, setRadius: _f, update: _g, reset: _h, ...data }) => data,
    },
  ),
)

/** Effective display currency: explicit choice, else the language's default. */
export function useDisplayCurrency(): CurrencyCode {
  return usePreferences((s) => s.currency ?? LANGUAGES[s.language].defaultCurrency)
}
