import { createRequire } from 'node:module'
import { test as base, expect, type Page } from '@playwright/test'

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

/** Ids from the generated demo data (src/mocks). They are stable because the generators are seeded. */
export const DATA = {
  /** A used tractor sold by another producer, by measure. */
  product: 'pr-214',
  productProducerName: 'Landtechnik Leinetal',
  /** A product of the logged-in company's own seller profile. */
  ownProduct: 'pr-001',
  ownProducer: 'p01',
  otherProducer: 'p27',
  completedDeal: 'D-2026-0019',
  thread: 't19',
}

export const PAGES = [
  '/',
  '/search?q=tractor',
  '/category/agri-machinery',
  `/product/${DATA.product}`,
  `/producer/${DATA.otherProducer}`,
  '/stock',
  '/deals',
  `/deals/${DATA.completedDeal}`,
  `/deals/new?product=${DATA.product}`,
  '/messages',
  '/partners',
  '/dashboard',
  '/settings',
]

/**
 * Every test gets:
 * - photo and map hosts blocked (the app must work without them, and tests stay fast and repeatable);
 * - the mock API's artificial delay switched off, unless the test saved its own dev settings;
 * - a list of uncaught page errors that must be empty when the test ends.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page, context }, run) => {
      await context.route(/pexels\.com|unsplash\.com|openstreetmap\.org/, (route) => route.abort())
      await context.addInitScript(() => {
        if (!localStorage.getItem('sy-dev'))
          localStorage.setItem('sy-dev', JSON.stringify({ state: { latencyMs: 0 }, version: 4 }))
      })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await run(errors)
      expect(errors, 'uncaught errors in the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Opens a page and waits until its data has loaded (no loading placeholders left). */
export async function open(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
}

/** WCAG 2.1 A/AA violations found by axe-core on the current page. */
export async function accessibilityViolations(page: Page): Promise<string[]> {
  await page.evaluate(() => Promise.allSettled(document.getAnimations().map((animation) => animation.finished)))
  await page.addScriptTag({ path: axePath })
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (root: Document, options: object) => Promise<{ violations: { id: string; nodes: { html: string }[] }[] }>
        }
      }
    ).axe
    const result = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })
    return result.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)
  })
}

/** How far the page can be scrolled sideways; 0 means it fits the screen. */
export const sidewaysOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
