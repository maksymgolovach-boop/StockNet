import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { VerificationLevel } from '@/types/models'
import { RadioChips, Switch } from '@/shared/ui/form'
import type { FiltersApi } from '../useFilters'

const LEVELS: VerificationLevel[] = ['identity', 'verified', 'audited']

export function TrustFilters({ api }: { api: FiltersApi }) {
  const { t } = useTranslation()
  const id = useId()
  const f = api.filters
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-muted">{t('filters.verificationMin')}</span>
        <RadioChips
          name="verification"
          legend={t('filters.verificationMin')}
          value={f.verificationMin}
          onChange={(verificationMin) => api.setFilters({ verificationMin })}
          options={[{ value: '', label: t('filters.any') }, ...LEVELS.map((l) => ({ value: l, label: t(`verification.levels.${l}`) }))]}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-trust`} className="flex justify-between text-xs text-ink-muted">
          {t('filters.minTrust')}
          <output className="font-medium text-ink tabular">{f.minTrust ? `≥ ${f.minTrust}` : t('filters.any')}</output>
        </label>
        <input
          id={`${id}-trust`}
          type="range"
          min={0}
          max={95}
          step={5}
          value={f.minTrust ?? 0}
          onChange={(e) => api.setFilters({ minTrust: Number(e.target.value) || undefined })}
          className="accent-[var(--primary)]"
        />
      </div>
      <Switch checked={f.pastPartnersOnly} onChange={(pastPartnersOnly) => api.setFilters({ pastPartnersOnly })} label={t('filters.pastPartnersOnly')} />
      <Switch checked={f.validCertsOnly} onChange={(validCertsOnly) => api.setFilters({ validCertsOnly })} label={t('filters.validCertsOnly')} hint={t('filters.validCertsHint')} />
    </div>
  )
}
