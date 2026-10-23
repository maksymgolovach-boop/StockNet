import { useTranslation } from 'react-i18next'
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import type { Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { availableLots, lotQuantityRule, pricePerLotFor, sellableLots } from '@/features/lots/lotMath'
import { useLotFormat } from '@/features/lots/useLotFormat'
import { cn } from '@/shared/lib/cn'
import type { RfqValues } from './rfqSchema'

const input = 'h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm aria-[invalid=true]:border-expired'

interface Props {
  index: number
  products: Product[]
  control: Control<RfqValues>
  register: UseFormRegister<RfqValues>
  setValue: UseFormSetValue<RfqValues>
  errors: FieldErrors<RfqValues>
  onRemove?: () => void
}

export function RfqItemRow({ index: i, products, control, register, setValue, errors, onRemove }: Props) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lf = useLotFormat()
  const item = useWatch({ control, name: `items.${i}` })
  const product = products.find((p) => p.id === item?.productId)
  const lots = product ? sellableLots(product) : []
  const lot = lots.find((l) => l.id === item?.lotId)
  const q = Number((item?.quantity ?? '').replace(',', '.'))
  const e = errors.items?.[i]
  const msg = (k: 'productId' | 'quantity' | 'lotId' | 'mode') => e?.[k]?.message
  const measureTier = product && item?.mode === 'measure' ? ([...product.pricing.tiers].reverse().find((tr) => q >= tr.minQty) ?? product.pricing.tiers[0]) : undefined
  const unitPrice = item?.mode === 'lot' && lot ? pricePerLotFor(lot, q || 1) : measureTier?.unitPrice
  const rule = lot ? lotQuantityRule(lot) : undefined
  const id = (k: string) => `rfq-${i}-${k}`

  const pickProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    setValue(`items.${i}.productId`, productId, { shouldValidate: false })
    if (!p) return
    const firstLot = sellableLots(p)[0]
    const mode = p.saleModes.includes('measure') ? 'measure' : 'lot'
    setValue(`items.${i}.mode`, mode)
    setValue(`items.${i}.lotId`, firstLot?.id ?? '')
    setValue(`items.${i}.quantity`, String(mode === 'lot' && firstLot ? lotQuantityRule(firstLot).min : p.moq))
  }

  return (
    <li className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={id('product')} className="text-xs font-medium text-ink-muted">
            {t('rfq.product')} {i + 1}
          </label>
          <select id={id('product')} value={item?.productId ?? ''} onChange={(ev) => pickProduct(ev.target.value)} aria-invalid={!!msg('productId')} className={input}>
            <option value="">{t('lots.form.chooseProduct')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {msg('productId') && <p className="text-xs text-expired">{t(msg('productId') as string)}</p>}
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={t('rfq.removeItem', { index: i + 1 })} className="mt-5 grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-2">
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {product && (
        <>
          {product.saleModes.includes('measure') && lots.length > 0 && (
            <div role="radiogroup" aria-label={t('lots.filters.saleMode')} className="grid grid-cols-2 gap-1 self-start rounded-[var(--radius-control)] bg-surface-2 p-1 text-sm sm:w-72">
              {(['measure', 'lot'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={item?.mode === mode}
                  onClick={() => {
                    setValue(`items.${i}.mode`, mode)
                    setValue(`items.${i}.quantity`, String(mode === 'lot' && lots[0] ? lotQuantityRule(lots[0]).min : product.moq))
                    if (mode === 'lot' && !item?.lotId) setValue(`items.${i}.lotId`, lots[0]?.id ?? '')
                  }}
                  className={cn('h-8 rounded-[calc(var(--radius-control)-2px)] font-medium', item?.mode === mode ? 'bg-ink text-bg' : 'text-ink-muted')}
                >
                  {t(`lots.buyBy.${mode}`)}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start">
            {item?.mode === 'lot' ? (
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={id('lot')} className="text-xs font-medium text-ink-muted">
                  {t('rfq.lot')}
                </label>
                <select id={id('lot')} {...register(`items.${i}.lotId`)} aria-invalid={!!msg('lotId')} className={input}>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lotNumber} · {lf.type(l.type)} · {lf.content(l.content)} · {lf.available(availableLots(l))}
                    </option>
                  ))}
                </select>
                {msg('lotId') && <p className="text-xs text-expired">{t(msg('lotId') as string)}</p>}
              </div>
            ) : (
              <p className="self-center text-xs text-ink-muted">{t('product.moqLong', { qty: fmt.quantity(product.moq, product.unit, { withImperial: false }) })}</p>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor={id('qty')} className="text-xs font-medium text-ink-muted">
                {item?.mode === 'lot' ? t('lots.quantityLabel') : t('rfq.quantityIn', { unit: t(`units.${product.unit}`) })}
              </label>
              <input id={id('qty')} {...register(`items.${i}.quantity`)} inputMode="decimal" step={rule?.step} aria-invalid={!!msg('quantity')} className={input} />
              {msg('quantity') ? (
                <p className="text-xs text-expired">{t(msg('quantity') as string, { min: rule ? lf.lots(rule.min) : product.moq, step: rule?.step, max: lot ? availableLots(lot) : '' })}</p>
              ) : rule ? (
                <p className="text-xs text-ink-subtle">{rule.divisible ? t('lots.divisibleShort', { step: fmt.number(rule.step) }) : t('lots.indivisibleShort')}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-0.5 text-sm sm:items-end sm:pt-5">
              {unitPrice !== undefined && (
                <>
                  <span className="text-xs text-ink-muted">
                    <Price amount={unitPrice} currency={product.pricing.currency} unit={item?.mode === 'lot' ? undefined : product.unit} unitLabel={item?.mode === 'lot' ? t('lots.unit') : undefined} />
                  </span>
                  {q > 0 && (
                    <span className="font-semibold">
                      <Price amount={unitPrice * q} currency={product.pricing.currency} />
                    </span>
                  )}
                </>
              )}
              {product.pricing.mode === 'on_request' && item?.mode === 'measure' && <span className="text-xs text-ink-muted">{t('common.priceOnRequest')}</span>}
            </div>
          </div>
        </>
      )}
    </li>
  )
}
