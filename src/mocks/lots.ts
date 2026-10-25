import type { Deal, Document, Lot, LotCondition, LotDivisibility, LotType, Product, SaleMode, UnitCode } from '@/types/models'
import { CURRENCIES } from '@/config/currencies'
import { getAnyCategory as getCategory, getCategoryConfig } from '@/config/categories'
import { addDays, now } from '@/shared/lib/dates'
import { createRng, type Rng } from '@/shared/lib/random'
import { cityById } from './cities'
import { PRODUCER_SEEDS } from './producers'
import { producerCurrency, roundPrice } from './products'
import { EXTRA_TEMPLATES } from './catalog/extra'
import { REGIONAL_TEMPLATES } from './regional'
import type { ProductTemplate } from './catalog/types'

interface LotSpec {
  type: LotType
  content: [number, UnitCode]
  item?: [number, UnitCode]
  kg?: number
  m3?: number
  eur: number
  stock: number
  tiers?: [minLots: number, discountPct: number][]
  split?: [step: number, minSplit: number]
  moq?: number
  condition?: LotCondition
  expiresIn?: number
  producedAgo?: number
  warehouse?: [label: string, cityId: string]
  status?: Lot['status']
}

interface ListingSpec {
  template: string
  producer: string
  modes: SaleMode[]
  lots: LotSpec[]
}

