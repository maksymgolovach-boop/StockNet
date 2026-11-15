import type { Company } from '@/types/models'
import type { CompanyIds } from '@/domain/company'
import { currentCompany } from '@/mocks/companies'

/** The logged-in company. The demo has one fixed account; with a real back-end this comes from the sign-in. */
export function useCompany(): Company {
  return currentCompany
}

/** The company's party ids, used to derive sides. */
export function useCompanyIds(): CompanyIds {
  return { buyerId: currentCompany.buyerId, producerId: currentCompany.producerId }
}

/** True when the producer is the logged-in company's own seller identity. */
export function useIsOwnProducer(producerId: string | undefined): boolean {
  return !!producerId && producerId === currentCompany.producerId
}
