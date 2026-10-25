import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { FileSignature, Plus } from 'lucide-react'
import type { Deal, Incoterm, Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useCompanyIds } from '@/features/dev/devStore'
import { useDeal, useDealMutations } from '@/features/deals/useDeals'
import { useFormat } from '@/features/i18n/useFormat'
import { isSellable, lotQuantityRule, pricePerLotFor, sellableLots } from '@/features/lots/lotMath'
import { CITIES } from '@/mocks/cities'
import { useBuyers, useProducers, useProducts } from '@/services/queries'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Button } from '@/shared/ui/Button'
import { LoadingRegion, Skeleton } from '@/shared/ui/states'
import { liveNow } from '@/shared/lib/dates'
import { RfqItemRow } from './RfqItemRow'
import { rfqSchema, type RfqItemValues, type RfqValues } from './rfqSchema'

const input = 'h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm aria-[invalid=true]:border-expired'
const COUNTRIES = [...new Set(CITIES.map((c) => c.country))].sort()

function itemFor(product: Product, lotId?: string | null, qty?: string | null): RfqItemValues {
  const lot = sellableLots(product).find((l) => l.id === lotId)
  if (lot) return { productId: product.id, mode: 'lot', lotId: lot.id, quantity: qty ?? String(lotQuantityRule(lot).min) }
  if (product.saleModes.includes('measure')) return { productId: product.id, mode: 'measure', lotId: sellableLots(product)[0]?.id ?? '', quantity: String(product.moq) }
  const first = sellableLots(product)[0]
  return { productId: product.id, mode: 'lot', lotId: first?.id ?? '', quantity: String(first ? lotQuantityRule(first).min : 1) }
}

function fromDeal(deal: Deal, products: Product[]): RfqItemValues[] {
  return deal.lineItems.flatMap((li): RfqItemValues[] => {
    const product = products.find((p) => p.id === li.productId)
    if (!product) return []
    if (li.lot) {
      const lot = product.lots.find((l) => l.id === li.lot?.lotId && isSellable(l)) ?? sellableLots(product)[0]
      if (lot) return [{ productId: product.id, mode: 'lot' as const, lotId: lot.id, quantity: String(Math.max(li.quantity, lotQuantityRule(lot).min)) }]
    }
    return product.saleModes.includes('measure') ? [{ productId: product.id, mode: 'measure' as const, lotId: '', quantity: String(Math.max(li.quantity, product.moq)) }] : []
  })
}

