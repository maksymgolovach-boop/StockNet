import { expect, open, test } from './fixtures'

test.describe('Romanian browser', () => {
  test.use({ locale: 'ro-RO' })

  test('starts in Romanian and downloads only that language first', async ({ page }) => {
    const languages: string[] = []
    page.on('request', (request) => {
      const match = request.url().match(/\/assets\/(en|de|ro)-[\w-]+\.js$/)
      if (match?.[1]) languages.push(match[1])
    })
    await page.goto('/')
    await expect(page.locator('header a[href="/deals"]').first()).toBeVisible()
    expect(languages[0]).toBe('ro')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ro')
    await expect.poll(() => [...languages].sort()).toEqual(['de', 'en', 'ro'])
  })
})

test('switching language updates the page and is remembered', async ({ page }) => {
  await open(page, '/')
  await page.locator('header select').first().selectOption('de')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.locator('header')).toContainText('Nachrichten')
  await page.reload()
  await expect(page.locator('header')).toContainText('Nachrichten')
})
