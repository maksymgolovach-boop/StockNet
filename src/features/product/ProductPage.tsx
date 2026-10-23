import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Boxes, CalendarClock, Package, Plus } from 'lucide-react'
import { NotFoundPage } from '@/app/NotFoundPage'
import { CERTIFICATIONS } from '@/config/certifications'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { LotBadge } from '@/features/lots/LotBadge'
import { LotOrderPanel } from '@/features/lots/LotOrderPanel'
import { LotTable } from '@/features/lots/LotTable'
import { bestLot, sellableLots } from '@/features/lots/lotMath'
import { ProducerTrustCard } from '@/features/producer/ProducerTrustCard'
import { DocumentCenter } from '@/features/trust/DocumentCenter'
import { PartnershipBanner } from '@/features/trust/PartnershipBanner'
import { ReviewsSection } from '@/features/trust/ReviewsSection'
import { NotFoundError } from '@/services/client'
import { useProduct, useProducer, useProducerReviews } from '@/services/queries'
import { Badge } from '@/shared/ui/Badge'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { ButtonLink } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { PriceTiers } from './PriceTiers'
import { ProductActions } from './ProductActions'
import { ProductGallery } from './ProductGallery'
import { SimilarProducts } from './SimilarProducts'
import { SpecTable } from './SpecTable'
import { AvailabilityBadge, ExpiryBadge } from './StatusBadges'
import { TranslatableText } from './TranslatableText'

