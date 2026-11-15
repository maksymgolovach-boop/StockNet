/** File name of a stock photo's local copy in src/assets/photos, or null for an address we don't recognise. */
export function photoFileName(url: string): string | null {
  const pexels = url.match(/^https:\/\/images\.pexels\.com\/photos\/(\d+)/)
  if (pexels) return `pexels-${pexels[1]}.jpg`
  const unsplash = url.match(/^https:\/\/images\.unsplash\.com\/photo-([\w-]+)/)
  if (unsplash) return `unsplash-${unsplash[1]}.jpg`
  return null
}

/** The photo's address at a given width (both photo hosts resize on request). */
export const sizedPhotoUrl = (url: string, width: number) =>
  url.includes('images.unsplash.com')
    ? `${url}?auto=format&fit=crop&w=${width}&q=70`
    : `${url}?auto=compress&cs=tinysrgb&w=${width}`
