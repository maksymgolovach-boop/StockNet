import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pin } from 'lucide-react'
import type { Thread } from '@/types/models'
import { DealStatusBadge } from '@/features/deals/DealStatusBadge'
import { ProductMedia } from '@/features/product/ProductMedia'
import { ProductPrice } from '@/features/product/ProductPrice'
import { useMyDeals, useProduct } from '@/services/queries'
import { Skeleton } from '@/shared/ui/states'

export function PinnedContext({ thread }: { thread: Thread }) {
  const { t } = useTranslation()
  const product = useProduct(thread.productId ?? '')
  const { data: deals } = useMyDeals()
  const deal = deals?.find((d) => d.id === thread.dealId)
  if (!thread.productId) return null
  if (product.isPending) return <Skeleton className="mx-3 mt-3 h-[4.5rem] md:mx-5" />
  const p = product.data
  if (!p) return null
  return (
    <section aria-label={t('chat.pinned')} className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5 md:px-5">
      <Pin className="size-4 shrink-0 rotate-45 text-primary" aria-hidden />
      <ProductMedia media={p.media[0]} categorySlug={p.categorySlug} className="size-12 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link to={`/product/${p.id}`} className="truncate text-sm font-semibold hover:text-primary hover:underline" lang={p.contentLang}>
          {p.name}
        </Link>
        {deal && (
          <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <Link to={`/deals/${deal.id}`} className="font-mono hover:text-primary hover:underline">
              {deal.id}
            </Link>
            <DealStatusBadge status={deal.status} />
          </span>
        )}
      </div>
      <div className="hidden shrink-0 sm:block">
        <ProductPrice product={p} />
      </div>
    </section>
  )
}
