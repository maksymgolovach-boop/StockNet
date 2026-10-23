import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { getCategoryConfig } from '@/config/categories'
import { useDisplayCurrency } from '@/features/settings/preferencesStore'
import { Checkbox, NumberField, RadioChips, RangeInputs, Switch } from '@/shared/ui/form'
import { LOT_CONDITIONS, SALE_MODE_FILTERS } from '../filtersCodec'
import type { SearchResponse } from '../types'
import type { FiltersApi } from '../useFilters'

export function LotFilters({ api, counts }: { api: FiltersApi; counts: SearchResponse['facets']['saleModes'] | undefined }) {
  const { t } = useTranslation()
  const currency = useDisplayCurrency()
  const id = useId()
  const f = api.filters
  const unit = f.category ? getCategoryConfig(f.category)?.defaultUnit : undefined
  const dateInput = 'h-9 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-2 text-sm'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">{t('lots.filters.saleMode')}</span>
        <RadioChips
          name="saleMode"
          legend={t('lots.filters.saleMode')}
          value={f.saleMode}
          onChange={(saleMode) => api.setFilters({ saleMode })}
          options={[
            { value: '', label: t('filters.any') },
            ...SALE_MODE_FILTERS.map((m) => ({ value: m, label: counts ? `${t(`lots.saleModes.${m}`)} (${counts[m]})` : t(`lots.saleModes.${m}`) })),
          ]}
        />
      </div>
      <RangeInputs
        min={f.lotPriceMin}
        max={f.lotPriceMax}
        minLabel={t('lots.filters.lotPriceMin')}
        maxLabel={t('lots.filters.lotPriceMax')}
        suffix={currency}
        onCommit={(lotPriceMin, lotPriceMax) => api.setFilters({ lotPriceMin, lotPriceMax })}
      />
      {unit && (
        <RangeInputs
          min={f.lotSizeMin}
          max={f.lotSizeMax}
          minLabel={t('lots.filters.lotSizeMin')}
          maxLabel={t('lots.filters.lotSizeMax')}
          suffix={t(`units.${unit}`)}
          onCommit={(lotSizeMin, lotSizeMax) => api.setFilters({ lotSizeMin, lotSizeMax })}
        />
      )}
      <NumberField value={f.lotsAvailableMin} label={t('lots.filters.lotsAvailable')} suffix={t('lots.unit')} onCommit={(lotsAvailableMin) => api.setFilters({ lotsAvailableMin })} />
      <Switch checked={f.indivisibleOnly} onChange={(indivisibleOnly) => api.setFilters({ indivisibleOnly })} label={t('lots.filters.indivisibleOnly')} hint={t('lots.filters.indivisibleHint')} />
      <fieldset className="flex flex-col gap-0.5">
        <legend className="mb-1 text-xs text-ink-muted">{t('lots.filters.condition')}</legend>
        {LOT_CONDITIONS.map((c) => (
          <Checkbox
            key={c}
            checked={f.lotConditions.includes(c)}
            onChange={(on) => api.setFilters({ lotConditions: on ? [...f.lotConditions, c] : f.lotConditions.filter((x) => x !== c) })}
            label={t(`lots.conditions.${c}`)}
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs text-ink-muted">{t('lots.filters.produced')}</legend>
        <div className="flex gap-2">
          <label htmlFor={`${id}-from`} className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-muted">
            {t('lots.filters.from')}
            <input id={`${id}-from`} type="date" value={f.producedFrom ?? ''} max={f.producedTo} onChange={(e) => api.setFilters({ producedFrom: e.target.value || undefined })} className={dateInput} />
          </label>
          <label htmlFor={`${id}-to`} className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-ink-muted">
            {t('lots.filters.to')}
            <input id={`${id}-to`} type="date" value={f.producedTo ?? ''} min={f.producedFrom} onChange={(e) => api.setFilters({ producedTo: e.target.value || undefined })} className={dateInput} />
          </label>
        </div>
      </fieldset>
    </div>
  )
}
