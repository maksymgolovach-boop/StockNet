import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useDisplayCurrency, usePreferences } from '@/features/settings/preferencesStore'
import { searchService } from '@/services/searchService'
import type { SearchParams } from './types'

export function useSearchResults(params: SearchParams) {
  const location = usePreferences((s) => s.location.point)
  const displayCurrency = useDisplayCurrency()
  const role = useDevStore((s) => s.role)
  const partyId = useActorId()
  return useQuery({
    queryKey: ['search', params, location, displayCurrency, role, partyId],
    queryFn: () => searchService.search(params, { location, displayCurrency, role, partyId }),
    placeholderData: keepPreviousData,
  })
}
