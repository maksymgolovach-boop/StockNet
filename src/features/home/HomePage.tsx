import { useTranslation } from 'react-i18next'
import { SearchBox } from '@/features/search/SearchBox'
import { CategoryGrid } from '@/features/categories/CategoryGrid'
import { RecommendedSection } from '@/features/recommendations/RecommendedSection'
import { useDevStore } from '@/features/dev/devStore'
import { HomeDeals } from './HomeDeals'
import { NearbyProducers } from './NearbyProducers'
import { TrustHighlights } from './TrustHighlights'

export function HomePage() {
  const { t } = useTranslation()
  const role = useDevStore((s) => s.role)
  return (
    <div className="flex flex-col gap-14">
      <section className="relative border-b border-line bg-surface">
        <div aria-hidden className="grid-paper absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-12 md:py-16 lg:px-6">
          <h1 className="max-w-3xl text-4xl font-semibold md:text-5xl">{t('home.heroTitle')}</h1>
          <p className="max-w-2xl text-base text-ink-muted md:text-lg">{t('home.heroBody')}</p>
          <div className="flex max-w-2xl flex-col gap-2">
            <SearchBox size="lg" />
            <p className="text-[0.8125rem] text-ink-subtle">{t('home.heroSearchHint')}</p>
          </div>
        </div>
      </section>

      {role === 'buyer' && <RecommendedSection />}

      <section aria-labelledby="home-categories" className="mx-auto w-full max-w-[90rem] px-4 lg:px-6">
        <div className="mb-4 flex flex-col gap-1">
          <h2 id="home-categories" className="text-2xl font-semibold">
            {t('home.categoriesTitle')}
          </h2>
          <p className="text-sm text-ink-muted">{t('home.categoriesBody')}</p>
        </div>
        <CategoryGrid />
      </section>

      <NearbyProducers />

      <HomeDeals />

      <section aria-labelledby="home-trust" className="mx-auto w-full max-w-[90rem] px-4 lg:px-6">
        <h2 id="home-trust" className="mb-4 text-2xl font-semibold">
          {t('home.trustTitle')}
        </h2>
        <TrustHighlights />
      </section>
    </div>
  )
}
