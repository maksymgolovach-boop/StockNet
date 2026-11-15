import { expect, open, test } from './fixtures'

const searchBox = (page: import('@playwright/test').Page) => page.locator('header input[role="combobox"]').first()

test('the search box follows the address', async ({ page }) => {
  await open(page, '/search?q=tractor')
  await expect(searchBox(page)).toHaveValue('tractor')
  await open(page, '/search?q=mere')
  await expect(searchBox(page)).toHaveValue('mere')
})

test('suggestions open while typing and Enter opens the highlighted one', async ({ page }) => {
  await open(page, '/')
  await searchBox(page).fill('ingr')
  await expect(page.getByRole('option').first()).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/\/$/)
})

test('a typo and a query in another language still find products', async ({ page }) => {
  await open(page, '/search?q=tractr')
  await expect(page.locator('main a[href^="/product/"]').first()).toBeVisible()
  await open(page, '/search?q=Traktoren')
  await expect(page.locator('main a[href^="/product/"]').first()).toBeVisible()
})

test('price filter inputs mirror the address and clear with it', async ({ page }) => {
  await open(page, '/search?q=ingrasamant&pmin=100&pmax=900')
  const inputs = page.locator('input[inputmode="decimal"]')
  await expect(inputs.nth(0)).toHaveValue('100')
  await expect(inputs.nth(1)).toHaveValue('900')
  await open(page, '/search?q=ingrasamant')
  await expect(inputs.nth(0)).toHaveValue('')
  await expect(inputs.nth(1)).toHaveValue('')
})

test('map view shows pins and a pin opens its card', async ({ page }) => {
  await open(page, '/search?q=ingrasamant&view=map')
  const pin = page.locator('.leaflet-marker-icon[role="button"]').first()
  await expect(pin).toBeAttached()
  await expect(async () => {
    await pin.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.leaflet-popup')).toBeVisible({ timeout: 2_000 })
  }).toPass()
})
