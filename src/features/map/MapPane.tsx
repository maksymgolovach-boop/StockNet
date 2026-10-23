import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, LocateFixed, RotateCcw, Search } from 'lucide-react'
import type { SearchResponse, MapPin } from '@/features/search/types'
import type { FiltersApi } from '@/features/search/useFilters'
import { useCurrency } from '@/features/currency/useCurrency'
import { useFormat } from '@/features/i18n/useFormat'
import { usePreferences } from '@/features/settings/preferencesStore'
import { Button } from '@/shared/ui/Button'
import { Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import type { MapHandle } from './MapView'
import { MapLocationSearch } from './MapLocationSearch'
import { PinCard } from './PinCard'
import { useMapViewport } from './useMapViewport'

const MapView = lazy(() => import('./MapView'))

interface MapPaneProps {
  api: FiltersApi
  data: SearchResponse | undefined
  dataReady: boolean
  fetching: boolean
  variant: 'split' | 'full' | 'mobile'
  className?: string
}

export function MapPane({ api, data, dataReady, fetching, variant, className }: MapPaneProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { short } = useCurrency()
  const location = usePreferences((s) => s.location.point)
  const handle = useRef<MapHandle | null>(null)
  const vp = useMapViewport(api, handle)
  const [initialView] = useState(() => (api.map.center && api.map.zoom !== undefined ? { center: api.map.center, zoom: api.map.zoom } : undefined))
  const fitKey = useMemo(() => JSON.stringify(api.filters), [api.filters])

  const pinText = useCallback(
    (pin: MapPin) =>
      pin.lotPrice !== null
        ? { label: short(pin.lotPrice), unit: t('lots.unit'), from: pin.count > 1 ? t('map.from') : null }
        : {
            label: pin.minPrice === null ? t('map.quote') : short(pin.minPrice),
            unit: pin.minPrice === null ? '' : t(`units.${pin.unit}`),
            from: pin.count > 1 && pin.minPrice !== null ? t('map.from') : null,
          },
    [t, short],
  )
  const pinAria = useCallback(
    (pin: MapPin) => {
      const price =
        pin.lotPrice !== null
          ? `${short(pin.lotPrice)} / ${t('lots.unit')}`
          : pin.minPrice === null
            ? t('common.priceOnRequest')
            : `${short(pin.minPrice)} / ${t(`units.${pin.unit}`)}`
      return t('map.pinAria', { name: pin.best.producer.name, price, distance: fmt.distance(pin.best.distanceKm), count: pin.count })
    },
    [t, short, fmt],
  )
  const clusterText = useCallback(
    (count: number, min: number | null, unit: string | null) => {
      const price = min === null ? null : unit ? `${short(min)} / ${t(`units.${unit}`)}` : short(min)
      return {
        short: price === null ? null : t('map.clusterFrom', { price }),
        aria: t('map.clusterAria', { count, price: price ?? '—' }),
      }
    },
    [t, short],
  )

  const pins = data?.pins ?? []

  return (
    <div className={cn('isolate overflow-hidden bg-surface-2', variant === 'mobile' && 'sy-map-mobile', className ?? 'relative')}>
      <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
        <MapView
          ref={handle}
          pins={pins}
          fitKey={fitKey}
          dataReady={dataReady}
          initialView={initialView}
          userLocation={location}
          radiusKm={api.filters.radiusKm}
          popups={variant !== 'mobile'}
          pinText={pinText}
          pinAria={pinAria}
          clusterText={clusterText}
          renderPopup={(pin) => <PinCard pin={pin} closeGap />}
          onViewport={vp.onViewport}
          inset={variant === 'full' ? [460, 72] : variant === 'mobile' ? [24, 120] : [24, 116]}
          labels={{ zoomIn: t('map.zoomIn'), zoomOut: t('map.zoomOut'), tilesFailed: t('map.tilesFailed'), you: t('map.yourLocation') }}
        />
      </Suspense>

      <div className={cn('pointer-events-none absolute inset-x-0 z-[450] flex flex-wrap items-start gap-2 p-3', variant === 'mobile' ? 'top-14' : 'top-0')}>
        {variant !== 'mobile' && (
          <div className="pointer-events-auto">
            <MapLocationSearch onPick={(p) => handle.current?.flyTo(p, 10)} />
          </div>
        )}
        <label className="pointer-events-auto flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] font-medium shadow-pop">
          <input type="checkbox" checked={vp.searchAsMove} onChange={(e) => vp.setSearchAsMove(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          {t('map.searchAsMove')}
        </label>
        {fetching && <Loader2 className="mt-2 size-5 animate-spin text-primary" aria-label={t('common.loading')} />}
      </div>

      {vp.moved && !vp.searchAsMove && (
        <div className={cn('absolute inset-x-0 z-[450] flex justify-center', variant === 'mobile' ? 'top-28' : 'top-16')}>
          <Button size="sm" onClick={vp.searchThisArea} icon={<Search className="size-3.5" aria-hidden />} className="shadow-pop">
            {t('map.searchThisArea')}
          </Button>
        </div>
      )}

      <div className={cn('absolute end-3 z-[450] flex flex-col gap-2', variant === 'mobile' ? 'bottom-[14rem]' : 'bottom-8')}>
        <Button variant="secondary" size="sm" onClick={vp.reset} icon={<RotateCcw className="size-3.5" aria-hidden />} className="shadow-pop">
          {t('map.reset')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handle.current?.flyTo(location, 9)} icon={<LocateFixed className="size-3.5" aria-hidden />} className="shadow-pop">
          {t('map.yourLocation')}
        </Button>
      </div>

    </div>
  )
}
