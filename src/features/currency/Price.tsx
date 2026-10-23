import { useTranslation } from 'react-i18next'
import type { CurrencyCode, UnitCode } from '@/types/models'
import { Tooltip } from '@/shared/ui/Tooltip'
import { cn } from '@/shared/lib/cn'
import { useCurrency, type FormatMoneyOptions } from './useCurrency'

interface PriceProps extends FormatMoneyOptions {
  amount: number
  currency: CurrencyCode
  unit?: UnitCode
  unitLabel?: string
  className?: string
}

/**
 * Shows a price converted to the display currency. When converted, the native listing
 * ("Listed at 820 EUR") is available on hover and keyboard focus.
 */
export function Price({ amount, currency, unit, unitLabel: customUnit, className, ...opts }: PriceProps) {
  const { t } = useTranslation()
  const { present } = useCurrency()
  const { text, original, converted } = present(amount, currency, opts)
  const unitLabel = customUnit ?? (unit ? t(`units.${unit}`) : null)
  const label = unitLabel ? t('common.perUnit', { price: text, unit: unitLabel }) : text
  const listed = unitLabel ? t('common.perUnit', { price: original, unit: unitLabel }) : original

  if (!converted) return <span className={cn('tabular', className)}>{label}</span>
  return (
    <Tooltip content={t('common.listedAt', { price: listed })}>
      <span
        tabIndex={0}
        className={cn('tabular cursor-help underline decoration-line-strong decoration-dotted underline-offset-4', className)}
      >
        {label}
      </span>
    </Tooltip>
  )
}
