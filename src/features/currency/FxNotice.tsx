import { useTranslation } from 'react-i18next'
import { CURRENCY_CODES } from '@/config/currencies'
import { useFormat } from '@/features/i18n/useFormat'
import { Skeleton } from '@/shared/ui/states'
import { useCurrency } from './useCurrency'

/** "Indicative rates, updated …" plus the current EUR-based rates. */
export function FxNotice() {
  const { t } = useTranslation()
  const { rates, isPending, isError } = useCurrency()
  const fmt = useFormat()
  if (isPending) return <Skeleton className="h-4 w-56" />
  if (isError || !rates) return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      <span>{t('fx.indicative', { time: fmt.dateTime(rates.updatedAt) })}</span>
      {CURRENCY_CODES.filter((c) => c !== rates.base).map((c) => (
        <span key={c} className="tabular">
          {t('fx.rate', { base: rates.base, rate: fmt.number(rates.rates[c], { maximumFractionDigits: 4 }), quote: c })}
        </span>
      ))}
    </div>
  )
}
