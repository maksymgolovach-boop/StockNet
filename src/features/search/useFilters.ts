import { useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { AttributeFilterValue, Filters, SortOption } from '@/types/models'
import { getCategoryConfig } from '@/config/categories'
import { PAGE_SIZE, emptyFilters, parseSearchState, serializeSearchState, type MapUrlState, type SearchState } from './filtersCodec'
import type { ResultsView } from './types'

/**
 * Search state lives entirely in the URL: /category/:slug carries the category, the query
 * string carries everything else. Every update pushes a history entry so Back works.
 */
export function useFilters() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const state = useMemo(() => parseSearchState(params, slug), [params, slug])

  const commit = useCallback(
    (next: SearchState, { replace = false } = {}) => {
      const category = next.filters.category
      const qs = serializeSearchState(next, !!category).toString()
      const path = category ? `/category/${category}` : '/search'
      navigate(`${path}${qs ? `?${qs}` : ''}`, { replace })
    },
    [navigate],
  )

  const setFilters = useCallback(
    (patch: Partial<Filters>) => {
      const filters = { ...state.filters, ...patch }
      if (patch.category !== undefined || 'category' in patch) {
        const config = filters.category ? getCategoryConfig(filters.category) : undefined
        const keep = new Set(config?.attributes.filter((a) => a.filterable).map((a) => a.key) ?? [])
        filters.attributes = Object.fromEntries(Object.entries(filters.attributes).filter(([k]) => keep.has(k)))
        if (!config?.perishable) filters.expiry = undefined
        if (config?.perishable) filters.leadTime = undefined
      }
      const sort = state.sort === 'expiry' && filters.category && !getCategoryConfig(filters.category)?.perishable ? 'relevance' : state.sort
      commit({ ...state, filters, sort, limit: PAGE_SIZE, map: { ...state.map, bounds: undefined } })
    },
    [state, commit],
  )

  const setAttribute = useCallback(
    (key: string, value: AttributeFilterValue | undefined) => {
      const attributes = { ...state.filters.attributes }
      if (value === undefined) delete attributes[key]
      else attributes[key] = value
      setFilters({ attributes })
    },
    [state.filters.attributes, setFilters],
  )

  return {
    ...state,
    setFilters,
    setAttribute,
    setSort: (sort: SortOption) => commit({ ...state, sort }),
    setView: (view: ResultsView) => commit({ ...state, view }),
    showMore: () => commit({ ...state, limit: state.limit + PAGE_SIZE }, { replace: true }),
    clearAll: () =>
      commit({ ...state, filters: { ...emptyFilters(), q: state.filters.q, category: state.filters.category }, limit: PAGE_SIZE, map: { ...state.map, bounds: undefined } }),
    /** Map viewport changes replace the history entry; applying an area pushes one. */
    setMap: (patch: Partial<MapUrlState>, { replace = true } = {}) =>
      commit({ ...state, map: { ...state.map, ...patch }, limit: 'bounds' in patch ? PAGE_SIZE : state.limit }, { replace }),
  }
}

export type FiltersApi = ReturnType<typeof useFilters>
