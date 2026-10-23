import type { AttributeFilterValue, ExpiryPreset, Filters, GeoBounds, GeoPoint, LeadTimePreset, LotCondition, SaleModeFilter, SortOption, VerificationLevel } from '@/types/models'
import { getCategory, getCategoryConfig } from '@/config/categories'
import { isCertificationCode, type CertificationCode } from '@/config/certifications'
import { UNIT_CODES, type UnitCode } from '@/config/units'
import type { ResultsView } from './types'

export const SORT_OPTIONS: SortOption[] = ['relevance', 'price_asc', 'price_desc', 'normalized_asc', 'lot_price_asc', 'distance', 'expiry', 'availability', 'newest', 'rating', 'trust']
export const SALE_MODE_FILTERS: SaleModeFilter[] = ['measure', 'lot', 'both']
export const LOT_CONDITIONS: LotCondition[] = ['new', 'surplus', 'clearance', 'b_grade', 'returned']
export const EXPIRY_PRESETS: ExpiryPreset[] = ['lt7', 'lt30', 'gt30']
export const LEAD_TIME_PRESETS: LeadTimePreset[] = ['immediate', 'lt1w', 'lt1m', 'made_to_order']
const LEVELS: VerificationLevel[] = ['unverified', 'identity', 'verified', 'audited']

export const PAGE_SIZE = 24

export function emptyFilters(): Filters {
  return {
    q: '',
    countries: [],
    certifications: [],
    inStock: false,
    deliveryAvailable: false,
    pastPartnersOnly: false,
    validCertsOnly: false,
    indivisibleOnly: false,
    lotConditions: [],
    attributes: {},
  }
}

export interface MapUrlState {
  center?: GeoPoint
  zoom?: number
  /** active "search this area" restriction */
  bounds?: GeoBounds
  searchAsMove: boolean
}

export interface SearchState {
  filters: Filters
  sort: SortOption
  view: ResultsView
  limit: number
  map: MapUrlState
}

const round = (n: number, d = 4) => Number(n.toFixed(d))

function parseMap(params: URLSearchParams): MapUrlState {
  const c = (params.get('c') ?? '').split(',').map(Number)
  const b = (params.get('b') ?? '').split(',').map(Number)
  const zoom = num(params.get('z'))
  const center = c.length === 2 && c.every(Number.isFinite) ? { lat: c[0] as number, lng: c[1] as number } : undefined
  const bounds = b.length === 4 && b.every(Number.isFinite) ? { south: b[0] as number, west: b[1] as number, north: b[2] as number, east: b[3] as number } : undefined
  return { center, zoom: zoom !== undefined && zoom >= 2 && zoom <= 18 ? zoom : undefined, bounds, searchAsMove: params.get('move') === '1' }
}

const num = (v: string | null) => {
  if (v === null || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])
const range = (v: string | null) => {
  const [lo, hi] = (v ?? '').split('..')
  return [num(lo ?? null), num(hi ?? null)] as const
}
const isoDay = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)
const oneOf = <T extends string>(v: string | null, options: readonly T[]) => (options as readonly string[]).includes(v ?? '') ? (v as T) : undefined

/** Attribute filters are only kept when the active category defines that attribute as filterable. */
function parseAttributes(params: URLSearchParams, category: string | undefined): Record<string, AttributeFilterValue> {
  const config = category ? getCategoryConfig(category) : undefined
  const out: Record<string, AttributeFilterValue> = {}
  if (!config) return out
  for (const def of config.attributes) {
    const raw = params.get(`a.${def.key}`)
    if (!def.filterable || raw === null || raw === '') continue
    if (def.type === 'number') {
      const [lo, hi] = raw.split('..')
      const min = num(lo ?? null)
      const max = num(hi ?? null)
      if (min !== undefined || max !== undefined) out[def.key] = { kind: 'range', min, max }
    } else if (def.type === 'enum') {
      const values = list(raw).filter((v) => def.options.includes(v))
      if (values.length) out[def.key] = { kind: 'enum', values }
    } else if (def.type === 'boolean') {
      out[def.key] = { kind: 'boolean', value: raw === '1' }
    } else {
      out[def.key] = { kind: 'text', value: raw }
    }
  }
  return out
}

