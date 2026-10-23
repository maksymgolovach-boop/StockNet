import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import type { GeoBounds, GeoPoint } from '@/types/models'
import type { MapPin } from '@/features/search/types'
import { useSaved } from '@/features/saved/savedStore'
import { cn } from '@/shared/lib/cn'
import { useMapUi } from './mapUiStore'
import { applyPinState, clusterIcon, pinIcon, pinKey, type PinContent, type PinState } from './pinIcons'

export interface MapHandle {
  flyTo: (point: GeoPoint, zoom?: number) => void
  zoomOut: () => void
  fitAll: () => void
  getBounds: () => GeoBounds | null
}

export interface ViewportEvent {
  center: GeoPoint
  zoom: number
  bounds: GeoBounds
  visiblePins: number
  userInitiated: boolean
}

export interface PinText {
  label: string
  unit: string
  from: string | null
}

export interface MapViewProps {
  pins: MapPin[]
  /** changes on every new search / filter change → the map auto-fits once */
  fitKey: string
  dataReady: boolean
  initialView?: { center: GeoPoint; zoom: number }
  userLocation: GeoPoint
  radiusKm?: number
  popups: boolean
  pinText: (pin: MapPin) => PinText
  pinAria: (pin: MapPin) => string
  clusterText: (count: number, minPrice: number | null, unit: string | null) => { short: string | null; aria: string }
  renderPopup: (pin: MapPin) => ReactNode
  onViewport: (e: ViewportEvent) => void
  labels: { zoomIn: string; zoomOut: string; tilesFailed: string; you: string }
  /** extra top-left padding (px) when a floating panel covers part of the map */
  inset?: [number, number]
  ref?: Ref<MapHandle>
}

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const markerIds = new WeakMap<L.Marker, string>()
const toBounds = (b: L.LatLngBounds): GeoBounds => ({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })

