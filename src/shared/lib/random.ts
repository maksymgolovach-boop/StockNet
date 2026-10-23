/** Deterministic PRNG (mulberry32) so mock data is identical on every load. */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number, decimals = 2) => Number((next() * (max - min) + min).toFixed(decimals)),
    pick: <T,>(items: readonly T[]): T => {
      const item = items[Math.floor(next() * items.length)]
      if (item === undefined) throw new Error('pick() on empty list')
      return item
    },
    chance: (p: number) => next() < p,
  }
}

export type Rng = ReturnType<typeof createRng>
