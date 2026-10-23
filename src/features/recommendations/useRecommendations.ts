import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useSaved } from '@/features/saved/savedStore'
import { useSearchHistory } from '@/features/search/searchHistoryStore'
import { useDisplayCurrency, usePreferences } from '@/features/settings/preferencesStore'
import { searchService } from '@/services/searchService'

export function useRecommendations(limit = 12) {
  const location = usePreferences((s) => s.location.point)
  const tuning = usePreferences((s) => s.recommendations)
  const displayCurrency = useDisplayCurrency()
  const role = useDevStore((s) => s.role)
  const partyId = useActorId()
  const recentSearches = useSearchHistory((s) => s.recent)
  const savedProductIds = useSaved((s) => s.productIds)
  const savedProducerIds = useSaved((s) => s.producerIds)
  return useQuery({
    queryKey: ['recommendations', location, tuning, displayCurrency, role, partyId, recentSearches, savedProductIds, savedProducerIds, limit],
    queryFn: () => searchService.recommend({ location, displayCurrency, role, partyId }, { tuning, recentSearches, savedProductIds, savedProducerIds, limit }),
    enabled: role === 'buyer',
    placeholderData: keepPreviousData,
  })
}
