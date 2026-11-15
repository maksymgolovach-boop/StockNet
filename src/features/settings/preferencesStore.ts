import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  CurrencyCode,
  LanguageCode,
  ThemePreference,
  UnitsSystem,
  UserLocation,
  UserPreferences,
} from '@/types/models'
import { isCurrencyCode } from '@/config/currencies'
import { LANGUAGES, detectLanguage, isLanguageCode } from '@/config/languages'
import { isRecord, matches } from '@/shared/lib/shape'
import { safeStorage } from '@/shared/lib/storage'

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

/**
 * The fields of saved preferences that still hold a valid value. Anything else falls back to the default,
 * so preferences saved by an older version (or edited by hand) can never break a page.
 */
function validPreferences(saved: unknown): Partial<UserPreferences> {
  if (!isRecord(saved)) return {}
  const { language, currency, units, theme, location, radiusKm, notifications, privacy, recommendations } = saved
  const valid: Partial<UserPreferences> = {}
  if (isLanguageCode(language)) valid.language = language
  if (currency === null || isCurrencyCode(currency)) valid.currency = currency
  if (units === 'metric' || units === 'imperial') valid.units = units
  if (theme === 'light' || theme === 'dark' || theme === 'system') valid.theme = theme
  if (matches(location, { label: 'string', source: 'string', point: { lat: 'number', lng: 'number' } }))
    valid.location = location as UserLocation
  if (typeof radiusKm === 'number' && radiusKm >= 0) valid.radiusKm = radiusKm
  if (
    matches(notifications, {
      newMessages: 'boolean',
      quoteUpdates: 'boolean',
      dealStatus: 'boolean',
      expiringDocuments: 'boolean',
      priceDrops: 'boolean',
      emailDigest: 'string',
    })
  )
    valid.notifications = notifications as UserPreferences['notifications']
  if (matches(privacy, { showReferenceCustomers: 'boolean', showDealCountPublicly: 'boolean' }))
    valid.privacy = privacy as UserPreferences['privacy']
  if (
    matches(recommendations, {
      categories: 'array',
      volumeEUR: { min: 'number', max: 'number' },
      certifications: 'array',
      preferVerified: 'boolean',
      preferPastPartners: 'boolean',
    })
  )
    valid.recommendations = recommendations as UserPreferences['recommendations']
  return valid
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
        const prev = (isRecord(s) ? s : {}) as Partial<UserPreferences>
        return {
          ...prev,
          recommendations: DEFAULT_PREFERENCES.recommendations,
          location: prev.location?.source === 'default' ? DEFAULT_LOCATION : prev.location,
        } as UserPreferences & PreferencesActions
      },
      merge: (saved, current) => ({ ...current, ...validPreferences(saved) }),
      storage: createJSONStorage(() => safeStorage),
      partialize: ({
        setLanguage: _a,
        setCurrency: _b,
        setUnits: _c,
        setTheme: _d,
        setLocation: _e,
        setRadius: _f,
        update: _g,
        reset: _h,
        ...data
      }) => data,
    },
  ),
)

/** Effective display currency: explicit choice, else the language's default. */
export function useDisplayCurrency(): CurrencyCode {
  return usePreferences((s) => s.currency ?? LANGUAGES[s.language].defaultCurrency)
}
