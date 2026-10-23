import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSignature, MessageSquare, Star } from 'lucide-react'
import type { Partnership, PartyRole } from '@/types/models'
import type { Partner } from '@/features/chat/usePartner'
import { useCurrency } from '@/features/currency/useCurrency'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { Badge } from '@/shared/ui/Badge'
import { buttonClass } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { VolumeChart } from './VolumeChart'

export const PARTNER_TAGS = ['primary_supplier', 'local_supplier', 'preferred', 'backup', 'under_review', 'key_account'] as const

interface Props {
  p: Partnership
  partner: Partner | undefined
  role: PartyRole
  onMeta: (patch: Partial<Pick<Partnership, 'favorite' | 'tag' | 'privateNotes'>>) => void
  saving: boolean
}

export function PartnerCard({ p, partner, role, onMeta, saving }: Props) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { convert, format, display } = useCurrency()
  const [notes, setNotes] = useState(p.privateNotes)
  useEffect(() => setNotes(p.privateNotes), [p.privateNotes])
  const name = partner?.name ?? p.counterpartyId
  const volume = convert(p.totalVolumeEUR, 'EUR')
  const stats: [string, string][] = [
    [t('partners.first'), fmt.date(p.firstDealAt, { month: 'short', year: 'numeric' })],
    [t('partners.last'), fmt.date(p.lastDealAt, { day: 'numeric', month: 'short', year: 'numeric' })],
    [t('partners.deals'), t('partners.dealsValue', { count: p.dealCount, completed: p.completedCount })],
    [t('partners.volume'), volume === null ? '—' : format(volume, display, { compact: true })],
    [t(role === 'buyer' ? 'partners.ratingGiven' : 'partners.ratingReceived'), p.avgRatingGiven === null ? '—' : `${fmt.number(p.avgRatingGiven, { minimumFractionDigits: 1 })} ★`],
    [t('partners.onTime'), p.onTimeRate === null ? '—' : fmt.percent(p.onTimeRate)],
  ]
  const notesId = `notes-${p.counterpartyId}`
  const tagId = `tag-${p.counterpartyId}`
  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <header className="flex items-start gap-3">
        {partner && <ProducerAvatar producer={partner} />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate text-base font-semibold">
            {partner?.kind === 'producer' ? (
              <Link to={`/producer/${partner.id}`} className="hover:text-primary hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={p.status === 'active' ? 'verified' : 'neutral'}>{t(`partners.status.${p.status}`)}</Badge>
            {p.activeCount > 0 && <Badge tone="primary">{t('partner.active', { count: p.activeCount })}</Badge>}
            {p.disputeCount > 0 && <Badge tone="disputed">{t('partners.disputes', { count: p.disputeCount })}</Badge>}
            {partner?.kind === 'producer' && <TrustScoreButton trust={partner.producer.trust} size="sm" />}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={p.favorite}
          aria-label={t(p.favorite ? 'partners.unfavorite' : 'partners.favorite', { name })}
          title={t(p.favorite ? 'partners.unfavorite' : 'partners.favorite', { name })}
          onClick={() => onMeta({ favorite: !p.favorite })}
          className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] hover:bg-surface-2"
        >
          <Star className={cn('size-5', p.favorite ? 'fill-accent text-accent' : 'text-ink-subtle')} aria-hidden />
        </button>
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="truncate font-medium tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <VolumeChart data={p.volumeByQuarter} label={t('partners.chartLabel', { name })} />
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <div className="flex flex-col gap-1">
          <label htmlFor={tagId} className="text-xs font-medium text-ink-muted">
            {t('partners.tag')}
          </label>
          <select id={tagId} value={p.tag ?? ''} onChange={(e) => onMeta({ tag: e.target.value || undefined })} className="h-9 rounded-[var(--radius-control)] border border-line-strong bg-surface px-2 text-sm">
            <option value="">{t('partners.noTag')}</option>
            {PARTNER_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {t(`partners.tags.${tag}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={notesId} className="text-xs font-medium text-ink-muted">
            {t('partners.notes')}
          </label>
          <textarea
            id={notesId}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== p.privateNotes && onMeta({ privateNotes: notes })}
            placeholder={t('partners.notesPlaceholder')}
            className="rounded-[var(--radius-control)] border border-line-strong bg-surface px-2 py-1.5 text-sm"
          />
          <span className="text-[0.6875rem] text-ink-subtle" aria-live="polite">
            {saving ? t('partners.saving') : t('partners.notesPrivate')}
          </span>
        </div>
      </div>
      <footer className="flex flex-wrap gap-2 border-t border-line pt-3">
        {role === 'buyer' && (
          <Link to={`/deals/new?producer=${p.counterpartyId}`} className={buttonClass('primary', 'sm')}>
            <FileSignature className="size-3.5" aria-hidden />
            {t('partners.requestQuote')}
          </Link>
        )}
        <Link to={role === 'buyer' ? `/messages?producer=${p.counterpartyId}` : `/messages?buyer=${p.counterpartyId}`} className={buttonClass('secondary', 'sm')}>
          <MessageSquare className="size-3.5" aria-hidden />
          {t('partners.message')}
        </Link>
        <Link to={`/deals?cp=${p.counterpartyId}`} className={buttonClass('ghost', 'sm')}>
          {t('partners.viewDeals')}
        </Link>
      </footer>
    </article>
  )
}
