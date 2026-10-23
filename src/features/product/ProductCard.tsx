import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Handshake, MapPin, Star, TriangleAlert, Truck } from 'lucide-react'
import { CERTIFICATIONS } from '@/config/certifications'
import type { SearchResultItem } from '@/features/search/types'
import { Highlight } from '@/features/search/Highlight'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { useFormat } from '@/features/i18n/useFormat'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { useProducerTrust } from '@/features/trust/useProducerTrust'
import { LotBadge, LotConditionBadge } from '@/features/lots/LotBadge'
import { LotSummaryLine } from '@/features/lots/LotSummaryLine'
import { Badge } from '@/shared/ui/Badge'
import { cn } from '@/shared/lib/cn'
import { ProductMedia } from './ProductMedia'
import { ProductPrice } from './ProductPrice'
import { AvailabilityBadge, ExpiryBadge } from './StatusBadges'

interface ProductCardProps {
  item: SearchResultItem
  view: 'list' | 'grid'
  query?: string
}

export function ProductCard({ item, view, query = '' }: ProductCardProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { product: p, producer } = item
  const cat = useCategoryConfig(p.categorySlug)
  const trust = useProducerTrust(producer.id)
  const certLabel = (c: keyof typeof CERTIFICATIONS) => {
    const cfg = CERTIFICATIONS[c] as { label: string; translatable?: boolean }
    return cfg.translatable ? t(`certs.${c}`) : cfg.label
  }
  const lot = item.lot ? p.lots.find((l) => l.id === item.lot?.lotId) : undefined
  const specs = cat.cardAttributes
    .map((def) => cat.formatValue(def, p.attributes[def.key]))
    .filter((v): v is string => v !== null)
    .slice(0, 3)
  const list = view === 'list'

  return (
    <div className="@container h-full min-w-0">
    <article
      className={cn(
        'group relative flex h-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card transition hover:border-ink hover:shadow-pop focus-within:border-ink',
        list ? 'flex-col @xl:flex-row' : 'flex-col',
      )}
    >
      <ProductMedia media={p.media[0]} categorySlug={p.categorySlug} className={list ? 'h-32 @xl:h-auto @xl:w-40 @xl:shrink-0' : 'h-36'} />
      <div className={cn('flex min-w-0 flex-1 gap-3 p-4', list ? 'flex-col @3xl:flex-row' : 'flex-col')}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
            <span>{cat.name}</span>
            {lot && <LotBadge />}
            {lot && <LotConditionBadge condition={lot.condition} />}
            {p.clearance && (
              <Badge tone="accent">
                {t(`product.clearance.${p.clearance.reason}`, { pct: p.clearance.discountPct })}
              </Badge>
            )}
          </div>
          <h3 className="font-sans text-[0.9375rem] font-semibold leading-snug" lang={p.contentLang}>
            <Link to={`/product/${p.id}`} className="after:absolute after:inset-0 hover:text-primary focus-visible:outline-none">
              <Highlight text={p.name} query={query} />
            </Link>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[0.8125rem]">
            <Link to={`/producer/${producer.id}`} className="relative z-10 font-medium text-ink-muted hover:text-primary hover:underline">
              {producer.name}
            </Link>
            <VerificationBadge level={producer.verification} compact={!list} />
            {trust && <TrustScoreButton trust={trust} size="sm" />}
            {producer.reviewCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-ink-muted tabular">
                <Star className="size-3 fill-current text-accent" aria-hidden />
                {t('product.rating', { rating: fmt.number(producer.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), count: producer.reviewCount })}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {p.city}, {fmt.region(p.country)} · {fmt.distance(item.distanceKm)}
            </span>
            {item.beyondMaxRange ? (
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <TriangleAlert className="size-3.5" aria-hidden />
                {t('product.beyondRange', { distance: fmt.distance(p.logistics.maxDeliveryKm ?? 0) })}
              </span>
            ) : (
              <span className={cn('inline-flex items-center gap-1', item.deliversToUser ? 'text-verified' : 'text-ink-subtle')}>
                <Truck className="size-3.5" aria-hidden />
                {t(item.deliversToUser ? 'product.deliversToYou' : 'product.outsideDelivery')}
              </span>
            )}
          </div>
          {lot && item.lot && <LotSummaryLine product={p} lot={lot} lotsAvailable={item.lot.lotsAvailable} className="relative z-10" />}
          {specs.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label={t('product.keySpecs')}>
              {specs.map((s) => (
                <li key={s} className="max-w-full truncate rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-muted">
                  <Highlight text={s} query={query} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            {p.expiryDate ? <ExpiryBadge expiryDate={p.expiryDate} /> : <AvailabilityBadge product={p} />}
            {item.pastPartnerDeals > 0 && (
              <Badge tone="ink" icon={<Handshake className="size-3" aria-hidden />}>
                {t('product.pastPartner', { count: item.pastPartnerDeals })}
              </Badge>
            )}
            {p.certifications.slice(0, list ? 3 : 2).map((c) => (
              <Badge key={c}>{certLabel(c)}</Badge>
            ))}
          </div>
        </div>
        <div className={cn('flex shrink-0', list ? 'border-t border-line pt-3 @3xl:w-40 @3xl:flex-col @3xl:justify-between @3xl:border-t-0 @3xl:pt-0' : 'border-t border-line pt-3')}>
          <ProductPrice product={p} align={list ? 'responsive' : 'start'} lotId={item.lot?.lotId} />
        </div>
      </div>
    </article>
    </div>
  )
}
