import { DATA, expect, open, test } from './fixtures'

const status = (page: import('@playwright/test').Page) => page.locator('main h1').locator('xpath=..')

test('quote request → automatic quote → accept, and it survives a reload', async ({ page }) => {
  await open(page, `/deals/new?product=${DATA.product}`)
  await expect(page.locator('main')).toContainText(DATA.productProducerName)
  await page.locator('button[type="submit"]').last().click()
  await expect(page).toHaveURL(/\/deals\/D-\d{4}-\d{4}$/)
  const dealPath = new URL(page.url()).pathname
  await expect(status(page)).toContainText('Quote request')

  await page.reload()
  await expect(status(page)).toContainText('Quote received', { timeout: 20_000 })

  await page
    .getByRole('button', { name: /Accept/ })
    .first()
    .click()
  await expect(status(page)).toContainText('Order confirmed')

  await open(page, '/deals')
  await expect(page.locator(`a[href="${dealPath}"]`).first()).toBeVisible()
})

test('reorder pre-fills the quote form', async ({ page }) => {
  await open(page, `/deals/new?reorder=${DATA.completedDeal}`)
  await expect(page.locator('textarea').first()).toHaveValue(new RegExp(DATA.completedDeal))
})

test('the company cannot request a quote from itself', async ({ page }) => {
  await open(page, `/product/${DATA.ownProduct}`)
  await expect(page.locator('main')).toContainText('This is your listing')
  await expect(page.getByRole('link', { name: /Request quote/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Contact producer' })).toHaveCount(0)

  await open(page, `/deals/new?product=${DATA.ownProduct}`)
  const producers = page.locator('select').filter({ has: page.locator(`option[value="${DATA.otherProducer}"]`) })
  await expect(producers).toHaveValue('')
  await expect(producers.locator(`option[value="${DATA.ownProducer}"]`)).toHaveCount(0)
})

test('"Add lot" link opens the lot form with a live preview', async ({ page }) => {
  await open(page, `/stock?new=${DATA.ownProduct}`)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page).not.toHaveURL(/new=/)
  await dialog.locator('input[name="contentQty"]').fill('24')
  await dialog.locator('input[name="pricePerLot"]').fill('1200')
  await expect(dialog).toContainText('One lot ≈')
})

test('chat: a sent message gets read and answered', async ({ page }) => {
  await open(page, `/messages/${DATA.thread}`)
  const composer = page.locator('textarea').first()
  await composer.click()
  await composer.pressSequentially('Is this still available?')
  await page.keyboard.press('Enter')
  await expect(composer).toHaveValue('')
  const messages = page.locator('main')
  await expect(messages).toContainText('Is this still available?')
  const lastSender = messages.locator('span.sr-only').filter({ hasText: /:$/ }).last()
  await expect(lastSender).not.toHaveText('You:', { timeout: 20_000 })
})
