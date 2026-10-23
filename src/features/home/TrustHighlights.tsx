import { useTranslation } from 'react-i18next'
import { BadgeCheck, FileCheck2, MessageSquareQuote } from 'lucide-react'
import { usePlatformStats } from '@/services/queries'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'

export function TrustHighlights() {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = usePlatformStats()
  if (isPending)
    return (
      <LoadingRegion>
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </LoadingRegion>
    )
  if (isError) return <ErrorState compact error={error} onRetry={() => void refetch()} />

  const items = [
    { icon: BadgeCheck, tone: 'text-verified bg-verified-soft', title: t('home.trustVerified', { count: data.verifiedOrAudited, total: data.producers }), body: t('home.trustVerifiedBody') },
    { icon: FileCheck2, tone: 'text-expiring bg-expiring-soft', title: t('home.trustDocuments', { count: data.documents }), body: t('home.trustDocumentsBody') },
    { icon: MessageSquareQuote, tone: 'text-primary bg-primary-soft', title: t('home.trustReviews', { count: data.reviews }), body: t('home.trustReviewsBody') },
  ]
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${item.tone}`}>
            <item.icon className="size-5" aria-hidden />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-semibold">{item.title}</span>
            <span className="text-[0.8125rem] text-ink-muted">{item.body}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
