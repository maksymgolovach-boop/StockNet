import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OctagonAlert, Paperclip } from 'lucide-react'
import type { Deal, PartyRole } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'

export function DisputePanel({ deal, role, onResolve, resolving }: { deal: Deal; role: PartyRole; onResolve: (note: string) => void; resolving: boolean }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const [note, setNote] = useState('')
  const d = deal.dispute
  if (!d) return null
  const open = d.status === 'open'
  return (
    <section aria-labelledby="dispute-title" className={`flex flex-col gap-3 rounded-[var(--radius-card)] border-2 p-4 ${open ? 'border-expired bg-expired-soft' : 'border-line bg-surface'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <OctagonAlert className="size-5 text-expired" aria-hidden />
        <h2 id="dispute-title" className="text-lg font-semibold">
          {t('dispute.panelTitle')}
        </h2>
        <Badge tone={open ? 'expired' : 'verified'}>{t(open ? 'dispute.open' : 'dispute.resolved')}</Badge>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-muted">{t('dispute.reason')}</dt>
          <dd>{t(`dispute.reasons.${d.reason}`)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t('dispute.resolution')}</dt>
          <dd>{t(`dispute.resolutions.${d.resolution}`)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t('dispute.openedAt')}</dt>
          <dd>
            {fmt.dateTime(d.openedAt)} · {t(`dealDetail.actor.${d.openedBy}`)}
          </dd>
        </div>
        {d.lotNumbers.length > 0 && (
          <div>
            <dt className="text-xs text-ink-muted">{t('dispute.lots')}</dt>
            <dd className="font-mono text-[0.8125rem]">{d.lotNumbers.join(', ')}</dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="text-xs text-ink-muted">{t('dispute.description')}</dt>
          <dd className="whitespace-pre-wrap">{d.description}</dd>
        </div>
        {d.attachments.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-muted">{t('dispute.evidence')}</dt>
            <dd className="flex flex-wrap gap-2">
              {d.attachments.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs" title={t('docs.demoOnly')}>
                  <Paperclip className="size-3" aria-hidden />
                  {a}
                </span>
              ))}
            </dd>
          </div>
        )}
        {d.resolutionNote && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-muted">{t('dispute.resolutionNote')}</dt>
            <dd>
              {d.resolutionNote} {d.resolvedAt && <span className="text-ink-muted">· {fmt.dateTime(d.resolvedAt)}</span>}
            </dd>
          </div>
        )}
      </dl>
      {open && role === 'buyer' && (
        <form
          className="flex flex-col gap-2 border-t border-expired/30 pt-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            onResolve(note.trim())
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
            {t('dispute.resolveNote')}
            <input value={note} onChange={(e) => setNote(e.target.value)} className="h-10 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm text-ink" />
          </label>
          <Button type="submit" disabled={resolving || note.trim().length < 3}>
            {t('dispute.markResolved')}
          </Button>
        </form>
      )}
      <p className="text-xs text-ink-muted">{t('dispute.platformNote')}</p>
    </section>
  )
}