const LISTINGS: ListingSpec[] = [
  { template: 'vine-tomatoes', producer: 'p01', modes: ['measure', 'lot'], lots: [
    { type: 'pallet', content: [80, 'crate'], item: [12, 'kg'], kg: 960, eur: 1150, stock: 6, expiresIn: 6, producedAgo: 1 },
    { type: 'pallet', content: [80, 'crate'], item: [12, 'kg'], kg: 960, eur: 1180, stock: 4, expiresIn: 9, producedAgo: 0 },
  ] },
  { template: 'potatoes', producer: 'p01', modes: ['measure', 'lot'], lots: [
    { type: 'truckload', content: [24, 't'], kg: 24000, eur: 6900, stock: 5, split: [0.25, 0.5], expiresIn: 120, producedAgo: 30 },
  ] },
  { template: 'apples', producer: 'p03', modes: ['lot'], lots: [
    { type: 'truckload', content: [22, 't'], kg: 22000, eur: 12100, stock: 3, tiers: [[1, 0], [2, 4]], expiresIn: 75, producedAgo: 20 },
    { type: 'truckload', content: [22, 't'], kg: 22000, eur: 11400, stock: 2, expiresIn: 40, producedAgo: 35, condition: 'surplus' },
  ] },
  { template: 'blueberries', producer: 'p04', modes: ['lot'], lots: [
    { type: 'pallet', content: [120, 'crate'], item: [1.5, 'kg'], kg: 180, eur: 1060, stock: 2, expiresIn: 4, producedAgo: 2, condition: 'clearance' },
    { type: 'pallet', content: [120, 'crate'], item: [1.5, 'kg'], kg: 180, eur: 1290, stock: 5, expiresIn: 7, producedAgo: 1 },
    { type: 'pallet', content: [120, 'crate'], item: [1.5, 'kg'], kg: 180, eur: 1330, stock: 4, expiresIn: 10, producedAgo: 0 },
  ] },
  { template: 'whole-milk', producer: 'p05', modes: ['measure', 'lot'], lots: [
    { type: 'pallet', content: [640, 'piece'], item: [1, 'l'], kg: 670, eur: 470, stock: 10, expiresIn: 8, producedAgo: 1 },
    { type: 'pallet', content: [640, 'piece'], item: [1, 'l'], kg: 670, eur: 455, stock: 3, expiresIn: -1, producedAgo: 9 },
    { type: 'pallet', content: [640, 'piece'], item: [1, 'l'], kg: 670, eur: 480, stock: 8, expiresIn: 12, producedAgo: 0 },
  ] },
  { template: 'yogurt', producer: 'p05', modes: ['measure', 'lot'], lots: [
    { type: 'mixed', content: [90, 'piece'], item: [5, 'kg'], kg: 450, eur: 390, stock: 1, expiresIn: 5, producedAgo: 16, condition: 'clearance' },
  ] },
  { template: 'butter', producer: 'p06', modes: ['lot'], lots: [
    { type: 'pallet', content: [80, 'piece'], item: [10, 'kg'], kg: 800, eur: 4650, stock: 6, expiresIn: 120, producedAgo: 10 },
    { type: 'pallet', content: [80, 'piece'], item: [10, 'kg'], kg: 800, eur: 4290, stock: 3, expiresIn: 70, producedAgo: 50, condition: 'surplus' },
  ] },
  { template: 'grana', producer: 'p07', modes: ['lot'], lots: [
    { type: 'pallet', content: [24, 'piece'], kg: 912, eur: 12150, stock: 4, expiresIn: 300, producedAgo: 480 },
  ] },
  { template: 'pork-neck-frozen', producer: 'p08', modes: ['lot'], lots: [
    { type: 'container', content: [24, 't'], kg: 24000, eur: 96500, stock: 1, expiresIn: 270, producedAgo: 20, warehouse: ['Cold store Constanța port', 'ro-constanta'] },
  ] },
  { template: 'whole-chicken-frozen', producer: 'p09', modes: ['measure', 'lot'], lots: [
    { type: 'pallet', content: [80, 'crate'], item: [10, 'kg'], kg: 800, eur: 1960, stock: 8, expiresIn: 210, producedAgo: 30, condition: 'surplus' },
  ] },
  { template: 'rebar-12', producer: 'p10', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [238, 'piece'], item: [12, 'm'], kg: 2000, eur: 1400, stock: 40, tiers: [[1, 0], [5, 3], [10, 5]], producedAgo: 12 },
    { type: 'bundle', content: [238, 'piece'], item: [12, 'm'], kg: 2000, eur: 1380, stock: 12, tiers: [[1, 0], [5, 3]], producedAgo: 40, status: 'paused' },
  ] },
  { template: 'rebar-16', producer: 'p10', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [134, 'piece'], item: [12, 'm'], kg: 2000, eur: 1370, stock: 0, producedAgo: 60 },
  ] },
  { template: 'rebar-coil-8', producer: 'p10', modes: ['lot'], lots: [
    { type: 'coil_set', content: [5, 'coil'], item: [2, 't'], kg: 10000, eur: 7350, stock: 6, producedAgo: 25, condition: 'surplus', warehouse: ['Port warehouse Brăila', 'ro-braila'] },
  ] },
  { template: 'plate-10', producer: 'p10', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [10, 'piece'], kg: 4700, eur: 3650, stock: 4, producedAgo: 15 },
  ] },
  { template: 'welded-mesh', producer: 'p10', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [50, 'piece'], kg: 1560, eur: 1290, stock: 2, producedAgo: 200, status: 'archived' },
  ] },
  { template: 'hea-200', producer: 'p11', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [6, 'piece'], item: [12, 'm'], kg: 3020, eur: 3050, stock: 8, producedAgo: 20 },
    { type: 'bundle', content: [6, 'piece'], item: [12, 'm'], kg: 3020, eur: 2650, stock: 2, producedAgo: 260, condition: 'b_grade' },
  ] },
  { template: 'galv-coil', producer: 'p11', modes: ['lot'], lots: [
    { type: 'coil_set', content: [3, 'coil'], kg: 15000, eur: 12800, stock: 2, producedAgo: 35 },
  ] },
  { template: 'nym-3x25', producer: 'p15', modes: ['measure', 'lot'], lots: [
    { type: 'coil_set', content: [20, 'coil'], item: [100, 'm'], kg: 260, eur: 1750, stock: 15, tiers: [[1, 0], [5, 4]], producedAgo: 30 },
  ] },
  { template: 'nyy-5x16', producer: 'p14', modes: ['lot'], lots: [
    { type: 'coil_set', content: [4, 'coil'], item: [500, 'm'], kg: 2200, eur: 22400, stock: 3, split: [0.25, 0.25], producedAgo: 45 },
  ] },
  { template: 'cat6', producer: 'p16', modes: ['lot'], lots: [
    { type: 'pallet', content: [36, 'piece'], item: [305, 'm'], kg: 430, eur: 3150, stock: 5, producedAgo: 300, condition: 'surplus' },
  ] },
  { template: 'cement-bags', producer: 'p19', modes: ['measure', 'lot'], lots: [
    { type: 'pallet', content: [40, 'bag'], kg: 1000, eur: 245, stock: 60, tiers: [[1, 0], [10, 4], [24, 7]], producedAgo: 14 },
  ] },
  { template: 'sand-04', producer: 'p20', modes: ['lot'], lots: [
    { type: 'truckload', content: [26, 't'], kg: 26000, eur: 320, stock: 25, producedAgo: 3 },
  ] },
  { template: 'gravel-48', producer: 'p17', modes: ['measure', 'lot'], lots: [
    { type: 'truckload', content: [26, 't'], kg: 26000, eur: 340, stock: 18, producedAgo: 2 },
  ] },
  { template: 'recycled-063', producer: 'p21', modes: ['lot'], lots: [
    { type: 'truckload', content: [26, 't'], kg: 26000, eur: 150, stock: 12, producedAgo: 20, condition: 'surplus' },
  ] },
  { template: 'kvh-c24', producer: 'p23', modes: ['measure', 'lot'], lots: [
    { type: 'bundle', content: [48, 'piece'], m3: 3.46, kg: 1630, eur: 1660, stock: 9, producedAgo: 18 },
  ] },
  { template: 'osb3', producer: 'p22', modes: ['lot'], lots: [
    { type: 'pallet', content: [50, 'piece'], kg: 1400, m3: 2.8, eur: 900, stock: 14, producedAgo: 40 },
    { type: 'pallet', content: [50, 'piece'], kg: 1400, m3: 2.8, eur: 690, stock: 3, producedAgo: 160, condition: 'b_grade' },
  ] },
  { template: 'oak-planks', producer: 'p22', modes: ['lot'], lots: [
    { type: 'mixed', content: [4, 'm3'], m3: 4, kg: 2800, eur: 3600, stock: 1, producedAgo: 400, condition: 'clearance' },
  ] },
  { template: 'pp-homo', producer: 'p25', modes: ['measure', 'lot'], lots: [
    { type: 'container', content: [24, 'bag'], item: [1, 't'], kg: 24000, eur: 29500, stock: 2, producedAgo: 30, warehouse: ['Bonded warehouse București', 'ro-bucuresti'] },
  ] },
  { template: 'rhdpe', producer: 'p24', modes: ['lot'], lots: [
    { type: 'truckload', content: [20, 'bag'], item: [1, 't'], kg: 20000, eur: 17600, stock: 1, producedAgo: 90, condition: 'returned' },
  ] },
  { template: 'disc-harrow', producer: 'p26', modes: ['measure', 'lot'], lots: [
    { type: 'mixed', content: [3, 'piece'], kg: 7800, eur: 57900, stock: 1, producedAgo: 210, condition: 'surplus' },
  ] },
  { template: 'urea', producer: 'p28', modes: ['measure', 'lot'], lots: [
    { type: 'truckload', content: [24, 'bag'], item: [1, 't'], kg: 24000, eur: 9950, stock: 7, producedAgo: 40 },
  ] },
  { template: 'npk-151515', producer: 'p28', modes: ['lot'], lots: [
    { type: 'pallet', content: [24, 'bag'], item: [50, 'kg'], kg: 1200, eur: 650, stock: 30, tiers: [[1, 0], [10, 3], [20, 6]], producedAgo: 60 },
  ] },
  { template: 'seed-maize', producer: 'p29', modes: ['lot'], lots: [
    { type: 'pallet', content: [40, 'bag'], kg: 800, eur: 5450, stock: 6, producedAgo: 220, condition: 'clearance' },
  ] },
  { template: 'herbicide-gly', producer: 'p29', modes: ['lot'], lots: [
    { type: 'pallet', content: [128, 'piece'], item: [5, 'l'], kg: 760, eur: 2950, stock: 4, producedAgo: 70 },
  ] },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

