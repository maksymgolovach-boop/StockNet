import { db } from '../src/mocks'
import { ProductSearchIndex, searchCategories, searchProducers } from '../src/features/search/searchIndex'
import { runSearch } from '../src/features/search/engine'
import { emptyFilters } from '../src/features/search/filtersCodec'
import { normalize } from '../src/features/search/normalize'

const idx = new ProductSearchIndex(db.products, db.producers)
const name = (id: string) => db.products.find((p) => p.id === id)!.name
const cases: [string, (names: string[]) => boolean][] = [
  ['NPK 16-16-16', (n) => n.length > 0 && n.every((x) => x.includes('16-16-16'))],
  ['20-20-20', (n) => n.length > 0 && n.every((x) => x.includes('20-20-20'))],
  ['FAO 380', (n) => n.length > 0 && n.every((x) => x.includes('FAO 380'))],
  ['rosii', (n) => n.some((x) => x.includes('Roșii'))],
  ['Kartoffeln', (n) => n.some((x) => /Kartoffel|potato|Cartofi/i.test(x))],
  ['tractr', (n) => n.some((x) => /tractor|Traktor/i.test(x))],
  ['mere', (n) => n.some((x) => /Mere|apple|Äpfel/i.test(x))],
  ['ingrasamant', (n) => n.some((x) => /Îngrășământ/i.test(x))],
  ['Mähdrescher', (n) => n.some((x) => /combine|Mähdrescher|Combină/i.test(x))],
  ['erbicid', (n) => n.some((x) => /herbicide|Herbizid|Erbicid/i.test(x))],
  ['cupru', (n) => n.some((x) => /cupru|copper|Kupfer/i.test(x))],
]
let fail = 0
for (const [q, ok] of cases) {
  const res = idx.search(q)!
  const names = [...res].sort((a, b) => a[1] - b[1]).map(([id]) => name(id))
  const pass = ok(names)
  if (!pass) fail++
  console.log(pass ? 'PASS' : 'FAIL', JSON.stringify(q).padEnd(14), String(names.length).padStart(3), '|', names.slice(0, 3).join(' · '))
}
console.log('normalize', normalize('Oțel-beton ȘȚĂÂÎ Straße 3×2,5 mm² m³'))
console.log('categories "legume":', searchCategories('legume'), ' "Traktor":', searchCategories('Traktor'))
console.log('producers "tisza":', searchProducers(db.producers, 'tisza').map((p) => p.name))

const ctx = { location: { lat: 47.1585, lng: 27.6014 }, partnerDeals: { p28: 7, p26: 4 }, rates: { EUR: 1, USD: 1.085, RON: 4.975 }, displayCurrency: 'EUR' }
const f = { ...emptyFilters(), category: 'tractors' }
let r = runSearch(db.products, db.producers, null, { filters: f, sort: 'distance', limit: 50 }, ctx)
console.log('tractors from Iași:', r.items.slice(0, 4).map((i) => `${i.product.name} ${i.distanceKm}km`))
r = runSearch(db.products, db.producers, null, { filters: { ...emptyFilters(), category: 'fresh-produce', attributes: { qualityClass: { kind: 'enum', values: ['extra'] } } }, sort: 'price_asc', limit: 50 }, ctx)
console.log('fresh class extra price asc:', r.total, r.items.slice(0, 8).map((i) => (i.displayUnitPrice ?? 0).toFixed(2)))
r = runSearch(db.products, db.producers, null, { filters: { ...emptyFilters(), pastPartnersOnly: true }, sort: 'relevance', limit: 200 }, ctx)
console.log('past partners only:', r.total, [...new Set(r.items.map((i) => i.producer.id))])
r = runSearch(db.products, db.producers, null, { filters: { ...emptyFilters(), expiry: 'lt7' }, sort: 'expiry', limit: 200 }, ctx)
console.log('expiry <7d:', r.total, '| facets roots:', runSearch(db.products, db.producers, null, { filters: emptyFilters(), sort: 'relevance', limit: 1 }, ctx).facets.categories.map((c) => `${c.value}:${c.count}`).join(' '))
r = runSearch(db.products, db.producers, null, { filters: { ...emptyFilters(), priceMax: 500, priceUnit: 't', category: 'mineral-fertilizers' }, sort: 'price_asc', limit: 200 }, ctx)
console.log('mineral fertilizers ≤500 EUR/t:', r.total)
const all = runSearch(db.products, db.producers, null, { filters: emptyFilters(), sort: 'relevance', limit: 24 }, ctx)
const area = runSearch(db.products, db.producers, null, { filters: emptyFilters(), sort: 'relevance', limit: 24, bounds: { north: 48.3, south: 43.6, east: 29.8, west: 20.2 } }, ctx)
const pinsOk = all.pins.length === db.producers.length && all.pins.every((p) => p.count >= 1) && area.pins.length === all.pins.length && area.total < all.total && area.items.every((i) => i.product.country === 'RO' || i.product.country === 'BG' || i.product.country === 'HU')
console.log(pinsOk ? 'PASS' : 'FAIL', 'pins', all.pins.length, '| Romania bbox list', area.total, 'of', area.unboundedTotal, '| cheapest p28 pin', all.pins.find((p) => p.producerId === 'p28')?.minPrice?.toFixed(2))
if (!pinsOk) fail++
process.exit(fail ? 1 : 0)
