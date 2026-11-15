import { detectLanguage, isLanguageCode, loadTranslations } from '@/config/languages'

/**
 * Starts downloading the translations of the likely start language while the app code is still loading.
 * It only saves time: the preferences store decides the language, and a wrong guess costs one small request.
 */
export function warmUpLanguage() {
  let saved: unknown
  try {
    saved = JSON.parse(localStorage.getItem('sy-preferences') ?? 'null')?.state?.language
  } catch {
    saved = undefined
  }
  loadTranslations(isLanguageCode(saved) ? saved : detectLanguage()).catch(() => undefined)
}
