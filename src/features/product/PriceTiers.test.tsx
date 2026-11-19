import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { catalogService } from '@/services/catalogService'
import { usePreferences } from '@/features/settings/preferencesStore'
import { renderWithProviders } from '@/test/render'
import type { Product } from '@/types/models'
import { PriceTiers } from './PriceTiers'

const findProduct = async (test: (p: Product) => boolean) => {
  const product = (await catalogService.products()).find(test)
  if (!product) throw new Error('no demo product matches')
  return product
}

beforeEach(() => {
  usePreferences.setState({ language: 'en', currency: null })
})

describe('PriceTiers', () => {
  it('lists every price tier, with the saving against the first tier', async () => {
    const product = await findProduct((p) => p.pricing.mode !== 'on_request' && p.pricing.tiers.length >= 3)
    renderWithProviders(<PriceTiers product={product} />)
    const rows = within(screen.getByRole('table', { name: 'Volume pricing' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows).toHaveLength(product.pricing.tiers.length)
    expect(rows[0]).not.toHaveTextContent('−')
    expect(rows.at(-1)).toHaveTextContent(/−\d/)
  })

  it('explains price on request instead of showing tiers', async () => {
    // the active demo industries only have fixed prices, so turn one into a price-on-request listing
    const listed = await findProduct((p) => p.pricing.mode === 'fixed')
    const product: Product = { ...listed, pricing: { ...listed.pricing, mode: 'on_request' } }
    renderWithProviders(<PriceTiers product={product} />)
    expect(screen.getByText('Price on request')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
