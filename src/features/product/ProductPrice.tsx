import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import type { Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { bestLot, isLotOnly, lotQuantityRule, normalizedLotPrice } from '@/features/lots/lotMath'
import { useLotFormat } from '@/features/lots/useLotFormat'
import { Tooltip } from '@/shared/ui/Tooltip'
import { cn } from '@/shared/lib/cn'

/** Price block for cards: fixed (MOQ tier), indexed (with "price may change"), or on request. */
function LotPrice({ product, lotId, alignClass }: { product: Product; lotId?: string; alignClass: string }) {
  const { t } = useTranslation()
  const lf = useLotFormat()
  const lot = product.lots.find((l) => l.id === lotId) ?? bestLot(product)
  if (!lot) return <span className={cn('flex flex-col text-sm font-semibold', alignClass)}>{t('lots.noneAvailable')}</span>
  const norm = normalizedLotPrice(lot, product.unit)
  return (
    <div className={cn('flex flex-col gap-0.5', alignClass)}>
      <span className="relative z-10 text-lg font-semibold leading-tight">
        <Price amount={lot.pricePerLot} currency={product.pricing.currency} unitLabel={lf.unit} compact={lot.pricePerLot >= 100} />
      </span>
      {norm && (
        <span className="relative z-10 text-xs text-ink-muted">
          {t('lots.approx')} <Price amount={norm.amount} currency={product.pricing.currency} unit={norm.unit} />
        </span>
      )}
      <span className="text-xs text-ink-muted">
        {t('lots.moq', { lots: lf.lots(lotQuantityRule(lot).min) })}
        {lot.tiers.length > 1 && ` · ${t('product.tiers', { count: lot.tiers.length })}`}
      </span>
    </div>
  )
}

export function ProductPrice({ product, align = 'end', lotId }: { product: Product; align?: 'start' | 'end' | 'responsive'; lotId?: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  if (isLotOnly(product)) {
    const alignClass = align === 'end' ? 'items-end text-end' : align === 'responsive' ? 'items-start @3xl:items-end @3xl:text-end' : 'items-start'
    return <LotPrice product={product} lotId={lotId} alignClass={alignClass} />
  }
  const { pricing, unit, moq } = product
  const tier = pricing.tiers[0]
  const discount = product.clearance?.discountPct
  return (
    <div className={cn('flex flex-col gap-0.5', align === 'end' ? 'items-end text-end' : align === 'responsive' ? 'items-start @3xl:items-end @3xl:text-end' : 'items-start')}>
      {pricing.mode === 'on_request' || !tier ? (
        <span className="text-sm font-semibold">{t('common.priceOnRequest')}</span>
      ) : (
        <>
          {discount && (
            <span className="text-xs text-ink-subtle line-through">
              <Price amount={tier.unitPrice / (1 - discount / 100)} currency={pricing.currency} unit={unit} compact />
            </span>
          )}
          <span className="relative z-10 text-lg font-semibold leading-tight">
            <Price amount={tier.unitPrice} currency={pricing.currency} unit={unit} compact={tier.unitPrice >= 100} />
          </span>
          {pricing.mode === 'indexed' && pricing.index && (
            <Tooltip content={t('fx.priceMayChange', { index: pricing.index.name })}>
              <span tabIndex={0} className="relative z-10 inline-flex items-center gap-1 text-xs font-medium text-accent">
                <TrendingUp className="size-3" aria-hidden />
                {t('common.indexedPrice')}
              </span>
            </Tooltip>
          )}
        </>
      )}
      <span className="text-xs text-ink-muted">
        {t('product.moq', { qty: fmt.quantity(moq, unit, { withImperial: false }) })}
        {pricing.tiers.length > 1 && ` · ${t('product.tiers', { count: pricing.tiers.length })}`}
      </span>
    </div>
  )
}
