import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudOff, Inbox, RefreshCw } from 'lucide-react'
import { ApiError } from '@/services/client'
import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-[var(--radius-control)]', className)} />
}

/** Wraps skeleton content with a single polite live-region announcement. */
export function LoadingRegion({ children, label }: { children: ReactNode; label?: string }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {children}
    </div>
  )
}

interface StateProps {
  title: string
  body?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

function StatePanel({ title, body, icon, action, className, compact }: StateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      {icon && <div className="grid size-11 place-items-center rounded-full bg-surface-2 text-ink-muted">{icon}</div>}
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="max-w-md text-sm text-ink-muted">{body}</p>}
      {action}
    </div>
  )
}

export function EmptyState(props: Partial<StateProps>) {
  const { t } = useTranslation()
  return <StatePanel icon={<Inbox className="size-5" aria-hidden />} title={t('empty.title')} body={t('empty.body')} {...props} />
}

export function ErrorState({ error, onRetry, className, compact }: { error?: unknown; onRetry?: () => void; className?: string; compact?: boolean }) {
  const { t } = useTranslation()
  const simulated = error instanceof ApiError && error.simulated
  return (
    <div role="alert">
      <StatePanel
        compact={compact}
        className={cn('border-expired/40', className)}
        icon={<CloudOff className="size-5 text-expired" aria-hidden />}
        title={t('errors.title')}
        body={t('errors.body')}
        action={
          <>
            {simulated && <p className="text-xs text-ink-subtle">{t('errors.simulated')}</p>}
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="size-3.5" aria-hidden />}>
                {t('common.retry')}
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}
