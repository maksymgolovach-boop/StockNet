import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Pencil, Truck } from 'lucide-react'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { LocationPicker } from '@/features/settings/LocationPicker'
import { usePreferences } from '@/features/settings/preferencesStore'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { useProducers } from '@/services/queries'
import { buttonClass } from '@/shared/ui/Button'
import { Popover } from '@/shared/ui/Popover'
import { LoadingRegion, Skeleton } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import { distanceKm } from '@/shared/lib/geo'

export function NearbyProducers() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const location = usePreferences((s) => s.location)
  const { data, isPending, error } = useProducers()
  if (error) return null
  const nearest = (data ?? [])
    .map((p) => ({ p, km: Math.round(distanceKm(location.point, p.location)) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 8)
  return (
    <section aria-labelledby="home-nearby" className="mx-auto w-full max-w-[90rem] px-4 lg:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="home-nearby" className="flex items-center gap-2 text-2xl font-semibold">
            <MapPin className="size-6 text-primary" aria-hidden />
            {t('nearby.title')}
          </h2>
          <p className="text-sm text-ink-muted">{t('nearby.body', { place: location.label })}</p>
        </div>
        <Popover
          label={t('nearby.change')}
          width={300}
          trigger={({ open, toggle, id, ref }) => (
            <button ref={ref} type="button" aria-expanded={open} aria-controls={id} onClick={toggle} className={buttonClass('secondary', 'sm')}>
              <Pencil className="size-4" aria-hidden />
              {t('nearby.change')}
            </button>
          )}
        >
          <div className="p-3">
            <LocationPicker />
          </div>
        </Popover>
      </div>
      {isPending ? (
        <LoadingRegion>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </LoadingRegion>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {nearest.map(({ p, km }) => {
            const delivers = km <= p.deliveryRadiusKm
            return (
              <li key={p.id} className="relative flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:border-ink">
                <div className="flex items-start gap-3">
                  <ProducerAvatar producer={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/producer/${p.id}`} className="block truncate font-semibold after:absolute after:inset-0 hover:text-primary">
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-ink-muted">{t(`producerTypes.${p.type}`)}</p>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                  <VerificationBadge level={p.verification.level} compact />
                  <TrustScoreButton trust={p.trust} size="sm" />
                </div>
                <p className="flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="size-3.5" aria-hidden />
                  {p.address.city}, {fmt.region(p.address.country)} · <span className="font-medium text-ink">{fmt.distance(km)}</span>
                </p>
                <p className={cn('flex items-center gap-1 text-xs', delivers ? 'text-verified' : 'text-ink-subtle')}>
                  <Truck className="size-3.5" aria-hidden />
                  {t(delivers ? 'product.deliversToYou' : 'product.outsideDelivery')}
                </p>
                <p className="truncate text-xs text-ink-subtle">{p.rootCategories.map((c) => t(`categories.${c}`)).join(' · ')}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
