import { readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const clashes: string[] = []
function walk(dir: string) {
  const seen = new Map<string, string>()
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      walk(full)
      continue
    }
    const key = name.slice(0, name.length - extname(name).length).toLowerCase()
    const prev = seen.get(key)
    if (prev) clashes.push(`${dir}: ${prev} ↔ ${name}`)
    else seen.set(key, name)
  }
}
walk('src')
if (clashes.length) {
  console.error(`Case-insensitive module name clashes (break on Windows/macOS):\n${clashes.join('\n')}`)
  process.exit(1)
}
console.log('OK — no case-insensitive module name clashes')
