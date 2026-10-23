import { useTranslation } from 'react-i18next'
import { FilterSection } from '@/shared/ui/form'
import type { SearchResponse } from '../types'
import type { FiltersApi } from '../useFilters'
import { AttributeFilters } from './AttributeFilters'
import { CategoryFilter } from './CategoryFilter'
import { CertificationFilter, CountryFilter } from './FacetFilters'
import { LocationFilter } from './LocationFilter'
import { LotFilters } from './LotFilters'
import { hasLotFilters } from '../engine'
import { OrderFilters, TimeFilters } from './OrderFilters'
import { PriceFilter } from './PriceFilter'
import { TrustFilters } from './TrustFilters'

export function FilterPanel({ api, facets }: { api: FiltersApi; facets: SearchResponse['facets'] | undefined }) {
  const { t } = useTranslation()
  const f = api.filters
  const lotCount =
    [f.saleMode, f.lotSizeMin ?? f.lotSizeMax, f.lotPriceMin ?? f.lotPriceMax, f.lotsAvailableMin, f.producedFrom ?? f.producedTo].filter((v) => v !== undefined).length +
    (f.indivisibleOnly ? 1 : 0) +
    f.lotConditions.length
  const showLots = (facets?.saleModes.lot ?? 0) > 0 || hasLotFilters(f) || f.saleMode !== undefined
  const trustCount = [f.verificationMin, f.minTrust].filter((v) => v !== undefined).length + [f.pastPartnersOnly, f.validCertsOnly].filter(Boolean).length
  return (
    <div className="flex flex-col">
      <FilterSection title={t('nav.categories')}>
        <CategoryFilter api={api} facets={facets?.categories ?? []} />
      </FilterSection>
      <FilterSection title={t('filters.location')} count={f.radiusKm ? 1 : undefined}>
        <LocationFilter api={api} />
      </FilterSection>
      <FilterSection title={t('filters.trust')} count={trustCount || undefined}>
        <TrustFilters api={api} />
      </FilterSection>
      <AttributeFilters api={api} />
      <FilterSection title={t('filters.price')} count={f.priceMin !== undefined || f.priceMax !== undefined ? 1 : undefined}>
        <PriceFilter api={api} />
      </FilterSection>
      {showLots && (
        <FilterSection title={t('lots.filters.title')} count={lotCount || undefined} defaultOpen={lotCount > 0}>
          <LotFilters api={api} counts={facets?.saleModes} />
        </FilterSection>
      )}
      <FilterSection title={t('filters.availability')} count={(f.expiry ? 1 : 0) + (f.leadTime ? 1 : 0) || undefined}>
        <TimeFilters api={api} />
      </FilterSection>
      <FilterSection title={t('filters.order')} defaultOpen={false}>
        <OrderFilters api={api} />
      </FilterSection>
      <FilterSection title={t('filters.country')} count={f.countries.length || undefined}>
        <CountryFilter api={api} facets={facets?.countries ?? []} />
      </FilterSection>
      <FilterSection title={t('filters.certifications')} defaultOpen={!!f.category} count={f.certifications.length || undefined}>
        <CertificationFilter api={api} facets={facets?.certifications ?? []} />
      </FilterSection>
    </div>
  )
}
