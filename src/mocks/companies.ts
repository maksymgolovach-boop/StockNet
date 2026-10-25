import type { Company } from '@/types/models'

export const CURRENT_COMPANY_ID = 'co01'
export const COMPANY_SEEDS: Company[] = [
  {
    id: CURRENT_COMPANY_ID,
    name: 'Câmpia Moldovei Agro',
    legalName: 'Câmpia Moldovei Agro SRL',
    buyerId: 'b07',
    producerId: 'p01',
    brandHue: 96,
  },
]
export const currentCompany = COMPANY_SEEDS.find((c) => c.id === CURRENT_COMPANY_ID) as Company

/** True when the buyer and the producer belong to the same company (a company cannot trade with itself). */
export const isSameCompany = (buyerId: string, producerId: string) => COMPANY_SEEDS.some((c) => c.buyerId === buyerId && c.producerId === producerId)
