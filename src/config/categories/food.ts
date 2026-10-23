import type { CategoryConfig, LogisticsProfile } from '@/types/models'

const coldChain = (maxKm: number, maxHours: number, temp: { min: number; max: number }): LogisticsProfile => ({
  deliveryModes: ['pickup', 'truck', 'cold_chain'],
  coldChain: true,
  heavyFreight: false,
  bulk: false,
  timeLimited: true,
  maxDeliveryKm: maxKm,
  maxDeliveryHours: maxHours,
  storageTempC: temp,
  incoterms: ['EXW', 'DAP'],
  shippingEstimateEUR: { base: 90, perKm: 1.9, loadSize: 20 },
})

export const freshProduce: CategoryConfig = {
  slug: 'fresh-produce',
  icon: 'Apple',
  perishable: true,
  allowedUnits: ['kg', 't', 'crate', 'pallet'],
  defaultUnit: 'kg',
  lots: { allowedSaleModes: ['measure', 'lot'], lotTypes: ['pallet', 'crate', 'truckload', 'mixed'], requiresExpiry: true, requiresBatch: false, requiresCertificate: false },
  certifications: ['organic', 'pgi', 'pdo', 'globalgap', 'haccp'],
  logistics: { ...coldChain(650, 30, { min: 2, max: 10 }), coldChain: false },
  attributes: [
    { key: 'variety', type: 'text', filterable: false, showOnCard: true, searchable: true },
    { key: 'origin', type: 'enum', options: ['RO', 'DE', 'HU', 'NL', 'IT', 'PL', 'BG', 'ES'], display: 'region', filterable: true },
    { key: 'qualityClass', type: 'enum', options: ['extra', 'class_i', 'class_ii'], display: 'translate', filterable: true, showOnCard: true },
    { key: 'organic', type: 'boolean', filterable: true },
    { key: 'caliberMm', type: 'number', unit: 'mm', min: 10, max: 120, filterable: false },
    { key: 'storageTempC', type: 'number', unit: '°C', min: -2, max: 15, filterable: false },
    { key: 'packaging', type: 'enum', options: ['bulk', 'crate', 'carton', 'big_bag'], display: 'translate', filterable: true },
  ],
  children: [
    { slug: 'vegetables', children: [{ slug: 'greenhouse-vegetables' }, { slug: 'leafy-vegetables' }, { slug: 'brassicas' }, { slug: 'root-vegetables' }] },
    { slug: 'fruit', children: [{ slug: 'pome-fruit' }, { slug: 'stone-fruit' }, { slug: 'berries' }, { slug: 'grapes' }, { slug: 'melons' }] },
  ],
}

export const dairy: CategoryConfig = {
  slug: 'dairy',
  icon: 'Milk',
  perishable: true,
  allowedUnits: ['kg', 'l', 'crate', 'pallet'],
  defaultUnit: 'kg',
  lots: { allowedSaleModes: ['measure', 'lot'], lotTypes: ['pallet', 'crate', 'mixed'], requiresExpiry: true, requiresBatch: true, requiresCertificate: false },
  certifications: ['organic', 'pdo', 'pgi', 'halal', 'haccp', 'ifs'],
  logistics: coldChain(900, 48, { min: 2, max: 6 }),
  attributes: [
    { key: 'milkType', type: 'enum', options: ['cow', 'sheep', 'goat', 'buffalo'], display: 'translate', filterable: true, showOnCard: true },
    { key: 'fatContentPct', type: 'number', unit: '%', min: 0, max: 85, step: 0.1, filterable: true, showOnCard: true },
    { key: 'pasteurized', type: 'boolean', filterable: true },
    { key: 'organic', type: 'boolean', filterable: true },
    { key: 'ripeningDays', type: 'number', unit: 'd', min: 0, max: 720, filterable: false },
    { key: 'storageTempC', type: 'number', unit: '°C', min: -20, max: 8, filterable: false },
  ],
  children: [{ slug: 'milk-cream' }, { slug: 'cheese' }, { slug: 'butter-yogurt' }],
}

export const meat: CategoryConfig = {
  slug: 'meat',
  icon: 'Beef',
  perishable: true,
  allowedUnits: ['kg', 't', 'crate', 'pallet'],
  defaultUnit: 'kg',
  lots: { allowedSaleModes: ['measure', 'lot'], lotTypes: ['pallet', 'crate', 'container'], requiresExpiry: true, requiresBatch: true, requiresCertificate: false },
  certifications: ['organic', 'halal', 'haccp', 'ifs', 'pgi'],
  logistics: coldChain(700, 36, { min: 0, max: 4 }),
  attributes: [
    { key: 'species', type: 'enum', options: ['pork', 'beef', 'poultry', 'lamb'], display: 'translate', filterable: true, showOnCard: true },
    { key: 'cut', type: 'enum', options: ['carcass', 'half_carcass', 'primal', 'retail_cut', 'minced'], display: 'translate', filterable: true, showOnCard: true },
    { key: 'state', type: 'enum', options: ['chilled', 'frozen'], display: 'translate', filterable: true },
    { key: 'organic', type: 'boolean', filterable: true },
    { key: 'storageTempC', type: 'number', unit: '°C', min: -25, max: 4, filterable: false },
  ],
  children: [{ slug: 'pork' }, { slug: 'beef' }, { slug: 'poultry' }],
}
