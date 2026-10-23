import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react'
import type { SortOption } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import { Select } from '@/shared/ui/Select'
import { cn } from '@/shared/lib/cn'
import { SORT_OPTIONS, activeFilterCount } from './filtersCodec'
import type { FiltersApi } from './useFilters'

interface ResultsToolbarProps {
  api: FiltersApi
  total: number | undefined
  fetching: boolean
  onOpenFilters: () => void
  /** where the "Filters" button is visible: below lg, below xl, or always */
  filtersButton?: 'mobile' | 'belowXl' | 'always'
  compact?: boolean
}

export function ResultsToolbar({ api, total, fetching, onOpenFilters, filtersButton = 'mobile', compact = false }: ResultsToolbarProps) {
  const { t } = useTranslation()
  const perishableOrAny = !api.filters.category || getCategoryConfig(api.filters.category)?.perishable
  const sorts = SORT_OPTIONS.filter((s) => s !== 'expiry' || perishableOrAny)
  const count = activeFilterCount(api.filters)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className={cn('me-auto text-sm text-ink-muted transition-opacity', fetching && 'opacity-60')} role="status" aria-live="polite">
        {total === undefined ? t('common.loading') : t(api.map.bounds ? 'map.inArea' : 'search.resultCount', { count: total })}
      </p>
      <button
        type="button"
        onClick={onOpenFilters}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-[0.8125rem] font-medium',
          filtersButton === 'mobile' && 'lg:hidden',
          filtersButton === 'belowXl' && 'xl:hidden',
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {t('filters.title')}
        {count > 0 && <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] text-on-primary tabular">{count}</span>}
      </button>
      <Select
        label={t('search.sortBy')}
        hideLabel
        compact
        value={api.sort}
        onChange={(e) => api.setSort(e.target.value as SortOption)}
        options={sorts.map((s) => ({ value: s, label: compact ? t(`search.sort.${s}`) : `${t('search.sortBy')}: ${t(`search.sort.${s}`)}` }))}
      />
      <div role="radiogroup" aria-label={t('search.view')} className="flex rounded-[var(--radius-control)] border border-line-strong bg-surface p-0.5">
        {(['list', 'grid', 'map'] as const).map((v) => {
          const Icon = v === 'list' ? List : v === 'grid' ? LayoutGrid : MapIcon
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={api.view === v}
              aria-label={t(`search.views.${v}`)}
              title={t(`search.views.${v}`)}
              onClick={() => api.setView(v)}
              className={cn('grid size-7 place-items-center rounded', api.view === v ? 'bg-ink text-bg' : 'text-ink-muted hover:bg-surface-2')}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
