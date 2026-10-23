import { useState, type CSSProperties } from 'react'
import type { MediaRef } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import { CategoryIcon } from '@/features/categories/CategoryIcon'
import { cn } from '@/shared/lib/cn'

const sized = (url: string, w: number) => (url.includes('images.unsplash.com') ? `${url}?auto=format&fit=crop&w=${w}&q=70` : `${url}?auto=compress&cs=tinysrgb&w=${w}`)

export function ProductMedia({ media, categorySlug, className }: { media: MediaRef | undefined; categorySlug: string; className?: string }) {
  const icon = getCategoryConfig(categorySlug)?.icon ?? 'Package'
  const [failed, setFailed] = useState<string | null>(null)
  const url = media?.url && failed !== media.url ? media.url : undefined
  return (
    <div aria-hidden style={{ '--h': media?.tone ?? 0 } as CSSProperties} className={cn('product-media relative grid place-items-center overflow-hidden', className)}>
      <CategoryIcon name={icon} className="size-1/3 max-h-14 max-w-14 opacity-70" />
      {url && (
        <img
          src={sized(url, 640)}
          srcSet={`${sized(url, 320)} 320w, ${sized(url, 640)} 640w, ${sized(url, 1200)} 1200w`}
          sizes="(min-width: 1024px) 40vw, 100vw"
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