function lotDocuments(lot: Pick<Lot, 'id' | 'lotNumber' | 'productionDate' | 'expiryDate'>, kind: 'certificate' | 'lab' | 'batch', issuer: string, verified: boolean): Document[] {
  const issued = lot.productionDate ?? addDays(now(), -30).toISOString()
  if (kind === 'certificate')
    return [{ id: `${lot.id}-d1`, ownerType: 'lot', ownerId: lot.id, type: 'mill_test_certificate', title: `Inspection certificate 3.1 — batch ${lot.lotNumber}`, certification: 'en10204', issuer, issuedAt: issued, verifiedByPlatform: verified, fileName: `3.1-${lot.lotNumber}.pdf`, sizeKb: 420 }]
  if (kind === 'lab')
    return [{ id: `${lot.id}-d1`, ownerType: 'lot', ownerId: lot.id, type: 'test_report', title: `Laboratory analysis — batch ${lot.lotNumber}`, issuer, issuedAt: issued, expiresAt: lot.expiryDate, verifiedByPlatform: verified, fileName: `lab-${lot.lotNumber}.pdf`, sizeKb: 180 }]
  return [{ id: `${lot.id}-d1`, ownerType: 'lot', ownerId: lot.id, type: 'datasheet', title: `Batch record ${lot.lotNumber}`, issuer, issuedAt: issued, verifiedByPlatform: false, fileName: `batch-${lot.lotNumber}.pdf`, sizeKb: 95 }]
}

