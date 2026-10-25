import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCompanyIds } from '@/features/dev/devStore'
import { useDisplayCurrency, usePreferences } from '@/features/settings/preferencesStore'
import { searchService } from '@/services/searchService'
import type { SearchParams } from './types'

export function useSearchResults(params: SearchParams) {
  const location = usePreferences((s) => s.location.point)
  const displayCurrency = useDisplayCurrency()
  const { buyerId } = useCompanyIds()
  return useQuery({
    queryKey: ['search', params, location, displayCurrency, 'buyer', buyerId],
    queryFn: () => searchService.search(params, { location, displayCurrency, role: 'buyer', partyId: buyerId }),
    placeholderData: keepPreviousData,
  })
}
