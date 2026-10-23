import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgePercent } from 'lucide-react'
import type { Filters } from '@/types/models'
import { ProductCard } from '@/features/product/ProductCard'
import { emptyFilters } from '@/features/search/filtersCodec'
import { useSearchResults } from '@/features/search/useSearchResults'
import { ButtonLink } from '@/shared/ui/Button'
import { LoadingRegion, Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'

type Tab = 'lots' | 'expiry'

const TABS: Record<Tab, { filters: Filters; sort: 'normalized_asc' | 'expiry'; link: string }> = {
  lots: { filters: { ...emptyFilters(), saleMode: 'lot', lotConditions: ['surplus', 'clearance'] }, sort: 'normalized_asc', link: '/search?mode=lot&lcond=surplus,clearance&sort=normalized_asc' },
  expiry: { filters: { ...emptyFilters(), expiry: 'lt7' }, sort: 'expiry', link: '/search?exp=lt7&sort=expiry' },
}

/** Deals: surplus/clearance lots for non-perishables and near-expiry perishables. */
export function HomeDeals() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('lots')
  const { data, isPending, error } = useSearchResults({ filters: TABS[tab].filters, sort: TABS[tab].sort, limit: 8 })
  if (error) return null
  return (
    <section aria-labelledby="home-deals" className="mx-auto w-full max-w-[90rem] px-4 lg:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="home-deals" className="flex items-center gap-2 text-2xl font-semibold">
            <BadgePercent className="size-6 text-primary" aria-hidden />
            {t('home.dealsTitle')}
          </h2>
          <p className="text-sm text-ink-muted">{t(tab === 'lots' ? 'home.dealsBody' : 'home.dealsExpiryBody')}</p>
          <div role="tablist" aria-label={t('home.dealsTitle')} className="mt-1 flex gap-1.5">
            {(['lots', 'expiry'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('h-8 rounded-full border px-3 text-[0.8125rem] font-medium', tab === k ? 'border-ink bg-ink text-bg' : 'border-line-strong hover:bg-surface-2')}>
                {t(`home.dealsTabs.${k}`)}
              </button>
            ))}
          </div>
        </div>
        <ButtonLink to={TABS[tab].link} variant="secondary" size="sm" icon={<ArrowRight className="size-4 rtl:rotate-180" aria-hidden />}>
          {data ? t('home.dealsAll', { count: data.total }) : t('common.viewAll')}
        </ButtonLink>
      </div>
      {data && data.total === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-6 text-sm text-ink-muted">{t('home.dealsNone')}</p>
      ) : isPending ? (
        <LoadingRegion>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </LoadingRegion>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data?.items.map((item) => (
            <li key={item.product.id} className="min-w-0">
              <ProductCard item={item} view="grid" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
