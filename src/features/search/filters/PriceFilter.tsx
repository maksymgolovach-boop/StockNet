import { useTranslation } from 'react-i18next'
import { getCategoryConfig } from '@/config/categories'
import { UNIT_CODES, UNITS, type UnitCode } from '@/config/units'
import { useDisplayCurrency } from '@/features/settings/preferencesStore'
import { RangeInputs } from '@/shared/ui/form'
import { Select } from '@/shared/ui/Select'
import type { FiltersApi } from '../useFilters'

const MEASURABLE = UNIT_CODES.filter((u) => (UNITS[u] as { toBase: number | null }).toBase !== null)

export function PriceFilter({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const currency = useDisplayCurrency()
  const { priceMin, priceMax, priceUnit, category } = api.filters
  const config = category ? getCategoryConfig(category) : undefined
  const units: UnitCode[] = config ? [...config.allowedUnits] : MEASURABLE
  return (
    <div className="flex flex-col gap-2">
      <RangeInputs
        min={priceMin}
        max={priceMax}
        minLabel={t('filters.min')}
        maxLabel={t('filters.max')}
        suffix={currency}
        onCommit={(a, b) => api.setFilters({ priceMin: a, priceMax: b })}
      />
      <Select
        label={t('filters.priceUnit')}
        compact
        value={priceUnit ?? ''}
        onChange={(e) => api.setFilters({ priceUnit: (e.target.value || undefined) as UnitCode | undefined })}
        options={[{ value: '', label: t('filters.perListedUnit') }, ...units.map((u) => ({ value: u, label: t('filters.perUnit', { unit: t(`units.${u}`) }) }))]}
      />
      <p className="text-xs text-ink-subtle">{t(priceUnit ? 'filters.priceUnitHint' : 'filters.priceCurrencyHint', { currency })}</p>
    </div>
  )
}
