import { useCallback, useRef, useState, type RefObject } from 'react'
import type { FiltersApi } from '@/features/search/useFilters'
import type { MapHandle, ViewportEvent } from './MapView'

const same = (a: number | undefined, b: number, digits = 4) => a !== undefined && a.toFixed(digits) === b.toFixed(digits)

/**
 * Glue between the map and the URL: center/zoom are mirrored to the query string (replace),
 * "search as I move" applies the visible bounds automatically, otherwise a
 * "Search this area" button appears after the user pans or zooms.
 */
export function useMapViewport(api: FiltersApi, handle: RefObject<MapHandle | null>) {
  const [moved, setMoved] = useState(false)
  const [visiblePins, setVisiblePins] = useState<number | null>(null)
  const latest = useRef(api)
  latest.current = api

  const onViewport = useCallback((e: ViewportEvent) => {
    const { map, setMap } = latest.current
    setVisiblePins(e.visiblePins)
    const unchanged = same(map.center?.lat, e.center.lat) && same(map.center?.lng, e.center.lng) && map.zoom === e.zoom
    if (e.userInitiated && map.searchAsMove) {
      setMap({ center: e.center, zoom: e.zoom, bounds: e.bounds })
      setMoved(false)
      return
    }
    if (e.userInitiated) setMoved(true)
    if (!unchanged) setMap({ center: e.center, zoom: e.zoom })
  }, [])

  const searchThisArea = useCallback(() => {
    const bounds = handle.current?.getBounds()
    if (!bounds) return
    latest.current.setMap({ bounds }, { replace: false })
    setMoved(false)
  }, [handle])

  const setSearchAsMove = useCallback(
    (on: boolean) => {
      const bounds = on ? handle.current?.getBounds() ?? undefined : undefined
      latest.current.setMap({ searchAsMove: on, bounds })
      setMoved(false)
    },
    [handle],
  )

  const reset = useCallback(() => {
    latest.current.setMap({ bounds: undefined })
    handle.current?.fitAll()
    setMoved(false)
  }, [handle])

  return {
    center: api.map.center,
    zoom: api.map.zoom,
    bounds: api.map.bounds,
    searchAsMove: api.map.searchAsMove,
    moved,
    visiblePins,
    onViewport,
    searchThisArea,
    setSearchAsMove,
    reset,
  }
}
