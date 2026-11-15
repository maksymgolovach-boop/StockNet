import { DATA, PAGES, expect, open, test } from './fixtures'

for (const path of PAGES) {
  test(`renders ${path}`, async ({ page }) => {
    await open(page, path)
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(page.locator('[data-crash]')).toHaveCount(0)
  })
}

for (const path of ['/product/nope', '/producer/nope', '/deals/D-0000-0000', '/category/nope', '/nope/nope']) {
  test(`unknown address ${path} shows "Page not found"`, async ({ page }) => {
    await open(page, path)
    await expect(page.locator('main')).toContainText('Page not found')
  })
}

test('client-side navigation and reload on a deep link', async ({ page }) => {
  await open(page, '/')
  await page.locator('main a[href^="/product/"]').first().click()
  await expect(page).toHaveURL(/\/product\//)
  await expect(page.locator('main h1')).toBeVisible()
  await page.reload()
  await expect(page.locator('main h1')).toBeVisible()
})

test('your own seller profile explains the second company name', async ({ page }) => {
  await open(page, `/producer/${DATA.ownProducer}`)
  await expect(page.locator('main')).toContainText('This is your seller profile')
  await expect(page.getByRole('link', { name: 'Contact producer' })).toHaveCount(0)
  await open(page, '/stock')
  await expect(page.locator('main')).toContainText('Câmpia Moldovei Agro sells as Cooperativa Agricolă Țara Bârsei')
})
