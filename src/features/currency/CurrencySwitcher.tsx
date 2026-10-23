import { useTranslation } from 'react-i18next'
import { CURRENCY_CODES, isCurrencyCode } from '@/config/currencies'
import { usePreferences, useDisplayCurrency } from '@/features/settings/preferencesStore'
import { Select } from '@/shared/ui/Select'

export function CurrencySwitcher({ compact = true, showLabel = false }: { compact?: boolean; showLabel?: boolean }) {
  const { t } = useTranslation()
  const display = useDisplayCurrency()
  const setCurrency = usePreferences((s) => s.setCurrency)
  return (
    <Select
      label={t('header.currency')}
      hideLabel={!showLabel}
      compact={compact}
      value={display}
      onChange={(e) => isCurrencyCode(e.target.value) && setCurrency(e.target.value)}
      options={CURRENCY_CODES.map((c) => ({ value: c, label: compact && !showLabel ? c : `${c} — ${t(`currency.${c}`)}` }))}
    />
  )
}
