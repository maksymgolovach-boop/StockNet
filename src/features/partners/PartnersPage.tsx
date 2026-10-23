import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Handshake, Search } from 'lucide-react'
import { usePartners } from '@/features/chat/usePartner'
import { useDevStore } from '@/features/dev/devStore'
import { useDealMutations, usePartnerships } from '@/features/deals/useDeals'
import { normalize } from '@/features/search/normalize'
import { Select } from '@/shared/ui/Select'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import { PartnerCard } from './PartnerCard'

type View = 'all' | 'favorites' | 'active' | 'dormant'
type Sort = 'last' | 'volume' | 'deals' | 'name'

export function PartnersPage() {
  const { t } = useTranslation()
  const role = useDevStore((s) => s.role)
  const data = usePartnerships()
  const partners = usePartners(role)
  const { setMeta } = useDealMutations()
  const [view, setView] = useState<View>('all')
  const [sort, setSort] = useState<Sort>('last')
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.title = `${t('pages.partners')} · Stocknet`
  }, [t])

  const list = data.data ?? []
  const name = (id: string) => partners.resolve(role === 'buyer' ? { producerId: id, buyerId: '' } : { buyerId: id, producerId: '' })?.name ?? id
  const q = normalize(query)
  const visible = list
    .filter((p) => (view === 'favorites' ? p.favorite : view === 'active' ? p.status === 'active' : view === 'dormant' ? p.status === 'dormant' : true))
    .filter((p) => !q || normalize(`${name(p.counterpartyId)} ${p.tag ? t(`partners.tags.${p.tag}`) : ''} ${p.privateNotes}`).includes(q))
    .sort((a, b) =>
      sort === 'volume' ? b.totalVolumeEUR - a.totalVolumeEUR : sort === 'deals' ? b.dealCount - a.dealCount : sort === 'name' ? name(a.counterpartyId).localeCompare(name(b.counterpartyId)) : b.lastDealAt.localeCompare(a.lastDealAt),
    )
  const counts: Record<View, number> = {
    all: list.length,
    favorites: list.filter((p) => p.favorite).length,
    active: list.filter((p) => p.status === 'active').length,
    dormant: list.filter((p) => p.status === 'dormant').length,
  }

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold">
          <Handshake className="size-7" aria-hidden />
          {t('pages.partners')}
        </h1>
        <p className="text-sm text-ink-muted">{t(role === 'buyer' ? 'partners.subtitleBuyer' : 'partners.subtitleProducer')}</p>
      </div>
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 md:flex-row md:items-center">
        <div role="group" aria-label={t('partners.viewLabel')} className="flex flex-wrap gap-1.5">
          {(['all', 'favorites', 'active', 'dormant'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn('h-8 rounded-full border px-3 text-[0.8125rem] font-medium', view === v ? 'border-ink bg-ink text-bg' : 'border-line-strong hover:bg-surface-2')}>
              {t(`partners.views.${v}`)} <span className="tabular opacity-70">{counts[v]}</span>
            </button>
          ))}
        </div>
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t('partners.search')}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('partners.search')} className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-9 pe-3 text-sm" />
        </label>
        <Select label={t('search.sortBy')} hideLabel value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={(['last', 'volume', 'deals', 'name'] as const).map((s) => ({ value: s, label: `${t('search.sortBy')}: ${t(`partners.sort.${s}`)}` }))} className="md:w-56" />
      </div>
      <p className="text-xs text-ink-subtle">{t('partner.privateNote')}</p>
      {data.isPending || partners.isPending ? (
        <LoadingRegion>
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </LoadingRegion>
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={() => void data.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Handshake className="size-5" aria-hidden />} title={list.length ? t('partners.noMatch') : t('partners.none')} body={list.length ? undefined : t('partners.noneBody')} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((p) => (
            <li key={p.counterpartyId} className="min-w-0">
              <PartnerCard
                p={p}
                role={role}
                partner={partners.resolve(role === 'buyer' ? { producerId: p.counterpartyId, buyerId: '' } : { buyerId: p.counterpartyId, producerId: '' })}
                saving={setMeta.isPending && setMeta.variables?.counterpartyId === p.counterpartyId}
                onMeta={(patch) => setMeta.mutate({ counterpartyId: p.counterpartyId, patch })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
