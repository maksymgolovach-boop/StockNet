import { db, validateMockData } from '../src/mocks'
import { CURRENT_BUYER_ID } from '../src/mocks/buyers'
import { currentCompany } from '../src/mocks/companies'

const issues = validateMockData()
console.log('company', currentCompany.id, currentCompany.name, `${currentCompany.buyerId}/${currentCompany.producerId}`)
const by = <T,>(xs: T[], key: (x: T) => string) =>
  Object.fromEntries([...xs.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map<string, number>())].sort())

console.log('products', db.products.length, by(db.products, (p) => p.rootCategorySlug))
console.log('product currencies', by(db.products, (p) => p.pricing.currency))
console.log('pricing modes', by(db.products, (p) => p.pricing.mode))
console.log('producers', db.producers.length, by(db.producers, (p) => p.address.country))
console.log('verification', by(db.producers, (p) => p.verification.level))
console.log('trust scores', db.producers.map((p) => `${p.id}:${p.trust.score}`).join(' '))
console.log('buyers', db.buyers.length, 'threads', db.threads.length, 'messages', db.messages.length)
console.log('deals', db.deals.length, by(db.deals, (d) => d.status), by(db.deals, (d) => d.currency))
console.log('current buyer deals', db.deals.filter((d) => d.buyerId === CURRENT_BUYER_ID).length)
console.log('reviews', db.reviews.length)
console.log('near expiry (<7d)', db.products.filter((p) => p.clearance?.reason === 'near_expiry').length, 'surplus/eol', db.products.filter((p) => p.clearance && p.clearance.reason !== 'near_expiry').length)
console.log('sample deals', db.deals.slice(0, 4).map((d) => `${d.id} ${d.buyerId}->${d.producerId} ${d.status} ${d.total} ${d.currency} items=${d.lineItems.length} upd=${d.updatedAt.slice(0, 10)}`))
if (issues.length) {
  console.error(`\n${issues.length} ISSUES:\n` + issues.join('\n'))
  process.exit(1)
}
console.log('\nOK — dataset valid')
