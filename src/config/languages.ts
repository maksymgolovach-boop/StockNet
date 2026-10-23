import type { CurrencyCode } from './currencies'
import en from '@/locales/en.json'
import de from '@/locales/de.json'
import ro from '@/locales/ro.json'

export type TranslationTree = { [key: string]: string | TranslationTree }

export interface LanguageConfig {
  code: string
  nativeName: string
  intlLocale: string
  defaultCurrency: CurrencyCode
  resources: TranslationTree
}

export const LANGUAGES = {
  en: { code: 'en', nativeName: 'English', intlLocale: 'en-GB', defaultCurrency: 'EUR', resources: en },
  de: { code: 'de', nativeName: 'Deutsch', intlLocale: 'de-DE', defaultCurrency: 'EUR', resources: de },
  ro: { code: 'ro', nativeName: 'Română', intlLocale: 'ro-RO', defaultCurrency: 'RON', resources: ro },
} as const satisfies Record<string, LanguageConfig>

export type LanguageCode = keyof typeof LANGUAGES

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[]
export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES
}

export function intlLocaleOf(lang: string): string {
  return isLanguageCode(lang) ? LANGUAGES[lang].intlLocale : LANGUAGES[DEFAULT_LANGUAGE].intlLocale
}
