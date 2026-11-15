import { DATA, expect, open, test } from './fixtures'

/** Pages that read every kind of saved data: preferences, saved items, lots, deals, threads and partner notes. */
const PAGES = ['/', '/search?q=tractor', '/stock', '/deals', '/messages', '/partners', '/settings']

const CORRUPT: [key: string, value: string][] = [
  ['sy-preferences', 'not json {{{'],
  [
    'sy-preferences',
    '{"state":{"language":"xx","currency":"ZZZ","units":7,"theme":"neon","radiusKm":"far"},"version":2}',
  ],
  ['sy-preferences', '{"state":null,"version":0}'],
  ['sy-saved', '{"state":{"productIds":"pr-1","producerIds":null},"version":0}'],
  ['sy-search-history', '{"state":{"queries":[null,5,{}]},"version":0}'],
  ['sy-lots', 'not json'],
  ['sy-lots', '{"version":1,"lots":{"a":null,"b":{"id":"x"}},"saleModes":{"pr-001":"lot"}}'],
  ['sy-deals', 'not json'],
  ['sy-deals', '{"version":1,"deals":{},"reviews":[null],"threads":[],"messages":[],"partnerMeta":[]}'],
  [
    'sy-deals',
    '{"version":1,"deals":{"D-1":{"id":"D-1"},"D-2":null},"reviews":[{"id":"r"}],"threads":[7],"messages":[{}]}',
  ],
  ['sy-deals', '{"version":1,"deals":[],"reviews":{},"threads":"x","messages":null}'],
]

for (const [index, [key, value]] of CORRUPT.entries()) {
  test(`corrupted saved data never blanks the app: ${key} #${index + 1}`, async ({ page }) => {
    await page.addInitScript(([k, v]) => localStorage.setItem(k as string, v as string), [key, value])
    for (const path of PAGES) {
      await open(page, path)
      await expect(page.locator('main h1').first()).toBeVisible()
      await expect(page.locator('[data-crash]')).toHaveCount(0)
    }
  })
}

test('a page whose code fails to load shows the crash screen inside the layout', async ({ page, pageErrors }) => {
  await page.route('**/assets/ProductPage-*.js', (route) => route.abort())
  await open(page, '/')
  await page.goto(`/product/${DATA.product}`)
  await expect(page.locator('[data-crash]')).toContainText('This page ran into a problem')
  await expect(page.getByRole('button', { name: 'Reset demo data' })).toBeVisible()
  await page.locator('header a[href="/deals"]').first().click()
  await expect(page.locator('[data-crash]')).toHaveCount(0)
  await expect(page.locator('main h1')).toBeVisible()
  pageErrors.length = 0
})

test('a start-up failure shows the fallback, and reset clears only Stocknet data', async ({ page, pageErrors }) => {
  await page.route('**/assets/boot-*.js', (route) => route.abort())
  await page.goto('/')
  const fallback = page.locator('[data-startup-error]')
  await expect(fallback).toContainText('Stocknet could not start')
  await page.evaluate(() => {
    localStorage.setItem('sy-deals', 'x')
    localStorage.setItem('other-app', 'keep')
  })
  await page.unroute('**/assets/boot-*.js')
  await fallback.getByRole('button').first().click()
  await expect(page.locator('main h1, main h2').first()).toBeVisible()
  expect(await page.evaluate(() => [localStorage.getItem('sy-deals'), localStorage.getItem('other-app')])).toEqual([
    null,
    'keep',
  ])
  pageErrors.length = 0
})
