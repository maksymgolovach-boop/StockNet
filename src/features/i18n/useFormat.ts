import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { intlLocaleOf, isLanguageCode, DEFAULT_LANGUAGE, type LanguageCode } from '@/config/languages'
import { UNITS, type UnitCode } from '@/config/units'
import { usePreferences } from '@/features/settings/preferencesStore'
import { liveNow } from '@/shared/lib/dates'

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** Locale-aware formatting through Intl, bound to the active language and units system. */
export function useFormat() {
  const { t, i18n } = useTranslation()
  const units = usePreferences((s) => s.units)
  const lang: LanguageCode = isLanguageCode(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
  const locale = intlLocaleOf(lang)

  return useMemo(() => {
    const number = (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(value)
    const unitLabel = (unit: string) => t(`units.${unit}`, { defaultValue: unit })

    return {
      lang,
      locale,
      number,
      percent: (ratio: number, digits = 0) => number(ratio, { style: 'percent', maximumFractionDigits: digits }),
      date: (iso: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(iso)),
      dateTime: (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)),
      relative: (iso: string) => {
        const seconds = (new Date(iso).getTime() - liveNow().getTime()) / 1000
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
        for (const [unit, size] of RELATIVE_STEPS) {
          if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
        }
        return rtf.format(Math.round(seconds / 60), 'minute')
      },
      list: (items: string[], type: Intl.ListFormatType = 'conjunction') => new Intl.ListFormat(locale, { style: 'long', type }).format(items),
      region: (code: string) => new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code,
      unitLabel,
      /** Distance in km or miles depending on the units preference. */
      distance: (km: number) => {
        const value = units === 'imperial' ? km * 0.621371 : km
        const label = unitLabel(units === 'imperial' ? 'mi' : 'km')
        return `${number(value, { maximumFractionDigits: value < 10 ? 1 : 0 })} ${label}`
      },
      /** Quantity in the product's native unit, with an imperial equivalent appended when relevant. */
      quantity: (qty: number, unit: UnitCode, { withImperial = true } = {}) => {
        const native = `${number(qty, { maximumFractionDigits: 2 })} ${unitLabel(unit)}`
        const imperial = (UNITS[unit] as { imperial?: { unit: string; factor: number } }).imperial
        if (units !== 'imperial' || !withImperial || !imperial) return native
        return `${native} (≈ ${number(qty * imperial.factor, { maximumFractionDigits: 1 })} ${unitLabel(imperial.unit)})`
      },
    }
  }, [locale, lang, t, units])
}

export type Formatter = ReturnType<typeof useFormat>
