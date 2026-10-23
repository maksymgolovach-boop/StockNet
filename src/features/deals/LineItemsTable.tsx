import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Deal } from '@/types/models'
import { useCurrency } from '@/features/currency/useCurrency'
import { LotRef, useLineItemText } from './LineItemQuantity'

export function LineItemsTable({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const { format, convert, display } = useCurrency()
  const qty = useLineItemText()
  const converted = deal.currency !== display ? convert(deal.total, deal.currency) : null
  const th = 'px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-muted'
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">{t('dealDetail.lineItems')}</caption>
        <thead className="bg-surface-2">
          <tr>
            <th scope="col" className={`${th} text-start`}>{t('dealDetail.cols.product')}</th>
            <th scope="col" className={`${th} text-end`}>{t('dealDetail.cols.quantity')}</th>
            <th scope="col" className={`${th} text-end`}>{t('dealDetail.cols.unitPrice')}</th>
            <th scope="col" className={`${th} text-end`}>{t('dealDetail.cols.subtotal')}</th>
          </tr>
        </thead>
        <tbody>
          {deal.lineItems.map((li, i) => (
            <tr key={`${li.productId}-${i}`} className="border-t border-line align-top">
              <td className="px-3 py-3">
                <Link to={`/product/${li.productId}${li.lot ? `?lot=${li.lot.lotId}` : ''}`} className="font-medium hover:text-primary hover:underline">
                  {li.productName}
                </Link>
                <span className="mt-1 block">
                  <LotRef item={li} />
                </span>
              </td>
              <td className="px-3 py-3 text-end whitespace-nowrap tabular">{qty(li)}</td>
              <td className="px-3 py-3 text-end whitespace-nowrap tabular">
                {format(li.unitPrice, deal.currency)} / {li.lot ? t('lots.unit') : t(`units.${li.unit}`)}
              </td>
              <td className="px-3 py-3 text-end font-medium whitespace-nowrap tabular">{format(li.subtotal, deal.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink">
            <th scope="row" colSpan={3} className="px-3 py-3 text-end text-sm font-semibold">
              {t('dealDetail.total', { currency: deal.currency })}
            </th>
            <td className="px-3 py-3 text-end text-base font-semibold whitespace-nowrap tabular">
              {format(deal.total, deal.currency)}
              {converted !== null && <span className="block text-xs font-normal text-ink-muted">≈ {format(converted, display)}</span>}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
