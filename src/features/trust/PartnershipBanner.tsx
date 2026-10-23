import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Handshake } from 'lucide-react'
import { useFormat } from '@/features/i18n/useFormat'
import { usePartnerHistory } from './usePartnerHistory'

/** "You've completed 7 deals with this producer since 2023. Last deal: 12 Mar." — visible only to the user. */
export function PartnershipBanner({ producerId, historyLink }: { producerId: string; historyLink: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const h = usePartnerHistory(producerId)
  if (!h || !h.lastAt || !h.firstAt) return null
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border-s-4 border-ink bg-surface-2 px-4 py-3 text-sm">
      <Handshake className="size-5 shrink-0" aria-hidden />
      <p className="flex-1">
        {t('partner.banner', { count: h.completed, year: new Date(h.firstAt).getFullYear() })}{' '}
        <span className="text-ink-muted">{t('partner.lastDeal', { date: fmt.date(h.lastAt, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>
        {h.active > 0 && <span className="ms-1 font-medium">· {t('partner.active', { count: h.active })}</span>}
      </p>
      <Link to={historyLink} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        {t('partner.viewHistory')}
        <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
      </Link>
    </div>
  )
}
