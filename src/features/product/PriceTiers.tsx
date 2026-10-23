import { useTranslation } from 'react-i18next'
import { Info, TrendingUp } from 'lucide-react'
import type { Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'

/** Price tiers and MOQ, or the indexed / on-request explanation. */
export function PriceTiers({ product }: { product: Product }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { pricing, unit, moq } = product
  const first = pricing.tiers[0]
  const discount = product.clearance?.discountPct
  if (pricing.mode === 'on_request' || !first)
    return (
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold">{t('common.priceOnRequest')}</p>
        <p className="text-sm text-ink-muted">{t('product.onRequestBody')}</p>
        <p className="text-sm">{t('product.moq', { qty: fmt.quantity(moq, unit) })}</p>
      </div>
    )
  return (
    <div className="flex flex-col gap-3">
      <div>
        {discount && (
          <p className="text-sm text-ink-subtle line-through">
            <Price amount={first.unitPrice / (1 - discount / 100)} currency={pricing.currency} unit={unit} />
          </p>
        )}
        <p className="text-3xl font-semibold leading-tight">
          <Price amount={first.unitPrice} currency={pricing.currency} unit={unit} />
        </p>
        <p className="text-sm text-ink-muted">{t('product.moqLong', { qty: fmt.quantity(moq, unit) })}</p>
      </div>
      {pricing.mode === 'indexed' && pricing.index && (
        <div className="flex gap-2 rounded-[var(--radius-control)] border border-accent/40 bg-accent-soft p-3 text-sm text-accent">
          <TrendingUp className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('fx.priceMayChange', { index: pricing.index.name })}</p>
            <p className="text-ink-muted">
              {t('product.indexFormula', { index: pricing.index.name, date: fmt.date(pricing.index.asOf) })}{' '}
              <Price amount={pricing.index.referenceValue} currency={pricing.currency} unit={unit} /> + <Price amount={pricing.index.premium} currency={pricing.currency} unit={unit} />
            </p>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <caption className="mb-1 text-start text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('product.priceTiers')}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{t('product.quantity')}</th>
            <th scope="col">{t('product.unitPrice')}</th>
            <th scope="col">{t('product.saving')}</th>
          </tr>
        </thead>
        <tbody>
          {pricing.tiers.map((tier) => {
            const saving = 1 - tier.unitPrice / first.unitPrice
            return (
              <tr key={tier.minQty} className="border-t border-line">
                <td className="py-1.5 tabular">
                  {tier.maxQty !== undefined
                    ? t('product.tierRange', { from: fmt.number(tier.minQty), to: fmt.number(tier.maxQty), unit: fmt.unitLabel(unit) })
                    : t('product.tierFrom', { from: fmt.number(tier.minQty), unit: fmt.unitLabel(unit) })}
                </td>
                <td className="py-1.5 text-end font-medium">
                  <Price amount={tier.unitPrice} currency={pricing.currency} unit={unit} />
                </td>
                <td className="w-16 py-1.5 text-end text-xs text-verified tabular">{saving > 0.001 ? `−${fmt.percent(saving, 1)}` : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="flex items-center gap-1 text-xs text-ink-subtle">
        <Info className="size-3.5" aria-hidden />
        {t('product.listedIn', { currency: pricing.currency })}
      </p>
    </div>
  )
}
