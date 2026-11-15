import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '@/features/settings/preferencesStore'
import { loadLanguage, setDocumentLanguage } from './i18n'

/** Keeps i18next and <html lang> in sync with the persisted language preference. */
export function LocaleSync() {
  const { i18n } = useTranslation()
  const language = usePreferences((s) => s.language)
  useEffect(() => {
    if (i18n.language === language) {
      setDocumentLanguage(language)
      return
    }
    let current = true
    void loadLanguage(language).then(() => {
      if (!current) return
      void i18n.changeLanguage(language)
      setDocumentLanguage(language)
    })
    return () => {
      current = false
    }
  }, [i18n, language])
  return null
}
