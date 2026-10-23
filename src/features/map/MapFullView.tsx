import { useTranslation } from 'react-i18next'
import type { SearchResponse } from '@/features/search/types'
import type { FiltersApi } from '@/features/search/useFilters'
import { ActiveFilterChips } from '@/features/search/ActiveFilterChips'
import { ResultsToolbar } from '@/features/search/ResultsToolbar'
import { Button } from '@/shared/ui/Button'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { MapPane } from './MapPane'
import { MapResultRow } from './MapResultRow'
import { MapSyncItem } from './MapSyncItem'

interface MapFullViewProps {
  api: FiltersApi
  title: string
  data: SearchResponse | undefined
  dataReady: boolean
  isPending: boolean
  fetching: boolean
  error: unknown
  onRetry: () => void
  onOpenFilters: () => void
}

/** Desktop full-map mode: the map fills the page with a floating, scrollable results panel. */
export function MapFullView({ api, title, data, dataReady, isPending, fetching, error, onRetry, onOpenFilters }: MapFullViewProps) {
  const { t } = useTranslation()
  return (
    <div className="relative h-[calc(100dvh-var(--chrome-h,8rem))] min-h-[32rem]">
      <MapPane api={api} data={data} dataReady={dataReady} fetching={fetching} variant="full" className="absolute inset-0" />
      <section
        aria-label={t('search.results')}
        className="absolute bottom-4 start-4 top-16 z-[460] flex w-[26rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-bg/95 shadow-overlay backdrop-blur"
      >
        <div className="flex flex-col gap-2 border-b border-line bg-surface p-3">
          <h1 className="font-display text-lg font-semibold">{title}</h1>
          <ResultsToolbar api={api} total={data?.total} fetching={fetching} onOpenFilters={onOpenFilters} filtersButton="always" compact />
          <ActiveFilterChips api={api} />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isPending ? (
            <LoadingRegion>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </LoadingRegion>
          ) : error ? (
            <ErrorState compact error={error} onRetry={onRetry} />
          ) : !data || data.total === 0 ? (
            <EmptyState compact title={t('search.emptyTitle')} body={t('search.emptyWithFilters')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.items.map((item, i) => (
                <li key={item.product.id}>
                  <MapSyncItem producerId={item.producer.id} first={data.items.findIndex((x) => x.producer.id === item.producer.id) === i}>
                    <MapResultRow item={item} />
                  </MapSyncItem>
                </li>
              ))}
              {data.items.length < data.total && (
                <li className="pt-1 text-center">
                  <Button variant="secondary" size="sm" onClick={api.showMore}>
                    {t('search.showMore')}
                  </Button>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
