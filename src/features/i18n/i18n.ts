import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_CODES, isLanguageCode, type LanguageCode } from '@/config/languages'

const resources = Object.fromEntries(LANGUAGE_CODES.map((code) => [code, { translation: LANGUAGES[code].resources }]))

const reported = new Set<string>()

export function initI18n(initial: LanguageCode) {
  if (i18n.isInitialized) return i18n
  void i18n.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGE_CODES,
    interpolation: { escapeValue: false },
    returnNull: false,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, _ns, key) => {
      const id = `${lngs.join(',')}:${key}`
      if (reported.has(id)) return
      reported.add(id)
      console.warn(`[i18n] missing key "${key}" for ${lngs.join(', ')} — falling back to ${DEFAULT_LANGUAGE}`)
    },
    react: { useSuspense: false },
  })
  if (import.meta.env.DEV) reportMissingTranslations()
  return i18n
}

/** Dev-time parity check: every key present in English must exist in every other language. */
function reportMissingTranslations() {
  const flatten = (tree: object, prefix = ''): string[] =>
    Object.entries(tree).flatMap(([k, v]) =>
      typeof v === 'string' ? [`${prefix}${k}`] : flatten(v as object, `${prefix}${k}.`),
    )
  const strip = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '')
  const base = new Set(flatten(LANGUAGES[DEFAULT_LANGUAGE].resources).map(strip))
  for (const code of LANGUAGE_CODES) {
    if (code === DEFAULT_LANGUAGE) continue
    const keys = new Set(flatten(LANGUAGES[code].resources).map(strip))
    const missing = [...base].filter((k) => !keys.has(k))
    if (missing.length) console.warn(`[i18n] ${code} is missing ${missing.length} keys (English fallback used):`, missing)
  }
}

export function setDocumentLanguage(lang: string) {
  if (typeof document !== 'undefined' && isLanguageCode(lang)) document.documentElement.lang = lang
}

export default i18n
