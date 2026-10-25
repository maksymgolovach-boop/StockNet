import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, MapPin, MessageSquare, Star } from 'lucide-react'
import { NotFoundPage } from '@/app/NotFoundPage'
import { useFormat } from '@/features/i18n/useFormat'
import { ProductCard } from '@/features/product/ProductCard'
import { useSaved } from '@/features/saved/savedStore'
import { emptyFilters } from '@/features/search/filtersCodec'
import { useSearchResults } from '@/features/search/useSearchResults'
import { DocumentCenter } from '@/features/trust/DocumentCenter'
import { PartnershipBanner } from '@/features/trust/PartnershipBanner'
import { ReportButton } from '@/features/trust/ReportDialog'
import { ReviewsSection } from '@/features/trust/ReviewsSection'
import { TrustBreakdown, TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { usePartnerHistory } from '@/features/trust/usePartnerHistory'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { VerificationDetails } from '@/features/trust/VerificationDetails'
import { NotFoundError } from '@/services/client'
import { useProducer, useProducerReviews } from '@/services/queries'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Button, ButtonLink } from '@/shared/ui/Button'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { Tabs } from '@/shared/ui/Tabs'
import { cn } from '@/shared/lib/cn'
import { ProducerAvatar } from './ProducerAvatar'
import { ProducerHistory } from './ProducerHistory'
import { ProducerOverview } from './ProducerOverview'

type ProducerTab = 'overview' | 'products' | 'trust' | 'reviews' | 'history'

function ProducerProducts({ producerId }: { producerId: string }) {
  const { data, isPending, error, refetch } = useSearchResults({ filters: emptyFilters(), sort: 'relevance', limit: 200, producerId })
  if (isPending)
    return (
      <LoadingRegion>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </LoadingRegion>
    )
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data?.items.map((item) => (
        <li key={item.product.id} className="min-w-0">
          <ProductCard item={item} view="grid" />
        </li>
      ))}
    </ul>
  )
}

export function ProducerPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const fmt = useFormat()
  const [params, setParams] = useSearchParams()
  const producer = useProducer(id)
  const reviews = useProducerReviews(id)
  const history = usePartnerHistory(id, 'buyer')
  const saved = useSaved((s) => s.producerIds.includes(id))
  const toggleSaved = useSaved((s) => s.toggleProducer)

  if (producer.error instanceof NotFoundError) return <NotFoundPage />
  if (producer.isPending)
    return (
      <LoadingRegion>
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-6 lg:px-6">
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </LoadingRegion>
    )
  const p = producer.data
  if (producer.error || !p)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={producer.error} onRetry={() => void producer.refetch()} />
      </div>
    )

  const requested = params.get('tab') as ProducerTab | null
  const tabs = [
    { id: 'overview' as const, label: t('producer.tabs.overview') },
    { id: 'products' as const, label: t('producer.tabs.products') },
    { id: 'trust' as const, label: t('producer.tabs.trust') },
    { id: 'reviews' as const, label: t('producer.tabs.reviews'), badge: <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular">{p.reviewCount}</span> },
    ...(history ? [{ id: 'history' as const, label: t('producer.tabs.history'), badge: <span className="rounded-full bg-ink px-1.5 text-xs text-bg tabular">{history.deals.length}</span> }] : []),
  ]
  const active: ProducerTab = requested && tabs.some((x) => x.id === requested) ? requested : 'overview'
  const setTab = (tab: ProducerTab) => setParams(tab === 'overview' ? {} : { tab }, { replace: true })

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:px-6">
      <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('pages.producer') }, { label: p.name }]} />
      <header className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 md:flex-row md:items-start">
        <ProducerAvatar producer={p} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <h1 className="text-3xl font-semibold">{p.name}</h1>
            <p className="text-sm text-ink-muted">
              {p.legalName} · {t(`producerTypes.${p.type}`)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge level={p.verification.level} />
            <TrustScoreButton trust={p.trust} />
            {p.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="size-4 fill-accent text-accent" aria-hidden />
                <span className="font-semibold tabular">{fmt.number(p.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                <span className="text-ink-muted">({t('common.reviews', { count: p.reviewCount })})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
              <MapPin className="size-4" aria-hidden />
              {p.address.city}, {fmt.region(p.address.country)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
          <div className="flex gap-2">
            <ButtonLink to={`/messages?producer=${p.id}`} icon={<MessageSquare className="size-4" aria-hidden />}>
              {t('product.contactProducer')}
            </ButtonLink>
            <Button variant="secondary" onClick={() => toggleSaved(p.id)} aria-pressed={saved} aria-label={t(saved ? 'map.unsave' : 'map.save', { name: p.name })}>
              <Heart className={cn('size-4', saved && 'fill-primary text-primary')} aria-hidden />
            </Button>
          </div>
          <ReportButton target="user" name={p.name} />
        </div>
      </header>
      <PartnershipBanner producerId={p.id} historyLink={`/producer/${p.id}?tab=history`} />
      <Tabs tabs={tabs} active={active} onChange={setTab} label={t('producer.tabsLabel')}>
        {active === 'overview' && <ProducerOverview producer={p} />}
        {active === 'products' && <ProducerProducts producerId={p.id} />}
        {active === 'trust' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <h2 className="text-xl font-semibold">
                {t('trust.score')} · {p.trust.score}/100
              </h2>
              <TrustBreakdown trust={p.trust} />
            </section>
            <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <h2 className="text-xl font-semibold">{t('verification.label')}</h2>
              <VerificationDetails verification={p.verification} />
            </section>
            <div className="lg:col-span-2">
              <DocumentCenter documents={p.documents} title={t('docs.producerTitle')} />
            </div>
          </div>
        )}
        {active === 'reviews' && (reviews.isPending ? <Skeleton className="h-60" /> : <ReviewsSection reviews={reviews.data ?? []} producerName={p.name} />)}
        {active === 'history' && history && <ProducerHistory history={history} />}
      </Tabs>
    </div>
  )
}
