import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Download, FileText, TriangleAlert } from 'lucide-react'
import type { Document, DocumentStatus } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { daysFromNow } from '@/shared/lib/dates'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { EmptyState } from '@/shared/ui/states'
import { documentStatus } from './documentStatus'

const TONE: Record<DocumentStatus, BadgeTone> = { valid: 'verified', expiring_soon: 'expiring', expired: 'expired' }

/** Certificates, test reports, datasheets and licences with status and expiry warnings. Download is UI only. */
export function DocumentCenter({ documents, title }: { documents: Document[]; title?: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const [downloaded, setDownloaded] = useState<string | null>(null)
  const withStatus = documents.map((d) => ({ doc: d, status: documentStatus(d) }))
  const expired = withStatus.filter((d) => d.status === 'expired')
  const expiring = withStatus.filter((d) => d.status === 'expiring_soon')
  const order: Record<DocumentStatus, number> = { expired: 0, expiring_soon: 1, valid: 2 }
  withStatus.sort((a, b) => order[a.status] - order[b.status])

  return (
    <section className="flex flex-col gap-3" aria-label={title ?? t('docs.title')}>
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {expired.length > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-control)] border border-expired/40 bg-expired-soft px-3 py-2 text-sm text-expired">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('docs.expiredWarning', { count: expired.length, list: fmt.list(expired.map((d) => d.doc.title)) })}
        </p>
      )}
      {expiring.length > 0 && (
        <p className="flex items-start gap-2 rounded-[var(--radius-control)] border border-expiring/40 bg-expiring-soft px-3 py-2 text-sm text-expiring">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('docs.expiringWarning', { count: expiring.length, list: fmt.list(expiring.map((d) => d.doc.title)) })}
        </p>
      )}
      {documents.length === 0 ? (
        <EmptyState compact title={t('docs.empty')} body={t('docs.emptyBody')} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {withStatus.map(({ doc, status }) => (
            <li key={doc.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <FileText className="hidden size-8 shrink-0 text-ink-subtle sm:block" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{doc.title}</span>
                  <Badge tone={TONE[status]}>{t(`documents.status.${status}`)}</Badge>
                  {doc.verifiedByPlatform && (
                    <Badge tone="neutral" icon={<BadgeCheck className="size-3 text-verified" aria-hidden />}>
                      {t('trust.verifiedByPlatform')}
                    </Badge>
                  )}
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-muted">
                  <div className="flex gap-1">
                    <dt>{t('docs.type')}:</dt>
                    <dd>{t(`documents.types.${doc.type}`)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>{t('docs.issuer')}:</dt>
                    <dd>{doc.issuer}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>{t('docs.issued')}:</dt>
                    <dd>{fmt.date(doc.issuedAt)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>{t('docs.expires')}:</dt>
                    <dd className={status === 'valid' ? undefined : 'font-semibold'}>
                      {doc.expiresAt ? `${fmt.date(doc.expiresAt)} (${fmt.relative(doc.expiresAt)})` : t('docs.noExpiry')}
                    </dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={() => setDownloaded(doc.id)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.8125rem] font-medium hover:bg-surface-2 sm:self-center"
                aria-label={t('docs.downloadNamed', { name: doc.fileName })}
              >
                <Download className="size-3.5" aria-hidden />
                {downloaded === doc.id ? t('docs.demoOnly') : `PDF · ${fmt.number(doc.sizeKb)} KB`}
              </button>
            </li>
          ))}
        </ul>
      )}
      {expired.length === 0 && expiring.length === 0 && documents.some((d) => d.expiresAt && daysFromNow(d.expiresAt) > 0) && (
        <p className="text-xs text-ink-subtle">{t('docs.allValid')}</p>
      )}
    </section>
  )
}
