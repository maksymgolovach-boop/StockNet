import type { CurrencyCode, LanguageCode, PriceTier, Pricing, Product } from '@/types/models'
import { CURRENCIES } from '@/config/currencies'
import { CERTIFICATIONS } from '@/config/certifications'
import { getAnyCategory as getCategory, getCategoryConfig, getLogisticsFor } from '@/config/categories'
import { LANGUAGE_CODES } from '@/config/languages'
import { addDays, now } from '@/shared/lib/dates'
import { createRng, type Rng } from '@/shared/lib/random'
import { cityById } from './cities'
import { PRODUCER_SEEDS, type ProducerSeed } from './producers'
import { productDocuments } from './documents'
import { stockPhotos } from './photos'
import type { ProductTemplate } from './catalog/types'
import { FRESH_TEMPLATES } from './catalog/fresh'
import { DAIRY_TEMPLATES, MEAT_TEMPLATES } from './catalog/dairyMeat'
import { CABLE_TEMPLATES, METAL_TEMPLATES } from './catalog/metalsCables'
import { AGGREGATE_TEMPLATES, CONCRETE_TEMPLATES, PLASTICS_TEMPLATES, TIMBER_TEMPLATES } from './catalog/construction'
import { AGRO_INPUT_TEMPLATES, MACHINERY_TEMPLATES } from './catalog/agriculture'
import { EXTRA_TEMPLATES } from './catalog/extra'
import { REGIONAL_TEMPLATES } from './regional'

export const ALL_TEMPLATES: ProductTemplate[] = [
  ...FRESH_TEMPLATES,
  ...DAIRY_TEMPLATES,
  ...MEAT_TEMPLATES,
  ...METAL_TEMPLATES,
  ...CABLE_TEMPLATES,
  ...CONCRETE_TEMPLATES,
  ...AGGREGATE_TEMPLATES,
  ...TIMBER_TEMPLATES,
  ...PLASTICS_TEMPLATES,
  ...MACHINERY_TEMPLATES,
  ...AGRO_INPUT_TEMPLATES,
  ...EXTRA_TEMPLATES,
  ...REGIONAL_TEMPLATES,
]

const PRODUCER_CURRENCY: Record<string, CurrencyCode> = { p13: 'USD', p16: 'USD' }

export function producerCurrency(seed: ProducerSeed): CurrencyCode {
  const explicit = PRODUCER_CURRENCY[seed.id]
  if (explicit) return explicit
  return cityById(seed.cityId).country === 'RO' ? 'RON' : 'EUR'
}

const SITE_SENTENCE: Record<LanguageCode, (city: string) => string> = {
  en: (city) => `Dispatched from our site in ${city}.`,
  de: (city) => `Versand ab unserem Standort ${city}.`,
  ro: (city) => `Livrare din unitatea noastră din ${city}.`,
}

export function roundPrice(value: number): number {
  if (value >= 1000) return Math.round(value / 5) * 5
  if (value >= 100) return Math.round(value)
  if (value >= 10) return Math.round(value * 10) / 10
  return Math.round(value * 100) / 100
}

function buildTiers(moq: number, unitPrice: number): PriceTier[] {
  const breaks = [moq, moq * 5, moq * 20]
  const discounts = [0, 0.03, 0.065]
  return breaks.map((minQty, i) => {
    const next = breaks[i + 1]
    return {
      minQty,
      maxQty: next !== undefined ? next - 1 : undefined,
      unitPrice: roundPrice(unitPrice * (1 - (discounts[i] ?? 0))),
    }
  })
}

function buildPricing(t: ProductTemplate, currency: CurrencyCode, rng: Rng): Pricing {
  const rate = CURRENCIES[currency].mockRateFromEUR
  const jitter = rng.float(0.94, 1.08, 3)
  if (t.pricing === 'indexed' && t.index) {
    const reference = roundPrice(t.index.referenceEUR * rate)
    const premium = roundPrice(t.index.premiumEUR * rate * jitter)
    return {
      mode: 'indexed',
      currency,
      tiers: buildTiers(t.moq, reference + premium),
      index: { name: t.index.name, referenceValue: reference, premium, asOf: addDays(now(), -1).toISOString() },
    }
  }
  if (t.pricing === 'on_request') return { mode: 'on_request', currency, tiers: [] }
  return { mode: 'fixed', currency, tiers: buildTiers(t.moq, roundPrice(t.priceEUR * rate * jitter)) }
}

