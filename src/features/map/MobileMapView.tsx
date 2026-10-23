import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { List, SlidersHorizontal } from 'lucide-react'
import type { SearchResponse } from '@/features/search/types'
import type { FiltersApi } from '@/features/search/useFilters'
import { activeFilterCount } from '@/features/search/filtersCodec'
import { Button } from '@/shared/ui/Button'
import { MapPane } from './MapPane'
import { PinCard } from './PinCard'
import { useMapUi } from './mapUiStore'

interface MobileMapViewProps {
  api: FiltersApi
  data: SearchResponse | undefined
  dataReady: boolean
  fetching: boolean
  onOpenFilters: () => void
}

/** Full-screen mobile map with a snapping card carousel kept in sync with the pins. */
export function MobileMapView({ api, data, dataReady, fetching, onOpenFilters }: MobileMapViewProps) {
  const { t } = useTranslation()
  const track = useRef<HTMLUListElement>(null)
  const select = useMapUi((s) => s.select)
  const selectedId = useMapUi((s) => s.selectedProducerId)
  const source = useMapUi((s) => s.selectionSource)
  const pins = useMemo(() => [...(data?.pins ?? [])].sort((a, b) => a.best.distanceKm - b.best.distanceKm), [data?.pins])
  const count = activeFilterCount(api.filters)

  useEffect(() => {
    if (!selectedId || source === 'carousel') return
    track.current?.querySelector<HTMLElement>(`[data-pin="${selectedId}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedId, source])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const mid = el.getBoundingClientRect().left + el.clientWidth / 2
        let best: { id: string; d: number } | null = null
        for (const card of el.querySelectorAll<HTMLElement>('[data-pin]')) {
          const r = card.getBoundingClientRect()
          const d = Math.abs(r.left + r.width / 2 - mid)
          if (!best || d < best.d) best = { id: card.dataset.pin ?? '', d }
        }
        if (best && best.id !== useMapUi.getState().selectedProducerId) select(best.id, 'carousel')
      }, 160)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
    }
  }, [select, pins])

  return (
    <div role="dialog" aria-modal="true" aria-label={t('search.views.map')} className="fixed inset-0 z-[950] bg-bg">
      <MapPane api={api} data={data} dataReady={dataReady} fetching={fetching} variant="mobile" className="absolute inset-0" />
      <div className="absolute inset-x-0 top-0 z-[460] flex items-center gap-2 p-3">
        <Button variant="secondary" size="sm" onClick={() => api.setView('list')} icon={<List className="size-4" aria-hidden />} className="shadow-pop">
          {t('map.showList')}
        </Button>
        <span className="rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium shadow-pop tabular" role="status">
          {t('search.resultCount', { count: data?.total ?? 0 })}
        </span>
        <Button variant="secondary" size="sm" onClick={onOpenFilters} icon={<SlidersHorizontal className="size-4" aria-hidden />} className="ms-auto shadow-pop">
          {t('filters.title')}
          {count > 0 && <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] text-on-primary">{count}</span>}
        </Button>
      </div>
      <ul
        ref={track}
        aria-label={t('search.results')}
        className="absolute inset-x-0 bottom-0 z-[460] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[7.5vw] pb-4 pt-2 [scrollbar-width:none]"
      >
        {pins.map((pin) => (
          <li key={pin.producerId} data-pin={pin.producerId} className="w-[85vw] max-w-sm shrink-0 snap-center">
            <PinCard
              pin={pin}
              className={`overflow-hidden rounded-[var(--radius-card)] border shadow-overlay ${selectedId === pin.producerId ? 'border-primary' : 'border-line'}`}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