/** Attaches the lot catalogue to generated products and sets their sale modes. */
export function attachLots(products: Product[], templateKeyOf: (p: Product) => string | undefined) {
  const rng = createRng(1111)
  const seeds = new Map(PRODUCER_SEEDS.map((s) => [s.id, s]))
  for (const p of products) {
    p.saleModes = ['measure']
    p.lots = []
  }
  for (const spec of LISTINGS) {
    const product = products.find((p) => p.producerId === spec.producer && templateKeyOf(p) === spec.template)
    const seed = seeds.get(spec.producer)
    if (!product || !seed) throw new Error(`Lot listing ${spec.template}/${spec.producer}: product not found`)
    product.saleModes = spec.modes
    product.lots = buildLots(product, seed, spec.lots, rng)
  }
  const auto = createRng(3333)
  for (const product of products) {
    const key = templateKeyOf(product)
    const template = key ? EXTRA_BY_KEY.get(key) : undefined
    const seed = seeds.get(product.producerId)
    if (!template || !seed) continue
    const generated = generatedListing(product, template, auto)
    if (!generated) continue
    product.saleModes = generated.modes
    product.lots = buildLots(product, seed, generated.lots, auto)
  }
  for (const product of products) {
    const cfg = NEAR_EXPIRY[templateKeyOf(product) ?? '']
    if (!cfg || !product.lots.length) continue
    product.lots = product.lots.map((l, i) => {
      const price = roundPrice(l.pricePerLot * (1 - cfg.discountPct / 100))
      const productionDate = addDays(now(), -cfg.producedAgo - i * 6).toISOString()
      const lotNumber = l.lotNumber.replace(/-\d{4}-/, `-${productionDate.slice(2, 7).replace('-', '')}-`)
      return {
        ...l,
        lotNumber,
        documents: l.documents.map((d) => ({ ...d, title: d.title.replace(l.lotNumber, lotNumber), fileName: d.fileName.replace(l.lotNumber, lotNumber), issuedAt: productionDate })),
        condition: 'clearance',
        productionDate,
        expiryDate: addDays(now(), cfg.expiresIn[i % cfg.expiresIn.length] ?? 10).toISOString(),
        pricePerLot: price,
        tiers: l.tiers.map((t) => ({ ...t, pricePerLot: roundPrice(t.pricePerLot * (1 - cfg.discountPct / 100)) })),
      }
    })
    product.expiryDate = product.lots.map((l) => l.expiryDate as string).sort()[0]
    product.clearance = { discountPct: cfg.discountPct, reason: 'near_expiry' }
  }
}

