import { useMemo } from 'react'
import type { CurrencyCode, ExchangeRates } from '@/types/models'
import { CURRENCIES, type CurrencyConfig } from '@/config/currencies'
import { useFormat } from '@/features/i18n/useFormat'
import { useDisplayCurrency } from '@/features/settings/preferencesStore'
import { convertAmount } from '@/services/fxService'
import { useFxRates } from '@/services/queries'

export interface FormatMoneyOptions {
  compact?: boolean
  /** use a short symbol display (e.g. "lei") for space-constrained labels like map pins */
  narrow?: boolean
}

/** Display currency, live (mock) FX rates, conversion and Intl formatting in the active locale. */
export function useCurrency() {
  const display = useDisplayCurrency()
  const { data: rates, isPending, isError } = useFxRates()
  const { locale } = useFormat()

  return useMemo(() => {
    const format = (amount: number, currency: CurrencyCode, opts: FormatMoneyOptions = {}) => {
      const config = CURRENCIES[currency]
      const decimals = opts.compact ? config.compactDecimals : config.decimals
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: opts.narrow ? 'narrowSymbol' : 'symbol',
        minimumFractionDigits: amount < 10 && opts.compact ? 2 : decimals,
        maximumFractionDigits: amount < 10 && opts.compact ? 2 : decimals,
      }).format(amount)
    }
    const convert = (amount: number, from: CurrencyCode, to: CurrencyCode = display, r: ExchangeRates | undefined = rates) =>
      from === to ? amount : r ? convertAmount(amount, from, to, r) : null

    /** Compact label for map pins: "€790", "3.900 lei", "$1,250". */
    const short = (amount: number, currency: CurrencyCode = display) => {
      const digits = amount < 10 ? 2 : amount < 100 ? 1 : 0
      const local = (CURRENCIES[currency] as CurrencyConfig).localSymbol
      if (local) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: amount < 10 ? 2 : 0 }).format(amount)} ${local}`
      return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: digits, minimumFractionDigits: amount < 10 ? 2 : 0 }).format(amount)
    }

    return {
      display,
      short,
      rates,
      ready: rates !== undefined,
      isPending,
      isError,
      convert,
      format,
      /**
       * Formats an amount in the display currency when rates are available, falling back to the
       * original currency. `original` is always the listing in its native currency.
       */
      present: (amount: number, from: CurrencyCode, opts: FormatMoneyOptions = {}) => {
        const converted = convert(amount, from)
        const original = format(amount, from, opts)
        if (converted === null || from === display) return { text: original, original, converted: false }
        return { text: format(converted, display, opts), original, converted: true }
      },
    }
  }, [display, rates, isPending, isError, locale])
}
