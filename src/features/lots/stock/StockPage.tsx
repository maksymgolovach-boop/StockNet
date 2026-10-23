import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Boxes, Plus, Search, Store } from 'lucide-react'
import type { LotStatus, Product } from '@/types/models'
import { useCurrency } from '@/features/currency/useCurrency'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { CITIES } from '@/mocks/cities'
import { normalize } from '@/features/search/normalize'
import { useProducer } from '@/services/queries'
import type { ProducerLotRow } from '@/services/lotService'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/Select'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import { now } from '@/shared/lib/dates'
import { availableLots, lotStatus } from '../lotMath'
import { LotForm } from './LotForm'
import { StockTable } from './StockTable'
import { toFormValues } from './lotFormSchema'
import { useLotMutations, useProducerLots, useProducerProducts } from './useLotMutations'

const STATUSES: LotStatus[] = ['available', 'reserved', 'sold', 'expired', 'paused', 'archived']

function cityIdFor(name: string, country: string, fallback: string) {
  return CITIES.find((c) => c.name === name && c.country === country)?.id ?? fallback
}

export function StockPage() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const role = useDevStore((s) => s.role)
  const setRole = useDevStore((s) => s.setRole)
  const producerId = useActorId()
  const [params, setParams] = useSearchParams()
  const lots = useProducerLots()
  const products = useProducerProducts()
  const producer = useProducer(role === 'producer' ? producerId : undefined)
  const m = useLotMutations()
  const { convert, format, display } = useCurrency()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LotStatus | 'all'>('all')
  const [productFilter, setProductFilter] = useState('')
  const [editing, setEditing] = useState<ProducerLotRow | null>(null)
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const busyId = (m.setStock.isPending && m.setStock.variables?.lotId) || (m.setStatus.isPending && m.setStatus.variables?.lotId) || (m.duplicate.isPending && m.duplicate.variables) || undefined

  useEffect(() => {
    document.title = `${t('lots.stock.title')} · Stocknet`
  }, [t])

  const requestedNew = params.get('new')
  useEffect(() => {
    if (requestedNew === null || role !== 'producer') return
    setCreatingFor(requestedNew)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('new')
      return next
    }, { replace: true })
  }, [requestedNew, role, setParams])

  const rows = lots.data ?? []
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length }
    for (const r of rows) c[lotStatus(r.lot)] = (c[lotStatus(r.lot)] ?? 0) + 1
    return c
  }, [rows])
  const q = normalize(query)
  const visible = rows.filter(
    (r) => (status === 'all' || lotStatus(r.lot) === status) && (!productFilter || r.product.id === productFilter) && (!q || normalize(`${r.lot.lotNumber} ${r.product.name}`).includes(q)),
  )
  const stats = useMemo(() => {
    const live = rows.filter((r) => lotStatus(r.lot) === 'available' || lotStatus(r.lot) === 'reserved')
    const value = live.reduce((sum, r) => sum + (convert(r.lot.pricePerLot * availableLots(r.lot), r.product.pricing.currency) ?? 0), 0)
    return {
      listings: new Set(live.map((r) => r.product.id)).size,
      available: live.reduce((n, r) => n + availableLots(r.lot), 0),
      reserved: rows.reduce((n, r) => n + r.lot.reservedCount, 0),
      value,
    }
  }, [rows, convert])

  if (role !== 'producer')
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={<Store className="size-5" aria-hidden />}
          title={t('lots.stock.producerOnly')}
          body={t('lots.stock.producerOnlyBody')}
          action={<Button onClick={() => setRole('producer')}>{t('lots.stock.switchRole')}</Button>}
        />
      </div>
    )

  const productList: Product[] = products.data ?? []
  const createProduct = productList.find((p) => p.id === creatingFor)
  const modalOpen = editing !== null || creatingFor !== null
  const close = () => {
    setEditing(null)
    setCreatingFor(null)
  }
  const defaultCity = producer.data ? cityIdFor(producer.data.address.city, producer.data.address.country, CITIES[0]?.id ?? '') : (CITIES[0]?.id ?? '')
  const yymm = now().toISOString().slice(2, 7).replace('-', '')
  const initial = editing
    ? toFormValues(editing.lot, undefined, { cityId: cityIdFor(editing.lot.location.city, editing.lot.location.country, defaultCity), warehouseLabel: '', lotNumber: '', type: '', unit: 'piece' })
    : toFormValues(undefined, createProduct, {
        cityId: defaultCity,
        warehouseLabel: producer.data?.name ?? '',
        lotNumber: `${producerId.toUpperCase()}-${yymm}-${String(rows.length + 101)}`,
        type: '',
        unit: 'pallet',
      })
  const saving = m.create.isPending || m.update.isPending
  const saveError = m.create.error ?? m.update.error

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <Boxes className="size-7" aria-hidden />
            {t('lots.stock.title')}
          </h1>
          <p className="text-sm text-ink-muted">{t('lots.stock.subtitle', { name: producer.data?.name ?? '' })}</p>
        </div>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreatingFor('')}>
          {t('lots.stock.newLot')}
        </Button>
      </div>
      <p role="status" aria-live="polite" className={cn('rounded-md bg-verified-soft px-3 py-2 text-sm text-verified', !notice && 'sr-only')}>
        {notice}
      </p>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [t('lots.stock.statListings'), fmt.number(stats.listings)],
          [t('lots.stock.statAvailable'), fmt.number(stats.available)],
          [t('lots.stock.statReserved'), fmt.number(stats.reserved)],
          [t('lots.stock.statValue'), format(stats.value, display, { compact: true })],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="text-2xl font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3 lg:flex-row lg:items-end">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t('lots.stock.search')}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('lots.stock.search')} className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-9 pe-3 text-sm" />
        </label>
        <Select
          label={t('lots.form.product')}
          hideLabel
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          options={[{ value: '', label: t('lots.stock.allProducts') }, ...productList.filter((p) => p.lots.length).map((p) => ({ value: p.id, label: p.name }))]}
          className="lg:w-80"
        />
      </div>
      <div role="group" aria-label={t('lots.stock.statusFilter')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
            className={cn('h-8 shrink-0 rounded-full border px-3 text-[0.8125rem] font-medium', status === s ? 'border-ink bg-ink text-bg' : 'border-line-strong hover:bg-surface-2')}
          >
            {s === 'all' ? t('chat.all') : t(`lots.status.${s}`)} <span className="tabular opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      {lots.isPending ? (
        <LoadingRegion>
          <Skeleton className="h-80" />
        </LoadingRegion>
      ) : lots.error ? (
        <ErrorState error={lots.error} onRetry={() => void lots.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState title={t('lots.stock.empty')} body={rows.length ? t('lots.stock.emptyFiltered') : t('lots.stock.emptyBody')} />
      ) : (
        <StockTable
          rows={visible}
          busyId={busyId || undefined}
          onEdit={(row) => setEditing(row)}
          onDuplicate={(lotId) => m.duplicate.mutate(lotId, { onSuccess: (lot) => setNotice(t('lots.stock.duplicated', { number: lot.lotNumber })) })}
          onStock={(lotId, stock) => m.setStock.mutate({ lotId, stock })}
          onStatus={(lotId, s) => m.setStatus.mutate({ lotId, status: s }, { onSuccess: (lot) => setNotice(t(`lots.stock.statusChanged.${s}`, { number: lot.lotNumber })) })}
        />
      )}
      <p className="text-xs text-ink-subtle">{t('lots.stock.persistNote')}</p>
      <Modal
        open={modalOpen}
        onClose={close}
        size="lg"
        title={editing ? t('lots.stock.editTitle', { number: editing.lot.lotNumber }) : t('lots.stock.newTitle')}
        closeLabel={t('common.close')}
        footer={
          <>
            {saveError && (
              <p role="alert" className="me-auto self-center text-sm text-expired">
                {saveError.message}
              </p>
            )}
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="lot-form" disabled={saving || products.isPending}>
              {saving ? t('lots.form.saving') : t('lots.form.save')}
            </Button>
          </>
        }
      >
        {products.isPending ? (
          <Skeleton className="h-96" />
        ) : (
          <LotForm
            key={editing?.lot.id ?? `new-${creatingFor}`}
            formId="lot-form"
            products={productList}
            initial={initial}
            editing={editing?.lot}
            submitting={saving}
            onSubmit={(input) => {
              const done = (number: string) => {
                setNotice(t(editing ? 'lots.stock.saved' : 'lots.stock.created', { number }))
                close()
              }
              if (editing) m.update.mutate({ lotId: editing.lot.id, input }, { onSuccess: (lot) => done(lot.lotNumber) })
              else m.create.mutate(input, { onSuccess: (lot) => done(lot.lotNumber) })
            }}
          />
        )}
      </Modal>
    </div>
  )
}
