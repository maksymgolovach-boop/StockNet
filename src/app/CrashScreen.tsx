import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router-dom'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { resetDemoData } from '@/services/demoData'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { buttonClass } from '@/shared/ui/buttonClass'

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error ?? ''))

/** Shown instead of a blank page when rendering fails. Works outside the router, so it only uses plain links. */
export function CrashScreen({ error, fullPage = false }: { error: unknown; fullPage?: boolean }) {
  const { t } = useTranslation()
  const message = messageOf(error)
  return (
    <div
      data-crash
      role="alert"
      className={cn('mx-auto flex max-w-2xl flex-col px-4 py-16', fullPage && 'min-h-dvh justify-center')}
    >
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-expired/40 bg-surface px-6 py-12 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-surface-2 text-expired">
          <TriangleAlert className="size-5" aria-hidden />
        </div>
        <h1 className="font-display text-lg font-semibold">{t('errors.crashTitle')}</h1>
        <p className="max-w-md text-sm text-ink-muted">{t('errors.crashBody')}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            icon={<RefreshCw className="size-3.5" aria-hidden />}
          >
            {t('errors.reload')}
          </Button>
          <a href={import.meta.env.BASE_URL} className={buttonClass('secondary', 'sm')}>
            {t('errors.goHome')}
          </a>
          <Button variant="secondary" size="sm" onClick={resetDemoData}>
            {t('errors.resetData')}
          </Button>
        </div>
        {message && (
          <details className="max-w-full pt-2 text-xs text-ink-subtle">
            <summary className="cursor-pointer">{t('errors.details')}</summary>
            <p className="pt-1 font-mono break-words">{message}</p>
          </details>
        )}
      </div>
    </div>
  )
}

/** Route-level variant: React Router hands over the error thrown by a page or by loading its code. */
export function RouteCrash({ fullPage }: { fullPage?: boolean }) {
  return <CrashScreen error={useRouteError()} fullPage={fullPage} />
}
