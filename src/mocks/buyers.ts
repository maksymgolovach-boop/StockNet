import type { Buyer } from '@/types/models'
import { cityById } from './cities'

interface BuyerSeed extends Omit<Buyer, 'address' | 'location' | 'completedDeals' | 'verification'> {
  cityId: string
  street: string
  verification: Buyer['verification']
}

export const CURRENT_BUYER_ID = 'b07'

const SEEDS: BuyerSeed[] = [
  {
    id: 'b01', name: 'Constructorul Transilvan', legalName: 'Constructorul Transilvan SA', type: 'contractor',
    cityId: 'ro-cluj-napoca', street: 'Str. Fabricii de Zahăr 23', memberSince: '2022-11-14T00:00:00Z',
    verification: { level: 'verified', checks: [
      { kind: 'company_registry', checkedAt: '2022-11-15T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2022-11-15T00:00:00Z', by: 'EU VIES' },
      { kind: 'documents', checkedAt: '2022-11-28T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'site_information', checkedAt: '2023-01-12T00:00:00Z', by: 'Stocknet Field Team' },
    ] },
    paymentReliability: 0.96, avgPaymentDays: 27,
    preferredCategories: ['metals', 'concrete', 'cables', 'timber', 'aggregates'],
    typicalOrderEUR: { min: 8_000, max: 120_000 }, brandHue: 214,
  },
  {
    id: 'b02', name: 'Mega Proaspăt Retail', legalName: 'Mega Proaspăt Retail SRL', type: 'retailer',
    cityId: 'ro-bucuresti', street: 'Bd. Iuliu Maniu 7', memberSince: '2022-07-01T00:00:00Z',
    verification: { level: 'verified', checks: [
      { kind: 'company_registry', checkedAt: '2022-07-02T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2022-07-02T00:00:00Z', by: 'EU VIES' },
      { kind: 'documents', checkedAt: '2022-07-20T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'site_information', checkedAt: '2022-08-03T00:00:00Z', by: 'Stocknet Field Team' },
    ] },
    paymentReliability: 0.91, avgPaymentDays: 38,
    preferredCategories: ['fresh-produce', 'dairy', 'meat'], typicalOrderEUR: { min: 4_000, max: 40_000 }, brandHue: 120,
  },
  {
    id: 'b03', name: 'Rheinische Gastro Gruppe', legalName: 'Rheinische Gastro Gruppe GmbH', type: 'restaurant_chain',
    cityId: 'de-koln', street: 'Hohenzollernring 48', memberSince: '2022-05-18T00:00:00Z',
    verification: { level: 'identity', checks: [
      { kind: 'company_registry', checkedAt: '2022-05-19T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2022-05-19T00:00:00Z', by: 'EU VIES' },
    ] },
    paymentReliability: 0.98, avgPaymentDays: 14,
    preferredCategories: ['meat', 'dairy', 'fresh-produce'], typicalOrderEUR: { min: 2_000, max: 18_000 }, brandHue: 8,
  },
  {
    id: 'b04', name: 'Nordbau', legalName: 'Nordbau AG', type: 'contractor',
    cityId: 'de-hamburg', street: 'Billstraße 80', memberSince: '2022-02-09T00:00:00Z',
    verification: { level: 'audited', checks: [
      { kind: 'company_registry', checkedAt: '2022-02-10T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2022-02-10T00:00:00Z', by: 'EU VIES' },
      { kind: 'documents', checkedAt: '2022-02-25T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'site_information', checkedAt: '2022-03-10T00:00:00Z', by: 'Stocknet Field Team' },
      { kind: 'third_party_audit', checkedAt: '2025-03-01T00:00:00Z', by: 'TÜV Nord' },
    ] },
    paymentReliability: 0.99, avgPaymentDays: 21,
    preferredCategories: ['metals', 'concrete', 'timber', 'cables'], typicalOrderEUR: { min: 20_000, max: 400_000 }, brandHue: 230,
  },
  {
    id: 'b05', name: 'Alföld Wholesale', legalName: 'Alföld Wholesale Kft.', type: 'wholesaler',
    cityId: 'hu-debrecen', street: 'Balmazújvárosi út 12', memberSince: '2023-08-21T00:00:00Z',
    verification: { level: 'identity', checks: [
      { kind: 'company_registry', checkedAt: '2023-08-22T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2023-08-22T00:00:00Z', by: 'EU VIES' },
    ] },
    paymentReliability: 0.84, avgPaymentDays: 46,
    preferredCategories: ['fresh-produce', 'dairy', 'agro-inputs', 'agri-machinery'], typicalOrderEUR: { min: 6_000, max: 60_000 }, brandHue: 40,
  },
  {
    id: 'b06', name: 'ElectroMont Industries', legalName: 'ElectroMont Industries SA', type: 'manufacturer',
    cityId: 'ro-timisoara', street: 'Calea Buziașului 26', memberSince: '2023-01-30T00:00:00Z',
    verification: { level: 'verified', checks: [
      { kind: 'company_registry', checkedAt: '2023-01-31T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2023-01-31T00:00:00Z', by: 'EU VIES' },
      { kind: 'documents', checkedAt: '2023-02-14T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'site_information', checkedAt: '2023-03-02T00:00:00Z', by: 'Stocknet Field Team' },
    ] },
    paymentReliability: 0.93, avgPaymentDays: 33,
    preferredCategories: ['cables', 'metals', 'plastics'], typicalOrderEUR: { min: 10_000, max: 150_000 }, brandHue: 275,
  },
  {
    id: 'b07', name: 'Câmpia Moldovei Agro', legalName: 'Câmpia Moldovei Agro SRL', type: 'distributor',
    cityId: 'ro-iasi', street: 'Calea Chișinăului 45', memberSince: '2022-10-03T00:00:00Z',
    verification: { level: 'verified', checks: [
      { kind: 'company_registry', checkedAt: '2022-10-04T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'vat', checkedAt: '2022-10-04T00:00:00Z', by: 'EU VIES' },
      { kind: 'documents', checkedAt: '2022-10-19T00:00:00Z', by: 'Stocknet Compliance' },
      { kind: 'site_information', checkedAt: '2022-11-08T00:00:00Z', by: 'Stocknet Field Team' },
    ] },
    paymentReliability: 0.95, avgPaymentDays: 30,
    preferredCategories: ['agri-machinery', 'agro-inputs', 'fresh-produce'],
    typicalOrderEUR: { min: 3_000, max: 90_000 }, brandHue: 100,
  },
]

export const BUYER_SEEDS = SEEDS

export function buildBuyer(seed: BuyerSeed, completedDeals: number): Buyer {
  const city = cityById(seed.cityId)
  const { cityId: _cityId, street, ...rest } = seed
  return {
    ...rest,
    address: { street, postcode: city.postcode, city: city.name, region: city.region, country: city.country },
    location: { lat: city.point.lat + 0.008, lng: city.point.lng - 0.012 },
    completedDeals,
  }
}
