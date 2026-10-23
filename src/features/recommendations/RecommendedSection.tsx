import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react'
import { ProductCard } from '@/features/product/ProductCard'
import { Button, IconButton } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { LoadingRegion, Skeleton } from '@/shared/ui/states'
import { ReasonChip } from './ReasonChip'
import { TuningPanel } from './TuningPanel'
import { useRecommendations } from './useRecommendations'

export function RecommendedSection() {
  const { t } = useTranslation()
  const { data, isPending, error } = useRecommendations(12)
  const [tuneOpen, setTuneOpen] = useState(false)
  const track = useRef<HTMLUListElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }
  if (error) return null
  return (
    <section aria-labelledby="home-reco" className="mx-auto w-full max-w-[90rem] px-4 lg:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="home-reco" className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="size-6 text-primary" aria-hidden />
            {t('reco.title')}
          </h2>
          <p className="text-sm text-ink-muted">{t('reco.body')}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal className="size-4" aria-hidden />} onClick={() => setTuneOpen(true)}>
            {t('reco.tune.open')}
          </Button>
          <IconButton label={t('reco.prev')} onClick={() => scroll(-1)} className="hidden sm:inline-flex">
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
          </IconButton>
          <IconButton label={t('reco.next')} onClick={() => scroll(1)} className="hidden sm:inline-flex">
            <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
          </IconButton>
        </div>
      </div>
      {isPending ? (
        <LoadingRegion>
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[26rem] w-72 shrink-0" />
            ))}
          </div>
        </LoadingRegion>
      ) : data?.items.length ? (
        <ul ref={track} aria-label={t('reco.title')} className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {data.items.map((item) => (
            <li key={item.product.id} className="flex w-[17.5rem] shrink-0 snap-start flex-col gap-1.5 sm:w-72">
              {item.recommendation.reasons[0] && <ReasonChip reason={item.recommendation.reasons[0]} />}
              <div className="min-w-0 flex-1">
                <ProductCard item={item} view="grid" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-6 text-sm text-ink-muted">{t('reco.empty')}</p>
      )}
      <Drawer open={tuneOpen} onClose={() => setTuneOpen(false)} title={t('reco.tune.title')} closeLabel={t('common.close')} side="end">
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-ink-muted">{t('reco.tune.intro')}</p>
          <TuningPanel />
        </div>
      </Drawer>
    </section>
  )
}
