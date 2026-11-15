import { useState, type CSSProperties } from 'react'
import type { MediaRef } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import { CategoryIcon } from '@/features/categories/CategoryIcon'
import { cn } from '@/shared/lib/cn'
import { sizedPhotoUrl } from '@/shared/lib/photoFile'
import { localPhoto } from './localPhotos'

/** Used when a caller does not say how wide the photo is shown: the product gallery. */
const GALLERY_SIZES = '(min-width: 1024px) 40vw, 100vw'

export function ProductMedia({
  media,
  categorySlug,
  className,
  sizes = GALLERY_SIZES,
}: {
  media: MediaRef | undefined
  categorySlug: string
  className?: string
  /** How wide the photo is displayed (an <img sizes> value, e.g. "64px"), for browsers that cannot measure it themselves. */
  sizes?: string
}) {
  const icon = getCategoryConfig(categorySlug)?.icon ?? 'Package'
  const [failed, setFailed] = useState<string | null>(null)
  const url = media?.url && failed !== media.url ? media.url : undefined
  const local = url ? localPhoto(url) : undefined
  return (
    <div
      aria-hidden
      style={{ '--h': media?.tone ?? 0 } as CSSProperties}
      className={cn('product-media relative grid place-items-center overflow-hidden', className)}
    >
      <CategoryIcon name={icon} className="size-1/3 max-h-14 max-w-14 opacity-70" />
      {url && (
        <img
          src={local?.src ?? sizedPhotoUrl(url, 640)}
          srcSet={
            local?.srcSet ??
            `${sizedPhotoUrl(url, 320)} 320w, ${sizedPhotoUrl(url, 640)} 640w, ${sizedPhotoUrl(url, 1200)} 1200w`
          }
          sizes={`auto, ${sizes}`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(url)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  )
}
