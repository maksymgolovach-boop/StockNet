import { useMemo, type ReactNode } from 'react'
import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import type { Lot, Product } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import type { UnitCode } from '@/config/units'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { CITIES } from '@/mocks/cities'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { LOT_CONDITIONS } from '@/features/search/filtersCodec'
import { lotMeasure } from '../lotMath'
import { useLotFormat } from '../useLotFormat'
import { lotFormSchema, toLotInput, type LotFormValues } from './lotFormSchema'
import type { LotInput } from '@/services/lotService'

const MEASURABLE: UnitCode[] = ['kg', 't', 'm', 'm2', 'm3', 'l']
const COUNT: UnitCode[] = ['piece', 'pallet', 'coil', 'bag', 'crate']
const input = 'h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm aria-[invalid=true]:border-expired'

function Field({ id, label, error, required, hint, children, className }: { id: string; label: string; error?: string; required?: boolean; hint?: ReactNode; children: ReactNode; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-expired">
          {t(error)}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="float-left mb-1 w-full text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

interface Props {
  products: Product[]
  initial: LotFormValues
  editing?: Lot
  submitting: boolean
  onSubmit: (input: LotInput) => void
  formId: string
}

export function LotForm({ products, initial, editing, submitting, onSubmit, formId }: Props) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lf = useLotFormat()
  const policyFor = (productId: string) => getCategoryConfig(products.find((p) => p.id === productId)?.categorySlug ?? '')?.lots
  const resolver: Resolver<LotFormValues> = (values, ctx, opts) =>
    zodResolver(
      lotFormSchema(policyFor(values.productId), {
        reserved: editing?.reservedCount ?? 0,
        hasCertificate: !!editing?.documents.some((d) => d.type === 'mill_test_certificate'),
      }),
    )(values, ctx, opts) as ReturnType<Resolver<LotFormValues>>
  const { register, handleSubmit, control, formState, setValue } = useForm<LotFormValues>({ defaultValues: initial, resolver, mode: 'onBlur' })
  const tiers = useFieldArray({ control, name: 'tiers' })
  const v = useWatch({ control })
  const product = products.find((p) => p.id === v.productId)
  const config = product ? getCategoryConfig(product.categorySlug) : undefined
  const policy = config?.lots
  const err = (path: string) => {
    const parts = path.split('.')
    let node: unknown = formState.errors
    for (const part of parts) node = (node as Record<string, unknown> | undefined)?.[part]
    return (node as { message?: string } | undefined)?.message
  }
  const a11y = (name: string) => ({ id: `${formId}-${name}`, 'aria-invalid': !!err(name), 'aria-describedby': err(name) ? `${formId}-${name}-err` : undefined })
  const contentUnits = useMemo(() => [...new Set([...COUNT, ...(config?.allowedUnits ?? [])])], [config])
  const preview = useMemo(() => {
    if (!product) return null
    const q = Number((v.contentQty ?? '').replace(',', '.'))
    const price = Number((v.pricePerLot ?? '').replace(',', '.'))
    if (!(q > 0)) return null
    const iq = Number((v.itemQty ?? '').replace(',', '.'))
    const m = lotMeasure(
      {
        content: { quantity: q, unit: (v.contentUnit || 'piece') as UnitCode, itemSize: iq > 0 && v.itemUnit ? { quantity: iq, unit: v.itemUnit as UnitCode } : undefined },
        totalWeightKg: Number(v.weightKg) || undefined,
        totalVolumeM3: Number(v.volumeM3) || undefined,
      },
      product.unit,
    )
    return { m, perUnit: price > 0 && m.quantity > 0 ? price / m.quantity : null }
  }, [product, v.contentQty, v.contentUnit, v.itemQty, v.itemUnit, v.weightKg, v.volumeM3, v.pricePerLot])

  return (
    <form id={formId} noValidate onSubmit={handleSubmit((values) => onSubmit(toLotInput(values)))} className="flex flex-col gap-5" aria-busy={submitting}>
      <Section title={t('lots.form.sections.listing')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${formId}-productId`} label={t('lots.form.product')} required error={err('productId')} className="sm:col-span-2">
            <select {...register('productId')} {...a11y('productId')} disabled={!!editing} className={input}>
              <option value="">{t('lots.form.chooseProduct')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-type`} label={t('lots.form.type')} required error={err('type')}>
            <select {...register('type')} {...a11y('type')} className={input}>
              <option value="">{t('lots.form.choose')}</option>
              {(policy?.lotTypes ?? []).map((lt) => (
                <option key={lt} value={lt}>
                  {lf.type(lt)}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-lotNumber`} label={t('lots.form.lotNumber')} required={policy?.requiresBatch} error={err('lotNumber')} hint={t('lots.form.lotNumberHint')}>
            <input {...register('lotNumber')} {...a11y('lotNumber')} className={cn(input, 'font-mono')} autoComplete="off" />
          </Field>
          <Field id={`${formId}-condition`} label={t('lots.form.condition')} required error={err('condition')}>
            <select {...register('condition')} {...a11y('condition')} className={input}>
              {LOT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {lf.condition(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-status`} label={t('lots.form.status')} error={err('status')}>
            <select {...register('status')} {...a11y('status')} className={input}>
              {(['active', 'paused', 'archived'] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`lots.recordStatus.${s}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title={t('lots.form.sections.content')}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field id={`${formId}-contentQty`} label={t('lots.form.contentQty')} required error={err('contentQty')}>
            <input {...register('contentQty')} {...a11y('contentQty')} inputMode="decimal" className={input} />
          </Field>
          <Field id={`${formId}-contentUnit`} label={t('lots.form.contentUnit')} required error={err('contentUnit')}>
            <select {...register('contentUnit')} {...a11y('contentUnit')} className={input}>
              {contentUnits.map((u) => (
                <option key={u} value={u}>
                  {t(`units.${u}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-itemQty`} label={t('lots.form.itemQty')} error={err('itemQty')}>
            <input {...register('itemQty')} {...a11y('itemQty')} inputMode="decimal" className={input} />
          </Field>
          <Field id={`${formId}-itemUnit`} label={t('lots.form.itemUnit')} error={err('itemUnit')}>
            <select {...register('itemUnit')} {...a11y('itemUnit')} className={input}>
              <option value="">—</option>
              {MEASURABLE.map((u) => (
                <option key={u} value={u}>
                  {t(`units.${u}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-weightKg`} label={t('lots.form.weightKg')} error={err('weightKg')} className="sm:col-span-2">
            <input {...register('weightKg')} {...a11y('weightKg')} inputMode="decimal" className={input} />
          </Field>
          <Field id={`${formId}-volumeM3`} label={t('lots.form.volumeM3')} error={err('volumeM3')} className="sm:col-span-2">
            <input {...register('volumeM3')} {...a11y('volumeM3')} inputMode="decimal" className={input} />
          </Field>
        </div>
        {preview && product && (
          <p className="rounded-md bg-surface-2 px-3 py-2 text-sm" aria-live="polite">
            {t('lots.form.preview', { size: preview.m.unit === product.unit ? fmt.quantity(preview.m.quantity, preview.m.unit, { withImperial: false }) : lf.amount(preview.m.quantity, preview.m.unit) })}
            {preview.perUnit !== null && preview.m.unit === product.unit && (
              <>
                {' · '}
                {t('lots.approx')} <Price amount={preview.perUnit} currency={product.pricing.currency} unit={product.unit} />
              </>
            )}
          </p>
        )}
      </Section>

      <Section title={t('lots.form.sections.price')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${formId}-pricePerLot`} label={t('lots.form.pricePerLot', { currency: product?.pricing.currency ?? '' })} required error={err('pricePerLot')}>
            <input {...register('pricePerLot')} {...a11y('pricePerLot')} inputMode="decimal" className={input} />
          </Field>
          <Field
            id={`${formId}-stockCount`}
            label={t('lots.form.stockCount')}
            required
            error={err('stockCount')}
            hint={editing?.reservedCount ? t('lots.form.reservedHint', { count: editing.reservedCount }) : undefined}
          >
            <input {...register('stockCount')} {...a11y('stockCount')} inputMode="numeric" className={input} />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-ink-muted">{t('lots.form.tiers')}</p>
          {tiers.fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Field id={`${formId}-tiers.${i}.minLots`} label={t('lots.form.tierFrom')} error={err(`tiers.${i}.minLots`)}>
                <input {...register(`tiers.${i}.minLots`)} {...a11y(`tiers.${i}.minLots`)} inputMode="numeric" className={input} />
              </Field>
              <Field id={`${formId}-tiers.${i}.price`} label={t('lots.form.tierPrice')} error={err(`tiers.${i}.price`)}>
                <input {...register(`tiers.${i}.price`)} {...a11y(`tiers.${i}.price`)} inputMode="decimal" className={input} />
              </Field>
              <button type="button" onClick={() => tiers.remove(i)} aria-label={t('lots.form.removeTier', { index: i + 1 })} className="mb-0.5 grid size-10 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-2">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="self-start" icon={<Plus className="size-4" aria-hidden />} onClick={() => tiers.append({ minLots: '', price: '' })} disabled={tiers.fields.length >= 4}>
            {t('lots.form.addTier')}
          </Button>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-ink-muted">{t('lots.form.divisibility')}</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={!v.divisible} onChange={() => setValue('divisible', false, { shouldDirty: true })} className="accent-[var(--primary)]" />
              {t('lots.form.indivisible')}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={!!v.divisible} onChange={() => setValue('divisible', true, { shouldDirty: true })} className="accent-[var(--primary)]" />
              {t('lots.form.divisible')}
            </label>
          </div>
          {v.divisible ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`${formId}-step`} label={t('lots.form.step')} error={err('step')} hint={t('lots.form.stepHint')}>
                <input {...register('step')} {...a11y('step')} inputMode="decimal" className={input} />
              </Field>
              <Field id={`${formId}-minSplit`} label={t('lots.form.minSplit')} error={err('minSplit')}>
                <input {...register('minSplit')} {...a11y('minSplit')} inputMode="decimal" className={input} />
              </Field>
            </div>
          ) : (
            <Field id={`${formId}-moqLots`} label={t('lots.form.moqLots')} error={err('moqLots')} className="sm:max-w-[50%]">
              <input {...register('moqLots')} {...a11y('moqLots')} inputMode="numeric" className={input} />
            </Field>
          )}
        </fieldset>
      </Section>

      <Section title={t('lots.form.sections.dates')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${formId}-productionDate`} label={t('lots.form.productionDate')} error={err('productionDate')}>
            <input type="date" {...register('productionDate')} {...a11y('productionDate')} className={input} />
          </Field>
          <Field id={`${formId}-expiryDate`} label={t('lots.form.expiryDate')} required={policy?.requiresExpiry} error={err('expiryDate')} hint={policy?.requiresExpiry ? t('lots.form.expiryHint') : undefined}>
            <input type="date" {...register('expiryDate')} {...a11y('expiryDate')} className={input} />
          </Field>
          <Field
            id={`${formId}-certificateFile`}
            label={t('lots.form.certificate')}
            required={policy?.requiresCertificate && !editing?.documents.length}
            error={err('certificateFile')}
            hint={v.certificateFile ? v.certificateFile : editing?.documents[0]?.fileName ?? t('lots.form.certificateHint')}
            className="sm:col-span-2"
          >
            <input
              id={`${formId}-certificateFile`}
              type="file"
              accept=".pdf,image/*"
              aria-invalid={!!err('certificateFile')}
              onChange={(e) => setValue('certificateFile', e.target.files?.[0]?.name ?? '', { shouldValidate: true, shouldDirty: true })}
              className="text-sm file:me-3 file:h-9 file:rounded-[var(--radius-control)] file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm"
            />
          </Field>
        </div>
      </Section>

      <Section title={t('lots.form.sections.location')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${formId}-warehouseLabel`} label={t('lots.form.warehouse')} required error={err('warehouseLabel')}>
            <input {...register('warehouseLabel')} {...a11y('warehouseLabel')} className={input} />
          </Field>
          <Field id={`${formId}-cityId`} label={t('lots.form.city')} required error={err('cityId')}>
            <select {...register('cityId')} {...a11y('cityId')} className={input}>
              {[...CITIES]
                .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {fmt.region(c.country)}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </Section>
    </form>
  )
}
