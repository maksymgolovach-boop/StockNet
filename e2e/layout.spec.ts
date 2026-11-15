import { DATA, PAGES, accessibilityViolations, expect, open, sidewaysOverflow, test } from './fixtures'

const EXTRA = [
  `/producer/${DATA.otherProducer}?tab=history`,
  `/producer/${DATA.ownProducer}`,
  `/messages/${DATA.thread}`,
]

for (const width of [360, 390, 768]) {
  test(`no page scrolls sideways at ${width} px`, async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width, height: 844 })
    for (const path of [...PAGES, ...EXTRA]) {
      await open(page, path)
      expect(await sidewaysOverflow(page), `${path} at ${width} px`).toBeLessThanOrEqual(1)
    }
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accessibility (WCAG A/AA) in ${colorScheme} mode`, async ({ page }) => {
    test.slow()
    await page.emulateMedia({ colorScheme })
    for (const path of [...PAGES, `/producer/${DATA.ownProducer}`]) {
      await open(page, path)
      await expect(page.locator('main h1').first()).toBeVisible()
      expect(await accessibilityViolations(page), `${path} in ${colorScheme} mode`).toEqual([])
    }
  })
}

test('the dev menu is hidden in the published build until ?dev=1', async ({ page }) => {
  const button = page.locator('button:has(svg.lucide-wrench)')
  await open(page, '/')
  await expect(button).toHaveCount(0)
  await open(page, '/?dev=1')
  await expect(button).toHaveCount(1)
  await open(page, '/deals')
  await expect(button).toHaveCount(1)
  await open(page, '/?dev=0')
  await open(page, '/deals')
  await expect(button).toHaveCount(0)
})

test('nothing is requested from font, photo or tracking hosts', async ({ page }) => {
  const hosts = new Set<string>()
  page.on('request', (request) => hosts.add(new URL(request.url()).hostname))
  await open(page, '/')
  await open(page, `/product/${DATA.product}`)
  const allowed = /^(localhost|images\.pexels\.com|images\.unsplash\.com|[abc]\.tile\.openstreetmap\.org)$/
  expect([...hosts].filter((host) => !allowed.test(host))).toEqual([])
})
