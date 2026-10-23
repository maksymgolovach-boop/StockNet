import { useCallback, useState } from 'react'
import type { GeoPoint } from '@/types/models'

export type GeolocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable' | 'success'

/** Browser geolocation with explicit status so callers can show a manual fallback. */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [point, setPoint] = useState<GeoPoint | null>(null)

  const locate = useCallback(
    () =>
      new Promise<GeoPoint | null>((resolve) => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          setStatus('unavailable')
          resolve(null)
          return
        }
        setStatus('locating')
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setPoint(p)
            setStatus('success')
            resolve(p)
          },
          (err) => {
            setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
            resolve(null)
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
        )
      }),
    [],
  )

  return { status, point, locate }
}
