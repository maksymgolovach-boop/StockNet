import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocateFixed, MapPin } from 'lucide-react'
import { CITIES } from '@/mocks'
import { usePreferences } from '@/features/settings/preferencesStore'
import { useGeolocation } from '@/shared/hooks/useGeolocation'
import { Button } from '@/shared/ui/Button'

const cityLabel = (c: (typeof CITIES)[number]) => `${c.name}, ${c.postcode} ${c.country}`

/** Current location, city/postcode autocomplete (~100 cities) and browser geolocation. */
export function LocationPicker() {
  const { t } = useTranslation()
  const id = useId()
  const location = usePreferences((s) => s.location)
  const setLocation = usePreferences((s) => s.setLocation)
  const { status, locate } = useGeolocation()
  const [query, setQuery] = useState('')

  const pickCity = (value: string) => {
    setQuery(value)
    const city = CITIES.find((c) => cityLabel(c) === value)
    if (city) {
      setLocation({ label: `${city.name}, ${city.country}`, point: city.point, source: 'manual' })
      setQuery('')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-sm">
        <MapPin className="size-4 text-primary" aria-hidden />
        <span className="text-ink-muted">{t('filters.from')}</span>
        <span className="font-medium">{location.label}</span>
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-city`} className="text-xs text-ink-muted">
          {t('filters.changeLocation')}
        </label>
        <input
          id={`${id}-city`}
          list={`${id}-cities`}
          value={query}
          onChange={(e) => pickCity(e.target.value)}
          placeholder={t('filters.cityPlaceholder')}
          className="h-9 rounded-[var(--radius-control)] border border-line-strong bg-surface px-2.5 text-sm"
        />
        <datalist id={`${id}-cities`}>
          {CITIES.map((c) => (
            <option key={c.id} value={cityLabel(c)} />
          ))}
        </datalist>
      </div>
      <Button
        variant="secondary"
        size="sm"
        icon={<LocateFixed className="size-3.5" aria-hidden />}
        disabled={status === 'locating'}
        onClick={async () => {
          const p = await locate()
          if (p) setLocation({ label: t('filters.myLocation'), point: p, source: 'geolocation' })
        }}
      >
        {status === 'locating' ? t('common.loading') : t('filters.useMyLocation')}
      </Button>
      {(status === 'denied' || status === 'unavailable') && <p className="text-xs text-accent">{t(`filters.geo.${status}`)}</p>}
    </div>
  )
}
