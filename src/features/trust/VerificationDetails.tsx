import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle } from 'lucide-react'
import type { Verification, VerificationCheckKind } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { VERIFICATION_ORDER } from './trustScore'
import { VerificationBadge } from './VerificationBadge'

const ALL_CHECKS: VerificationCheckKind[] = ['company_registry', 'vat', 'documents', 'site_information', 'third_party_audit']

/** Every check with date and checker; the steps not yet done are shown greyed out. */
export function VerificationDetails({ verification }: { verification: Verification }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const done = new Map(verification.checks.map((c) => [c.kind, c]))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge level={verification.level} />
        <span className="text-sm text-ink-muted">{t(`verification.levelHelp.${verification.level}`)}</span>
      </div>
      <ol className="flex flex-col gap-0" aria-label={t('verification.label')}>
        {ALL_CHECKS.map((kind) => {
          const check = done.get(kind)
          return (
            <li key={kind} className="flex items-start gap-3 border-b border-line py-2.5 last:border-b-0">
              {check ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verified" aria-hidden /> : <Circle className="mt-0.5 size-5 shrink-0 text-ink-subtle" aria-hidden />}
              <span className="flex flex-col">
                <span className={check ? 'font-medium' : 'text-ink-subtle'}>{t(`verification.checks.${kind}`)}</span>
                <span className="text-xs text-ink-subtle">{check ? t('verification.checkedOn', { date: fmt.date(check.checkedAt), by: check.by }) : t('verification.notChecked')}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-ink-subtle">
        {t('verification.ladder', { levels: fmt.list(VERIFICATION_ORDER.map((l) => t(`verification.levels.${l}`)), 'unit') })}
      </p>
    </div>
  )
}
