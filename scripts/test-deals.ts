import { db } from '../src/mocks'
import { currentCompany } from '../src/mocks/companies'
import { useDevStore } from '../src/features/dev/devStore'
import { availableLots, clampLotQuantity, isSellable, lotQuantityRule } from '../src/features/lots/lotMath'
import { tierFor } from '../src/features/product/pricing'
import { chatTransport } from '../src/services/chatTransport'
import { ApiError } from '../src/services/client'
import { dealService, type QuoteRequestInput } from '../src/services/dealService'
import { DEMO_NOW } from '../src/shared/lib/dates'

useDevStore.setState({ latencyMs: 0, simulateErrors: false })

let fail = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) fail++
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
}
const rejects = async (name: string, run: () => Promise<unknown>, status: number) => {
  try {
    await run()
    check(name, false, '(no error)')
  } catch (e) {
    check(name, e instanceof ApiError && e.status === status, e instanceof Error ? `(${e.message})` : '')
  }
}

const { buyerId, producerId: ownProducerId } = currentCompany
const request = (producerId: string, items: QuoteRequestInput['items']): QuoteRequestInput => ({
  producerId,
  items,
  deliveryAddress: { street: 'Calea Chișinăului 45', postcode: '700001', city: 'Iași', country: 'RO' },
  incoterm: 'DAP',
  requestedDeliveryDate: '2026-11-30',
  notes: '',
  attachments: [],
  lang: 'en',
})

const tiers = [{ minQty: 1, unitPrice: 10 }, { minQty: 10, unitPrice: 9 }, { minQty: 50, unitPrice: 8 }]
check('tierFor picks the highest tier reached', tierFor(tiers, 12)?.unitPrice === 9 && tierFor(tiers, 50)?.unitPrice === 8)
check('tierFor falls back to the first tier', tierFor(tiers, 0)?.unitPrice === 10)

check('no seeded quote request is auto-answered on start-up', !db.deals.some((d) => d.status === 'quote_request' && new Date(d.createdAt) >= DEMO_NOW))

const ownProduct = db.products.find((p) => p.producerId === ownProducerId && p.saleModes.includes('measure'))
if (ownProduct) await rejects('quote request to your own company is rejected', () => dealService.createQuoteRequest(buyerId, request(ownProducerId, [{ productId: ownProduct.id, mode: 'measure', quantity: ownProduct.moq }])), 422)
await rejects('chat with your own company is rejected', () => chatTransport.openThread({ buyerId, producerId: ownProducerId }), 422)

const candidate = db.products
  .filter((p) => p.producerId !== ownProducerId && p.saleModes.includes('lot'))
  .flatMap((p) => p.lots.map((lot) => ({ product: p, lot })))
  .find(({ lot }) => isSellable(lot) && availableLots(lot) >= lotQuantityRule(lot).min && clampLotQuantity(lot, availableLots(lot)) === availableLots(lot))

if (!candidate) check('found a lot to test with', false)
else {
  const { product, lot } = candidate
  const qty = availableLots(lot)
  const item = [{ productId: product.id, mode: 'lot' as const, lotId: lot.id, quantity: qty }]
  const a = await dealService.createQuoteRequest(buyerId, request(product.producerId, item))
  const b = await dealService.createQuoteRequest(buyerId, request(product.producerId, item))
  for (const d of [a, b]) await dealService.transition('producer', product.producerId, d.id, 'sendQuote')
  const reservedAtStart = lot.reservedCount
  await dealService.transition('buyer', buyerId, a.id, 'acceptQuote')
  check('accepting the first quote reserves the lot', lot.reservedCount === reservedAtStart + qty && availableLots(lot) === 0, `(${lot.lotNumber}: ${lot.reservedCount}/${lot.stockCount})`)
  await rejects('accepting a second quote for the same stock is rejected', () => dealService.transition('buyer', buyerId, b.id, 'acceptQuote'), 409)

  const stockBefore = lot.stockCount
  const reservedBefore = lot.reservedCount
  await dealService.openDispute('buyer', buyerId, a.id, { reason: 'quality', resolution: 'discount', description: 'Goods do not match the agreed specification.', productIds: [product.id], attachments: [] })
  check('lots stay reserved while an undelivered deal is disputed', lot.reservedCount === reservedBefore)
  await rejects('the producer cannot resolve the buyer’s dispute', () => dealService.resolveDispute('producer', product.producerId, a.id, 'ok'), 403)
  const resolved = await dealService.resolveDispute('buyer', buyerId, a.id, 'Agreed a discount')
  check('resolving returns the deal to its previous status', resolved.status === 'order_confirmed', `(${resolved.status})`)
  await dealService.transition('producer', product.producerId, a.id, 'dispatch')
  const delivered = await dealService.transition('producer', product.producerId, a.id, 'markDelivered')
  check('the resolved deal can still be delivered', delivered.status === 'delivered' && !!delivered.deliveredAt)
  check('delivery takes the lots out of stock', Math.abs(lot.stockCount - (stockBefore - qty)) < 1e-9, `(${stockBefore} → ${lot.stockCount})`)
}

console.log(fail ? `${fail} failed` : 'all deal tests passed')
process.exit(fail ? 1 : 0)
