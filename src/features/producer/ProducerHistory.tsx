import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { useCurrency } from '@/features/currency/useCurrency'
import { DealStatusBadge } from '@/features/deals/DealStatusBadge'
import { useFormat } from '@/features/i18n/useFormat'
import type { PartnerHistory } from '@/features/trust/usePartnerHistory'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular">{value}</dd>
    </div>
  )
}

/** The user's own deals with this producer — never shown to anyone else. */
export function ProducerHistory({ history }: { history: PartnerHistory }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { format, convert, display } = useCurrency()
  const totalDisplay = convert(history.totalEUR, 'EUR')
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Lock className="size-4" aria-hidden />
        {t('partner.privateNote')}
      </p>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label={t('partner.stats.deals')} value={fmt.number(history.deals.length)} />
        <Stat label={t('partner.stats.completed')} value={fmt.number(history.completed)} />
        <Stat label={t('partner.stats.volume')} value={totalDisplay === null ? '—' : format(totalDisplay, display, { compact: true })} />
        <Stat label={t('partner.stats.onTime')} value={history.onTimeRate === null ? '—' : fmt.percent(history.onTimeRate)} />
        <Stat label={t('partner.stats.since')} value={history.firstAt ? fmt.date(history.firstAt, { month: 'short', year: 'numeric' }) : '—'} />
      </dl>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">{t('partner.dealsTable')}</caption>
          <thead className="bg-surface-2 text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t('partner.cols.deal')}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t('partner.cols.date')}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t('partner.cols.products')}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t('partner.cols.status')}</th>
              <th scope="col" className="px-3 py-2 text-end font-medium">{t('partner.cols.total')}</th>
            </tr>
          </thead>
          <tbody>
            {history.deals.map((d) => {
              const converted = d.currency !== display ? convert(d.total, d.currency) : null
              return (
                <tr key={d.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-[0.8125rem]">
                    <Link to={`/deals/${d.id}`} className="text-primary hover:underline">
                      {d.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt.date(d.createdAt)}</td>
                  <td className="max-w-64 truncate px-3 py-2" title={d.lineItems.map((li) => li.productName).join(', ')}>
                    {d.lineItems[0]?.productName}
                    {d.lineItems.length > 1 && <span className="text-ink-subtle"> +{d.lineItems.length - 1}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <DealStatusBadge status={d.status} />
                  </td>
                  <td className="px-3 py-2 text-end tabular">
                    <span className="block font-medium">{format(d.total, d.currency)}</span>
                    {converted !== null && <span className="block text-xs text-ink-subtle">≈ {format(converted, display, { compact: true })}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
