import { useTranslation } from 'react-i18next'
import type { Product } from '@/types/models'
import { getCategory } from '@/config/categories'
import { emptyFilters } from '@/features/search/filtersCodec'
import { useSearchResults } from '@/features/search/useSearchResults'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { ProductCard } from './ProductCard'

export function SimilarProducts({ product }: { product: Product }) {
  const { t } = useTranslation()
  const parent = getCategory(product.categorySlug)?.parentSlug ?? product.categorySlug
  const { data, isPending, error, refetch } = useSearchResults({ filters: { ...emptyFilters(), category: parent }, sort: 'relevance', limit: 4, excludeProductId: product.id })
  if (!isPending && !error && !data?.items.length) return null
  return (
    <section aria-labelledby="similar-title" className="flex flex-col gap-3">
      <h2 id="similar-title" className="text-xl font-semibold">
        {t('product.similar')}
      </h2>
      {isPending ? (
        <LoadingRegion>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </LoadingRegion>
      ) : error ? (
        <ErrorState compact error={error} onRetry={() => void refetch()} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data?.items.map((item) => (
            <li key={item.product.id} className="min-w-0">
              <ProductCard item={item} view="grid" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