function buildProduct(t: ProductTemplate, seed: ProducerSeed, index: number, rng: Rng): Product {
  const photos = stockPhotos(t.category, t.key, t.names.en)
  const shown = [0, 1, 2].map((v) => photos[(v + index) % photos.length])
  const order = t.key === 'x-can-27' ? [2, 0, 1] : [0, 1, 2]
  const config = getCategoryConfig(t.category)
  const category = getCategory(t.category)
  const logistics = getLogisticsFor(t.category)
  if (!config || !category || !logistics) throw new Error(`Template ${t.key}: unknown category ${t.category}`)
  const city = cityById(seed.cityId)
  const id = `pr-${String(index + 1).padStart(3, '0')}`
  const lang = seed.contentLang
  const description = (l: LanguageCode) => `${t.summary[l]} ${SITE_SENTENCE[l](city.name)}`

  const attributes = { ...t.attributes, ...(t.overrides?.[seed.id] ?? {}) }
  const originDef = config.attributes.find((a) => a.key === 'origin')
  if (originDef?.type === 'enum' && originDef.options.includes(city.country)) attributes.origin = city.country

  const certifications = t.certifications.filter(
    (c) => CERTIFICATIONS[c].kind === 'standard' || seed.certs.includes(c) || (c === 'organic' && attributes.organic === true),
  )

  const quantity = t.stock[1] === 0 ? 0 : rng.int(t.stock[0], t.stock[1])
  const lowThreshold = t.moq * 3
  let availability: Product['availability']
  if (t.madeToOrderDays) {
    const lead = rng.int(...t.madeToOrderDays)
    availability = { status: 'made_to_order', leadTimeDays: lead, availableFrom: addDays(now(), lead).toISOString() }
  } else if (config.perishable) {
    availability = { status: 'in_stock', leadTimeDays: rng.int(1, 2) }
  } else if (quantity < lowThreshold) {
    const lead = rng.int(5, 18)
    availability = { status: 'ships_in', leadTimeDays: lead, availableFrom: addDays(now(), lead).toISOString() }
  } else if (rng.chance(0.06)) {
    const lead = rng.int(20, 45)
    availability = { status: 'pre_order', leadTimeDays: lead, availableFrom: addDays(now(), lead).toISOString() }
  } else {
    availability = { status: 'in_stock', leadTimeDays: rng.int(1, 4) }
  }

  let expiryDate: string | undefined
  let productionDate: string | undefined
  if (config.perishable && t.shelfLifeDays) {
    expiryDate = addDays(now(), rng.int(...t.shelfLifeDays)).toISOString()
    productionDate = addDays(now(), -rng.int(1, 4)).toISOString()
  }
  const daysLeft = expiryDate ? (new Date(expiryDate).getTime() - now().getTime()) / 86_400_000 : Infinity
  let clearance: Product['clearance']
  if (daysLeft < 7) clearance = { discountPct: rng.int(15, 30), reason: 'near_expiry' }
  else if (!config.perishable && t.pricing !== 'on_request' && rng.chance(0.08)) {
    clearance = { discountPct: rng.int(6, 15), reason: rng.chance(0.6) ? 'surplus' : 'end_of_line' }
  }

  const mockTranslations: Product['mockTranslations'] = {}
  for (const l of LANGUAGE_CODES) if (l !== lang) mockTranslations[l] = { name: t.names[l], description: description(l) }

  return {
    id,
    producerId: seed.id,
    categorySlug: t.category,
    rootCategorySlug: category.rootSlug,
    name: t.names[lang],
    description: description(lang),
    contentLang: lang,
    mockTranslations,
    keywords: [...new Set([...t.keywords, ...Object.values(t.names)])],
    location: { lat: city.point.lat + seed.offset[0], lng: city.point.lng + seed.offset[1] },
    country: city.country,
    city: city.name,
    unit: t.unit,
    moq: t.moq,
    saleModes: ['measure'],
    lots: [],
    pricing: buildPricing(t, producerCurrency(seed), rng),
    stock: { quantity, lowThreshold },
    availability,
    expiryDate,
    productionDate,
    logistics,
    attributes,
    certifications,
    documents: productDocuments(id, category.rootSlug, t.names.en, seed.level !== 'unverified', rng),
    media: [0, 1, 2].map((v) => ({ id: `${id}-m${v}`, tone: (seed.brandHue + v * 23 + rng.int(0, 20)) % 360, variant: v, url: shown[order[v] ?? v] })),
    rating: 0,
    reviewCount: 0,
    clearance,
    createdAt: addDays(now(), -(rng.chance(0.12) ? rng.int(1, 14) : rng.int(15, 540))).toISOString(),
  }
}

export const TEMPLATE_KEY_BY_PRODUCT = new Map<string, string>()

export function buildProducts(): Product[] {
  const rng = createRng(20261016)
  const seeds = new Map(PRODUCER_SEEDS.map((s) => [s.id, s]))
  const products: Product[] = []
  for (const t of ALL_TEMPLATES) {
    for (const pid of t.producers) {
      const seed = seeds.get(pid)
      if (!seed) throw new Error(`Template ${t.key}: unknown producer ${pid}`)
      const product = buildProduct(t, seed, products.length, rng)
      TEMPLATE_KEY_BY_PRODUCT.set(product.id, t.key)
      products.push(product)
    }
  }
  return products
}
