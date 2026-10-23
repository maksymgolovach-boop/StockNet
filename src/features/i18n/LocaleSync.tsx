import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '@/features/settings/preferencesStore'
import { setDocumentLanguage } from './i18n'

/** Keeps i18next and <html lang> in sync with the persisted language preference. */
export function LocaleSync() {
  const { i18n } = useTranslation()
  const language = usePreferences((s) => s.language)
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language)
    setDocumentLanguage(language)
  }, [i18n, language])
  return null
}