export default function MapView(props: MapViewProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const markers = useRef(new Map<string, L.Marker>())
  const iconKeys = useRef(new Map<string, string>())
  const pinById = useRef(new Map<string, MapPin>())
  const latest = useRef(props)
  const programmatic = useRef(false)
  const userMoved = useRef(false)
  /** once the user pans or zooms, new searches no longer move the map */
  const userControlled = useRef(false)
  const fitted = useRef<string | null>(props.initialView ? props.fitKey : null)
  const popupId = useRef<string | null>(null)
  const [tilesFailed, setTilesFailed] = useState(false)
  const popupEl = useMemo(() => document.createElement('div'), [])
  const popup = useMemo(() => L.popup({ className: 'sy-popup', offset: [0, -30], minWidth: 248, maxWidth: 248, autoPanPaddingTopLeft: [24, 72], autoPanPaddingBottomRight: [24, 24] }).setContent(popupEl), [popupEl])
  const selectedId = useMapUi((s) => s.selectedProducerId)

  useLayoutEffect(() => {
    latest.current = props
  })

  const content = (id: string): PinContent | null => {
    const pin = pinById.current.get(id)
    if (!pin) return null
    return {
      ...latest.current.pinText(pin),
      count: pin.count,
      verified: pin.best.producer.verification === 'verified' || pin.best.producer.verification === 'audited',
      saved: useSaved.getState().producerIds.includes(id),
      partner: pin.best.pastPartnerDeals > 0,
    }
  }
  const state = (id: string): PinState => {
    const ui = useMapUi.getState()
    return { hovered: ui.hoveredProducerId === id, selected: ui.selectedProducerId === id, visited: ui.visitedProducerIds.includes(id) }
  }
  const decorate = (id: string, m: L.Marker) => {
    const s = state(id)
    const el = m.getElement()
    applyPinState(el, s)
    el?.setAttribute('aria-pressed', String(s.selected))
    m.setZIndexOffset(s.selected ? 2000 : s.hovered ? 1000 : 0)
  }
  const refresh = (id: string | null) => {
    const m = id ? markers.current.get(id) : undefined
    const c = id ? content(id) : null
    if (!m || !c || !id) return
    const key = pinKey(c)
    if (iconKeys.current.get(id) !== key) {
      iconKeys.current.set(id, key)
      m.setIcon(pinIcon(c))
    }
    decorate(id, m)
  }
  /** When a hovered/selected marker sits inside a cluster, highlight the cluster instead. */
  const markClusters = () => {
    const cluster = clusterRef.current
    const ui = useMapUi.getState()
    document.querySelectorAll('.sy-cluster.is-hovered').forEach((el) => el.classList.remove('is-hovered'))
    for (const id of [ui.hoveredProducerId, ui.selectedProducerId]) {
      const m = id ? markers.current.get(id) : undefined
      if (!cluster || !m || !cluster.hasLayer(m)) continue
      const parent = cluster.getVisibleParent(m)
      if (parent && parent !== m) parent.getElement()?.querySelector('.sy-cluster')?.classList.add('is-hovered')
    }
  }
  const refreshAll = () => {
    for (const id of markers.current.keys()) refresh(id)
    clusterRef.current?.refreshClusters()
  }
  const move = (fn: (map: L.Map) => void) => {
    const map = mapRef.current
    if (!map) return
    programmatic.current = true
    fn(map)
  }
  const firstFit = useRef(true)
  const fitAll = () =>
    move((map) => {
      const pts = [...pinById.current.values()].map((p) => L.latLng(p.location.lat, p.location.lng))
      const instant = firstFit.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      firstFit.current = false
      if (pts.length === 1 && pts[0]) {
        if (instant) map.setView(pts[0], 10)
        else map.flyTo(pts[0], 10, { duration: 0.7 })
      } else if (pts.length > 1) {
        const [x, y] = latest.current.inset ?? [56, 72]
        const bounds = L.latLngBounds(pts)
        const opts = { paddingTopLeft: L.point(x, y), paddingBottomRight: L.point(56, 56), maxZoom: 11 }
        if (instant) map.fitBounds(bounds, opts)
        else map.flyToBounds(bounds, { ...opts, duration: 0.7 })
      } else programmatic.current = false
    })

  useImperativeHandle(props.ref, () => ({
    flyTo: (p, zoom = 10) => move((map) => map.flyTo([p.lat, p.lng], zoom, { duration: 0.6 })),
    zoomOut: () => mapRef.current?.zoomOut(2),
    fitAll: () => {
      userControlled.current = false
      fitAll()
    },
    getBounds: () => (mapRef.current ? toBounds(mapRef.current.getBounds()) : null),
  }))

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const init = latest.current.initialView
    const map = L.map(el, { zoomControl: false, minZoom: 3, maxZoom: 17, worldCopyJump: true }).setView(init ? [init.center.lat, init.center.lng] : [47.2, 16], init?.zoom ?? 5)
    L.control.zoom({ position: 'topright', zoomInTitle: latest.current.labels.zoomIn, zoomOutTitle: latest.current.labels.zoomOut }).addTo(map)
    let ok = 0
    let failed = 0
    L.tileLayer(OSM, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' })
      .on('tileload', () => (ok += 1))
      .on('tileerror', () => {
        failed += 1
        if (failed >= 4 && ok === 0) setTilesFailed(true)
      })
      .addTo(map)
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 64,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      iconCreateFunction: (c) => {
        const priced = c
          .getAllChildMarkers()
          .map((m) => pinById.current.get(markerIds.get(m) ?? ''))
          .filter((p): p is MapPin => !!p && typeof p.minPrice === 'number')
        const units = new Set(priced.map((p) => p.unit))
        const comparable = units.size === 1
        const min = comparable && priced.length ? Math.min(...priced.map((p) => p.minPrice as number)) : null
        const text = latest.current.clusterText(c.getChildCount(), min, comparable ? (priced[0]?.unit ?? null) : null)
        return clusterIcon(c.getChildCount(), text.short, text.aria)
      },
    })
    map.addLayer(cluster)
    let timer: ReturnType<typeof setTimeout> | undefined
    map.on('moveend', () => {
      if (!programmatic.current) {
        userMoved.current = true
        userControlled.current = true
      }
      programmatic.current = false
      clearTimeout(timer)
      timer = setTimeout(() => {
        const b = map.getBounds()
        const visiblePins = [...pinById.current.values()].filter((p) => b.contains([p.location.lat, p.location.lng])).length
        latest.current.onViewport({ center: { lat: map.getCenter().lat, lng: map.getCenter().lng }, zoom: map.getZoom(), bounds: toBounds(b), visiblePins, userInitiated: userMoved.current })
        userMoved.current = false
      }, 400)
    })
    map.on('click', () => useMapUi.getState().select(null))
    popup.on('remove', () => {
      if (useMapUi.getState().selectedProducerId === popupId.current) useMapUi.getState().select(null)
      popupId.current = null
    })
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    mapRef.current = map
    clusterRef.current = cluster
    const unsubUi = useMapUi.subscribe((s, prev) => {
      if (s.visitedProducerIds !== prev.visitedProducerIds) return refreshAll()
      new Set([s.hoveredProducerId, prev.hoveredProducerId, s.selectedProducerId, prev.selectedProducerId]).forEach(refresh)
      markClusters()
    })
    map.on('zoomend', markClusters)
    const unsubSaved = useSaved.subscribe(refreshAll)
    return () => {
      clearTimeout(timer)
      unsubUi()
      unsubSaved()
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    markers.current.clear()
    iconKeys.current.clear()
    pinById.current = new Map(props.pins.map((p) => [p.producerId, p]))
    const list = props.pins.map((pin) => {
      const id = pin.producerId
      const c = content(id) as PinContent
      iconKeys.current.set(id, pinKey(c))
      const m = L.marker([pin.location.lat, pin.location.lng], { icon: pinIcon(c), keyboard: true })
      markerIds.set(m, id)
      m.on('click', () => useMapUi.getState().select(id, 'map'))
      m.on('mouseover', () => useMapUi.getState().setHovered(id))
      m.on('mouseout', () => useMapUi.getState().setHovered(null))
      m.on('add', () => {
        const el = m.getElement()
        el?.setAttribute('role', 'button')
        el?.setAttribute('aria-label', latest.current.pinAria(pin))
        el?.addEventListener('focus', () => useMapUi.getState().setHovered(id))
        el?.addEventListener('blur', () => useMapUi.getState().setHovered(null))
        el?.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          useMapUi.getState().select(id, 'map')
        })
        decorate(id, m)
      })
      markers.current.set(id, m)
      return m
    })
    cluster.addLayers(list)
  }, [props.pins])

  useEffect(() => {
    if (props.dataReady && fitted.current !== props.fitKey) {
      fitted.current = props.fitKey
      if (!userControlled.current) fitAll()
    }
  }, [props.fitKey, props.dataReady, props.pins])

  useEffect(refreshAll, [props.pinText])

  useEffect(() => {
    const map = mapRef.current
    const marker = selectedId ? markers.current.get(selectedId) : undefined
    if (!map || !marker || !selectedId) {
      map?.closePopup()
      return
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useMapUi.getState().select(null)
    document.addEventListener('keydown', onKey)
    move(() =>
      clusterRef.current?.zoomToShowLayer(marker, () => {
        programmatic.current = true
        if (latest.current.popups) {
          popupId.current = selectedId
          const [x, y] = latest.current.inset ?? [24, 72]
          popup.options.autoPanPaddingTopLeft = L.point(x, y)
          popup.setLatLng(marker.getLatLng()).openOn(map)
        } else map.panTo(marker.getLatLng(), { animate: true })
      }),
    )
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedId, props.pins])


  const { userLocation, radiusKm } = props
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const you = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({ className: '', html: '<div class="sy-user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
      interactive: false,
      keyboard: false,
      zIndexOffset: -500,
      title: latest.current.labels.you,
    }).addTo(map)
    return () => {
      you.remove()
    }
  }, [userLocation.lat, userLocation.lng])

  const ringRef = useRef<L.Circle | null>(null)
  const ringAnim = useRef<number | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const target = radiusKm ? radiusKm * 1000 : 0
    let ring = ringRef.current
    if (!ring) {
      if (!target) return
      ring = L.circle([userLocation.lat, userLocation.lng], { radius: target * 0.6, className: 'sy-radius-ring', weight: 1.5, fillOpacity: 0.04, opacity: 0, interactive: false }).addTo(map)
      ringRef.current = ring
    }
    ring.setLatLng([userLocation.lat, userLocation.lng])
    if (ringAnim.current) cancelAnimationFrame(ringAnim.current)
    const from = ring.getRadius()
    const fromOpacity = (ring.options.opacity as number | undefined) ?? 1
    const toOpacity = target ? 1 : 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduced ? 0 : 420
    let start = -1
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
    const step = (now: number) => {
      if (start < 0) start = now
      const k = duration ? Math.min(1, (now - start) / duration) : 1
      const e = ease(k)
      const r = from + ((target || from * 0.6) - from) * e
      const o = fromOpacity + (toOpacity - fromOpacity) * e
      ring?.setRadius(Math.max(1, r))
      ring?.setStyle({ opacity: o, fillOpacity: 0.04 * o })
      if (k < 1) ringAnim.current = requestAnimationFrame(step)
      else {
        ringAnim.current = null
        if (!target) {
          ring?.remove()
          ringRef.current = null
        }
      }
    }
    ringAnim.current = requestAnimationFrame(step)
  }, [userLocation.lat, userLocation.lng, radiusKm])

  useEffect(
    () => () => {
      if (ringAnim.current) cancelAnimationFrame(ringAnim.current)
      ringRef.current?.remove()
      ringRef.current = null
    },
    [],
  )

  const selectedPin = selectedId ? props.pins.find((p) => p.producerId === selectedId) : undefined
  return (
    <div className={cn('relative h-full w-full', tilesFailed && 'tiles-failed')}>
      <div ref={elRef} className="sy-map h-full w-full" />
      {tilesFailed && (
        <p role="status" className="absolute bottom-8 start-3 z-[450] max-w-xs rounded-md border border-line bg-surface/95 px-3 py-2 text-xs text-ink-muted shadow-pop">
          {props.labels.tilesFailed}
        </p>
      )}
      {props.popups && selectedPin && createPortal(props.renderPopup(selectedPin), popupEl)}
    </div>
  )
}

