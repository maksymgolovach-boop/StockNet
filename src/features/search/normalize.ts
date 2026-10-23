const COMBINING = /[̀-ͯ]/g
const SPECIAL: Record<string, string> = { ß: 'ss', '×': 'x', '·': ' ', '–': '-', '—': '-', '„': '"', '“': '"', '”': '"', 'ı': 'i', 'ł': 'l', 'ø': 'o', 'æ': 'ae', 'œ': 'oe' }

function foldChar(ch: string): string {
  const lower = ch.toLowerCase()
  if (SPECIAL[lower] !== undefined) return SPECIAL[lower]
  return lower.normalize('NFKD').replace(COMBINING, '')
}

const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9'

/**
 * Search normalisation: lower-case, strip diacritics (ă â î ș ț ä ö ü), fold ß→ss, ×→x, ²/³→2/3,
 * treat a decimal comma like a dot ("2,5" = "2.5") and collapse whitespace.
 * Returns the folded string plus, for each folded character, the index of its source character.
 */
export function foldWithMap(input: string): { text: string; map: number[] } {
  let text = ''
  const map: number[] = []
  let lastSpace = true
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as string
    let folded = ch === ',' && isDigit(input[i - 1]) && isDigit(input[i + 1]) ? '.' : foldChar(ch)
    if (/\s/.test(folded)) {
      if (lastSpace) continue
      folded = ' '
    }
    for (const f of folded) {
      text += f
      map.push(i)
    }
    lastSpace = folded === ' '
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1)
    map.pop()
  }
  return { text, map }
}

export function normalize(input: string): string {
  return foldWithMap(input).text
}

export function tokenize(query: string): string[] {
  return [...new Set(normalize(query).split(' ').filter((t) => t.length >= 2 || /\d/.test(t)))]
}

export const hasDigit = (token: string) => /\d/.test(token)

/** Character ranges of `source` that match any query token, for highlighting. */
export function matchRanges(source: string, query: string): [number, number][] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const { text, map } = foldWithMap(source)
  const marks = new Array<boolean>(source.length).fill(false)
  for (const token of tokens) {
    let from = 0
    for (;;) {
      const at = text.indexOf(token, from)
      if (at === -1) break
      for (let k = at; k < at + token.length; k++) {
        const src = map[k]
        if (src !== undefined) marks[src] = true
      }
      from = at + 1
    }
  }
  const ranges: [number, number][] = []
  marks.forEach((m, i) => {
    if (!m) return
    const last = ranges[ranges.length - 1]
    if (last && last[1] === i) last[1] = i + 1
    else ranges.push([i, i + 1])
  })
  return ranges
}
