import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPinned } from 'lucide-react'
import type { GeoPoint } from '@/types/models'
import { CITIES } from '@/mocks'
import { normalize } from '@/features/search/normalize'

const label = (c: (typeof CITIES)[number]) => `${c.name}, ${c.postcode} ${c.country}`

/** Jump the map to a city or postcode (static list of ~100 cities). */
export function MapLocationSearch({ onPick }: { onPick: (point: GeoPoint) => void }) {
  const { t } = useTranslation()
  const id = useId()
  const [value, setValue] = useState('')
  const pick = (v: string) => {
    setValue(v)
    const exact = CITIES.find((c) => label(c) === v)
    if (exact) {
      onPick(exact.point)
      setValue('')
    }
  }
  const submit = () => {
    const q = normalize(value)
    const hit = CITIES.find((c) => normalize(c.name).startsWith(q) || c.postcode.startsWith(value.trim()))
    if (hit && q) {
      onPick(hit.point)
      setValue('')
    }
  }
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {t('map.locationSearch')}
      </label>
      <MapPinned className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
      <input
        id={id}
        list={`${id}-list`}
        value={value}
        onChange={(e) => pick(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('map.locationSearchPlaceholder')}
        className="h-9 w-56 rounded-full border border-line-strong bg-surface ps-8 pe-3 text-[0.8125rem] shadow-pop"
      />
      <datalist id={`${id}-list`}>
        {CITIES.map((c) => (
          <option key={c.id} value={label(c)} />
        ))}
      </datalist>
    </div>
  )
}
