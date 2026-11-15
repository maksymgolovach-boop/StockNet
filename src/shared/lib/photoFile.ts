/** Widths of the local copies: a small one for thumbnails and cards, a large one for the product gallery. */
export const LOCAL_PHOTO_WIDTHS = [320, 800] as const
export type LocalPhotoWidth = (typeof LOCAL_PHOTO_WIDTHS)[number]

/**
 * File name of a stock photo's local copy in src/assets/photos (e.g. pexels-123-320.jpg), or null for an address
 * we don't recognise.
 */
export function photoFileName(url: string, width: LocalPhotoWidth): string | null {
  const pexels = url.match(/^https:\/\/images\.pexels\.com\/photos\/(\d+)/)
  if (pexels) return `pexels-${pexels[1]}-${width}.jpg`
  const unsplash = url.match(/^https:\/\/images\.unsplash\.com\/photo-([\w-]+)/)
  if (unsplash) return `unsplash-${unsplash[1]}-${width}.jpg`
  return null
}

/** The photo's address at a given width (both photo hosts resize on request). */
export const sizedPhotoUrl = (url: string, width: number) =>
  url.includes('images.unsplash.com')
    ? `${url}?auto=format&fit=crop&w=${width}&q=70`
    : `${url}?auto=compress&cs=tinysrgb&w=${width}`
