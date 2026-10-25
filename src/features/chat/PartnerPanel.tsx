import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarCheck, Clock, FileSignature, MapPin, Star, Wallet } from 'lucide-react'
import type { Thread } from '@/types/models'
import { useCurrency } from '@/features/currency/useCurrency'
import { DealStatusBadge } from '@/features/deals/DealStatusBadge'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { usePartnerHistory } from '@/features/trust/usePartnerHistory'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { ButtonLink } from '@/shared/ui/Button'
import type { Partner } from './usePartner'

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-ink-muted">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}

function TrustSummary({ partner }: { partner: Partner }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const icon = 'size-4'
  if (partner.kind === 'producer') {
    const p = partner.producer
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge level={p.verification.level} />
          <TrustScoreButton trust={p.trust} size="sm" />
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {p.reviewCount > 0 && (
            <Row icon={<Star className={`${icon} fill-accent text-accent`} aria-hidden />}>
              {fmt.number(p.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · {t('common.reviews', { count: p.reviewCount })}
            </Row>
          )}
          <Row icon={<Clock className={icon} aria-hidden />}>{t('producer.responds', { hours: Math.round(p.trustInputs.avgResponseHours) })}</Row>
          <Row icon={<MapPin className={icon} aria-hidden />}>
            {p.address.city}, {fmt.region(p.address.country)}
          </Row>
        </ul>
      </>
    )
  }
  const b = partner.buyer
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge level={b.verification.level} />
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        <Row icon={<Wallet className={icon} aria-hidden />}>{t('chat.buyer.payment', { pct: fmt.percent(b.paymentReliability), days: b.avgPaymentDays })}</Row>
        <Row icon={<CalendarCheck className={icon} aria-hidden />}>{t('chat.buyer.deals', { count: b.completedDeals })}</Row>
        <Row icon={<Clock className={icon} aria-hidden />}>{t('chat.buyer.memberSince', { date: fmt.date(b.memberSince, { month: 'long', year: 'numeric' }) })}</Row>
        <Row icon={<MapPin className={icon} aria-hidden />}>
          {b.address.city}, {fmt.region(b.address.country)}
        </Row>
      </ul>
    </>
  )
}

function History({ partner }: { partner: Partner }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { format, convert, display } = useCurrency()
  const side = partner.kind === 'producer' ? 'buyer' : 'producer'
  const history = usePartnerHistory(partner.id, side)
  if (!history) return <p className="text-sm text-ink-muted">{t('chat.noHistory')}</p>
  const volume = convert(history.totalEUR, 'EUR')
  const stats: [string, string][] = [
    [t('partner.stats.deals'), fmt.number(history.deals.length)],
    [t('partner.stats.completed'), fmt.number(history.completed)],
    [t('chat.lastDeal'), history.lastAt ? fmt.date(history.lastAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
    [t('partner.stats.volume'), volume === null ? '—' : format(volume, display, { compact: true })],
    [t('partner.stats.onTime'), history.onTimeRate === null ? '—' : fmt.percent(history.onTimeRate)],
    [t('partner.stats.since'), history.firstAt ? fmt.date(history.firstAt, { month: 'short', year: 'numeric' }) : '—'],
  ]
  return (
    <>
      <dl className="grid grid-cols-2 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface-2 px-2.5 py-2">
            <dt className="text-[0.6875rem] text-ink-muted">{k}</dt>
            <dd className="text-sm font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col divide-y divide-line text-sm" aria-label={t('chat.recentDeals')}>
        {history.deals.slice(0, 3).map((d) => (
          <li key={d.id} className="flex items-center gap-2 py-2">
            <Link to={`/deals/${d.id}`} className="min-w-0 flex-1 hover:text-primary">
              <span className="block truncate">{d.lineItems[0]?.productName}</span>
              <span className="block text-xs text-ink-subtle tabular">
                {fmt.date(d.createdAt)} · {format(d.total, d.currency, { compact: true })}
              </span>
            </Link>
            <DealStatusBadge status={d.status} />
          </li>
        ))}
      </ul>
      {partner.kind === 'producer' && (
        <Link to={`/producer/${partner.id}?tab=history`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t('partner.viewHistory')}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
        </Link>
      )}
      <p className="text-[0.6875rem] text-ink-subtle">{t('partner.privateNote')}</p>
    </>
  )
}

export function PartnerPanel({ partner, thread }: { partner: Partner; thread: Thread }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start gap-3">
        <ProducerAvatar producer={partner} />
        <div className="min-w-0">
          {partner.kind === 'producer' ? (
            <Link to={`/producer/${partner.id}`} className="font-semibold hover:text-primary hover:underline">
              {partner.name}
            </Link>
          ) : (
            <p className="font-semibold">{partner.name}</p>
          )}
          <p className="text-xs text-ink-muted">{partner.kind === 'producer' ? t(`producerTypes.${partner.producer.type}`) : t(`buyerTypes.${partner.buyer.type}`)}</p>
        </div>
      </div>
      <section className="flex flex-col gap-2.5" aria-labelledby="pp-trust">
        <h3 id="pp-trust" className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
          {t('chat.trustSummary')}
        </h3>
        <TrustSummary partner={partner} />
      </section>
      <section className="flex flex-col gap-2.5" aria-labelledby="pp-history">
        <h3 id="pp-history" className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
          {t('chat.historyTitle')}
        </h3>
        <History partner={partner} />
      </section>
      {partner.kind === 'producer' ? (
        <ButtonLink to={`/deals/new?producer=${partner.id}${thread.productId ? `&product=${thread.productId}` : ''}&thread=${thread.id}`} icon={<FileSignature className="size-4" aria-hidden />}>
          {t('chat.createQuote')}
        </ButtonLink>
      ) : (
        <ButtonLink to="/deals" variant="secondary">
          {t('chat.viewDeals')}
        </ButtonLink>
      )}
    </div>
  )
}
