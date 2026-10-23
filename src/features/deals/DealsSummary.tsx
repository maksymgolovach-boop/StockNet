import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/currency/useCurrency'
import { useFormat } from '@/features/i18n/useFormat'
import { ACTIVE_STATUSES } from './dealRules'
import type { DealRow } from './useDealRows'

export function DealsSummary({ rows }: { rows: DealRow[] }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { format, display } = useCurrency()
  const valid = rows.filter((r) => r.deal.status !== 'cancelled')
  const volume = valid.reduce((s, r) => s + (r.displayTotal ?? 0), 0)
  const delivered = rows.filter((r) => r.deal.onTime !== undefined)
  const stats: [string, string][] = [
    [t('dealsPage.summary.total'), fmt.number(rows.length)],
    [t('dealsPage.summary.volume'), format(volume, display, { compact: true })],
    [t('dealsPage.summary.active'), fmt.number(rows.filter((r) => ACTIVE_STATUSES.has(r.deal.status)).length)],
    [t('dealsPage.summary.average'), valid.length ? format(volume / valid.length, display, { compact: true }) : '—'],
    [t('dealsPage.summary.onTime'), delivered.length ? fmt.percent(delivered.filter((r) => r.deal.onTime).length / delivered.length) : '—'],
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {stats.map(([k, v]) => (
        <div key={k} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 last:col-span-2 md:last:col-span-1">
          <dt className="text-xs text-ink-muted">{k}</dt>
          <dd className="text-2xl font-semibold tabular">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
