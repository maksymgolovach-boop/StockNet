import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { getCategory } from '@/config/categories'
import type { FacetCount } from '../types'
import type { FiltersApi } from '../useFilters'

export function CategoryFilter({ api, facets }: { api: FiltersApi; facets: FacetCount[] }) {
  const { t } = useTranslation()
  const current = api.filters.category ? getCategory(api.filters.category) : undefined
  const up = current?.parentSlug ?? undefined
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      {current && (
        <>
          <button type="button" onClick={() => api.setFilters({ category: up })} className="flex min-h-8 items-center gap-1 rounded px-1 text-ink-muted hover:bg-surface-2 hover:text-ink">
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            {up ? t(`categories.${up}`) : t('nav.allCategories')}
          </button>
          <p className="px-1 py-1 font-semibold" aria-current="true">
            {t(`categories.${current.slug}`)}
          </p>
        </>
      )}
      <ul className={current ? 'ms-3 border-s border-line ps-2' : ''}>
        {facets.map((f) => (
          <li key={f.value}>
            <button
              type="button"
              disabled={f.count === 0}
              onClick={() => api.setFilters({ category: f.value })}
              className="flex min-h-8 w-full items-center justify-between gap-2 rounded px-1 text-start hover:bg-surface-2 hover:text-primary disabled:pointer-events-none disabled:opacity-45"
            >
              <span>{t(`categories.${f.value}`)}</span>
              <span className="text-xs text-ink-subtle tabular">{f.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
