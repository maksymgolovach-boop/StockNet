import { z } from 'zod'
import type { Lot, LotCondition, LotPolicy, LotRecordStatus, LotType, Product, UnitCode } from '@/types/models'
import { UNIT_CODES } from '@/config/units'
import { now } from '@/shared/lib/dates'
import type { LotInput } from '@/services/lotService'

export interface LotFormValues {
  productId: string
  lotNumber: string
  type: string
  contentQty: string
  contentUnit: string
  itemQty: string
  itemUnit: string
  weightKg: string
  volumeM3: string
  pricePerLot: string
  tiers: { minLots: string; price: string }[]
  stockCount: string
  divisible: boolean
  step: string
  minSplit: string
  moqLots: string
  condition: string
  productionDate: string
  expiryDate: string
  warehouseLabel: string
  cityId: string
  certificateFile: string
  status: LotRecordStatus
}

const num = (s: string) => Number(s.replace(',', '.'))
const isNum = (s: string) => s.trim() !== '' && Number.isFinite(num(s))
const E = 'lots.form.errors.'

export function lotFormSchema(policy: LotPolicy | undefined, opts: { reserved: number; hasCertificate: boolean }) {
  return z
    .object({
      productId: z.string().min(1, `${E}required`),
      lotNumber: z.string().trim().max(40, `${E}tooLong`),
      type: z.string().min(1, `${E}required`),
      contentQty: z.string(),
      contentUnit: z.string().refine((u) => (UNIT_CODES as string[]).includes(u), `${E}required`),
      itemQty: z.string(),
      itemUnit: z.string(),
      weightKg: z.string(),
      volumeM3: z.string(),
      pricePerLot: z.string(),
      tiers: z.array(z.object({ minLots: z.string(), price: z.string() })),
      stockCount: z.string(),
      divisible: z.boolean(),
      step: z.string(),
      minSplit: z.string(),
      moqLots: z.string(),
      condition: z.string().min(1, `${E}required`),
      productionDate: z.string(),
      expiryDate: z.string(),
      warehouseLabel: z.string().trim().min(2, `${E}required`),
      cityId: z.string().min(1, `${E}required`),
      certificateFile: z.string(),
      status: z.enum(['active', 'paused', 'archived']),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: path.split('.'), message: `${E}${message}` })
      if (!policy?.allowedSaleModes.includes('lot')) issue('productId', 'lotsNotAllowed')
      else if (!policy.lotTypes.includes(v.type as LotType)) issue('type', 'required')
      if (policy?.requiresBatch && v.lotNumber.trim().length < 3) issue('lotNumber', 'batchRequired')
      if (v.lotNumber && !/^[\p{L}\p{N}][\p{L}\p{N}\-/._]*$/u.test(v.lotNumber.trim())) issue('lotNumber', 'lotNumberFormat')
      if (!isNum(v.contentQty) || num(v.contentQty) <= 0) issue('contentQty', 'positive')
      if (v.itemQty.trim() !== '' && (!isNum(v.itemQty) || num(v.itemQty) <= 0)) issue('itemQty', 'positive')
      if (v.itemQty.trim() !== '' && !v.itemUnit) issue('itemUnit', 'required')
      for (const k of ['weightKg', 'volumeM3'] as const) if (v[k].trim() !== '' && (!isNum(v[k]) || num(v[k]) <= 0)) issue(k, 'positive')
      if (!isNum(v.pricePerLot) || num(v.pricePerLot) <= 0) issue('pricePerLot', 'positive')
      let prevMin = 1
      let prevPrice = isNum(v.pricePerLot) ? num(v.pricePerLot) : Infinity
      v.tiers.forEach((tier, i) => {
        if (!isNum(tier.minLots) || !Number.isInteger(num(tier.minLots)) || num(tier.minLots) <= prevMin) issue(`tiers.${i}.minLots`, 'tierOrder')
        else prevMin = num(tier.minLots)
        if (!isNum(tier.price) || num(tier.price) <= 0) issue(`tiers.${i}.price`, 'positive')
        else if (num(tier.price) > prevPrice) issue(`tiers.${i}.price`, 'tierPrice')
        else prevPrice = num(tier.price)
      })
      if (!isNum(v.stockCount) || !Number.isInteger(num(v.stockCount)) || num(v.stockCount) < 0) issue('stockCount', 'wholeNumber')
      else if (num(v.stockCount) < opts.reserved) issue('stockCount', 'belowReserved')
      if (v.divisible) {
        const step = num(v.step)
        const min = num(v.minSplit)
        if (!isNum(v.step) || step <= 0 || step > 1) issue('step', 'step')
        if (!isNum(v.minSplit) || min < step || Math.abs(min / step - Math.round(min / step)) > 1e-9) issue('minSplit', 'minSplit')
      } else if (!isNum(v.moqLots) || !Number.isInteger(num(v.moqLots)) || num(v.moqLots) < 1) issue('moqLots', 'wholeNumber')
      if (v.productionDate && Number.isNaN(Date.parse(v.productionDate))) issue('productionDate', 'date')
      if (policy?.requiresExpiry && !v.expiryDate) issue('expiryDate', 'expiryRequired')
      if (v.expiryDate && v.productionDate && v.expiryDate <= v.productionDate) issue('expiryDate', 'expiryAfterProduction')
      if (policy?.requiresCertificate && !v.certificateFile && !opts.hasCertificate) issue('certificateFile', 'certificateRequired')
    })
}

