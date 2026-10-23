import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { CERTIFICATIONS } from '@/config/certifications'
import { getCategoryConfig } from '@/config/categories'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { useFormat } from '@/features/i18n/useFormat'
import { useDisplayCurrency } from '@/features/settings/preferencesStore'
import type { FiltersApi } from './useFilters'

interface Chip {
  id: string
  label: string
  remove: () => void
}

export function ActiveFilterChips({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const currency = useDisplayCurrency()
  const cat = useCategoryConfig(api.filters.category)
  const f = api.filters
  const set = api.setFilters
  const chips: Chip[] = []
  const push = (id: string, label: string, remove: () => void) => chips.push({ id, label, remove })

  if (api.map.bounds) push('area', t('map.areaChip'), () => api.setMap({ bounds: undefined }, { replace: false }))
  if (f.q) push('q', `“${f.q}”`, () => set({ q: '' }))
  if (f.radiusKm) push('radius', t('filters.chips.radius', { distance: fmt.distance(f.radiusKm) }), () => set({ radiusKm: undefined }))
  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    const lo = f.priceMin !== undefined ? fmt.number(f.priceMin) : '…'
    const hi = f.priceMax !== undefined ? fmt.number(f.priceMax) : '…'
    const unit = f.priceUnit ? ` / ${t(`units.${f.priceUnit}`)}` : ''
    push('price', `${lo}–${hi} ${currency}${unit}`, () => set({ priceMin: undefined, priceMax: undefined, priceUnit: undefined }))
  }
  f.countries.forEach((c) => push(`country-${c}`, fmt.region(c), () => set({ countries: f.countries.filter((x) => x !== c) })))
  f.certifications.forEach((c) => {
    const cfg = CERTIFICATIONS[c] as { label: string; translatable?: boolean }
    push(`cert-${c}`, cfg.translatable ? t(`certs.${c}`) : cfg.label, () => set({ certifications: f.certifications.filter((x) => x !== c) }))
  })
  if (f.verificationMin) push('ver', t('filters.chips.verification', { level: t(`verification.levels.${f.verificationMin}`) }), () => set({ verificationMin: undefined }))
  if (f.minTrust) push('trust', t('filters.chips.trust', { score: f.minTrust }), () => set({ minTrust: undefined }))
  if (f.pastPartnersOnly) push('partners', t('filters.pastPartnersOnly'), () => set({ pastPartnersOnly: false }))
  if (f.validCertsOnly) push('validcerts', t('filters.validCertsOnly'), () => set({ validCertsOnly: false }))
  if (f.inStock) push('stock', t('filters.inStock'), () => set({ inStock: false }))
  if (f.deliveryAvailable) push('delivery', t('filters.deliveryAvailable'), () => set({ deliveryAvailable: false }))
  if (f.minRating) push('rating', `${f.minRating}+ ★`, () => set({ minRating: undefined }))
  if (f.moqMax !== undefined) push('moq', t('filters.chips.moq', { qty: fmt.number(f.moqMax) }), () => set({ moqMax: undefined }))
  if (f.expiry) push('exp', t(`filters.expiryPresets.${f.expiry}`), () => set({ expiry: undefined }))
  if (f.saleMode) push('mode', t(`lots.saleModes.${f.saleMode}`), () => set({ saleMode: undefined }))
  if (f.lotPriceMin !== undefined || f.lotPriceMax !== undefined)
    push('lprice', t('lots.chips.lotPrice', { range: `${f.lotPriceMin !== undefined ? fmt.number(f.lotPriceMin) : '…'}–${f.lotPriceMax !== undefined ? fmt.number(f.lotPriceMax) : '…'} ${currency}` }), () => set({ lotPriceMin: undefined, lotPriceMax: undefined }))
  if (f.lotSizeMin !== undefined || f.lotSizeMax !== undefined) {
    const unit = cat.config ? ` ${t(`units.${cat.config.defaultUnit}`)}` : ''
    push('lsize', t('lots.chips.lotSize', { range: `${f.lotSizeMin ?? '…'}–${f.lotSizeMax ?? '…'}${unit}` }), () => set({ lotSizeMin: undefined, lotSizeMax: undefined }))
  }
  if (f.lotsAvailableMin !== undefined) push('lots', t('lots.chips.lotsAvailable', { count: f.lotsAvailableMin }), () => set({ lotsAvailableMin: undefined }))
  if (f.indivisibleOnly) push('indiv', t('lots.filters.indivisibleOnly'), () => set({ indivisibleOnly: false }))
  f.lotConditions.forEach((c) => push(`lcond-${c}`, t(`lots.conditions.${c}`), () => set({ lotConditions: f.lotConditions.filter((x) => x !== c) })))
  if (f.producedFrom || f.producedTo)
    push('prod', t('lots.chips.produced', { range: `${f.producedFrom ? fmt.date(f.producedFrom) : '…'}–${f.producedTo ? fmt.date(f.producedTo) : '…'}` }), () => set({ producedFrom: undefined, producedTo: undefined }))
  if (f.leadTime) push('lead', t(`filters.leadPresets.${f.leadTime}`), () => set({ leadTime: undefined }))

  const defs = f.category ? getCategoryConfig(f.category)?.attributes ?? [] : []
  for (const [key, v] of Object.entries(f.attributes)) {
    const def = defs.find((d) => d.key === key)
    if (!def) continue
    const name = cat.attributeLabel(def)
    if (v.kind === 'enum') v.values.forEach((o) => push(`a-${key}-${o}`, `${name}: ${cat.optionLabel(def, o)}`, () => api.setAttribute(key, v.values.length > 1 ? { kind: 'enum', values: v.values.filter((x) => x !== o) } : undefined)))
    else if (v.kind === 'range') push(`a-${key}`, `${name}: ${v.min ?? '…'}–${v.max ?? '…'}${def.type === 'number' && def.unit ? ` ${def.unit}` : ''}`, () => api.setAttribute(key, undefined))
    else push(`a-${key}`, name, () => api.setAttribute(key, undefined))
  }

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('filters.active')}>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={c.remove}
          aria-label={t('filters.remove', { filter: c.label })}
          className="group inline-flex h-7 items-center gap-1 rounded-full border border-line-strong bg-surface ps-2.5 pe-1.5 text-xs hover:border-primary hover:text-primary"
        >
          {c.label}
          <X className="size-3.5 text-ink-subtle group-hover:text-primary" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={api.clearAll} className="h-7 px-2 text-xs font-medium text-primary hover:underline">
          {t('common.clearAll')}
        </button>
      )}
    </div>
  )
}
