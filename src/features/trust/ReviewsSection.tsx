import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Camera, CornerDownRight, MessageSquareOff, Star, ThumbsUp } from 'lucide-react'
import type { Review, ReviewCriterion } from '@/types/models'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { useBuyers } from '@/services/queries'
import { Badge } from '@/shared/ui/Badge'
import { Select } from '@/shared/ui/Select'
import { EmptyState } from '@/shared/ui/states'
import { cn } from '@/shared/lib/cn'
import { ReportButton } from './ReportDialog'

const CRITERIA: ReviewCriterion[] = ['quality', 'conformity', 'delivery', 'communication', 'value']
type ReviewSort = 'newest' | 'helpful' | 'highest' | 'lowest'

export function Stars({ value, size = 'sm', label }: { value: number; size?: 'sm' | 'md'; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(size === 'md' ? 'size-5' : 'size-3.5', value >= i - 0.25 ? 'fill-accent text-accent' : value >= i - 0.75 ? 'fill-accent/40 text-accent' : 'text-line-strong')}
        />
      ))}
    </span>
  )
}

function Summary({ reviews, starFilter, onStar }: { reviews: Review[]; starFilter: number | null; onStar: (n: number | null) => void }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const avg = reviews.reduce((s, r) => s + r.overall, 0) / reviews.length
  const buckets = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.overall) === n).length }))
  const max = Math.max(...buckets.map((b) => b.count), 1)
  return (
    <div className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-4 md:grid-cols-[auto_1fr_1fr]">
      <div className="flex flex-col items-start gap-1">
        <span className="font-display text-4xl font-semibold tabular">{fmt.number(avg, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
        <Stars value={avg} size="md" label={t('reviews.average', { rating: fmt.number(avg, { maximumFractionDigits: 1 }) })} />
        <span className="text-sm text-ink-muted">{t('common.reviews', { count: reviews.length })}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-verified">
          <BadgeCheck className="size-3.5" aria-hidden />
          {t('reviews.allVerified')}
        </span>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('reviews.distribution')}</p>
        <ul className="flex flex-col gap-1">
          {buckets.map((b) => (
            <li key={b.n}>
              <button
                type="button"
                onClick={() => onStar(starFilter === b.n ? null : b.n)}
                aria-pressed={starFilter === b.n}
                disabled={b.count === 0}
                className={cn('flex w-full items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-surface-2 disabled:opacity-40', starFilter === b.n && 'bg-primary-soft')}
                aria-label={t('reviews.filterStars', { count: b.n, total: b.count })}
              >
                <span className="w-6 text-end tabular">{b.n}★</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${(b.count / max) * 100}%` }} />
                </span>
                <span className="w-6 text-xs text-ink-muted tabular">{b.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('reviews.criteria')}</p>
        <dl className="flex flex-col gap-1.5">
          {CRITERIA.map((c) => {
            const v = reviews.reduce((s, r) => s + r.ratings[c], 0) / reviews.length
            return (
              <div key={c} className="flex items-center gap-2 text-sm">
                <dt className="w-32 shrink-0 text-ink-muted">{t(`reviews.criteriaNames.${c}`)}</dt>
                <dd className="flex flex-1 items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${(v / 5) * 100}%` }} />
                  </span>
                  <span className="w-7 text-end font-medium tabular">{fmt.number(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}

function ReviewCard({ review, buyerName, ownDeal, producerName }: { review: Review; buyerName: string; ownDeal: boolean; producerName: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const [voted, setVoted] = useState(false)
  return (
    <article className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <header className="flex flex-wrap items-center gap-2">
        <Stars value={review.overall} label={t('reviews.rated', { rating: review.overall })} />
        <span className="font-semibold tabular">{fmt.number(review.overall, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
        <span className="text-sm font-medium">{buyerName}</span>
        <span className="text-xs text-ink-subtle">· {fmt.date(review.createdAt)}</span>
        {ownDeal ? (
          <Link to={`/deals/${review.dealId}`} className="relative z-10">
            <Badge tone="verified" icon={<BadgeCheck className="size-3" aria-hidden />}>
              {t('reviews.verifiedDealLink', { id: review.dealId })}
            </Badge>
          </Link>
        ) : (
          <Badge tone="verified" icon={<BadgeCheck className="size-3" aria-hidden />}>
            {t('reviews.verifiedDeal')}
          </Badge>
        )}
        {review.lotNumbers?.map((n) => (
          <Badge key={n} tone="ink">
            {t('lots.reviewLot', { number: n })}
          </Badge>
        ))}
      </header>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted">
        {CRITERIA.map((c) => (
          <li key={c}>
            {t(`reviews.criteriaNames.${c}`)} <span className="font-medium text-ink">{review.ratings[c]}/5</span>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed" lang={review.contentLang}>
        {review.text}
      </p>
      {review.photoCount > 0 && (
        <ul className="flex gap-2" aria-label={t('reviews.photos', { count: review.photoCount })}>
          {Array.from({ length: review.photoCount }, (_, i) => (
            <li key={i} className="grid size-14 place-items-center rounded-md bg-surface-2 text-ink-subtle">
              <Camera className="size-4" aria-hidden />
            </li>
          ))}
        </ul>
      )}
      {review.reply && (
        <div className="ms-2 flex gap-2 rounded-md border-s-2 border-primary bg-surface-2 p-3 text-sm">
          <CornerDownRight className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
          <div>
            <p className="text-xs font-semibold">
              {t('reviews.replyFrom', { name: producerName })} <span className="font-normal text-ink-subtle">· {fmt.date(review.reply.createdAt)}</span>
            </p>
            <p className="mt-1">{review.reply.text}</p>
          </div>
        </div>
      )}
      <footer className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={() => setVoted((v) => !v)}
          aria-pressed={voted}
          className={cn('inline-flex items-center gap-1.5 text-xs font-medium', voted ? 'text-primary' : 'text-ink-muted hover:text-ink')}
        >
          <ThumbsUp className={cn('size-3.5', voted && 'fill-primary')} aria-hidden />
          {t('reviews.helpful', { count: review.helpfulVotes + (voted ? 1 : 0) })}
        </button>
        <ReportButton target="review" name={t('reviews.reviewBy', { name: buyerName })} />
      </footer>
    </article>
  )
}

/** Verified-deal reviews with distribution chart, criteria averages, filters and sorting. */
export function ReviewsSection({ reviews, producerName, emptyBody }: { reviews: Review[]; producerName: string; emptyBody?: string }) {
  const { t } = useTranslation()
  const { data: buyers } = useBuyers()
  const role = useDevStore((s) => s.role)
  const actor = useActorId()
  const [star, setStar] = useState<number | null>(null)
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [withPhotos, setWithPhotos] = useState(false)
  const [withReply, setWithReply] = useState(false)

  const shown = useMemo(() => {
    const list = reviews.filter((r) => (star === null || Math.round(r.overall) === star) && (!withPhotos || r.photoCount > 0) && (!withReply || !!r.reply))
    const cmp: Record<ReviewSort, (a: Review, b: Review) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      helpful: (a, b) => b.helpfulVotes - a.helpfulVotes,
      highest: (a, b) => b.overall - a.overall,
      lowest: (a, b) => a.overall - b.overall,
    }
    return list.sort(cmp[sort])
  }, [reviews, star, sort, withPhotos, withReply])

  if (!reviews.length) return <EmptyState icon={<MessageSquareOff className="size-5" aria-hidden />} title={t('reviews.none')} body={emptyBody ?? t('reviews.noneBody')} />

  const nameOf = (id: string) => buyers?.find((b) => b.id === id)?.name ?? t('reviews.verifiedBuyer')
  return (
    <div className="flex flex-col gap-4">
      <Summary reviews={reviews} starFilter={star} onStar={setStar} />
      <div className="flex flex-wrap items-center gap-3">
        <p className="me-auto text-sm text-ink-muted" role="status">
          {t('reviews.showing', { count: shown.length, total: reviews.length })}
        </p>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} className="accent-[var(--primary)]" />
          {t('reviews.withPhotos')}
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={withReply} onChange={(e) => setWithReply(e.target.checked)} className="accent-[var(--primary)]" />
          {t('reviews.withReply')}
        </label>
        <Select
          label={t('search.sortBy')}
          hideLabel
          compact
          value={sort}
          onChange={(e) => setSort(e.target.value as ReviewSort)}
          options={(['newest', 'helpful', 'highest', 'lowest'] as const).map((s) => ({ value: s, label: t(`reviews.sort.${s}`) }))}
        />
        {star !== null && (
          <button type="button" onClick={() => setStar(null)} className="text-xs font-medium text-primary hover:underline">
            {t('reviews.clearStars', { count: star })}
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <EmptyState compact title={t('reviews.noMatch')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} buyerName={nameOf(r.buyerId)} ownDeal={role === 'buyer' ? r.buyerId === actor : r.producerId === actor} producerName={producerName} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
