import { useTranslation } from 'react-i18next'
import { getCategoryConfig } from '@/config/categories'
import { NumberField, RadioChips, Switch } from '@/shared/ui/form'
import { EXPIRY_PRESETS, LEAD_TIME_PRESETS } from '../filtersCodec'
import type { FiltersApi } from '../useFilters'

export function OrderFilters({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const f = api.filters
  const unit = f.category ? getCategoryConfig(f.category)?.defaultUnit : undefined
  return (
    <div className="flex flex-col gap-3">
      <Switch checked={f.inStock} onChange={(inStock) => api.setFilters({ inStock })} label={t('filters.inStock')} />
      <Switch checked={f.deliveryAvailable} onChange={(deliveryAvailable) => api.setFilters({ deliveryAvailable })} label={t('filters.deliveryAvailable')} hint={t('filters.deliveryAvailableHint')} />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">{t('filters.minRating')}</span>
        <RadioChips
          name="rating"
          legend={t('filters.minRating')}
          value={f.minRating?.toString()}
          onChange={(v) => api.setFilters({ minRating: v === undefined ? undefined : Number(v) })}
          options={[{ value: '', label: t('filters.any') }, ...['3', '4', '4.5'].map((v) => ({ value: v, label: `${v}+ ★` }))]}
        />
      </div>
      <NumberField value={f.moqMax} label={t('filters.moqMax')} suffix={unit ? t(`units.${unit}`) : undefined} onCommit={(moqMax) => api.setFilters({ moqMax })} />
    </div>
  )
}

/** Expiry presets apply to perishables only; lead-time presets to non-perishables only. */
export function TimeFilters({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const f = api.filters
  const config = f.category ? getCategoryConfig(f.category) : undefined
  const showExpiry = !config || config.perishable
  const showLead = !config || !config.perishable
  return (
    <div className="flex flex-col gap-3">
      {showExpiry && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">{t(config ? 'filters.expiry' : 'filters.expiryPerishables')}</span>
          <RadioChips
            name="expiry"
            legend={t('filters.expiry')}
            value={f.expiry}
            onChange={(expiry) => api.setFilters({ expiry })}
            options={[{ value: '', label: t('filters.any') }, ...EXPIRY_PRESETS.map((p) => ({ value: p, label: t(`filters.expiryPresets.${p}`) }))]}
          />
        </div>
      )}
      {showLead && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">{t(config ? 'filters.leadTime' : 'filters.leadTimeNonPerishables')}</span>
          <RadioChips
            name="lead"
            legend={t('filters.leadTime')}
            value={f.leadTime}
            onChange={(leadTime) => api.setFilters({ leadTime })}
            options={[{ value: '', label: t('filters.any') }, ...LEAD_TIME_PRESETS.map((p) => ({ value: p, label: t(`filters.leadPresets.${p}`) }))]}
          />
        </div>
      )}
    </div>
  )
}
