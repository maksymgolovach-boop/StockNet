import { useTranslation } from 'react-i18next'
import { LANGUAGES, LANGUAGE_CODES, isLanguageCode } from '@/config/languages'
import { usePreferences } from '@/features/settings/preferencesStore'
import { Select } from '@/shared/ui/Select'

export function LanguageSwitcher({ compact = true, showLabel = false }: { compact?: boolean; showLabel?: boolean }) {
  const { t } = useTranslation()
  const language = usePreferences((s) => s.language)
  const setLanguage = usePreferences((s) => s.setLanguage)
  return (
    <Select
      label={t('header.language')}
      hideLabel={!showLabel}
      compact={compact}
      value={language}
      onChange={(e) => isLanguageCode(e.target.value) && setLanguage(e.target.value)}
      options={LANGUAGE_CODES.map((code) => ({
        value: code,
        label: compact && !showLabel ? code.toUpperCase() : LANGUAGES[code].nativeName,
      }))}
      lang={language}
    />
  )
}
