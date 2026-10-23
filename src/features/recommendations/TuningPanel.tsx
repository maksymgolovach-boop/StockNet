import { useTranslation } from 'react-i18next'
import type { RecommendationTuning } from '@/types/models'
import { CERTIFICATIONS, type CertificationCode } from '@/config/certifications'
import { ROOT_CATEGORY_SLUGS, getCategoryConfig } from '@/config/categories'
import { DEFAULT_PREFERENCES, usePreferences } from '@/features/settings/preferencesStore'
import { Button } from '@/shared/ui/Button'
import { Checkbox, RangeInputs, Switch } from '@/shared/ui/form'

/** "Tune my recommendations": every change is saved immediately and re-ranks the list. */
export function TuningPanel() {
  const { t } = useTranslation()
  const tuning = usePreferences((s) => s.recommendations)
  const update = usePreferences((s) => s.update)
  const set = (patch: Partial<RecommendationTuning>) => update({ recommendations: { ...tuning, ...patch } })
  const certOptions = [...new Set((tuning.categories.length ? tuning.categories : ROOT_CATEGORY_SLUGS).flatMap((slug) => getCategoryConfig(slug)?.certifications ?? []))]
  const certLabel = (c: CertificationCode) => {
    const cfg = CERTIFICATIONS[c] as { label: string; translatable?: boolean }
    return cfg.translatable ? t(`certs.${c}`) : cfg.label
  }
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">{t('reco.tune.categories')}</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {ROOT_CATEGORY_SLUGS.map((slug) => (
            <Checkbox
              key={slug}
              checked={tuning.categories.includes(slug)}
              onChange={(on) => set({ categories: on ? [...tuning.categories, slug] : tuning.categories.filter((x) => x !== slug), certifications: tuning.certifications })}
              label={t(`categories.${slug}`)}
            />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{t('reco.tune.volume')}</p>
        <RangeInputs
          min={tuning.volumeEUR.min}
          max={tuning.volumeEUR.max}
          minLabel={t('reco.tune.volumeMin')}
          maxLabel={t('reco.tune.volumeMax')}
          suffix="EUR"
          onCommit={(min, max) => set({ volumeEUR: { min: min ?? 0, max: max ?? Math.max(min ?? 0, 1_000_000) } })}
        />
        <p className="text-xs text-ink-subtle">{t('reco.tune.volumeHint')}</p>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">{t('reco.tune.certifications')}</legend>
        <div className="grid max-h-56 gap-x-4 overflow-y-auto sm:grid-cols-2">
          {certOptions.map((c) => (
            <Checkbox key={c} checked={tuning.certifications.includes(c)} onChange={(on) => set({ certifications: on ? [...tuning.certifications, c] : tuning.certifications.filter((x) => x !== c) })} label={certLabel(c)} />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1">
        <Switch checked={tuning.preferVerified} onChange={(preferVerified) => set({ preferVerified })} label={t('reco.tune.preferVerified')} hint={t('reco.tune.preferVerifiedHint')} />
        <Switch checked={tuning.preferPastPartners} onChange={(preferPastPartners) => set({ preferPastPartners })} label={t('reco.tune.preferPartners')} hint={t('reco.tune.preferPartnersHint')} />
      </div>
      <Button variant="ghost" size="sm" className="self-start" onClick={() => update({ recommendations: DEFAULT_PREFERENCES.recommendations })}>
        {t('reco.tune.reset')}
      </Button>
    </div>
  )
}
