import { useEffect, useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Globe2, MapPin, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import type { ThemePreference, UserPreferences } from '@/types/models'
import { CURRENCY_CODES, isCurrencyCode } from '@/config/currencies'
import { LANGUAGES } from '@/config/languages'
import { CurrencySwitcher } from '@/features/currency/CurrencySwitcher'
import { useFormat } from '@/features/i18n/useFormat'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { TuningPanel } from '@/features/recommendations/TuningPanel'
import { clearStoredDeals } from '@/mocks/dealStorage'
import { clearStoredLots } from '@/mocks/lotStorage'
import { Button } from '@/shared/ui/Button'
import { RadioChips, Switch } from '@/shared/ui/form'
import { RADIUS_STEPS } from '@/features/search/filters/LocationFilter'
import { LocationPicker } from './LocationPicker'
import { usePreferences } from './preferencesStore'

function Section({ id, icon, title, description, children }: { id: string; icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[calc(var(--chrome-h,8rem)+1rem)] rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink">{icon}</span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

const SECTIONS = ['region', 'location', 'notifications', 'privacy', 'recommendations', 'data'] as const

export function SettingsPage() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const id = useId()
  const prefs = usePreferences()
  const set = prefs.update
  const notif = (patch: Partial<UserPreferences['notifications']>) => set({ notifications: { ...prefs.notifications, ...patch } })
  const privacy = (patch: Partial<UserPreferences['privacy']>) => set({ privacy: { ...prefs.privacy, ...patch } })
  const radiusIndex = Math.max(0, RADIUS_STEPS.findIndex((r) => r >= prefs.radiusKm))

  useEffect(() => {
    document.title = `${t('pages.settings')} · Stocknet`
  }, [t])

  return (
    <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-6">
      <nav aria-label={t('settings.nav')} className="min-w-0 lg:sticky lg:top-[calc(var(--chrome-h,8rem)+1rem)] lg:self-start">
        <h1 className="mb-3 text-3xl font-semibold">{t('pages.settings')}</h1>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col">
          {SECTIONS.map((s) => (
            <li key={s}>
              <a href={`#${s}`} className="block shrink-0 rounded-[var(--radius-control)] px-3 py-2 text-sm whitespace-nowrap hover:bg-surface-2">
                {t(`settings.sections.${s}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-5">
        <p className="text-sm text-ink-muted" role="note">
          {t('settings.autosave')}
        </p>
        <Section id="region" icon={<Globe2 className="size-5" aria-hidden />} title={t('settings.sections.region')} description={t('settings.regionBody')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LanguageSwitcher compact={false} showLabel />
            <div className="flex flex-col gap-2">
              <CurrencySwitcher compact={false} showLabel />
              <Switch
                checked={prefs.currency === null}
                onChange={(follow) => prefs.setCurrency(follow ? null : LANGUAGES[prefs.language].defaultCurrency)}
                label={t('settings.followLanguage', { currency: LANGUAGES[prefs.language].defaultCurrency })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">{t('settings.units')}</span>
              <RadioChips
                name="units"
                legend={t('settings.units')}
                value={prefs.units}
                onChange={(u) => u && prefs.setUnits(u)}
                options={[
                  { value: 'metric', label: t('settings.metric') },
                  { value: 'imperial', label: t('settings.imperial') },
                ]}
              />
              <span className="text-xs text-ink-subtle">{t('settings.unitsHint')}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">{t('header.theme')}</span>
              <RadioChips<ThemePreference>
                name="theme"
                legend={t('header.theme')}
                value={prefs.theme}
                onChange={(v) => v && prefs.setTheme(v)}
                options={(['light', 'dark', 'system'] as const).map((v) => ({ value: v, label: t(`theme.${v}`) }))}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-subtle">{t('settings.currencyNote', { list: CURRENCY_CODES.filter(isCurrencyCode).join(', ') })}</p>
        </Section>

        <Section id="location" icon={<MapPin className="size-5" aria-hidden />} title={t('settings.sections.location')} description={t('settings.locationBody')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LocationPicker />
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-radius`} className="flex justify-between text-xs text-ink-muted">
                {t('settings.defaultRadius')}
                <output htmlFor={`${id}-radius`} className="font-medium text-ink tabular">
                  {fmt.distance(prefs.radiusKm)}
                </output>
              </label>
              <input
                id={`${id}-radius`}
                type="range"
                min={1}
                max={RADIUS_STEPS.length - 1}
                value={radiusIndex}
                aria-valuetext={fmt.distance(prefs.radiusKm)}
                onChange={(e) => prefs.setRadius(RADIUS_STEPS[Number(e.target.value)] ?? 250)}
                className="accent-[var(--primary)]"
              />
              <span className="text-xs text-ink-subtle">{t('settings.radiusHint')}</span>
            </div>
          </div>
        </Section>

        <Section id="notifications" icon={<Bell className="size-5" aria-hidden />} title={t('settings.sections.notifications')} description={t('settings.notificationsBody')}>
          <div className="grid gap-x-8 sm:grid-cols-2">
            {(['newMessages', 'quoteUpdates', 'dealStatus', 'expiringDocuments', 'priceDrops'] as const).map((k) => (
              <Switch key={k} checked={prefs.notifications[k]} onChange={(v) => notif({ [k]: v })} label={t(`settings.notifications.${k}`)} hint={t(`settings.notifications.${k}Hint`)} />
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-muted">{t('settings.digest')}</span>
            <RadioChips
              name="digest"
              legend={t('settings.digest')}
              value={prefs.notifications.emailDigest}
              onChange={(v) => v && notif({ emailDigest: v })}
              options={(['off', 'daily', 'weekly'] as const).map((v) => ({ value: v, label: t(`settings.digestOptions.${v}`) }))}
            />
          </div>
          <p className="mt-3 text-xs text-ink-subtle">{t('settings.demoNotifications')}</p>
        </Section>

        <Section id="privacy" icon={<ShieldCheck className="size-5" aria-hidden />} title={t('settings.sections.privacy')} description={t('settings.privacyBody')}>
          <div className="flex flex-col gap-1">
            <Switch checked={prefs.privacy.showReferenceCustomers} onChange={(v) => privacy({ showReferenceCustomers: v })} label={t('settings.privacy.showReferences')} hint={t('settings.privacy.showReferencesHint')} />
            <Switch checked={prefs.privacy.allowListedAsReference ?? true} onChange={(v) => privacy({ allowListedAsReference: v })} label={t('settings.privacy.allowReference')} hint={t('settings.privacy.allowReferenceHint')} />
            <Switch checked={prefs.privacy.showDealCountPublicly} onChange={(v) => privacy({ showDealCountPublicly: v })} label={t('settings.privacy.dealCount')} hint={t('settings.privacy.dealCountHint')} />
          </div>
          <p className="mt-3 text-xs text-ink-subtle">{t('settings.privacy.always')}</p>
        </Section>

        <Section id="recommendations" icon={<Sparkles className="size-5" aria-hidden />} title={t('settings.sections.recommendations')} description={t('reco.tune.intro')}>
          <TuningPanel />
        </Section>

        <Section id="data" icon={<RotateCcw className="size-5" aria-hidden />} title={t('settings.sections.data')} description={t('settings.dataBody')}>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={prefs.reset}>
              {t('dev.resetPrefs')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearStoredLots()
                clearStoredDeals()
                window.location.reload()
              }}
            >
              {t('dev.resetLots')}
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