const NEAR_EXPIRY: Record<string, { expiresIn: number[]; producedAgo: number; discountPct: number }> = {
  'x-can-27': { expiresIn: [6, 13], producedAgo: 390, discountPct: 18 },
}

function buildLots(product: Product, seed: (typeof PRODUCER_SEEDS)[number], specs: LotSpec[], rng: Rng): Lot[] {
  const config = getCategoryConfig(product.categorySlug)
  const policy = config?.lots
  const currency = producerCurrency(seed)
  const rate = CURRENCIES[currency].mockRateFromEUR
  return specs.map((l, i) => {
      const id = `lot-${product.id}-${i + 1}`
      const productionDate = l.producedAgo !== undefined ? addDays(now(), -l.producedAgo).toISOString() : undefined
      const expiryDate = l.expiresIn !== undefined ? addDays(now(), l.expiresIn).toISOString() : undefined
      const yymm = (productionDate ?? now().toISOString()).slice(2, 7).replace('-', '')
      const lotNumber = `${initials(seed.name)}-${yymm}-${String(rng.int(100, 999))}${i + 1}`
      const price = roundPrice(l.eur * rate)
      const where = l.warehouse ? cityById(l.warehouse[1]) : cityById(seed.cityId)
      const divisibility: LotDivisibility = l.split ? { kind: 'divisible', step: l.split[0], minSplit: l.split[1] } : { kind: 'indivisible' }
      const base = { id, lotNumber, productionDate, expiryDate }
      const docKind = policy?.requiresCertificate ? 'certificate' : config?.perishable ? 'lab' : policy?.requiresBatch ? 'batch' : null
      return {
        id,
        productId: product.id,
        producerId: product.producerId,
        lotNumber,
        type: l.type,
        content: { quantity: l.content[0], unit: l.content[1], itemSize: l.item ? { quantity: l.item[0], unit: l.item[1] } : undefined },
        totalWeightKg: l.kg,
        totalVolumeM3: l.m3,
        pricePerLot: price,
        tiers: (l.tiers ?? []).map(([minLots, pct], k, all) => {
          const next = all[k + 1]
          return { minLots, maxLots: next ? next[0] - 1 : undefined, pricePerLot: roundPrice(price * (1 - pct / 100)) }
        }),
        stockCount: l.stock,
        reservedCount: 0,
        moqLots: divisibility.kind === 'divisible' ? divisibility.minSplit : (l.moq ?? 1),
        divisibility,
        condition: l.condition ?? 'new',
        productionDate,
        expiryDate,
        documents: docKind ? lotDocuments(base, docKind, seed.name, seed.level !== 'unverified') : [],
        location: l.warehouse
          ? { label: l.warehouse[0], city: where.name, country: where.country, point: where.point }
          : { label: seed.name, city: product.city, country: product.country, point: product.location },
        status: l.status ?? 'active',
        createdAt: addDays(now(), -((l.producedAgo ?? 10) + 1)).toISOString(),
        updatedAt: addDays(now(), -rng.int(0, Math.max(1, l.producedAgo ?? 3))).toISOString(),
      } satisfies Lot
  })
}

const EXTRA_BY_KEY = new Map([...EXTRA_TEMPLATES, ...REGIONAL_TEMPLATES].map((t) => [t.key, t]))

const pick = <T,>(rng: Rng, xs: T[]): T => xs[rng.int(0, xs.length - 1)] as T

function generatedListing(product: Product, t: ProductTemplate, rng: Rng): { modes: SaleMode[]; lots: LotSpec[] } | null {
  const root = getCategory(product.categorySlug)?.rootSlug
  if (root !== 'fresh-produce' && root !== 'agro-inputs' && root !== 'agri-machinery' && root !== 'dairy' && root !== 'meat') return null
  const lotShare = root === 'agri-machinery' ? 0.8 : 0.88
  if (!rng.chance(lotShare)) return null
  const modes: SaleMode[] = rng.chance(0.45) ? ['lot'] : ['measure', 'lot']
  const count = rng.int(1, 3)
  const lots: LotSpec[] = []
  for (let i = 0; i < count; i++) {
    const spec = root === 'fresh-produce' ? freshLot(t, rng, i) : root === 'agro-inputs' ? inputLot(t, rng, i) : root === 'agri-machinery' ? machineLot(t, rng, i) : genericLot(t, rng, i)
    if (spec) lots.push(spec)
  }
  return lots.length ? { modes, lots } : null
}

