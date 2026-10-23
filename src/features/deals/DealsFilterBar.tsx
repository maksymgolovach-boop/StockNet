import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal } from 'lucide-react'
import { CURRENCY_CODES } from '@/config/currencies'
import { ROOT_CATEGORY_SLUGS } from '@/config/categories'
import { useDisplayCurrency } from '@/features/settings/preferencesStore'
import { Button } from '@/shared/ui/Button'
import { Checkbox, RangeInputs } from '@/shared/ui/form'
import { Select } from '@/shared/ui/Select'
import { cn } from '@/shared/lib/cn'
import { DEAL_SORTS, DEAL_STATUSES, activeDealFilterCount, type DealFilters } from './dealFilters'
import type { DealRow } from './useDealRows'

interface Props {
  filters: DealFilters
  onChange: (patch: Partial<DealFilters>) => void
  onReset: () => void
  all: DealRow[]
}

export function DealsFilterBar({ filters: f, onChange, onReset, all }: Props) {
  const { t } = useTranslation()
  const currency = useDisplayCurrency()
  const id = useId()
  const [open, setOpen] = useState(false)
  const counterparties = [...new Map(all.map((r) => [r.counterpartyId, r.partner?.name ?? r.counterpartyId])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const statusCounts = Object.fromEntries(DEAL_STATUSES.map((s) => [s, all.filter((r) => r.deal.status === s).length]))
  const count = activeDealFilterCount(f)
  const date = 'h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-2 text-sm'
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t('dealsPage.search')}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input type="search" value={f.q} onChange={(e) => onChange({ q: e.target.value })} placeholder={t('dealsPage.search')} className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-9 pe-3 text-sm" />
        </label>
        <Select label={t('search.sortBy')} hideLabel value={f.sort} onChange={(e) => onChange({ sort: e.target.value as DealFilters['sort'] })} options={DEAL_SORTS.map((s) => ({ value: s, label: `${t('search.sortBy')}: ${t(`dealsPage.sort.${s}`)}` }))} className="md:w-64" />
        <Button variant="secondary" aria-expanded={open} aria-controls={`${id}-more`} icon={<SlidersHorizontal className="size-4" aria-hidden />} onClick={() => setOpen((o) => !o)}>
          {t('dealsPage.filters')}
          {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-on-primary">{count}</span>}
        </Button>
      </div>
      <div role="group" aria-label={t('dealsPage.statusFilter')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {DEAL_STATUSES.filter((s) => statusCounts[s]).map((s) => {
          const on = f.statuses.includes(s)
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ statuses: on ? f.statuses.filter((x) => x !== s) : [...f.statuses, s] })}
              className={cn('h-8 shrink-0 rounded-full border px-3 text-[0.8125rem] font-medium', on ? 'border-ink bg-ink text-bg' : 'border-line-strong hover:bg-surface-2')}
            >
              {t(`deals.status.${s}`)} <span className="tabular opacity-70">{statusCounts[s]}</span>
            </button>
          )
        })}
      </div>
      <div id={`${id}-more`} hidden={!open} className="grid gap-3 border-t border-line pt-3 md:grid-cols-2 xl:grid-cols-4">
        <Select
          label={t('dealsPage.counterparty')}
          value={f.counterparty ?? ''}
          onChange={(e) => onChange({ counterparty: e.target.value || undefined })}
          options={[{ value: '', label: t('dealsPage.any') }, ...counterparties.map(([value, label]) => ({ value, label }))]}
        />
        <Select
          label={t('dealsPage.category')}
          value={f.category ?? ''}
          onChange={(e) => onChange({ category: e.target.value || undefined })}
          options={[{ value: '', label: t('dealsPage.any') }, ...ROOT_CATEGORY_SLUGS.map((s) => ({ value: s, label: t(`categories.${s}`) }))]}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            {t('dealsPage.from')}
            <input type="date" value={f.from ?? ''} max={f.to} onChange={(e) => onChange({ from: e.target.value || undefined })} className={date} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            {t('dealsPage.to')}
            <input type="date" value={f.to ?? ''} min={f.from} onChange={(e) => onChange({ to: e.target.value || undefined })} className={date} />
          </label>
        </div>
        <RangeInputs min={f.min} max={f.max} minLabel={t('dealsPage.amountMin')} maxLabel={t('dealsPage.amountMax')} suffix={currency} onCommit={(min, max) => onChange({ min, max })} />
        <fieldset className="flex flex-wrap gap-x-4 md:col-span-2 xl:col-span-4">
          <legend className="mb-1 text-xs font-medium text-ink-muted">{t('dealsPage.currency')}</legend>
          {CURRENCY_CODES.map((c) => (
            <Checkbox key={c} checked={f.currencies.includes(c)} onChange={(on) => onChange({ currencies: on ? [...f.currencies, c] : f.currencies.filter((x) => x !== c) })} label={c} />
          ))}
        </fieldset>
      </div>
      {count > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onClick={onReset}>
          {t('common.clearAll')}
        </Button>
      )}
    </div>
  )
}
