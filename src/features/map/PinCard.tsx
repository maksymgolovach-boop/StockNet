import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, MessageSquare, Star } from 'lucide-react'
import type { MapPin } from '@/features/search/types'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { AvailabilityBadge, ExpiryBadge } from '@/features/product/StatusBadges'
import { LotBadge } from '@/features/lots/LotBadge'
import { LotSummaryLine } from '@/features/lots/LotSummaryLine'
import { useLotFormat } from '@/features/lots/useLotFormat'
import { useSaved } from '@/features/saved/savedStore'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { buttonClass } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useMapUi } from './mapUiStore'

/** Compact producer card used in the desktop map popup and the mobile carousel. */
export function PinCard({ pin, className, closeGap = false }: { pin: MapPin; className?: string; closeGap?: boolean }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { product: p, producer } = pin.best
  const saved = useSaved((s) => s.producerIds.includes(producer.id))
  const toggleSaved = useSaved((s) => s.toggleProducer)
  const markVisited = useMapUi((s) => s.markVisited)
  const lf = useLotFormat()
  const tier = p.saleModes.includes('measure') ? p.pricing.tiers[0] : undefined
  const lot = pin.best.lot ? p.lots.find((l) => l.id === pin.best.lot?.lotId) : undefined

  return (
    <div className={cn('flex flex-col gap-1 bg-surface p-2.5 text-ink', className)}>
      <div className={cn('flex items-start gap-1.5', closeGap && 'pe-7')}>
        <p className="line-clamp-2 flex-1 text-[13px] font-semibold leading-snug" lang={p.contentLang}>
          {p.name}
        </p>
        <button
          type="button"
          onClick={() => toggleSaved(producer.id)}
          aria-pressed={saved}
          aria-label={t(saved ? 'map.unsave' : 'map.save', { name: producer.name })}
          className="-mt-0.5 grid size-6 shrink-0 place-items-center rounded-full hover:bg-surface-2"
        >
          <Heart className={cn('size-3.5', saved ? 'fill-primary text-primary' : 'text-ink-muted')} aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <span className="truncate font-medium text-ink-muted">{producer.name}</span>
        <VerificationBadge level={producer.verification} compact />
        {producer.reviewCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-ink-muted tabular">
            <Star className="size-3 fill-current text-accent" aria-hidden />
            {fmt.number(producer.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {lot && <LotBadge />}
        {p.expiryDate ? <ExpiryBadge expiryDate={p.expiryDate} /> : <AvailabilityBadge product={p} />}
        <span className="text-xs text-ink-muted">{fmt.distance(pin.best.distanceKm)}</span>
      </div>
      {lot && pin.best.lot && <LotSummaryLine product={p} lot={lot} lotsAvailable={pin.best.lot.lotsAvailable} />}
      <div className="flex items-end justify-between gap-2">
        <span className="text-sm font-semibold">
            {!tier && lot ? (
              <Price amount={lot.pricePerLot} currency={p.pricing.currency} unitLabel={lf.unit} compact={lot.pricePerLot >= 100} />
            ) : p.pricing.mode === 'on_request' || !tier ? (
              t('common.priceOnRequest')
            ) : (
              <Price amount={tier.unitPrice} currency={p.pricing.currency} unit={p.unit} compact={tier.unitPrice >= 100} />
            )}
        </span>
        {pin.count > 1 && <span className="text-xs text-ink-subtle">{t('map.moreProducts', { count: pin.count - 1 })}</span>}
      </div>
      <div className="mt-0.5 grid grid-cols-2 gap-1.5">
        <Link to={`/product/${p.id}`} onClick={() => markVisited(producer.id)} className={cn(buttonClass('primary', 'sm'), 'h-8')}>
          {t('map.view')}
        </Link>
        <Link to={`/messages?producer=${producer.id}&product=${p.id}`} className={cn(buttonClass('secondary', 'sm'), 'h-8')}>
          <MessageSquare className="size-3.5" aria-hidden />
          {t('map.chat')}
        </Link>
      </div>
    </div>
  )
}
