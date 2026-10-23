import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Map as MapIcon } from 'lucide-react'
import { NotFoundPage } from '@/app/NotFoundPage'
import { getCategory } from '@/config/categories'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { MapFullView } from '@/features/map/MapFullView'
import { MapPane } from '@/features/map/MapPane'
import { MobileMapView } from '@/features/map/MobileMapView'
import { Breadcrumbs, type Crumb } from '@/shared/ui/Breadcrumbs'
import { Button } from '@/shared/ui/Button'
import { useIsDesktop } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'
import { ActiveFilterChips } from './ActiveFilterChips'
import { FilterPanel } from './filters/FilterPanel'
import { FiltersDrawer } from './FiltersDrawer'
import { ResultsList } from './ResultsList'
import { ResultsToolbar } from './ResultsToolbar'
import { useFilters } from './useFilters'
import { useSearchResults } from './useSearchResults'

/** Shared by /search and /category/:slug. Layout depends on the view (list+map, grid, map) and viewport. */
export function SearchPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const api = useFilters()
  const desktop = useIsDesktop()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cat = useCategoryConfig(api.filters.category)
  const query = useSearchResults({ filters: api.filters, sort: api.sort, limit: api.limit, bounds: api.map.bounds })
  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = query
  const dataReady = !!data && !isPlaceholderData

  if (slug && !getCategory(slug)) return <NotFoundPage />

  const crumbs: Crumb[] = [
    { label: t('nav.home'), to: '/' },
    ...(api.filters.category ? cat.path.map((p) => ({ label: p.name, to: `/category/${p.slug}` })) : [{ label: t('pages.search') }]),
  ]
  const title = api.filters.category ? cat.name : api.filters.q ? t('search.resultsFor', { query: api.filters.q }) : t('search.allProducts')
  const drawer = <FiltersDrawer api={api} data={data} open={filtersOpen} onClose={() => setFiltersOpen(false)} side={desktop ? 'start' : 'bottom'} />

  if (api.view === 'map' && desktop)
    return (
      <>
        <MapFullView api={api} title={title} data={data} dataReady={dataReady} isPending={isPending} fetching={isFetching} error={error} onRetry={() => void refetch()} onOpenFilters={() => setFiltersOpen(true)} />
        {drawer}
      </>
    )

  const split = desktop && api.view === 'list'
  return (
    <div className="mx-auto flex max-w-[110rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={crumbs} />
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {api.filters.category && api.filters.q && <p className="text-sm text-ink-muted">{t('search.resultsFor', { query: api.filters.q })}</p>}
      </div>
      <div
        className={cn(
          'grid gap-6',
          split ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] xl:grid-cols-[16rem_minmax(0,1fr)_minmax(0,0.85fr)]' : 'lg:grid-cols-[17.5rem_1fr]',
        )}
      >
        <aside aria-label={t('filters.title')} className={cn('hidden', split ? 'xl:block' : 'lg:block')}>
          <div className="sticky top-[calc(var(--header-h,8rem)+1rem)] max-h-[calc(100dvh-var(--header-h,8rem)-2rem)] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface px-4">
            <FilterPanel api={api} facets={data?.facets} />
          </div>
        </aside>
        <section aria-label={t('search.results')} className="flex min-w-0 flex-col gap-3 overflow-x-clip [overflow-clip-margin:6px]">
          <ResultsToolbar api={api} total={data?.total} fetching={isFetching} onOpenFilters={() => setFiltersOpen(true)} filtersButton={split ? 'belowXl' : 'mobile'} />
          <ActiveFilterChips api={api} />
          <ResultsList api={api} data={data} isPending={isPending} error={error} onRetry={() => void refetch()} />
        </section>
        {split && (
          <div className="sticky top-[calc(var(--header-h,8rem)+1rem)] h-[calc(100dvh-var(--header-h,8rem)-2rem)] overflow-hidden rounded-[var(--radius-card)] border border-line">
            <MapPane api={api} data={data} dataReady={dataReady} fetching={isFetching} variant="split" className="relative h-full" />
          </div>
        )}
      </div>
      {!desktop && api.view !== 'map' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[600] flex justify-center">
          <Button onClick={() => api.setView('map')} icon={<MapIcon className="size-4" aria-hidden />} className="pointer-events-auto rounded-full px-5 shadow-overlay">
            {t('map.showMap')}
          </Button>
        </div>
      )}
      {!desktop && api.view === 'map' && <MobileMapView api={api} data={data} dataReady={dataReady} fetching={isFetching} onOpenFilters={() => setFiltersOpen(true)} />}
      {drawer}
    </div>
  )
}
