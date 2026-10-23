import { useTranslation } from 'react-i18next'
import { SearchX } from 'lucide-react'
import { ProductCard } from '@/features/product/ProductCard'
import { MapSyncItem } from '@/features/map/MapSyncItem'
import { Button } from '@/shared/ui/Button'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import type { SearchResponse } from './types'
import type { FiltersApi } from './useFilters'
import { activeFilterCount } from './filtersCodec'

interface ResultsListProps {
  api: FiltersApi
  data: SearchResponse | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
}

const gridClass = (view: 'list' | 'grid') => (view === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3')

export function ResultsList({ api, data, isPending, error, onRetry }: ResultsListProps) {
  const { t } = useTranslation()
  const view = api.view === 'grid' ? 'grid' : 'list'
  if (isPending)
    return (
      <LoadingRegion>
        <div className={gridClass(view)}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className={view === 'grid' ? 'h-96' : 'h-44'} />
          ))}
        </div>
      </LoadingRegion>
    )
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!data || data.total === 0) {
    const hasFilters = activeFilterCount(api.filters) > 0
    return (
      <EmptyState
        icon={<SearchX className="size-5" aria-hidden />}
        title={t('search.emptyTitle')}
        body={t(hasFilters ? 'search.emptyWithFilters' : 'search.emptyBody', { query: api.filters.q })}
        action={
          hasFilters ? (
            <Button variant="secondary" size="sm" onClick={api.clearAll}>
              {t('common.clearAll')}
            </Button>
          ) : undefined
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <ul className={cn(gridClass(view))}>
        {data.items.map((item, i) => (
          <li key={item.product.id} className="flex min-w-0">
            <MapSyncItem producerId={item.producer.id} first={data.items.findIndex((x) => x.producer.id === item.producer.id) === i} className="min-w-0 flex-1">
              <ProductCard item={item} view={view} query={api.filters.q} />
            </MapSyncItem>
          </li>
        ))}
      </ul>
      {data.items.length < data.total && (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-xs text-ink-subtle">{t('search.showing', { shown: data.items.length, total: data.total })}</p>
          <Button variant="secondary" onClick={api.showMore}>
            {t('search.showMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
