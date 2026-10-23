import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Snowflake } from 'lucide-react'
import { CATEGORY_CONFIGS } from '@/config/categories'
import { useCategoryStats } from '@/services/queries'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { Badge } from '@/shared/ui/Badge'
import { CategoryIcon } from './CategoryIcon'

/** Home category cards, rendered entirely from the category registry plus live counts. */
export function CategoryGrid() {
  const { t } = useTranslation()
  const { data, isPending, isError, error, refetch } = useCategoryStats()

  if (isPending) {
    return (
      <LoadingRegion>
        <ul className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_CONFIGS.map((c) => (
            <li key={c.slug}>
              <Skeleton className="h-[7.25rem] w-full" />
            </li>
          ))}
        </ul>
      </LoadingRegion>
    )
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />

  const stats = new Map(data.map((s) => [s.slug, s]))
  return (
    <ul className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3">
      {CATEGORY_CONFIGS.map((c) => {
        const s = stats.get(c.slug)
        return (
          <li key={c.slug}>
            <Link
              to={`/category/${c.slug}`}
              className="group flex h-full gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card transition hover:border-primary/50 hover:shadow-pop"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-on-primary">
                <CategoryIcon name={c.icon} className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{t(`categories.${c.slug}`)}</span>
                  {c.perishable && (
                    <Badge tone="primary" icon={<Snowflake className="size-3" aria-hidden />}>
                      {t('home.perishable')}
                    </Badge>
                  )}
                </span>
                <span className="text-[0.8125rem] leading-snug text-ink-muted">{t(`categoryBlurb.${c.slug}`)}</span>
                <span className="mt-auto pt-1 text-xs text-ink-subtle tabular">
                  {t('common.products', { count: s?.productCount ?? 0 })} · {t('common.producers', { count: s?.producerCount ?? 0 })}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
