import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CERTIFICATIONS, type CertificationCode } from '@/config/certifications'
import { useFormat } from '@/features/i18n/useFormat'
import { Checkbox } from '@/shared/ui/form'
import type { FacetCount } from '../types'
import type { FiltersApi } from '../useFilters'

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

function ShowMore({ total, shown, onClick }: { total: number; shown: number; onClick: () => void }) {
  const { t } = useTranslation()
  if (total <= shown) return null
  return (
    <button type="button" onClick={onClick} className="mt-1 px-1 text-xs font-medium text-primary hover:underline">
      {t('filters.showAll', { count: total })}
    </button>
  )
}

export function CountryFilter({ api, facets }: { api: FiltersApi; facets: FacetCount[] }) {
  const fmt = useFormat()
  const [all, setAll] = useState(false)
  const selected = api.filters.countries
  const rows = [...facets, ...selected.filter((c) => !facets.some((f) => f.value === c)).map((value) => ({ value, count: 0 }))]
  const shown = all ? rows : rows.slice(0, 6)
  return (
    <div>
      {shown.map((f) => (
        <Checkbox key={f.value} checked={selected.includes(f.value)} onChange={() => api.setFilters({ countries: toggle(selected, f.value) })} label={fmt.region(f.value)} meta={f.count} />
      ))}
      <ShowMore total={rows.length} shown={shown.length} onClick={() => setAll(true)} />
    </div>
  )
}

export function CertificationFilter({ api, facets }: { api: FiltersApi; facets: FacetCount[] }) {
  const { t } = useTranslation()
  const [all, setAll] = useState(false)
  const selected = api.filters.certifications
  const label = (c: CertificationCode) => {
    const cfg = CERTIFICATIONS[c] as { label: string; translatable?: boolean }
    return cfg.translatable ? t(`certs.${c}`) : cfg.label
  }
  const rows = facets.filter((f): f is FacetCount & { value: CertificationCode } => f.value in CERTIFICATIONS)
  const shown = all ? rows : rows.slice(0, 8)
  return (
    <div>
      <p className="mb-1 px-1 text-xs text-ink-subtle">{t('filters.allSelectedRequired')}</p>
      {shown.map((f) => (
        <Checkbox key={f.value} checked={selected.includes(f.value)} onChange={() => api.setFilters({ certifications: toggle(selected, f.value) })} label={label(f.value)} meta={f.count} />
      ))}
      <ShowMore total={rows.length} shown={shown.length} onClick={() => setAll(true)} />
    </div>
  )
}
