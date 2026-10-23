import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import type { RecommendationReason } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { useProducts } from '@/services/queries'

export function ReasonChip({ reason }: { reason: RecommendationReason }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { data: products } = useProducts()
  const text = (() => {
    switch (reason.code) {
      case 'searched':
        return t('reco.reasons.searched', { term: reason.term })
      case 'past_partner':
        return t('reco.reasons.pastPartner', { count: reason.dealCount })
      case 'popular_with_type':
        return t('reco.reasons.popular', { type: t(`reco.buyerTypePlural.${reason.buyerType}`) })
      case 'preferred_category':
        return t('reco.reasons.category', { category: t(`categories.${reason.categorySlug}`) })
      case 'saved_similar':
        return t('reco.reasons.saved', { name: products?.find((p) => p.id === reason.productId)?.name ?? '' })
      case 'nearby':
        return t('reco.reasons.nearby', { distance: fmt.distance(reason.distanceKm) })
    }
  })()
  return (
    <p className="flex items-start gap-1.5 px-1 text-xs font-medium text-ink-muted">
      <Sparkles className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
      <span className="line-clamp-2">{text}</span>
    </p>
  )
}
