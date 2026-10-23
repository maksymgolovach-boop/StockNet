import type { Category, CategoryConfig, CategoryNodeConfig, LogisticsProfile } from '@/types/models'
import { dairy, freshProduce, meat } from './food'
import { aggregates, cables, concrete, metals, plastics, timber } from './industrial'
import { agriMachinery, agroInputs } from './agriculture'
import { ACTIVE_ROOT_CATEGORIES } from '../scope'

/**
 * The category registry. To add a category: create a CategoryConfig, append it here,
 * add its translation keys (categories, attributes, enums) to every locale file.
 * No UI code changes are needed.
 */
export const ALL_CATEGORY_CONFIGS: readonly CategoryConfig[] = [
  agriMachinery,
  agroInputs,
  freshProduce,
  dairy,
  meat,
  metals,
  cables,
  concrete,
  aggregates,
  timber,
  plastics,
]

export const CATEGORY_CONFIGS: readonly CategoryConfig[] = ALL_CATEGORY_CONFIGS.filter((c) => ACTIVE_ROOT_CATEGORIES.includes(c.slug))

const configBySlug = new Map<string, CategoryConfig>(ALL_CATEGORY_CONFIGS.map((c) => [c.slug, c]))
const nodes = new Map<string, Category>()
const nodeOverrides = new Map<string, Partial<LogisticsProfile>>()

function register(node: CategoryNodeConfig, root: CategoryConfig, parent: Category | null, inherited: Partial<LogisticsProfile>) {
  const level = (parent ? parent.level + 1 : 1) as Category['level']
  const path = parent ? [...parent.path, node.slug] : [node.slug]
  const merged = { ...inherited, ...(node.logistics ?? {}) }
  const category: Category = {
    slug: node.slug,
    rootSlug: root.slug,
    parentSlug: parent?.slug ?? null,
    level,
    path,
    childSlugs: (node.children ?? []).map((c) => c.slug),
    icon: root.icon,
  }
  if (nodes.has(node.slug)) throw new Error(`Duplicate category slug: ${node.slug}`)
  nodes.set(node.slug, category)
  nodeOverrides.set(node.slug, merged)
  for (const child of node.children ?? []) register(child, root, category, merged)
}

for (const root of ALL_CATEGORY_CONFIGS) register(root, root, null, {})

export const ROOT_CATEGORY_SLUGS = CATEGORY_CONFIGS.map((c) => c.slug)

const isActive = (node: Category | undefined): node is Category => !!node && ACTIVE_ROOT_CATEGORIES.includes(node.rootSlug)

export function isActiveRoot(slug: string): boolean {
  return ACTIVE_ROOT_CATEGORIES.includes(slug)
}

export function getCategory(slug: string): Category | undefined {
  const node = nodes.get(slug)
  return isActive(node) ? node : undefined
}

export function getAnyCategory(slug: string): Category | undefined {
  return nodes.get(slug)
}

export function getAllCategories(): Category[] {
  return [...nodes.values()].filter(isActive)
}

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  const node = nodes.get(slug)
  return node ? configBySlug.get(node.rootSlug) : undefined
}

/** Category logistics with every subcategory override along the path applied. */
export function getLogisticsFor(slug: string): LogisticsProfile | undefined {
  const config = getCategoryConfig(slug)
  if (!config) return undefined
  return { ...config.logistics, ...(nodeOverrides.get(slug) ?? {}) }
}

/** The slug itself plus every descendant slug. */
export function getDescendantSlugs(slug: string): string[] {
  const node = getCategory(slug)
  if (!node) return []
  return [slug, ...node.childSlugs.flatMap(getDescendantSlugs)]
}

export function getCategoryChildren(slug: string | null): Category[] {
  if (slug === null) return ROOT_CATEGORY_SLUGS.map((s) => nodes.get(s)).filter((c): c is Category => !!c)
  const node = getCategory(slug)
  return node ? node.childSlugs.map((s) => nodes.get(s)).filter((c): c is Category => !!c) : []
}
