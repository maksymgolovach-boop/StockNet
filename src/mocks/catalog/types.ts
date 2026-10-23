import type { AttributeValue, LanguageCode, PricingMode, UnitCode } from '@/types/models'
import type { CertificationCode } from '@/config/certifications'

export type L10n = Record<LanguageCode, string>

export interface ProductTemplate {
  key: string
  category: string
  names: L10n
  summary: L10n
  keywords: string[]
  unit: UnitCode
  moq: number
  priceEUR: number
  pricing?: PricingMode
  index?: { name: string; referenceEUR: number; premiumEUR: number }
  attributes: Record<string, AttributeValue>
  certifications: CertificationCode[]
  /** perishables: shelf life range in days from today */
  shelfLifeDays?: [number, number]
  madeToOrderDays?: [number, number]
  stock: [number, number]
  producers: string[]
  /** per-producer attribute overrides (e.g. organic at one farm only) */
  overrides?: Record<string, Record<string, AttributeValue>>
}
