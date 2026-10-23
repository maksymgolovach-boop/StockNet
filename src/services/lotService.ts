import type { Document, Lot, LotRecordStatus, Product } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import { db, syncLotOnlyFields } from '@/mocks'
import { cityById } from '@/mocks/cities'
import { refreshReservations } from '@/mocks/lots'
import { persistLot, persistSaleModes } from '@/mocks/lotStorage'
import { liveNow } from '@/shared/lib/dates'
import { ApiError, NotFoundError, mockRequest } from './client'

export interface LotInput extends Omit<Lot, 'id' | 'producerId' | 'reservedCount' | 'createdAt' | 'updatedAt' | 'documents' | 'location'> {
  cityId: string
  warehouseLabel: string
  certificateFile?: string
}

export interface ProducerLotRow {
  product: Pick<Product, 'id' | 'name' | 'categorySlug' | 'unit' | 'saleModes' | 'pricing' | 'contentLang'>
  lot: Lot
}

function ownProduct(producerId: string, productId: string): Product {
  const product = db.products.find((p) => p.id === productId && p.producerId === producerId)
  if (!product) throw new NotFoundError(`Product ${productId}`)
  return product
}

function findLot(producerId: string, lotId: string): { product: Product; lot: Lot } {
  for (const product of db.products) {
    if (product.producerId !== producerId) continue
    const lot = product.lots.find((l) => l.id === lotId)
    if (lot) return { product, lot }
  }
  throw new NotFoundError(`Lot ${lotId}`)
}

function commit(product: Product, lot: Lot) {
  if (!product.saleModes.includes('lot')) {
    product.saleModes = [...product.saleModes, 'lot']
    persistSaleModes(product.id, product.saleModes)
  }
  persistLot(lot)
  refreshReservations(db.products, db.deals)
  syncLotOnlyFields(db.products)
}

function documentsFor(lot: Pick<Lot, 'id' | 'lotNumber' | 'productionDate'>, file: string | undefined, issuer: string, previous: Document[]): Document[] {
  if (!file) return previous.filter((d) => d.type !== 'mill_test_certificate')
  const kept = previous.filter((d) => d.type !== 'mill_test_certificate')
  return [
    {
      id: `${lot.id}-cert`,
      ownerType: 'lot',
      ownerId: lot.id,
      type: 'mill_test_certificate',
      title: `Inspection certificate 3.1 — batch ${lot.lotNumber}`,
      certification: 'en10204',
      issuer,
      issuedAt: lot.productionDate ?? liveNow().toISOString(),
      verifiedByPlatform: false,
      fileName: file,
      sizeKb: 240,
    },
    ...kept,
  ]
}

function build(producerId: string, product: Product, input: LotInput, id: string, previous?: Lot): Lot {
  const policy = getCategoryConfig(product.categorySlug)?.lots
  if (!policy?.allowedSaleModes.includes('lot')) throw new ApiError('Lots are not allowed in this category', 422)
  if (!policy.lotTypes.includes(input.type)) throw new ApiError('Lot type not allowed', 422)
  const city = cityById(input.cityId)
  const producer = db.producers.find((p) => p.id === producerId)
  const at = liveNow().toISOString()
  const { cityId: _c, warehouseLabel, certificateFile, ...rest } = input
  return {
    ...rest,
    id,
    producerId,
    reservedCount: previous?.reservedCount ?? 0,
    documents: documentsFor({ id, lotNumber: input.lotNumber, productionDate: input.productionDate }, certificateFile, producer?.name ?? '', previous?.documents ?? []),
    location: { label: warehouseLabel, city: city.name, country: city.country, point: city.point },
    createdAt: previous?.createdAt ?? at,
    updatedAt: at,
  }
}

let seq = 0
const newId = (productId: string) => `lot-${productId}-u${Date.now().toString(36)}${(seq += 1)}`

export const lotService = {
  producerLots: (producerId: string) =>
    mockRequest((): ProducerLotRow[] =>
      db.products
        .filter((p) => p.producerId === producerId)
        .flatMap((p) => p.lots.map((lot) => ({ product: { id: p.id, name: p.name, categorySlug: p.categorySlug, unit: p.unit, saleModes: p.saleModes, pricing: p.pricing, contentLang: p.contentLang }, lot })))
        .sort((a, b) => b.lot.updatedAt.localeCompare(a.lot.updatedAt)),
    ),
  producerProducts: (producerId: string) => mockRequest(() => db.products.filter((p) => p.producerId === producerId)),
  create: (producerId: string, input: LotInput) =>
    mockRequest(() => {
      const product = ownProduct(producerId, input.productId)
      const lot = build(producerId, product, input, newId(product.id))
      product.lots.push(lot)
      commit(product, lot)
      return lot
    }),
  update: (producerId: string, lotId: string, input: LotInput) =>
    mockRequest(() => {
      const { product, lot: previous } = findLot(producerId, lotId)
      if (input.productId !== product.id) throw new ApiError('A lot cannot move to another product', 422)
      const lot = build(producerId, product, input, lotId, previous)
      product.lots[product.lots.indexOf(previous)] = lot
      commit(product, lot)
      return lot
    }),
  duplicate: (producerId: string, lotId: string) =>
    mockRequest(() => {
      const { product, lot: source } = findLot(producerId, lotId)
      const at = liveNow().toISOString()
      const lot: Lot = { ...structuredClone(source), id: newId(product.id), lotNumber: `${source.lotNumber}-C`, reservedCount: 0, status: 'paused', documents: [], createdAt: at, updatedAt: at }
      product.lots.push(lot)
      commit(product, lot)
      return lot
    }),
  setStock: (producerId: string, lotId: string, stockCount: number) =>
    mockRequest(() => {
      const { product, lot } = findLot(producerId, lotId)
      if (stockCount < lot.reservedCount) throw new ApiError('Stock cannot go below reserved lots', 422)
      lot.stockCount = Math.max(0, Math.round(stockCount))
      lot.updatedAt = liveNow().toISOString()
      commit(product, lot)
      return lot
    }, { latencyFactor: 0.4 }),
  setStatus: (producerId: string, lotId: string, status: LotRecordStatus) =>
    mockRequest(() => {
      const { product, lot } = findLot(producerId, lotId)
      lot.status = status
      lot.updatedAt = liveNow().toISOString()
      commit(product, lot)
      return lot
    }, { latencyFactor: 0.4 }),
}
