import type { CurrencyCode } from './currencies'

export type TranslationTree = { [key: string]: string | TranslationTree }

export interface LanguageConfig {
  code: string
  nativeName: string
  intlLocale: string
  defaultCurrency: CurrencyCode
  /** Fetches the translations on demand, so a visitor only downloads the language they use. */
  load: () => Promise<TranslationTree>
}

export const LANGUAGES = {
  en: {
    code: 'en',
    nativeName: 'English',
    intlLocale: 'en-GB',
    defaultCurrency: 'EUR',
    load: () => import('@/locales/en.json').then((m) => m.default),
  },
  de: {
    code: 'de',
    nativeName: 'Deutsch',
    intlLocale: 'de-DE',
    defaultCurrency: 'EUR',
    load: () => import('@/locales/de.json').then((m) => m.default),
  },
  ro: {
    code: 'ro',
    nativeName: 'Română',
    intlLocale: 'ro-RO',
    defaultCurrency: 'RON',
    load: () => import('@/locales/ro.json').then((m) => m.default),
  },
} as const satisfies Record<string, LanguageConfig>

export type LanguageCode = keyof typeof LANGUAGES

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[]
export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES
}

const loaded = new Map<LanguageCode, TranslationTree>()

/** Downloads a language's translations once; later calls return the same tree. */
export async function loadTranslations(code: LanguageCode): Promise<TranslationTree> {
  const cached = loaded.get(code)
  if (cached) return cached
  const tree: TranslationTree = await LANGUAGES[code].load()
  loaded.set(code, tree)
  return tree
}

/** The translations downloaded so far. The search index reads category names from every one of them. */
export const loadedTranslations = (): ReadonlyMap<LanguageCode, TranslationTree> => loaded

/** The first browser language the platform supports, else the default. */
export function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase()
    if (isLanguageCode(base)) return base
  }
  return DEFAULT_LANGUAGE
}

export function intlLocaleOf(lang: string): string {
  return isLanguageCode(lang) ? LANGUAGES[lang].intlLocale : LANGUAGES[DEFAULT_LANGUAGE].intlLocale
}
