import { mkdir, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ALL_PHOTO_URLS } from '../src/mocks/photos'
import { LOCAL_PHOTO_WIDTHS, photoFileName, type LocalPhotoWidth } from '../src/shared/lib/photoFile'

/**
 * Downloads every stock photo of the catalogue into src/assets/photos, so the demo also works offline.
 * Each photo is saved in two widths: a small one for thumbnails and cards, a large one for the gallery.
 * Run it on a computer with internet access: npm run photos:download
 * Files that already exist are skipped, so it is safe to run again after a failure.
 */
const PARALLEL = 6
const folder = fileURLToPath(new URL('../src/assets/photos/', import.meta.url))

const downloadUrl = (url: string, width: LocalPhotoWidth) =>
  url.includes('images.unsplash.com')
    ? `${url}?fm=jpg&fit=crop&w=${width}&q=70`
    : `${url}?auto=compress&cs=tinysrgb&w=${width}`

const exists = (path: string) =>
  stat(path).then(
    (s) => s.size > 0,
    () => false,
  )

async function download(url: string, width: LocalPhotoWidth): Promise<'saved' | 'skipped'> {
  const name = photoFileName(url, width)
  if (!name) throw new Error('unrecognised photo address')
  const path = folder + name
  if (await exists(path)) return 'skipped'
  const response = await fetch(downloadUrl(url, width), {
    headers: { 'User-Agent': 'Mozilla/5.0 (Stocknet demo photo download)', Accept: 'image/jpeg,image/*;q=0.8' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  if (!type.startsWith('image/jpeg')) throw new Error(`expected a JPEG, got ${type || 'no content type'}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 1000) throw new Error('file is too small to be a photo')
  await writeFile(path, bytes)
  return 'saved'
}

await mkdir(folder, { recursive: true })
const jobs = ALL_PHOTO_URLS.flatMap((url) => LOCAL_PHOTO_WIDTHS.map((width) => ({ url, width })))
const queue = [...jobs]
const failed: [string, string][] = []
let saved = 0
let skipped = 0

async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    try {
      const result = await download(job.url, job.width)
      if (result === 'saved') saved += 1
      else skipped += 1
    } catch (error) {
      failed.push([`${job.url} (${job.width} px)`, error instanceof Error ? error.message : String(error)])
    }
    process.stdout.write(`\r${saved + skipped + failed.length} / ${jobs.length}`)
  }
}

await Promise.all(Array.from({ length: PARALLEL }, worker))
console.log(`\n${saved} downloaded, ${skipped} already there, ${failed.length} failed → src/assets/photos`)
for (const [photo, reason] of failed) console.log(`  failed: ${photo}: ${reason}`)
if (failed.length) console.log('Run the command again to retry the failed files.')
process.exit(failed.length ? 1 : 0)
