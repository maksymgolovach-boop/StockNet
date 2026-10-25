import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileSignature, Info, Minus, Plus } from 'lucide-react'
import type { Lot, Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { useIsOwnProducer } from '@/features/dev/devStore'
import { ButtonLink } from '@/shared/ui/Button'
import { availableLots, clampLotQuantity, lotMeasure, lotQuantityRule, normalizedLotPrice, pricePerLotFor } from './lotMath'
import { useLotFormat } from './useLotFormat'

export function LotOrderPanel({ product, lot }: { product: Product; lot: Lot }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lf = useLotFormat()
  const rule = lotQuantityRule(lot)
  const max = availableLots(lot)
  const [qty, setQty] = useState(() => clampLotQuantity(lot, rule.min))
  const quantity = clampLotQuantity(lot, qty)
  const perLot = pricePerLotFor(lot, quantity)
  const total = perLot * quantity
  const measure = lotMeasure(lot, product.unit)
  const norm = normalizedLotPrice({ ...lot, pricePerLot: perLot }, product.unit)
  const cur = product.pricing.currency
  const step = (dir: 1 | -1) => setQty(clampLotQuantity(lot, quantity + dir * rule.step))
  const isOwner = useIsOwnProducer(product.producerId)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('lots.selectedLot', { number: lot.lotNumber })}</p>
        <p className="text-3xl leading-tight font-semibold">
          <Price amount={perLot} currency={cur} unitLabel={lf.unit} />
        </p>
        {norm && (
          <p className="text-sm text-ink-muted">
            {t('lots.approx')} <Price amount={norm.amount} currency={cur} unit={norm.unit} />
          </p>
        )}
        <p className="mt-1 text-sm">
          {lf.type(lot.type)}: {lf.content(lot.content)}
          {measure.unit === product.unit && measure.unit !== lot.content.unit && <span className="text-ink-muted"> ≈ {fmt.quantity(measure.quantity, measure.unit, { withImperial: false })}</span>}
        </p>
      </div>
      {lot.tiers.length > 1 && (
        <table className="w-full text-sm">
          <caption className="mb-1 text-start text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('lots.tiers')}</caption>
          <tbody>
            {lot.tiers.map((tier) => (
              <tr key={tier.minLots} className={tier.pricePerLot === perLot ? 'font-semibold' : ''}>
                <td className="border-t border-line py-1.5">{tier.maxLots ? t('lots.tierRange', { from: tier.minLots, to: tier.maxLots }) : t('lots.tierFrom', { from: tier.minLots })}</td>
                <td className="border-t border-line py-1.5 text-end">
                  <Price amount={tier.pricePerLot} currency={cur} unitLabel={lf.unit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lot-qty" className="text-sm font-medium">
          {t('lots.quantityLabel')}
        </label>
        <div className="flex items-stretch gap-2">
          <button type="button" onClick={() => step(-1)} disabled={quantity <= rule.min} aria-label={t('lots.decrease')} className="grid size-10 place-items-center rounded-[var(--radius-control)] border border-line-strong disabled:opacity-40">
            <Minus className="size-4" aria-hidden />
          </button>
          <input
            id="lot-qty"
            type="number"
            inputMode="decimal"
            min={rule.min}
            max={max}
            step={rule.step}
            value={quantity}
            readOnly={!rule.divisible && max <= 1}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-10 w-24 rounded-[var(--radius-control)] border border-line-strong bg-surface text-center text-base tabular"
            aria-describedby="lot-qty-help"
          />
          <button type="button" onClick={() => step(1)} disabled={quantity >= max} aria-label={t('lots.increase')} className="grid size-10 place-items-center rounded-[var(--radius-control)] border border-line-strong disabled:opacity-40">
            <Plus className="size-4" aria-hidden />
          </button>
          <span className="self-center text-sm text-ink-muted">{lf.lots(quantity)}</span>
        </div>
        <p id="lot-qty-help" className="flex items-start gap-1.5 text-xs text-ink-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          {rule.divisible
            ? t('lots.divisibleHelp', { step: fmt.number(rule.step), min: lf.lots(rule.min) })
            : max === 1
              ? t('lots.indivisibleSingle')
              : t('lots.indivisibleHelp', { min: lf.lots(rule.min) })}
        </p>
        <p className="text-xs text-ink-muted">{lf.available(max)}</p>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm text-ink-muted">{t('lots.total')}</span>
        <span className="text-xl font-semibold">
          <Price amount={total} currency={cur} />
        </span>
      </div>
      {!isOwner && (
        <ButtonLink to={`/deals/new?product=${product.id}&lot=${lot.id}&lots=${quantity}`} size="lg" icon={<FileSignature className="size-4" aria-hidden />}>
          {t('lots.requestLotQuote')}
        </ButtonLink>
      )}
    </div>
  )
}
