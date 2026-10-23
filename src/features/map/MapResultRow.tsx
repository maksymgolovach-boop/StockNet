import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Handshake } from 'lucide-react'
import type { SearchResultItem } from '@/features/search/types'
import { useFormat } from '@/features/i18n/useFormat'
import { ProductMedia } from '@/features/product/ProductMedia'
import { ProductPrice } from '@/features/product/ProductPrice'
import { AvailabilityBadge, ExpiryBadge } from '@/features/product/StatusBadges'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { Badge } from '@/shared/ui/Badge'

/** Dense result row for the floating panel in full-map mode. */
export function MapResultRow({ item }: { item: SearchResultItem }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { product: p, producer } = item
  return (
    <article className="relative flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-2.5 hover:border-line-strong">
      <ProductMedia media={p.media[0]} categorySlug={p.categorySlug} className="size-16 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 font-sans text-[0.8125rem] font-semibold leading-snug" lang={p.contentLang}>
          <Link to={`/product/${p.id}`} className="after:absolute after:inset-0 hover:text-primary">
            {p.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
          <span className="truncate">{producer.name}</span>
          <VerificationBadge level={producer.verification} compact />
          <span>· {fmt.distance(item.distanceKm)}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1">
            {p.expiryDate ? <ExpiryBadge expiryDate={p.expiryDate} /> : <AvailabilityBadge product={p} />}
            {item.pastPartnerDeals > 0 && (
              <Badge tone="ink" icon={<Handshake className="size-3" aria-hidden />}>
                {t('trust.pastPartner')}
              </Badge>
            )}
          </div>
          <ProductPrice product={p} />
        </div>
      </div>
    </article>
  )
}