export function parseSearchState(params: URLSearchParams, categoryFromPath?: string): SearchState {
  const rawCategory = categoryFromPath ?? (params.get('cat') || undefined)
  const category = rawCategory && getCategory(rawCategory) ? rawCategory : undefined
  const [lotSizeMin, lotSizeMax] = range(params.get('lsize'))
  const [lotPriceMin, lotPriceMax] = range(params.get('lprice'))
  const [producedFrom, producedTo] = (params.get('prod') ?? '').split('..')
  const filters: Filters = {
    q: params.get('q') ?? '',
    category,
    countries: list(params.get('country')),
    radiusKm: ((r) => (r === undefined ? undefined : Math.min(Math.max(r, 0), 1000)))(num(params.get('radius'))),
    priceMin: num(params.get('pmin')),
    priceMax: num(params.get('pmax')),
    priceUnit: oneOf(params.get('punit'), UNIT_CODES) as UnitCode | undefined,
    certifications: list(params.get('cert')).filter(isCertificationCode) as CertificationCode[],
    moqMax: num(params.get('moq')),
    minRating: num(params.get('rating')),
    inStock: params.get('stock') === '1',
    deliveryAvailable: params.get('delivery') === '1',
    verificationMin: oneOf(params.get('ver'), LEVELS),
    minTrust: num(params.get('trust')),
    pastPartnersOnly: params.get('partners') === '1',
    validCertsOnly: params.get('validcerts') === '1',
    expiry: oneOf(params.get('exp'), EXPIRY_PRESETS),
    leadTime: oneOf(params.get('lead'), LEAD_TIME_PRESETS),
    saleMode: oneOf(params.get('mode'), SALE_MODE_FILTERS),
    lotSizeMin,
    lotSizeMax,
    lotPriceMin,
    lotPriceMax,
    lotsAvailableMin: num(params.get('lots')),
    indivisibleOnly: params.get('indiv') === '1',
    lotConditions: list(params.get('lcond')).filter((c): c is LotCondition => (LOT_CONDITIONS as string[]).includes(c)),
    producedFrom: isoDay(producedFrom),
    producedTo: isoDay(producedTo),
    attributes: parseAttributes(params, category),
  }
  return {
    filters,
    sort: oneOf(params.get('sort'), SORT_OPTIONS) ?? 'relevance',
    view: params.get('view') === 'grid' ? 'grid' : params.get('view') === 'map' ? 'map' : 'list',
    limit: Math.max(PAGE_SIZE, num(params.get('limit')) ?? PAGE_SIZE),
    map: parseMap(params),
  }
}

export function serializeSearchState(state: SearchState, categoryInPath: boolean): URLSearchParams {
  const { filters: f } = state
  const p = new URLSearchParams()
  const set = (k: string, v: string | number | undefined | false) => {
    if (v !== undefined && v !== false && v !== '') p.set(k, String(v))
  }
  set('q', f.q.trim())
  if (!categoryInPath) set('cat', f.category)
  set('country', f.countries.join(','))
  set('radius', f.radiusKm)
  set('pmin', f.priceMin)
  set('pmax', f.priceMax)
  set('punit', f.priceUnit)
  set('cert', f.certifications.join(','))
  set('moq', f.moqMax)
  set('rating', f.minRating)
  set('stock', f.inStock && '1')
  set('delivery', f.deliveryAvailable && '1')
  set('ver', f.verificationMin)
  set('trust', f.minTrust)
  set('partners', f.pastPartnersOnly && '1')
  set('validcerts', f.validCertsOnly && '1')
  set('exp', f.expiry)
  set('lead', f.leadTime)
  set('mode', f.saleMode)
  if (f.lotSizeMin !== undefined || f.lotSizeMax !== undefined) set('lsize', `${f.lotSizeMin ?? ''}..${f.lotSizeMax ?? ''}`)
  if (f.lotPriceMin !== undefined || f.lotPriceMax !== undefined) set('lprice', `${f.lotPriceMin ?? ''}..${f.lotPriceMax ?? ''}`)
  set('lots', f.lotsAvailableMin)
  set('indiv', f.indivisibleOnly && '1')
  set('lcond', f.lotConditions.join(','))
  if (f.producedFrom || f.producedTo) set('prod', `${f.producedFrom ?? ''}..${f.producedTo ?? ''}`)
  for (const [key, v] of Object.entries(f.attributes)) {
    if (v.kind === 'range') set(`a.${key}`, `${v.min ?? ''}..${v.max ?? ''}`)
    else if (v.kind === 'enum') set(`a.${key}`, v.values.join(','))
    else if (v.kind === 'boolean') set(`a.${key}`, v.value ? '1' : '0')
    else set(`a.${key}`, v.value)
  }
  if (state.sort !== 'relevance') set('sort', state.sort)
  if (state.view !== 'list') set('view', state.view)
  if (state.limit > PAGE_SIZE) set('limit', state.limit)
  const m = state.map
  if (m.center && m.zoom !== undefined) {
    set('c', `${round(m.center.lat)},${round(m.center.lng)}`)
    set('z', m.zoom)
  }
  if (m.bounds) set('b', [m.bounds.south, m.bounds.west, m.bounds.north, m.bounds.east].map((v) => round(v)).join(','))
  set('move', m.searchAsMove && '1')
  return p
}

/** Number of user-set constraints (for the mobile "Filters (n)" button). */
export function activeFilterCount(f: Filters): number {
  const flags = [f.inStock, f.deliveryAvailable, f.pastPartnersOnly, f.validCertsOnly, f.indivisibleOnly].filter(Boolean).length
  const scalars = [
    f.radiusKm,
    f.priceMin ?? f.priceMax,
    f.moqMax,
    f.minRating,
    f.verificationMin,
    f.minTrust,
    f.expiry,
    f.leadTime,
    f.saleMode,
    f.lotSizeMin ?? f.lotSizeMax,
    f.lotPriceMin ?? f.lotPriceMax,
    f.lotsAvailableMin,
    f.producedFrom ?? f.producedTo,
  ].filter((v) => v !== undefined).length
  return flags + scalars + f.countries.length + f.certifications.length + f.lotConditions.length + Object.keys(f.attributes).length
}
