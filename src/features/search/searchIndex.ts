import Fuse from 'fuse.js'
import type { Producer, Product } from '@/types/models'
import { CERTIFICATIONS } from '@/config/certifications'
import { getAllCategories, getCategory } from '@/config/categories'
import { LANGUAGES, LANGUAGE_CODES } from '@/config/languages'
import { hasDigit, normalize, tokenize } from './normalize'

interface Doc {
  id: string
  name: string
  keywords: string
  specs: string
  category: string
  producer: string
  all: string
}

const FIELD_PENALTY: Record<Exclude<keyof Doc, 'id' | 'all'>, number> = {
  name: 0,
  keywords: 0.04,
  specs: 0.06,
  category: 0.12,
  producer: 0.18,
}

function categoryNames(slug: string): string[] {
  return LANGUAGE_CODES.map((l) => {
    const cats = LANGUAGES[l].resources.categories as Record<string, string>
    return cats[slug] ?? slug
  })
}

function productDoc(p: Product, producer: Producer | undefined): Doc {
  const names = [p.name, ...Object.values(p.mockTranslations).map((t) => t?.name ?? '')]
  const specs = [
    ...Object.values(p.attributes).filter((v) => typeof v === 'string'),
    ...p.certifications.map((c) => CERTIFICATIONS[c].label),
  ]
  const path = getCategory(p.categorySlug)?.path ?? [p.categorySlug]
  const doc = {
    id: p.id,
    name: normalize(names.join(' | ')),
    keywords: normalize(p.keywords.join(' | ')),
    specs: normalize(specs.join(' | ')),
    category: normalize(path.flatMap(categoryNames).join(' | ')),
    producer: normalize(producer ? `${producer.name} ${producer.address.city}` : ''),
  }
  return { ...doc, all: [doc.name, doc.keywords, doc.specs, doc.category, doc.producer].join(' | ') }
}

const wordStart = (text: string, token: string) => new RegExp(`(^|[^a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)

function exactScore(doc: Doc, token: string, wordOnly: boolean): number | null {
  for (const field of Object.keys(FIELD_PENALTY) as (keyof typeof FIELD_PENALTY)[]) {
    const text = doc[field]
    const hit = wordOnly ? wordStart(text, token) : text.includes(token)
    if (hit) return FIELD_PENALTY[field] + (wordStart(text, token) ? 0 : 0.05)
  }
  return null
}

/**
 * Hybrid matcher: tokens containing digits ("S355", "C25/30", "3x2.5", "10025") must match
 * exactly; short words must match a word start; longer words fall back to Fuse fuzzy matching
 * for typo tolerance. Every token must match; the phrase as a whole earns a bonus.
 */
export class ProductSearchIndex {
  private docs: Doc[]
  private fuse: Fuse<Doc>

  constructor(products: Product[], producers: Producer[]) {
    const byId = new Map(producers.map((p) => [p.id, p]))
    this.docs = products.map((p) => productDoc(p, byId.get(p.producerId)))
    this.fuse = new Fuse(this.docs, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'keywords', weight: 2 },
        { name: 'specs', weight: 2 },
        { name: 'category', weight: 1 },
        { name: 'producer', weight: 1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 3,
    })
  }

  /** productId → score (0 best, 1 worst); an empty query returns null (no text constraint). */
  search(query: string): Map<string, number> | null {
    const tokens = tokenize(query)
    if (!tokens.length) return null
    const phrase = normalize(query)
    const perToken = tokens.map((token) => {
      const scores = new Map<string, number>()
      const exactOnly = hasDigit(token) || token.length <= 2
      for (const doc of this.docs) {
        const s = exactScore(doc, token, token.length <= 2 && !hasDigit(token))
        if (s !== null) scores.set(doc.id, s)
      }
      if (!exactOnly && scores.size < 3) {
        for (const r of this.fuse.search(token)) {
          const fuzzy = 0.25 + (r.score ?? 1) * 0.75
          const prev = scores.get(r.item.id)
          if (prev === undefined || fuzzy < prev) scores.set(r.item.id, fuzzy)
        }
      }
      return scores
    })
    const result = new Map<string, number>()
    const [first, ...rest] = perToken
    if (!first) return result
    for (const [id, s0] of first) {
      let total = s0
      let ok = true
      for (const m of rest) {
        const s = m.get(id)
        if (s === undefined) {
          ok = false
          break
        }
        total += s
      }
      if (!ok) continue
      let score = total / perToken.length
      const doc = this.docs.find((d) => d.id === id)
      if (doc && tokens.length > 1 && doc.all.includes(phrase)) score *= 0.5
      result.set(id, Math.min(1, score))
    }
    return result
  }
}

export function searchCategories(query: string): string[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const docs = getAllCategories().map((c) => ({ slug: c.slug, text: normalize(categoryNames(c.slug).join(' | ')), level: c.level }))
  const fuse = new Fuse(docs, { keys: ['text'], threshold: 0.3, ignoreLocation: true, includeScore: true, minMatchCharLength: 3 })
  const exact = docs.filter((d) => tokens.every((t) => d.text.includes(t)))
  const fuzzy = !exact.length && tokens.length === 1 && !hasDigit(tokens[0] ?? '') ? fuse.search(tokens[0] ?? '').map((r) => r.item) : []
  return [...new Set([...exact, ...fuzzy].sort((a, b) => a.level - b.level).map((d) => d.slug))]
}

export function searchProducers(producers: Producer[], query: string): Producer[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const docs = producers.map((p) => ({ p, text: normalize(`${p.name} ${p.legalName} ${p.address.city}`) }))
  const exact = docs.filter((d) => tokens.every((t) => d.text.includes(t))).map((d) => d.p)
  if (exact.length) return exact
  const fuse = new Fuse(docs, { keys: ['text'], threshold: 0.3, ignoreLocation: true, minMatchCharLength: 3 })
  return tokens.length === 1 ? fuse.search(tokens[0] ?? '').map((r) => r.item.p) : []
}