function RfqForm({ initial, products, producerFixed, reorderOf }: { initial: RfqValues; products: Product[]; producerFixed: boolean; reorderOf?: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const navigate = useNavigate()
  const producers = useProducers()
  const { createQuote } = useDealMutations()
  const resolver: Resolver<RfqValues> = (values, ctx, opts) => (zodResolver(rfqSchema(products)) as unknown as Resolver<RfqValues>)(values, ctx, opts)
  const { register, handleSubmit, control, setValue, formState } = useForm<RfqValues>({ defaultValues: initial, resolver })
  const items = useFieldArray({ control, name: 'items' })
  const values = useWatch({ control })
  const producerProducts = useMemo(() => products.filter((p) => p.producerId === values.producerId && (p.saleModes.includes('measure') || sellableLots(p).length > 0)), [products, values.producerId])
  const incoterms = useMemo(() => {
    const chosen = (values.items ?? []).map((i) => products.find((p) => p.id === i.productId)).filter((p): p is Product => !!p)
    const sets = chosen.map((p) => p.logistics.incoterms)
    const all: Incoterm[] = ['EXW', 'FCA', 'DAP', 'DDP']
    return sets.length ? all.filter((i) => sets.every((s) => s.includes(i))) : all
  }, [values.items, products])
  const totals = useMemo(() => {
    const byCurrency = new Map<string, number>()
    for (const it of values.items ?? []) {
      const p = products.find((x) => x.id === it.productId)
      const q = Number((it.quantity ?? '').replace(',', '.'))
      if (!p || !(q > 0)) continue
      const lot = it.mode === 'lot' ? p.lots.find((l) => l.id === it.lotId) : undefined
      const unit = lot ? pricePerLotFor(lot, q) : ([...p.pricing.tiers].reverse().find((tr) => q >= tr.minQty) ?? p.pricing.tiers[0])?.unitPrice
      if (unit !== undefined) byCurrency.set(p.pricing.currency, (byCurrency.get(p.pricing.currency) ?? 0) + unit * q)
    }
    return [...byCurrency.entries()]
  }, [values.items, products])
  const err = (k: keyof RfqValues) => (formState.errors[k] as { message?: string } | undefined)?.message
  const tomorrow = new Date(liveNow().getTime() + 86_400_000).toISOString().slice(0, 10)

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) =>
        createQuote.mutate(
          {
            producerId: v.producerId,
            items: v.items.map((it) => ({ productId: it.productId, mode: it.mode, quantity: Number(it.quantity.replace(',', '.')), lotId: it.mode === 'lot' ? it.lotId : undefined })),
            deliveryAddress: { street: v.street.trim(), postcode: v.postcode.trim(), city: v.city.trim(), region: '', country: v.country },
            incoterm: v.incoterm as Incoterm,
            requestedDeliveryDate: new Date(`${v.date}T12:00:00Z`).toISOString(),
            notes: v.notes.trim(),
            attachments: v.attachments,
            reorderOf,
            lang: fmt.lang,
          },
          { onSuccess: (deal) => navigate(`/deals/${deal.id}`, { state: { notice: t('rfq.created', { id: deal.id }) } }) },
        ),
      )}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="rfq-producer" className="flex flex-col gap-2">
          <h2 id="rfq-producer" className="text-lg font-semibold">
            {t('rfq.producerTitle')}
          </h2>
          <select
            {...register('producerId')}
            disabled={producerFixed}
            aria-invalid={!!err('producerId')}
            aria-label={t('rfq.producerTitle')}
            onChange={(e) => {
              setValue('producerId', e.target.value)
              setValue('items', [{ productId: '', mode: 'measure', lotId: '', quantity: '' }])
            }}
            className={input}
          >
            <option value="">{t('rfq.chooseProducer')}</option>
            {(producers.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.address.city}
              </option>
            ))}
          </select>
          {err('producerId') && <p className="text-xs text-expired">{t(err('producerId') as string)}</p>}
          <p className="text-xs text-ink-subtle">{t('rfq.oneProducer')}</p>
        </section>
        <section aria-labelledby="rfq-items" className="flex flex-col gap-3">
          <h2 id="rfq-items" className="text-lg font-semibold">
            {t('rfq.itemsTitle')}
          </h2>
          <ul className="flex flex-col gap-3">
            {items.fields.map((f, i) => (
              <RfqItemRow key={f.id} index={i} products={producerProducts} control={control} register={register} setValue={setValue} errors={formState.errors} onRemove={items.fields.length > 1 ? () => items.remove(i) : undefined} />
            ))}
          </ul>
          {formState.errors.items?.message && <p className="text-xs text-expired">{t(formState.errors.items.message)}</p>}
          <Button variant="secondary" size="sm" className="self-start" icon={<Plus className="size-4" aria-hidden />} disabled={!values.producerId || items.fields.length >= 10} onClick={() => items.append({ productId: '', mode: 'measure', lotId: '', quantity: '' })}>
            {t('rfq.addItem')}
          </Button>
        </section>
        <section aria-labelledby="rfq-delivery" className="flex flex-col gap-3">
          <h2 id="rfq-delivery" className="text-lg font-semibold">
            {t('rfq.deliveryTitle')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['street', 'postcode', 'city'] as const).map((k) => (
              <label key={k} className={`flex flex-col gap-1 text-xs font-medium text-ink-muted ${k === 'street' ? 'sm:col-span-2' : ''}`}>
                {t(`rfq.${k}`)}
                <input {...register(k)} aria-invalid={!!err(k)} className={`${input} text-ink`} autoComplete={k === 'street' ? 'address-line1' : k === 'postcode' ? 'postal-code' : 'address-level2'} />
                {err(k) && <span className="text-expired">{t(err(k) as string)}</span>}
              </label>
            ))}
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
              {t('rfq.country')}
              <select {...register('country')} className={`${input} text-ink`}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {fmt.region(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
              {t('rfq.incoterm')}
              <select {...register('incoterm')} aria-invalid={!!err('incoterm')} className={`${input} text-ink`}>
                {incoterms.map((i) => (
                  <option key={i} value={i}>
                    {i} · {t(`rfq.incoterms.${i}`)}
                  </option>
                ))}
              </select>
              {err('incoterm') && <span className="text-expired">{t(err('incoterm') as string)}</span>}
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
              {t('rfq.date')}
              <input type="date" min={tomorrow} {...register('date')} aria-invalid={!!err('date')} className={`${input} text-ink`} />
              {err('date') && <span className="text-expired">{t(err('date') as string)}</span>}
            </label>
          </div>
        </section>
        <section aria-labelledby="rfq-notes" className="flex flex-col gap-3">
          <h2 id="rfq-notes" className="text-lg font-semibold">
            {t('rfq.notesTitle')}
          </h2>
          <textarea {...register('notes')} rows={4} placeholder={t('rfq.notesPlaceholder')} aria-label={t('rfq.notesTitle')} className="rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 py-2 text-sm" />
          {err('notes') && <p className="text-xs text-expired">{t(err('notes') as string)}</p>}
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            {t('rfq.attachments')}
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.dwg,.dxf,.step,.stp,.xlsx,.csv"
              onChange={(e) => setValue('attachments', Array.from(e.target.files ?? []).map((f) => f.name).slice(0, 5))}
              className="text-sm text-ink file:me-3 file:h-9 file:rounded-[var(--radius-control)] file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm"
            />
            <span className="text-ink-subtle">{values.attachments?.length ? values.attachments.join(', ') : t('rfq.attachmentsHint')}</span>
          </label>
        </section>
      </div>
      <aside className="flex flex-col gap-3 lg:sticky lg:top-[calc(var(--header-h,8rem)+1rem)] lg:self-start">
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-ink bg-surface p-4">
          <h2 className="text-lg font-semibold">{t('rfq.summary')}</h2>
          <p className="text-sm text-ink-muted">{t('rfq.itemCount', { count: values.items?.filter((i) => i.productId).length ?? 0 })}</p>
          {totals.map(([currency, amount]) => (
            <p key={currency} className="flex items-baseline justify-between text-sm">
              <span className="text-ink-muted">{t('rfq.indicative')}</span>
              <span className="text-lg font-semibold">
                <Price amount={amount} currency={currency as Product['pricing']['currency']} />
              </span>
            </p>
          ))}
          <p className="text-xs text-ink-subtle">{t('rfq.indicativeNote')}</p>
          {createQuote.error && (
            <p role="alert" className="text-sm text-expired">
              {createQuote.error.message}
            </p>
          )}
          <Button type="submit" size="lg" disabled={createQuote.isPending} icon={<FileSignature className="size-4" aria-hidden />}>
            {createQuote.isPending ? t('rfq.sending') : t('rfq.submit')}
          </Button>
          <p className="text-xs text-ink-muted">{t('rfq.afterSubmit')}</p>
        </div>
      </aside>
    </form>
  )
}

