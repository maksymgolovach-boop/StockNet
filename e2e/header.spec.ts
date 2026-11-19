import { expect, open, test } from './fixtures'

/**
 * The header's top row holds the logo, search, main menu, language and currency, theme, settings and the account.
 * Menu labels differ in length per language, so the header measures what fits (src/app/layout/useHeaderFit.ts):
 * it drops the company name first, then the menu labels. Whatever it shows, nothing may be squeezed or cut off.
 */
const LOCALES = [
  { locale: 'en-GB', lang: 'en' },
  { locale: 'de-DE', lang: 'de' },
  { locale: 'ro-RO', lang: 'ro' },
]
const WIDTHS = [768, 900, 1024, 1180, 1280, 1366, 1440, 1600, 1920]

for (const { locale, lang } of LOCALES) {
  test.describe(`header in ${lang}`, () => {
    test.use({ locale })

    test('fits at every width without squeezing the search box', async ({ page }) => {
      test.slow()
      await open(page, '/dashboard')
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 })
        await page.waitForTimeout(50)
        const m = await page.evaluate(() => {
          const row = document.querySelector('header')!.firstElementChild as HTMLElement
          const search = row.querySelector<HTMLElement>('form[role="search"]')!
          const links = [...row.querySelectorAll<HTMLElement>('nav a')].filter((a) => a.offsetWidth > 0)
          return {
            overflow: row.scrollWidth - row.clientWidth,
            search: search.offsetWidth,
            cutSelects: [...row.querySelectorAll('select')]
              .filter((s) => s.offsetWidth > 0 && s.scrollWidth > s.clientWidth + 1)
              .map((s) => s.value),
            tallLinks: links.filter((a) => a.offsetHeight > 40).map((a) => a.textContent),
          }
        })
        expect(m.overflow, `header overflows at ${width} px`).toBeLessThanOrEqual(0)
        expect(m.search, `search box width at ${width} px`).toBeGreaterThanOrEqual(width >= 1024 ? 288 : 192)
        expect(m.cutSelects, `cut-off pickers at ${width} px`).toEqual([])
        expect(m.tallLinks, `menu items wrapping at ${width} px`).toEqual([])
      }
    })
  })
}

test('menu items keep their names when only icons are shown', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await open(page, '/dashboard')
  const menu = page.getByRole('navigation', { name: 'Primary' })
  await expect(menu.getByRole('link', { name: /Messages/ })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Stock & lots' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('title', 'Dashboard')
})

test('labels come back when the window gets wider', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await open(page, '/dashboard')
  const label = page.getByRole('navigation', { name: 'Primary' }).getByText('Stock & lots')
  await expect(label).toHaveClass(/sr-only/)
  await page.setViewportSize({ width: 1600, height: 800 })
  await expect(label).not.toHaveClass(/sr-only/)
})

test('search suggestions are readable even where the search box is narrow', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 800 })
  await open(page, '/dashboard')
  await page.locator('header form[role="search"] input').first().fill('tractor')
  const list = page.getByRole('listbox')
  await expect(list).toBeVisible()
  const width = await list.evaluate((el) => (el.parentElement as HTMLElement).offsetWidth)
  expect(width).toBeGreaterThanOrEqual(360)
})