const day = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const opt = (s: string) => (s.trim() === '' ? undefined : num(s))

export function toFormValues(lot: Lot | undefined, product: Product | undefined, defaults: { cityId: string; warehouseLabel: string; lotNumber: string; type: string; unit: UnitCode }): LotFormValues {
  if (!lot)
    return {
      productId: product?.id ?? '',
      lotNumber: defaults.lotNumber,
      type: defaults.type,
      contentQty: '',
      contentUnit: defaults.unit,
      itemQty: '',
      itemUnit: '',
      weightKg: '',
      volumeM3: '',
      pricePerLot: '',
      tiers: [],
      stockCount: '1',
      divisible: false,
      step: '0.5',
      minSplit: '0.5',
      moqLots: '1',
      condition: 'new',
      productionDate: now().toISOString().slice(0, 10),
      expiryDate: '',
      warehouseLabel: defaults.warehouseLabel,
      cityId: defaults.cityId,
      certificateFile: '',
      status: 'active',
    }
  return {
    productId: lot.productId,
    lotNumber: lot.lotNumber,
    type: lot.type,
    contentQty: String(lot.content.quantity),
    contentUnit: lot.content.unit,
    itemQty: lot.content.itemSize ? String(lot.content.itemSize.quantity) : '',
    itemUnit: lot.content.itemSize?.unit ?? '',
    weightKg: lot.totalWeightKg ? String(lot.totalWeightKg) : '',
    volumeM3: lot.totalVolumeM3 ? String(lot.totalVolumeM3) : '',
    pricePerLot: String(lot.pricePerLot),
    tiers: lot.tiers.slice(1).map((t) => ({ minLots: String(t.minLots), price: String(t.pricePerLot) })),
    stockCount: String(lot.stockCount),
    divisible: lot.divisibility.kind === 'divisible',
    step: lot.divisibility.kind === 'divisible' ? String(lot.divisibility.step) : '0.5',
    minSplit: lot.divisibility.kind === 'divisible' ? String(lot.divisibility.minSplit) : '0.5',
    moqLots: String(lot.moqLots),
    condition: lot.condition,
    productionDate: day(lot.productionDate),
    expiryDate: day(lot.expiryDate),
    warehouseLabel: lot.location.label,
    cityId: defaults.cityId,
    certificateFile: '',
    status: lot.status,
  }
}

const isoAtNoon = (d: string) => (d ? new Date(`${d}T12:00:00Z`).toISOString() : undefined)

export function toLotInput(v: LotFormValues): LotInput {
  const price = num(v.pricePerLot)
  const tiers = v.tiers.map((t) => ({ minLots: num(t.minLots), pricePerLot: num(t.price) }))
  const allTiers = tiers.length ? [{ minLots: 1, pricePerLot: price }, ...tiers] : []
  const divisibility = v.divisible ? { kind: 'divisible' as const, step: num(v.step), minSplit: num(v.minSplit) } : { kind: 'indivisible' as const }
  return {
    productId: v.productId,
    lotNumber: v.lotNumber.trim(),
    type: v.type as LotType,
    content: { quantity: num(v.contentQty), unit: v.contentUnit as UnitCode, itemSize: v.itemQty.trim() ? { quantity: num(v.itemQty), unit: v.itemUnit as UnitCode } : undefined },
    totalWeightKg: opt(v.weightKg),
    totalVolumeM3: opt(v.volumeM3),
    pricePerLot: price,
    tiers: allTiers.map((t, i) => ({ ...t, maxLots: allTiers[i + 1] ? (allTiers[i + 1] as { minLots: number }).minLots - 1 : undefined })),
    stockCount: num(v.stockCount),
    moqLots: divisibility.kind === 'divisible' ? divisibility.minSplit : num(v.moqLots),
    divisibility,
    condition: v.condition as LotCondition,
    productionDate: isoAtNoon(v.productionDate),
    expiryDate: isoAtNoon(v.expiryDate),
    status: v.status,
    cityId: v.cityId,
    warehouseLabel: v.warehouseLabel.trim(),
    certificateFile: v.certificateFile || undefined,
  }
}