export function RfqPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const { buyerId } = useCompanyIds()
  const products = useProducts()
  const buyers = useBuyers()
  const reorderId = params.get('reorder') ?? ''
  const reorder = useDeal(reorderId)
  const [initial, setInitial] = useState<{ values: RfqValues; fixed: boolean } | null>(null)

  useEffect(() => {
    document.title = `${t('pages.rfq')} · Stocknet`
  }, [t])

  useEffect(() => {
    if (initial || !products.data || !buyers.data || (reorderId && reorder.isPending)) return
    const buyer = buyers.data.find((b) => b.id === buyerId)
    const productId = params.get('product')
    const product = products.data.find((p) => p.id === productId)
    const deal = reorder.data
    const producerId = deal?.producerId ?? product?.producerId ?? params.get('producer') ?? ''
    const items = deal ? fromDeal(deal, products.data) : product ? [itemFor(product, params.get('lot'), params.get('lots'))] : [{ productId: '', mode: 'measure' as const, lotId: '', quantity: '' }]
    const address = deal?.deliveryAddress ?? buyer?.address
    const date = new Date(liveNow().getTime() + 14 * 86_400_000).toISOString().slice(0, 10)
    setInitial({
      fixed: !!(deal || product),
      values: {
        producerId,
        items: items.length ? items : [{ productId: '', mode: 'measure', lotId: '', quantity: '' }],
        street: address?.street ?? '',
        postcode: address?.postcode ?? '',
        city: address?.city ?? '',
        country: address?.country ?? 'RO',
        incoterm: deal?.incoterm ?? (product?.logistics.incoterms.includes('DAP') ? 'DAP' : (product?.logistics.incoterms[0] ?? 'DAP')),
        date,
        notes: deal ? t('rfq.reorderNote', { id: deal.id }) : '',
        attachments: [],
      },
    })
  }, [initial, products.data, buyers.data, reorder.isPending, reorder.data, reorderId, params, buyerId, t])

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('pages.deals'), to: '/deals' }, { label: t('pages.rfq') }]} />
      <div>
        <h1 className="text-3xl font-semibold">{reorderId ? t('rfq.reorderTitle', { id: reorderId }) : t('pages.rfq')}</h1>
        <p className="text-sm text-ink-muted">{t('rfq.subtitle')}</p>
      </div>
      {!initial || !products.data ? (
        <LoadingRegion>
          <Skeleton className="h-96" />
        </LoadingRegion>
      ) : (
        <RfqForm initial={initial.values} products={products.data} producerFixed={initial.fixed} reorderOf={reorderId || undefined} />
      )}
    </div>
  )
}
