import { photoFileName } from '@/shared/lib/photoFile'

const files = import.meta.glob<string>('../../assets/photos/*.jpg', { eager: true, query: '?url', import: 'default' })
const byName = new Map(Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url]))

/** The bundled copy of a stock photo, if `npm run photos:download` has fetched it. */
export function localPhoto(url: string): string | undefined {
  const name = photoFileName(url)
  return name ? byName.get(name) : undefined
}
