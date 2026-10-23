import { useTranslation } from 'react-i18next'
import { Boxes } from 'lucide-react'
import type { Lot, Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { cn } from '@/shared/lib/cn'
import { normalizedLotPrice } from './lotMath'
import { useLotFormat } from './useLotFormat'

/** "Lot · Pallet: 80 crates × 12 kg · 12 lots available · €1,150 per lot (approx. €1.20 / kg)" */
export function LotSummaryLine({ product, lot, lotsAvailable, className }: { product: Product; lot: Lot; lotsAvailable: number; className?: string }) {
  const { t } = useTranslation()
  const lf = useLotFormat()
  const norm = normalizedLotPrice(lot, product.unit)
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 rounded-md bg-surface-2 px-2 py-1.5 text-xs text-ink-muted', className)}>
      <Boxes className="size-3.5 shrink-0 self-center text-ink" aria-hidden />
      <span className="font-semibold text-ink">{t('lots.lotLabel', { type: lf.type(lot.type) })}</span>
      <span>{lf.content(lot.content)}</span>
      <span aria-hidden>·</span>
      <span>{lf.available(lotsAvailable)}</span>
      <span aria-hidden>·</span>
      <span className="font-medium text-ink">
        <Price amount={lot.pricePerLot} currency={product.pricing.currency} unitLabel={lf.unit} compact={lot.pricePerLot >= 1000} />
      </span>
      {norm && (
        <span>
          ({t('lots.approx')} <Price amount={norm.amount} currency={product.pricing.currency} unit={norm.unit} />)
        </span>
      )}
    </p>
  )
}
