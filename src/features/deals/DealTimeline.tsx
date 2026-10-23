import { useTranslation } from 'react-i18next'
import { Check, CircleDashed, OctagonAlert, X } from 'lucide-react'
import type { Deal } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { cn } from '@/shared/lib/cn'
import { LIFECYCLE } from './dealRules'

/** Events that happened (with timestamps and actor), then the steps still ahead. */
export function DealTimeline({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const terminal = deal.status === 'completed' || deal.status === 'cancelled'
  const reached = new Set(deal.events.map((e) => e.status))
  const currentIndex = LIFECYCLE.indexOf(deal.status)
  const upcoming = terminal || deal.status === 'disputed' ? [] : LIFECYCLE.slice(currentIndex + 1).filter((s) => s !== 'negotiation' && !reached.has(s))
  return (
    <ol className="flex flex-col" aria-label={t('dealDetail.timeline')}>
      {deal.events.map((e, i) => {
        const last = i === deal.events.length - 1
        const bad = e.status === 'cancelled' || e.status === 'disputed'
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0" aria-current={last ? 'step' : undefined}>
            {(!last || upcoming.length > 0) && <span aria-hidden className="absolute start-[0.6875rem] top-6 bottom-0 w-0.5 bg-line-strong" />}
            <span
              aria-hidden
              className={cn(
                'relative z-10 grid size-6 shrink-0 place-items-center rounded-full',
                bad ? 'bg-expired text-white' : last && !terminal ? 'bg-primary text-on-primary ring-4 ring-primary/20' : 'bg-ink text-bg',
              )}
            >
              {e.status === 'cancelled' ? <X className="size-3.5" /> : e.status === 'disputed' ? <OctagonAlert className="size-3.5" /> : <Check className="size-3.5" />}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className={cn('text-sm font-semibold', bad && 'text-expired')}>{t(`deals.status.${e.status}`)}</span>
              <time dateTime={e.at} className="text-xs text-ink-muted tabular">
                {fmt.dateTime(e.at)} · {t(`dealDetail.actor.${e.actor}`)}
              </time>
              {e.noteKey && <span className="text-xs text-ink-subtle">{t(`dealDetail.notes.${e.noteKey}`, { defaultValue: '' })}</span>}
            </div>
          </li>
        )
      })}
      {upcoming.map((s, i) => (
        <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
          {i < upcoming.length - 1 && <span aria-hidden className="absolute start-[0.6875rem] top-6 bottom-0 w-0.5 bg-line" />}
          <span aria-hidden className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong bg-surface text-ink-subtle">
            <CircleDashed className="size-3" />
          </span>
          <span className="text-sm text-ink-subtle">
            {t(`deals.status.${s}`)} <span className="sr-only">({t('dealDetail.upcoming')})</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
