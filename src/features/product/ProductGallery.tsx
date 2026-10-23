import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MediaRef } from '@/types/models'
import { cn } from '@/shared/lib/cn'
import { ProductMedia } from './ProductMedia'

export function ProductGallery({ media, categorySlug, name }: { media: MediaRef[]; categorySlug: string; name: string }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const current = media[index] ?? media[0]
  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label={t('product.imageOf', { name, index: index + 1, total: media.length })} className="overflow-hidden rounded-[var(--radius-card)] border border-line">
        <ProductMedia media={current} categorySlug={categorySlug} className="aspect-[4/3] w-full" />
      </div>
      {media.length > 1 && (
        <div className="flex gap-2" role="group" aria-label={t('product.gallery')}>
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              aria-label={t('product.showImage', { index: i + 1 })}
              className={cn('overflow-hidden rounded-md border-2', i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <ProductMedia media={m} categorySlug={categorySlug} className="h-14 w-20" />
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-ink-subtle">{t(media.some((m) => m.url) ? 'product.stockPhotos' : 'product.placeholderImages')}</p>
    </div>
  )
}
