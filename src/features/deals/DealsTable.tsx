import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Boxes } from 'lucide-react'
import { useCurrency } from '@/features/currency/useCurrency'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { DealStatusBadge } from './DealStatusBadge'
import type { DealRow } from './useDealRows'

function Products({ row }: { row: DealRow }) {
  const { t } = useTranslation()
  const items = row.deal.lineItems
  const lots = items.filter((li) => li.lot).length
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate" title={items.map((li) => li.productName).join(', ')}>
        {items[0]?.productName}
        {items.length > 1 && <span className="text-ink-subtle"> +{items.length - 1}</span>}
      </span>
      {lots > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <Boxes className="size-3" aria-hidden />
          {t('dealsPage.lotItems', { count: lots })}
        </span>
      )}
    </span>
  )
}

function Amount({ row, align = 'end' }: { row: DealRow; align?: 'start' | 'end' }) {
  const { format, display } = useCurrency()
  const { deal } = row
  return (
    <span className={align === 'end' ? 'flex flex-col items-end' : 'flex flex-col'}>
      <span className="font-semibold tabular">{format(deal.total, deal.currency)}</span>
      {deal.currency !== display && row.displayTotal !== null && <span className="text-xs text-ink-subtle tabular">≈ {format(row.displayTotal, display, { compact: true })}</span>}
    </span>
  )
}

export function DealsTable({ rows }: { rows: DealRow[] }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const th = 'px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-muted'
  return (
    <>
      <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('dealsPage.tableCaption')}</caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className={`${th} text-start`}>{t('partner.cols.deal')}</th>
              <th scope="col" className={`${th} text-start`}>{t('dealsPage.counterparty')}</th>
              <th scope="col" className={`${th} text-start`}>{t('partner.cols.products')}</th>
              <th scope="col" className={`${th} text-end`}>{t('partner.cols.total')}</th>
              <th scope="col" className={`${th} text-start`}>{t('partner.cols.status')}</th>
              <th scope="col" className={`${th} text-start`}>{t('dealsPage.lastUpdate')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.deal.id} className="relative border-t border-line hover:bg-surface-2">
                <td className="px-3 py-3 font-mono text-[0.8125rem] whitespace-nowrap">
                  <Link to={`/deals/${row.deal.id}`} className="font-semibold text-primary after:absolute after:inset-0 hover:underline">
                    {row.deal.id}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    {row.partner && <ProducerAvatar producer={row.partner} size="sm" />}
                    <span className="max-w-48 truncate">{row.partner?.name ?? row.counterpartyId}</span>
                  </span>
                </td>
                <td className="max-w-72 px-3 py-3">
                  <Products row={row} />
                </td>
                <td className="px-3 py-3">
                  <Amount row={row} />
                </td>
                <td className="px-3 py-3">
                  <DealStatusBadge status={row.deal.status} />
                </td>
                <td className="px-3 py-3 text-xs whitespace-nowrap text-ink-muted" title={fmt.dateTime(row.deal.updatedAt)}>
                  {fmt.relative(row.deal.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden" aria-label={t('dealsPage.tableCaption')}>
        {rows.map((row) => (
          <li key={row.deal.id} className="relative flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/deals/${row.deal.id}`} className="font-mono text-[0.8125rem] font-semibold text-primary after:absolute after:inset-0">
                {row.deal.id}
              </Link>
              <DealStatusBadge status={row.deal.status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {row.partner && <ProducerAvatar producer={row.partner} size="sm" />}
              <span className="min-w-0 truncate font-medium">{row.partner?.name}</span>
            </div>
            <div className="text-sm">
              <Products row={row} />
            </div>
            <div className="flex items-end justify-between gap-2">
              <Amount row={row} align="start" />
              <span className="text-xs text-ink-muted">{fmt.relative(row.deal.updatedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
