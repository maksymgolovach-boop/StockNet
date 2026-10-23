import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EyeOff } from 'lucide-react'
import type { Producer } from '@/types/models'
import { LANGUAGES } from '@/config/languages'
import { CategoryIcon } from '@/features/categories/CategoryIcon'
import { getCategoryConfig } from '@/config/categories'
import { useFormat } from '@/features/i18n/useFormat'
import { useBuyers } from '@/services/queries'
import { useDevStore } from '@/features/dev/devStore'
import { usePreferences } from '@/features/settings/preferencesStore'

export function ProducerOverview({ producer }: { producer: Producer }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { data: buyers } = useBuyers()
  const privacy = usePreferences((s) => s.privacy)
  const dev = useDevStore()
  const ownCompany = producer.id === dev.producerId
  const refsHidden = ownCompany && !privacy.showReferenceCustomers
  const countHidden = ownCompany && !privacy.showDealCountPublicly
  const refs = refsHidden
    ? []
    : producer.referenceCustomers
        .filter((r) => (r.buyerId === dev.buyerId ? (privacy.allowListedAsReference ?? true) : r.visible))
        .map((r) => buyers?.find((b) => b.id === r.buyerId))
        .filter((b) => b !== undefined)
  const facts: [string, string][] = [
    [t('producer.facts.type'), t(`producerTypes.${producer.type}`)],
    [t('producer.facts.founded'), String(producer.foundedYear)],
    [t('producer.facts.employees'), producer.employees],
    [t('producer.facts.address'), `${producer.address.street}, ${producer.address.postcode} ${producer.address.city}, ${fmt.region(producer.address.country)}`],
    [t('producer.facts.deliveryRadius'), fmt.distance(producer.deliveryRadiusKm)],
    [t('producer.facts.languages'), fmt.list(producer.spokenLanguages.map((l) => LANGUAGES[l].nativeName))],
    [t('producer.facts.memberSince'), fmt.date(producer.memberSince, { month: 'long', year: 'numeric' })],
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('producer.about')}</h2>
          <p className="leading-relaxed" lang={producer.contentLang}>
            {producer.description}
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('producer.supplies')}</h2>
          <ul className="flex flex-wrap gap-2">
            {producer.rootCategories.map((slug) => (
              <li key={slug}>
                <Link to={`/category/${slug}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-surface px-3 text-sm hover:border-primary hover:text-primary">
                  <CategoryIcon name={getCategoryConfig(slug)?.icon ?? ''} className="size-4" />
                  {t(`categories.${slug}`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t('producer.publicStats')}</h2>
          <dl className="grid grid-cols-3 gap-3">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
              <dt className="text-xs text-ink-muted">{t('producer.completedDeals')}</dt>
              <dd className="text-2xl font-semibold tabular">{countHidden ? '—' : fmt.number(producer.publicStats.completedDeals)}</dd>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
              <dt className="text-xs text-ink-muted">{t('producer.repeatCustomers')}</dt>
              <dd className="text-2xl font-semibold tabular">{fmt.percent(producer.publicStats.repeatCustomerRate)}</dd>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
              <dt className="text-xs text-ink-muted">{t('producer.yearsActive')}</dt>
              <dd className="text-2xl font-semibold tabular">{producer.publicStats.yearsActive}</dd>
            </div>
          </dl>
          <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <EyeOff className="size-3.5" aria-hidden />
            {t('producer.privacyNote')}
          </p>
        </section>
        {refsHidden && dev.role === 'producer' && (
          <p className="rounded-md bg-surface-2 px-3 py-2 text-xs text-ink-muted">
            {t('settings.privacy.refsHiddenNote')}{' '}
            <Link to="/settings#privacy" className="text-primary hover:underline">
              {t('pages.settings')}
            </Link>
          </p>
        )}
        {refs.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{t('producer.referenceCustomers')}</h2>
            <ul className="flex flex-wrap gap-2">
              {refs.map((b) => (
                <li key={b.id} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                  {b.name} <span className="text-ink-subtle">· {t(`buyerTypes.${b.type}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-subtle">{t('producer.referenceNote')}</p>
          </section>
        )}
      </div>
      <aside>
        <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 px-4 py-2.5">
              <dt className="text-xs text-ink-muted">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
