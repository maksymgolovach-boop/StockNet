import type { Buyer, Producer, Product } from '@/types/models'
import { getAllCategories, getDescendantSlugs } from '@/config/categories'
import { db } from '@/mocks'
import { NotFoundError, mockRequest } from './client'

export interface CategoryStats {
  slug: string
  productCount: number
  producerCount: number
}

export interface PlatformStats {
  producers: number
  verifiedOrAudited: number
  documents: number
  reviews: number
  countries: number
}

export interface CatalogService {
  categoryStats(): Promise<CategoryStats[]>
  platformStats(): Promise<PlatformStats>
  products(): Promise<Product[]>
  product(id: string): Promise<Product>
  productsByProducer(producerId: string): Promise<Product[]>
  producers(): Promise<Producer[]>
  producer(id: string): Promise<Producer>
  buyer(id: string): Promise<Buyer>
  buyers(): Promise<Buyer[]>
}

export const catalogService: CatalogService = {
  categoryStats: () =>
    mockRequest(() =>
      getAllCategories().map((c) => {
        const slugs = new Set(getDescendantSlugs(c.slug))
        const products = db.products.filter((p) => slugs.has(p.categorySlug))
        return { slug: c.slug, productCount: products.length, producerCount: new Set(products.map((p) => p.producerId)).size }
      }),
    ),
  platformStats: () =>
    mockRequest(() => ({
      producers: db.producers.length,
      verifiedOrAudited: db.producers.filter((p) => p.verification.level === 'verified' || p.verification.level === 'audited').length,
      documents: db.producers.reduce((n, p) => n + p.documents.length, 0) + db.products.reduce((n, p) => n + p.documents.length, 0),
      reviews: db.reviews.length,
      countries: new Set(db.producers.map((p) => p.address.country)).size,
    })),
  products: () => mockRequest(() => db.products),
  product: (id) =>
    mockRequest(() => {
      const p = db.products.find((x) => x.id === id)
      if (!p) throw new NotFoundError(`Product ${id}`)
      return p
    }),
  productsByProducer: (producerId) => mockRequest(() => db.products.filter((p) => p.producerId === producerId)),
  producers: () => mockRequest(() => db.producers),
  producer: (id) =>
    mockRequest(() => {
      const p = db.producers.find((x) => x.id === id)
      if (!p) throw new NotFoundError(`Producer ${id}`)
      return p
    }),
  buyers: () => mockRequest(() => db.buyers),
  buyer: (id) =>
    mockRequest(() => {
      const b = db.buyers.find((x) => x.id === id)
      if (!b) throw new NotFoundError(`Buyer ${id}`)
      return b
    }),
}
