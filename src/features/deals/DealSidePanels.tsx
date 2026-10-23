import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, MessageSquare, Paperclip } from 'lucide-react'
import type { Deal } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { Badge } from '@/shared/ui/Badge'
import { buttonClass } from '@/shared/ui/Button'

export function DealDetails({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const a = deal.deliveryAddress
  const rows: [string, React.ReactNode][] = [
    [t('dealDetail.incoterm'), <span className="font-mono">{deal.incoterm}</span>],
    [t('dealDetail.currency'), deal.currency],
    [t('dealDetail.address'), `${a.street}, ${a.postcode} ${a.city}, ${fmt.region(a.country)}`],
    [t('dealDetail.requested'), fmt.date(deal.requestedDeliveryDate, { dateStyle: 'long' })],
  ]
  if (deal.deliveredAt)
    rows.push([
      t('dealDetail.delivered'),
      <span className="flex flex-wrap items-center gap-2">
        {fmt.date(deal.deliveredAt, { dateStyle: 'long' })}
        {deal.onTime !== undefined && <Badge tone={deal.onTime ? 'verified' : 'expiring'}>{t(deal.onTime ? 'dealDetail.onTime' : 'dealDetail.late')}</Badge>}
      </span>,
    ])
  if (deal.reorderOf)
    rows.push([
      t('dealDetail.reorderOf'),
      <Link to={`/deals/${deal.reorderOf}`} className="font-mono text-primary hover:underline">
        {deal.reorderOf}
      </Link>,
    ])
  return (
    <section aria-labelledby="deal-details" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <h2 id="deal-details" className="text-lg font-semibold">
        {t('dealDetail.details')}
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>
      {deal.notes && (
        <div className="border-t border-line pt-3 text-sm">
          <p className="text-xs text-ink-muted">{t('dealDetail.notesLabel')}</p>
          <p className="whitespace-pre-wrap">{deal.notes}</p>
        </div>
      )}
      {deal.attachments && deal.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2 border-t border-line pt-3" aria-label={t('dealDetail.attachments')}>
          {deal.attachments.map((f) => (
            <li key={f} className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-0.5 text-xs" title={t('docs.demoOnly')}>
              <Paperclip className="size-3" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DealDocuments({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  return (
    <section aria-labelledby="deal-docs" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <h2 id="deal-docs" className="text-lg font-semibold">
        {t('dealDetail.documents')}
      </h2>
      {deal.documents.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('dealDetail.noDocuments')}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {[...deal.documents]
            .sort((x, y) => x.issuedAt.localeCompare(y.issuedAt))
            .map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <FileText className="size-5 shrink-0 text-ink-muted" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{t(`dealDetail.docTypes.${d.type}`)}</span>
                  <span className="truncate text-xs text-ink-subtle">
                    {d.fileName} · {fmt.date(d.issuedAt)} · {d.sizeKb} KB
                  </span>
                </span>
                <button type="button" disabled title={t('docs.demoOnly')} className={buttonClass('secondary', 'sm', 'opacity-60')}>
                  PDF
                </button>
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}

export function DealThreadCard({ deal, partnerName, messageLink }: { deal: Deal; partnerName: string; messageLink: string }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="deal-thread" className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <h2 id="deal-thread" className="text-lg font-semibold">
        {t('dealDetail.conversation')}
      </h2>
      <p className="text-sm text-ink-muted">{deal.threadId ? t('dealDetail.threadLinked', { name: partnerName }) : t('dealDetail.threadNone', { name: partnerName })}</p>
      <Link to={messageLink} className={buttonClass('secondary', 'md', 'self-start')}>
        <MessageSquare className="size-4" aria-hidden />
        {deal.threadId ? t('dealDetail.openThread') : t('dealDetail.messagePartner')}
      </Link>
    </section>
  )
}
