import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCompanyIds } from '@/features/dev/devStore'
import { useSaved } from '@/features/saved/savedStore'
import { useSearchHistory } from '@/features/search/searchHistoryStore'
import { useDisplayCurrency, usePreferences } from '@/features/settings/preferencesStore'
import { searchService } from '@/services/searchService'

export function useRecommendations(limit = 12) {
  const location = usePreferences((s) => s.location.point)
  const tuning = usePreferences((s) => s.recommendations)
  const displayCurrency = useDisplayCurrency()
  const { buyerId } = useCompanyIds()
  const recentSearches = useSearchHistory((s) => s.recent)
  const savedProductIds = useSaved((s) => s.productIds)
  const savedProducerIds = useSaved((s) => s.producerIds)
  return useQuery({
    queryKey: ['recommendations', location, tuning, displayCurrency, 'buyer', buyerId, recentSearches, savedProductIds, savedProducerIds, limit],
    queryFn: () => searchService.recommend({ location, displayCurrency, role: 'buyer', partyId: buyerId }, { tuning, recentSearches, savedProductIds, savedProducerIds, limit }),
    placeholderData: keepPreviousData,
  })
}