function freshLot(t: ProductTemplate, rng: Rng, i: number): LotSpec {
  const [minShelf, maxShelf] = t.shelfLifeDays ?? [7, 21]
  const clearance = i > 0 && rng.chance(0.25)
  const expiresIn = clearance ? Math.max(1, Math.round(minShelf / 2)) : rng.int(minShelf, maxShelf)
  const discount = clearance ? 0.78 : rng.float(0.93, 0.97)
  if (t.unit === 't') {
    const tonnes = pick(rng, [20, 22, 24])
    return { type: 'truckload', content: [tonnes, 't'], kg: tonnes * 1000, eur: tonnes * t.priceEUR * discount, stock: rng.int(2, 6), split: rng.chance(0.5) ? [0.25, 0.5] : undefined, tiers: rng.chance(0.4) ? [[1, 0], [3, 4]] : undefined, expiresIn, producedAgo: rng.int(0, 5), condition: clearance ? 'clearance' : 'new' }
  }
  const crateKg = pick(rng, [5, 8, 10, 12])
  const crates = pick(rng, [60, 80, 100, 120])
  const kg = crateKg * crates
  return { type: rng.chance(0.85) ? 'pallet' : 'mixed', content: [crates, 'crate'], item: [crateKg, 'kg'], kg, eur: kg * t.priceEUR * discount, stock: rng.int(2, 12), tiers: rng.chance(0.35) ? [[1, 0], [5, 3]] : undefined, expiresIn, producedAgo: rng.int(0, 3), condition: clearance ? 'clearance' : 'new' }
}

function inputLot(t: ProductTemplate, rng: Rng, i: number): LotSpec {
  const surplus = i > 0 && rng.chance(0.3)
  const discount = surplus ? 0.85 : 0.94
  const expiresIn = rng.int(300, 720)
  const producedAgo = rng.int(10, 120)
  const condition = surplus ? 'surplus' : 'new'
  if (t.unit === 't') {
    if (rng.chance(0.6)) {
      const tonnes = pick(rng, [24, 25])
      return { type: 'truckload', content: [tonnes, 't'], kg: tonnes * 1000, eur: tonnes * t.priceEUR * discount, stock: rng.int(2, 10), split: [0.25, 0.5], expiresIn, producedAgo, condition }
    }
    const bags = pick(rng, [20, 40])
    return { type: 'pallet', content: [bags, 'bag'], item: [50, 'kg'], kg: bags * 50, eur: (bags * 50 / 1000) * t.priceEUR * discount * 1.04, stock: rng.int(6, 30), tiers: [[1, 0], [10, 3]], expiresIn, producedAgo, condition }
  }
  if (t.unit === 'l') {
    const ibc = t.moq >= 1000
    return ibc
      ? { type: 'truckload', content: [20, 'piece'], item: [1000, 'l'], kg: 26000, eur: 20000 * t.priceEUR * discount, stock: rng.int(1, 4), expiresIn, producedAgo, condition }
      : (() => {
          const cans = pick(rng, [32, 40, 80])
          const size = pick(rng, [5, 20])
          return { type: 'pallet', content: [cans, 'piece'], item: [size, 'l'], kg: cans * size * 1.1, eur: cans * size * t.priceEUR * discount, stock: rng.int(4, 20), expiresIn, producedAgo, condition } satisfies LotSpec
        })()
  }
  if (t.unit === 'bag') {
    const bags = pick(rng, [30, 40, 50])
    return { type: 'pallet', content: [bags, 'bag'], eur: bags * t.priceEUR * discount, stock: rng.int(4, 20), tiers: [[1, 0], [5, 4]], expiresIn, producedAgo, condition }
  }
  const packs = pick(rng, [40, 48, 60])
  const packKg = pick(rng, [10, 25])
  return { type: 'pallet', content: [packs, 'piece'], item: [packKg, 'kg'], kg: packs * packKg, eur: packs * packKg * t.priceEUR * discount, stock: rng.int(4, 20), expiresIn, producedAgo, condition }
}

