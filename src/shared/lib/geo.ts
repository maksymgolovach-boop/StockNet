import type { GeoBounds, GeoPoint } from '@/types/models'

const EARTH_RADIUS_KM = 6371

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** Road distance is typically ~1.25× the great-circle distance in Central/Eastern Europe. */
export function roadDistanceKm(a: GeoPoint, b: GeoPoint): number {
  return distanceKm(a, b) * 1.25
}

export function isInBounds(p: GeoPoint, b: GeoBounds): boolean {
  const inLat = p.lat <= b.north && p.lat >= b.south
  const inLng = b.west <= b.east ? p.lng >= b.west && p.lng <= b.east : p.lng >= b.west || p.lng <= b.east
  return inLat && inLng
}

export function boundsOf(points: GeoPoint[]): GeoBounds | null {
  const first = points[0]
  if (!first) return null
  return points.reduce<GeoBounds>(
    (b, p) => ({
      north: Math.max(b.north, p.lat),
      south: Math.min(b.south, p.lat),
      east: Math.max(b.east, p.lng),
      west: Math.min(b.west, p.lng),
    }),
    { north: first.lat, south: first.lat, east: first.lng, west: first.lng },
  )
}
