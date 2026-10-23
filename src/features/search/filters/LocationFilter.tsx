import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/features/i18n/useFormat'
import { LocationPicker } from '@/features/settings/LocationPicker'
import type { FiltersApi } from '../useFilters'

/** Radius steps for the slider; index 0 = any distance. */
export const RADIUS_STEPS = [0, 5, 10, 25, 50, 100, 150, 250, 350, 500, 750, 1000]

export function LocationFilter({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const id = useId()
  const radius = api.filters.radiusKm
  const index = radius === undefined ? 0 : Math.max(0, RADIUS_STEPS.findIndex((r) => r >= radius))

  return (
    <div className="flex flex-col gap-3">
      <LocationPicker />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-radius`} className="flex justify-between text-xs text-ink-muted">
          {t('filters.radius')}
          <output htmlFor={`${id}-radius`} className="font-medium text-ink tabular">
            {radius === undefined ? t('filters.anyDistance') : fmt.distance(radius)}
          </output>
        </label>
        <input
          id={`${id}-radius`}
          type="range"
          min={0}
          max={RADIUS_STEPS.length - 1}
          step={1}
          value={index}
          aria-valuetext={radius === undefined ? t('filters.anyDistance') : fmt.distance(radius)}
          onChange={(e) => {
            const r = RADIUS_STEPS[Number(e.target.value)]
            api.setFilters({ radiusKm: r ? r : undefined })
          }}
          className="accent-[var(--primary)]"
        />
      </div>
    </div>
  )
}
