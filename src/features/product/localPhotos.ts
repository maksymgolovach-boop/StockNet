import { LOCAL_PHOTO_WIDTHS, photoFileName } from '@/shared/lib/photoFile'

const files = import.meta.glob<string>('../../assets/photos/*.jpg', { eager: true, query: '?url', import: 'default' })
const byName = new Map(Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url]))

/**
 * The bundled copies of a stock photo as a srcset ("small.jpg 320w, large.jpg 800w"), if `npm run photos:download`
 * has fetched them. `src` is the largest copy available.
 */
export function localPhoto(url: string): { src: string; srcSet: string } | undefined {
  const copies = LOCAL_PHOTO_WIDTHS.flatMap((width) => {
    const name = photoFileName(url, width)
    const file = name ? byName.get(name) : undefined
    return file ? [{ file, width }] : []
  })
  const largest = copies.at(-1)
  return largest && { src: largest.file, srcSet: copies.map((c) => `${c.file} ${c.width}w`).join(', ') }
}