function machineLot(t: ProductTemplate, rng: Rng, i: number): LotSpec | null {
  if (t.madeToOrderDays || t.attributes.condition === 'used') return null
  if (t.priceEUR < 3000) {
    const n = pick(rng, [5, 8, 10])
    return { type: 'container', content: [n, 'piece'], eur: n * t.priceEUR * 0.88, stock: rng.int(1, 4), moq: 1, condition: 'new' }
  }
  const n = t.priceEUR < 30000 ? pick(rng, [3, 4, 5]) : 2
  const surplus = i > 0 || rng.chance(0.3)
  return { type: t.priceEUR < 30000 ? 'mixed' : 'other', content: [n, 'piece'], eur: n * t.priceEUR * (surplus ? 0.86 : 0.92), stock: rng.int(1, 2), condition: surplus ? 'surplus' : 'new', producedAgo: rng.int(20, 200) }
}

function genericLot(t: ProductTemplate, rng: Rng, _i: number): LotSpec | null {
  if (t.moq >= 1000) return null
  const [minShelf, maxShelf] = t.shelfLifeDays ?? [10, 30]
  const units = t.moq * pick(rng, [2, 3, 4])
  return { type: 'pallet', content: [units, t.unit], kg: t.unit === 'kg' ? units : undefined, eur: units * t.priceEUR * 0.94, stock: rng.int(2, 8), expiresIn: rng.int(minShelf, maxShelf), producedAgo: rng.int(0, 2) }
}

const RESERVING = new Set(['order_confirmed', 'in_delivery'])

/** Converts part of the generated deals into lot purchases, so lot line items exist with traceability. */
export function convertDealsToLots(deals: Deal[], products: Product[]) {
  const rng = createRng(2222)
  const byId = new Map(products.map((p) => [p.id, p]))
  for (const deal of deals) {
    let changed = false
    deal.lineItems = deal.lineItems.map((li) => {
      const product = byId.get(li.productId)
      const lot = product?.lots.find((l) => l.status === 'active') ?? product?.lots[0]
      if (!product || !lot || !product.saleModes.includes('lot')) return li
      const lotOnly = !product.saleModes.includes('measure')
      if (!lotOnly && !RESERVING.has(deal.status) && !rng.chance(0.5)) return li
      const rate = CURRENCIES[deal.currency].mockRateFromEUR / CURRENCIES[product.pricing.currency].mockRateFromEUR
      const quantity = Math.max(lot.moqLots, Math.min(rng.int(1, 3), Math.max(1, lot.stockCount)))
      const unitPrice = roundPrice(lot.pricePerLot * rate)
      changed = true
      return { ...li, quantity, unit: product.unit, unitPrice, subtotal: Math.round(unitPrice * quantity * 100) / 100, lot: { lotId: lot.id, lotNumber: lot.lotNumber, type: lot.type } }
    })
    if (changed) deal.total = Math.round(deal.lineItems.reduce((s, li) => s + li.subtotal, 0) * 100) / 100
  }
}

/** Confirmed deals hold their lots until delivery, including while an undelivered deal is disputed. */
export const reservesLots = (deal: Pick<Deal, 'status' | 'deliveredAt'>) => RESERVING.has(deal.status) || (deal.status === 'disputed' && !deal.deliveredAt)

/** Recomputes each lot's reserved count from confirmed, not yet delivered deals. */
export function refreshReservations(products: Product[], deals: Deal[]) {
  const reserved = new Map<string, number>()
  for (const d of deals) {
    if (!reservesLots(d)) continue
    for (const li of d.lineItems) if (li.lot) reserved.set(li.lot.lotId, (reserved.get(li.lot.lotId) ?? 0) + li.quantity)
  }
  for (const p of products) for (const lot of p.lots) lot.reservedCount = Math.min(lot.stockCount, reserved.get(lot.id) ?? 0)
}
