import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { searchService } from '@/services/searchService'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useSearchHistory } from './searchHistoryStore'

export type SuggestionGroup = 'recent' | 'products' | 'categories' | 'producers' | 'all'

export interface SuggestionOption {
  id: string
  group: SuggestionGroup
  label: string
  meta?: string
  to: string
  query?: string
}

const searchUrl = (q: string) => `/search?q=${encodeURIComponent(q)}`

/** Builds the flat, grouped option list for the autosuggest combobox (250 ms debounce). */
export function useSuggestionOptions(value: string) {
  const { t } = useTranslation()
  const recent = useSearchHistory((s) => s.recent)
  const debounced = useDebouncedValue(value.trim(), 250)
  const enabled = debounced.length >= 2
  const { data, isFetching, isError } = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () => searchService.suggest(debounced),
    enabled,
    staleTime: 5 * 60_000,
  })

  const options = useMemo<SuggestionOption[]>(() => {
    const q = value.trim()
    if (q.length < 2) return recent.map((r, i) => ({ id: `recent-${i}`, group: 'recent', label: r, to: searchUrl(r), query: r }))
    if (!data || !enabled) return [{ id: 'all', group: 'all', label: q, to: searchUrl(q), query: q }]
    return [
      ...data.products.map((p) => ({ id: `p-${p.id}`, group: 'products' as const, label: p.name, meta: p.producerName, to: `/product/${p.id}` })),
      ...data.categories.map((c) => ({
        id: `c-${c.slug}`,
        group: 'categories' as const,
        label: t(`categories.${c.slug}`),
        meta: t('common.products', { count: c.productCount }),
        to: `/category/${c.slug}`,
      })),
      ...data.producers.map((p) => ({ id: `r-${p.id}`, group: 'producers' as const, label: p.name, meta: `${p.city}, ${p.country}`, to: `/producer/${p.id}` })),
      { id: 'all', group: 'all' as const, label: q, to: searchUrl(q), query: q },
    ]
  }, [value, recent, data, enabled, t])

  return { options, loading: isFetching && enabled, error: isError }
}
