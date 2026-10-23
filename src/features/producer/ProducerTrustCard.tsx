import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, MapPin, Star } from 'lucide-react'
import type { Producer } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { usePreferences } from '@/features/settings/preferencesStore'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { distanceKm } from '@/shared/lib/geo'
import { ProducerAvatar } from './ProducerAvatar'

export function ProducerTrustCard({ producer }: { producer: Producer }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const me = usePreferences((s) => s.location.point)
  const distance = Math.round(distanceKm(me, producer.location))
  return (
    <section aria-label={t('product.soldBy')} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('product.soldBy')}</p>
      <div className="flex items-start gap-3">
        <ProducerAvatar producer={producer} />
        <div className="min-w-0 flex-1">
          <Link to={`/producer/${producer.id}`} className="font-semibold hover:text-primary hover:underline">
            {producer.name}
          </Link>
          <p className="text-xs text-ink-muted">{t(`producerTypes.${producer.type}`)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge level={producer.verification.level} />
        <TrustScoreButton trust={producer.trust} size="sm" />
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
        <li className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {producer.address.city}, {fmt.region(producer.address.country)} · {fmt.distance(distance)}
        </li>
        {producer.reviewCount > 0 && (
          <li className="flex items-center gap-2">
            <Star className="size-4 shrink-0 fill-accent text-accent" aria-hidden />
            {t('product.rating', { rating: fmt.number(producer.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), count: producer.reviewCount })} · {t('common.reviews', { count: producer.reviewCount })}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden />
          {t('producer.responds', { hours: Math.round(producer.trustInputs.avgResponseHours) })}
        </li>
      </ul>
      <Link to={`/producer/${producer.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {t('producer.viewProfile')}
        <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
      </Link>
    </section>
  )
}