function PageSkeleton() {
  return (
    <LoadingRegion>
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:px-6">
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export function ProductPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const fmt = useFormat()
  const product = useProduct(id)
  const p = product.data
  const producer = useProducer(p?.producerId)
  const reviews = useProducerReviews(p?.producerId)
  const cat = useCategoryConfig(p?.categorySlug)
  const [params, setParams] = useSearchParams()
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  const [modeChoice, setModeChoice] = useState<'measure' | 'lot' | null>(null)

  if (product.error instanceof NotFoundError) return <NotFoundPage />
  if (product.isPending) return <PageSkeleton />
  if (product.error || !p)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={product.error} onRetry={() => void product.refetch()} />
      </div>
    )

  const perishable = cat.config?.perishable ?? false
  const isOwner = role === 'producer' && actorId === p.producerId
  const lots = p.saleModes.includes('lot') ? sellableLots(p) : []
  const selectedLot = lots.find((l) => l.id === params.get('lot')) ?? bestLot(p)
  const hasMeasure = p.saleModes.includes('measure')
  const mode: 'measure' | 'lot' = !hasMeasure ? 'lot' : !lots.length ? 'measure' : (modeChoice ?? (params.get('lot') ? 'lot' : 'measure'))
  const shownExpiry = mode === 'lot' && selectedLot?.expiryDate ? selectedLot.expiryDate : p.expiryDate
  const selectLot = (id: string) => {
    setModeChoice('lot')
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('lot', id)
      return next
    }, { replace: true, preventScrollReset: true })
  }
  const productReviews = (reviews.data ?? []).filter((r) => r.productIds.includes(p.id))
  const translations = Object.fromEntries(Object.entries(p.mockTranslations).map(([k, v]) => [k, v?.description ?? '']))
  const certLabel = (c: keyof typeof CERTIFICATIONS) => {
    const cfg = CERTIFICATIONS[c] as { label: string; translatable?: boolean }
    return cfg.translatable ? t(`certs.${c}`) : cfg.label
  }

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-8 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-3">
        <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, ...cat.path.map((c) => ({ label: c.name, to: `/category/${c.slug}` })), { label: p.name }]} />
        <div className="flex flex-wrap items-center gap-2">
          {p.clearance && <Badge tone="accent">{t(`product.clearance.${p.clearance.reason}`, { pct: p.clearance.discountPct })}</Badge>}
          {p.expiryDate ? <ExpiryBadge expiryDate={p.expiryDate} /> : <AvailabilityBadge product={p} />}
          {lots.length > 0 && <LotBadge />}
        </div>
        <h1 className="text-3xl font-semibold md:text-4xl" lang={p.contentLang}>
          {p.name}
        </h1>
        <PartnershipBanner producerId={p.producerId} historyLink={`/producer/${p.producerId}?tab=history`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <ProductGallery media={p.media} categorySlug={p.categorySlug} name={p.name} />
          {(p.saleModes.includes('lot') || isOwner) && (
            <section aria-labelledby="lots-title" className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="lots-title" className="flex items-center gap-2 text-xl font-semibold">
                  <Boxes className="size-5" aria-hidden />
                  {t('lots.sectionTitle')}
                  <span className="text-base font-normal text-ink-muted">({lots.length})</span>
                </h2>
                {isOwner && (
                  <ButtonLink to={`/stock?new=${p.id}`} variant="secondary" size="sm" icon={<Plus className="size-4" aria-hidden />}>
                    {t('lots.addLot')}
                  </ButtonLink>
                )}
              </div>
              {lots.length > 0 ? (
                <>
                  <p className="text-sm text-ink-muted">{t(hasMeasure ? 'lots.sectionBodyBoth' : 'lots.sectionBodyLotOnly')}</p>
                  <LotTable product={p} lots={lots} selectedId={mode === 'lot' ? selectedLot?.id : undefined} onSelect={selectLot} />
                </>
              ) : (
                <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-4 text-sm text-ink-muted">{t(p.saleModes.includes('lot') ? 'lots.noneAvailableBody' : 'lots.noLotsYet')}</p>
              )}
            </section>
          )}
          <section aria-labelledby="desc-title" className="flex flex-col gap-2">
            <h2 id="desc-title" className="text-xl font-semibold">
              {t('product.description')}
            </h2>
            <TranslatableText text={p.description} lang={p.contentLang} translations={translations} className="leading-relaxed" />
          </section>
          <SpecTable product={p} />
          {p.certifications.length > 0 && (
            <section aria-labelledby="certs-title" className="flex flex-col gap-2">
              <h2 id="certs-title" className="text-xl font-semibold">
                {t('product.certifications')}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {p.certifications.map((c) => (
                  <li key={c}>
                    <Badge size="md" tone={CERTIFICATIONS[c].kind === 'standard' ? 'neutral' : 'verified'}>
                      {certLabel(c)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <DocumentCenter documents={p.documents} title={t('docs.productTitle')} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h,8rem)+1rem)] lg:self-start">
          <section aria-label={t('product.purchase')} className="flex flex-col gap-4 rounded-[var(--radius-card)] border-2 border-ink bg-surface p-5">
            {hasMeasure && lots.length > 0 && (
              <div role="radiogroup" aria-label={t('lots.filters.saleMode')} className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1 text-sm">
                {(['measure', 'lot'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setModeChoice(m)}
                    className={cn('h-9 rounded-[calc(var(--radius-control)-2px)] font-medium', mode === m ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink')}
                  >
                    {t(`lots.buyBy.${m}`)}
                  </button>
                ))}
              </div>
            )}
            {mode === 'lot' && selectedLot ? (
              <LotOrderPanel key={selectedLot.id} product={p} lot={selectedLot} />
            ) : mode === 'lot' ? (
              <p className="text-lg font-semibold">{t('lots.noneAvailable')}</p>
            ) : (
              <PriceTiers product={p} />
            )}
            <div className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
              {(perishable || p.expiryDate) && shownExpiry ? (
                <p className="flex items-center gap-2">
                  <CalendarClock className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  {t('product.bestBefore', { date: fmt.date(shownExpiry, { dateStyle: 'long' }) })}
                </p>
              ) : (
                <>
                  {p.availability.availableFrom && (
                    <p className="flex items-center gap-2">
                      <CalendarClock className="size-4 shrink-0 text-ink-muted" aria-hidden />
                      {t('availability.availableFrom', { date: fmt.date(p.availability.availableFrom, { dateStyle: 'long' }) })}
                    </p>
                  )}
                </>
              )}
              {mode === 'measure' && p.stock.quantity > 0 && (
                <p className="flex items-center gap-2">
                  <Package className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  {t('product.inStockQty', { qty: fmt.quantity(p.stock.quantity, p.unit) })}
                </p>
              )}
            </div>
            <ProductActions product={p} showQuote={mode === 'measure'} />
          </section>
          {producer.data ? <ProducerTrustCard producer={producer.data} /> : producer.isPending ? <Skeleton className="h-64" /> : null}
        </aside>
      </div>

      <section aria-labelledby="reviews-title" className="flex flex-col gap-3">
        <h2 id="reviews-title" className="text-xl font-semibold">
          {t('reviews.forProduct')}
        </h2>
        {reviews.isPending ? (
          <Skeleton className="h-40" />
        ) : (
          <ReviewsSection reviews={productReviews} producerName={producer.data?.name ?? ''} emptyBody={t('reviews.noneForProduct')} />
        )}
      </section>
      <SimilarProducts product={p} />
    </div>
  )
}
