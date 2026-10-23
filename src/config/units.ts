export type UnitDimension = 'mass' | 'length' | 'area' | 'volume' | 'count'

export interface UnitConfig {
  dimension: UnitDimension
  /** factor to the dimension's metric base unit (kg, m, m², m³) — null for count-like units */
  toBase: number | null
  /** imperial display counterpart; factor converts 1 unit into the imperial unit */
  imperial?: { unit: string; factor: number }
}

export const UNITS = {
  kg: { dimension: 'mass', toBase: 1, imperial: { unit: 'lb', factor: 2.20462 } },
  t: { dimension: 'mass', toBase: 1000, imperial: { unit: 'short_ton', factor: 1.10231 } },
  m: { dimension: 'length', toBase: 1, imperial: { unit: 'ft', factor: 3.28084 } },
  km: { dimension: 'length', toBase: 1000, imperial: { unit: 'mi', factor: 0.621371 } },
  m2: { dimension: 'area', toBase: 1, imperial: { unit: 'sq_ft', factor: 10.7639 } },
  m3: { dimension: 'volume', toBase: 1, imperial: { unit: 'cu_yd', factor: 1.30795 } },
  l: { dimension: 'volume', toBase: 0.001, imperial: { unit: 'gal', factor: 0.264172 } },
  piece: { dimension: 'count', toBase: null },
  pallet: { dimension: 'count', toBase: null },
  coil: { dimension: 'count', toBase: null },
  bag: { dimension: 'count', toBase: null },
  crate: { dimension: 'count', toBase: null },
} as const satisfies Record<string, UnitConfig>

export type UnitCode = keyof typeof UNITS
export type UnitsSystem = 'metric' | 'imperial'

export const UNIT_CODES = Object.keys(UNITS) as UnitCode[]

/** Converts a quantity between two units of the same measurable dimension, or returns null. */
export function convertQuantity(qty: number, from: UnitCode, to: UnitCode): number | null {
  const a: UnitConfig = UNITS[from]
  const b: UnitConfig = UNITS[to]
  if (from === to) return qty
  if (a.dimension !== b.dimension || a.toBase === null || b.toBase === null) return null
  return (qty * a.toBase) / b.toBase
}
