import { db } from '../src/mocks'
import { CITIES } from '../src/mocks/cities'
import { currentCompany } from '../src/mocks/companies'
import { applyStoredDeals } from '../src/mocks/dealStorage'
import { applyStoredLots } from '../src/mocks/lotStorage'
import { useDevStore } from '../src/features/dev/devStore'
import { dealService } from '../src/services/dealService'
import { lotService, type LotInput } from '../src/services/lotService'
import { matches, matching } from '../src/shared/lib/shape'
import { safeStorage } from '../src/shared/lib/storage'
import type { Deal, Lot, Message, PartnershipMeta, Product, Review, Thread } from '../src/types/models'

useDevStore.setState({ latencyMs: 0, simulateErrors: false })

let fail = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) fail++
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
}

check(
  'matches accepts the listed fields and ignores extras',
  matches({ id: 'a', n: 1, tags: [], extra: true }, { id: 'string', n: 'number', tags: 'array' }),
)
check('matches rejects a wrong type', !matches({ id: 7 }, { id: 'string' }))
check('matches rejects a missing nested field', !matches({ at: {} }, { at: { lat: 'number' } }))
check('matches checks every item of a typed list', !matches({ rows: [{ q: 1 }, null] }, { rows: [{ q: 'number' }] }))
check('matches rejects NaN', !matches({ n: Number.NaN }, { n: 'number' }))
check('matching drops everything when the value is not a list', matching('oops', { id: 'string' }).length === 0)

const { buyerId, producerId: ownProducerId } = currentCompany
const product = db.products.find((p) => p.producerId !== ownProducerId && p.saleModes.includes('measure'))
const ownLot = db.products.find((p) => p.producerId === ownProducerId && p.lots.length)?.lots[0]
if (!product || !ownLot) throw new Error('test data missing')

const deal = await dealService.createQuoteRequest(buyerId, {
  producerId: product.producerId,
  items: [{ productId: product.id, mode: 'measure', quantity: product.moq }],
  deliveryAddress: { street: 'Calea Chișinăului 45', postcode: '700001', city: 'Iași', region: 'Iași', country: 'RO' },
  incoterm: 'DAP',
  requestedDeliveryDate: '2026-11-30',
  notes: 'storage test',
  attachments: [],
  lang: 'en',
})
for (const [role, id, action] of [
  ['producer', product.producerId, 'sendQuote'],
  ['buyer', buyerId, 'acceptQuote'],
  ['producer', product.producerId, 'dispatch'],
  ['producer', product.producerId, 'markDelivered'],
  ['buyer', buyerId, 'complete'],
] as const)
  await dealService.transition(role, id, deal.id, action)
await dealService.addReview(buyerId, deal.id, {
  ratings: { quality: 5, conformity: 4, delivery: 5, communication: 4, value: 4 },
  text: 'Arrived on time and as described.',
  lang: 'en',
  photoCount: 0,
})
await dealService.setPartnerMeta(buyerId, product.producerId, { favorite: true, privateNotes: 'storage test note' })

const {
  id: _id,
  producerId: _p,
  reservedCount: _r,
  createdAt: _c,
  updatedAt: _u,
  documents: _d,
  location: _l,
  ...rest
} = ownLot
const input: LotInput = {
  ...rest,
  lotNumber: 'TEST-STORAGE-1',
  cityId: CITIES[0]!.id,
  warehouseLabel: 'Test warehouse',
}
const created = await lotService.create(ownProducerId, input)
const copy = await lotService.duplicate(ownProducerId, ownLot.id)
await lotService.setStock(ownProducerId, ownLot.id, ownLot.stockCount + 1)

const rawDeals = JSON.parse(safeStorage.getItem('sy-deals') ?? '{}')
const rawLots = JSON.parse(safeStorage.getItem('sy-lots') ?? '{}')
const replayed = {
  deals: [] as Deal[],
  reviews: [] as Review[],
  threads: [] as Thread[],
  messages: [] as Message[],
  partnershipMeta: [] as PartnershipMeta[],
}
applyStoredDeals(replayed)
check(
  'saved deals survive a reload',
  replayed.deals.length === Object.keys(rawDeals.deals).length && replayed.deals.some((d) => d.id === deal.id),
)
check(
  'saved reviews survive a reload',
  replayed.reviews.length === rawDeals.reviews.length && replayed.reviews.length > 0,
)
check(
  'saved threads survive a reload',
  replayed.threads.length === rawDeals.threads.length && replayed.threads.length > 0,
)
check(
  'saved messages survive a reload',
  replayed.messages.length === rawDeals.messages.length && replayed.messages.length > 0,
)
check(
  'saved partner notes survive a reload',
  replayed.partnershipMeta.length === rawDeals.partnerMeta.length && replayed.partnershipMeta.length > 0,
)

const blank = (): Product[] =>
  db.products.filter((p) => p.producerId === ownProducerId).map((p) => ({ ...p, lots: [] }))
const lotsAfter = (products: Product[]) => products.flatMap((p) => p.lots)
const reloaded = blank()
applyStoredLots(reloaded)
const savedIds = Object.keys(rawLots.lots)
check(
  'saved lots survive a reload',
  lotsAfter(reloaded).length === savedIds.length &&
    [created.id, copy.id, ownLot.id].every((id) => savedIds.includes(id)),
  `(${savedIds.length} lots)`,
)

const validDeal = rawDeals.deals[deal.id]
const validLot: Lot = rawLots.lots[created.id]
const corruptDeals = [
  'not json',
  'null',
  '[]',
  '{"version":2,"deals":{}}',
  '{"version":1,"deals":[],"reviews":{},"threads":"x","messages":null}',
  JSON.stringify({
    version: 1,
    deals: { a: null, b: { id: 'b' }, [deal.id]: validDeal, wrongKey: validDeal },
    reviews: [null, { id: 'r' }],
    threads: [7],
    messages: [{ id: 'm' }],
    partnerMeta: [{}],
  }),
]
for (const raw of corruptDeals) {
  safeStorage.setItem('sy-deals', raw)
  const target = {
    deals: [] as Deal[],
    reviews: [] as Review[],
    threads: [] as Thread[],
    messages: [] as Message[],
    partnershipMeta: [] as PartnershipMeta[],
  }
  let threw = false
  try {
    applyStoredDeals(target)
  } catch {
    threw = true
  }
  const expected = raw.includes(deal.id) ? 1 : 0
  check(
    'broken saved deals are skipped, valid ones kept',
    !threw &&
      target.deals.length === expected &&
      target.reviews.length + target.threads.length + target.messages.length + target.partnershipMeta.length === 0,
    `(${raw.slice(0, 40)})`,
  )
}
for (const raw of [
  'not json',
  '{"version":1}',
  JSON.stringify({
    version: 1,
    lots: { a: null, b: { id: 'b' }, [created.id]: validLot, wrongKey: validLot },
    saleModes: { [validLot.productId]: 'lot', x: [], y: ['bulk'] },
  }),
]) {
  safeStorage.setItem('sy-lots', raw)
  const products = blank()
  const modesBefore = JSON.stringify(products.map((p) => p.saleModes))
  let threw = false
  try {
    applyStoredLots(products)
  } catch {
    threw = true
  }
  check(
    'broken saved lots are skipped, valid ones kept',
    !threw &&
      lotsAfter(products).length === (raw.includes(created.id) ? 1 : 0) &&
      JSON.stringify(products.map((p) => p.saleModes)) === modesBefore,
    `(${raw.slice(0, 40)})`,
  )
}

console.log(fail ? `${fail} failed` : 'all storage tests passed')
process.exit(fail ? 1 : 0)
