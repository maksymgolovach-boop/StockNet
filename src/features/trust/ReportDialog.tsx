import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Flag } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

export type ReportTarget = 'listing' | 'user' | 'review'

const REASONS: Record<ReportTarget, string[]> = {
  listing: ['misleading', 'counterfeit', 'wrong_category', 'prohibited', 'other'],
  user: ['fraud', 'impersonation', 'abusive', 'spam', 'other'],
  review: ['fake', 'offensive', 'off_topic', 'personal_data', 'other'],
}

/** Report a listing, user or review. UI only: nothing is sent, a confirmation is shown. */
export function ReportButton({ target, name, compact = false, children }: { target: ReportTarget; name: string; compact?: boolean; children?: ReactNode }) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const close = () => {
    setOpen(false)
    setTimeout(() => {
      setSent(false)
      setReason('')
      setDetails('')
    }, 200)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-expired"
        aria-label={compact ? t(`report.${target}`) : undefined}
      >
        <Flag className="size-3.5" aria-hidden />
        {!compact && (children ?? t(`report.${target}`))}
      </button>
      <Modal
        open={open}
        onClose={close}
        title={t(`report.${target}`)}
        closeLabel={t('common.close')}
        footer={
          sent ? (
            <Button onClick={close}>{t('common.close')}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" disabled={!reason} onClick={() => setSent(true)}>
                {t('report.submit')}
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div role="status" className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="size-10 text-verified" aria-hidden />
            <p className="font-semibold">{t('report.thanks')}</p>
            <p className="text-sm text-ink-muted">{t('report.thanksBody')}</p>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <p className="text-sm text-ink-muted">{t('report.about', { name })}</p>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm font-medium">{t('report.reason')}</legend>
              {REASONS[target].map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name={`${id}-reason`} value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--primary)]" />
                  {t(`report.reasons.${r}`)}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-details`} className="text-sm font-medium">
                {t('report.details')}
              </label>
              <textarea id={`${id}-details`} value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="rounded-[var(--radius-control)] border border-line-strong bg-surface p-2 text-sm" />
            </div>
            <p className="text-xs text-ink-subtle">{t('report.demoNote')}</p>
          </form>
        )}
      </Modal>
    </>
  )
}
