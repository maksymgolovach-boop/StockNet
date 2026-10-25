import { z } from 'zod'
import type { Incoterm, Product } from '@/types/models'
import { availableLots, isSellable, lotQuantityRule } from '@/features/lots/lotMath'
import { liveNow } from '@/shared/lib/dates'

export interface RfqItemValues {
  productId: string
  mode: 'measure' | 'lot'
  quantity: string
  lotId: string
}

export interface RfqValues {
  producerId: string
  items: RfqItemValues[]
  street: string
  postcode: string
  city: string
  country: string
  incoterm: Incoterm | ''
  date: string
  notes: string
  attachments: string[]
}

const E = 'rfq.errors.'
const num = (s: string) => Number(s.replace(',', '.'))

export function rfqSchema(products: Product[], ownProducerId?: string) {
  return z
    .object({
      producerId: z.string().min(1, `${E}producer`),
      items: z.array(z.object({ productId: z.string(), mode: z.enum(['measure', 'lot']), quantity: z.string(), lotId: z.string() })).min(1, `${E}items`),
      street: z.string().trim().min(3, `${E}required`),
      postcode: z.string().trim().min(3, `${E}required`),
      city: z.string().trim().min(2, `${E}required`),
      country: z.string().regex(/^[A-Z]{2}$/, `${E}required`),
      incoterm: z.string().min(1, `${E}required`),
      date: z.string().min(1, `${E}date`),
      notes: z.string().max(1000, `${E}tooLong`),
      attachments: z.array(z.string()),
    })
    .superRefine((v, ctx) => {
      const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message: `${E}${message}` })
      const tomorrow = new Date(liveNow().getTime() + 86_400_000).toISOString().slice(0, 10)
      if (v.date && v.date < tomorrow) issue(['date'], 'dateFuture')
      if (ownProducerId && v.producerId === ownProducerId) issue(['producerId'], 'ownProducer')
      const seen = new Set<string>()
      v.items.forEach((item, i) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return issue(['items', i, 'productId'], 'product')
        if (product.producerId !== v.producerId) issue(['items', i, 'productId'], 'sameProducer')
        const key = `${item.productId}:${item.mode === 'lot' ? item.lotId : 'm'}`
        if (seen.has(key)) issue(['items', i, 'productId'], 'duplicate')
        seen.add(key)
        const q = num(item.quantity)
        if (!Number.isFinite(q) || q <= 0) return issue(['items', i, 'quantity'], 'positive')
        if (item.mode === 'measure') {
          if (!product.saleModes.includes('measure')) issue(['items', i, 'mode'], 'lotOnly')
          else if (q < product.moq) issue(['items', i, 'quantity'], 'moq')
          return
        }
        const lot = product.lots.find((l) => l.id === item.lotId)
        if (!lot || !isSellable(lot)) return issue(['items', i, 'lotId'], 'lot')
        const rule = lotQuantityRule(lot)
        if (q < rule.min) issue(['items', i, 'quantity'], 'lotMin')
        else if (q > availableLots(lot)) issue(['items', i, 'quantity'], 'lotMax')
        else if (Math.abs(q / rule.step - Math.round(q / rule.step)) > 1e-9) issue(['items', i, 'quantity'], rule.divisible ? 'lotStep' : 'lotWhole')
      })
    })
}
