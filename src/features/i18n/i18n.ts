import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  isLanguageCode,
  loadTranslations,
  loadedTranslations,
  type LanguageCode,
} from '@/config/languages'

const reported = new Set<string>()

/** Downloads a language's translations (once) and registers them with i18next. */
export async function loadLanguage(code: LanguageCode) {
  const tree = await loadTranslations(code)
  if (i18n.isInitialized && !i18n.hasResourceBundle(code, 'translation'))
    i18n.addResourceBundle(code, 'translation', tree, true, true)
}

/**
 * Starts i18next with only the initial language, so the first render does not wait for the others. The remaining
 * languages (English is the fallback for missing keys) are fetched once the browser is idle.
 */
export async function initI18n(initial: LanguageCode) {
  if (i18n.isInitialized) return i18n
  await loadTranslations(initial)
  await i18n.use(initReactI18next).init({
    resources: Object.fromEntries([...loadedTranslations()].map(([code, translation]) => [code, { translation }])),
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
  const later = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 2000))
  later(() => {
    const all = Promise.all(LANGUAGE_CODES.map(loadLanguage))
    if (import.meta.env.DEV) void all.then(reportMissingTranslations)
  })
  return i18n
}

/** Dev-time parity check: every key present in English must exist in every other language. */
function reportMissingTranslations() {
  const flatten = (tree: object, prefix = ''): string[] =>
    Object.entries(tree).flatMap(([k, v]) =>
      typeof v === 'string' ? [`${prefix}${k}`] : flatten(v as object, `${prefix}${k}.`),
    )
  const strip = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '')
  const base = new Set(flatten(loadedTranslations().get(DEFAULT_LANGUAGE) ?? {}).map(strip))
  for (const code of LANGUAGE_CODES) {
    if (code === DEFAULT_LANGUAGE) continue
    const keys = new Set(flatten(loadedTranslations().get(code) ?? {}).map(strip))
    const missing = [...base].filter((k) => !keys.has(k))
    if (missing.length)
      console.warn(`[i18n] ${code} is missing ${missing.length} keys (English fallback used):`, missing)
  }
}

export function setDocumentLanguage(lang: string) {
  if (typeof document !== 'undefined' && isLanguageCode(lang)) document.documentElement.lang = lang
}

export default i18n
