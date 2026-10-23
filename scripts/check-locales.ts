import en from '../src/locales/en.json'
import de from '../src/locales/de.json'
import ro from '../src/locales/ro.json'
import { ALL_CATEGORY_CONFIGS, getAnyCategory } from '../src/config/categories'
import { UNIT_CODES } from '../src/config/units'
import { CURRENCY_CODES } from '../src/config/currencies'
import { CERTIFICATIONS } from '../src/config/certifications'

type Tree = { [k: string]: string | Tree }
const flatten = (t: Tree, p = ''): string[] => Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [p + k] : flatten(v, `${p}${k}.`)))
const PLURAL = /_(zero|one|two|few|many|other)$/
const locales: Record<string, Tree> = { en, de, ro }
const required: Record<string, string[]> = { en: ['one', 'other'], de: ['one', 'other'], ro: ['one', 'few', 'other'] }
const issues: string[] = []

const sets = Object.fromEntries(Object.entries(locales).map(([l, t]) => [l, new Set(flatten(t))]))
const baseKeys = new Set([...sets.en!].map((k) => k.replace(PLURAL, '')))
for (const [lang, keys] of Object.entries(sets)) {
  const stripped = new Set([...keys].map((k) => k.replace(PLURAL, '')))
  for (const k of baseKeys) if (!stripped.has(k)) issues.push(`${lang}: missing ${k}`)
  for (const k of stripped) if (!baseKeys.has(k)) issues.push(`${lang}: extra key ${k}`)
  const plurals = new Set([...keys].filter((k) => PLURAL.test(k)).map((k) => k.replace(PLURAL, '')))
  for (const base of plurals) for (const form of required[lang]!) if (!keys.has(`${base}_${form}`)) issues.push(`${lang}: ${base} lacks _${form}`)
}

const need = (key: string) => {
  for (const [lang, keys] of Object.entries(sets)) if (!keys.has(key)) issues.push(`${lang}: config-driven key missing ${key}`)
}
const walk = (slug: string): string[] => [slug, ...(getAnyCategory(slug)?.childSlugs ?? []).flatMap(walk)]
for (const c of ALL_CATEGORY_CONFIGS) for (const slug of walk(c.slug)) need(`categories.${slug}`)
for (const c of ALL_CATEGORY_CONFIGS) {
  need(`categoryBlurb.${c.slug}`)
  for (const a of c.attributes) {
    need(`attributes.${a.key}`)
    if (a.type === 'enum' && a.display === 'translate') for (const o of a.options) need(`enums.${a.key}.${o}`)
  }
}
for (const u of UNIT_CODES) need(`units.${u}`)
for (const c of CURRENCY_CODES) need(`currency.${c}`)
for (const [code, cfg] of Object.entries(CERTIFICATIONS)) if ('translatable' in cfg && cfg.translatable) need(`certs.${code}`)

console.log(`locale keys: en ${sets.en!.size}, de ${sets.de!.size}, ro ${sets.ro!.size}`)
if (issues.length) { console.error(issues.join('\n')); process.exit(1) }
console.log('OK — all locales complete, plural forms present, every config-driven key translated')
