type Primitive = 'string' | 'number' | 'boolean'

/** A field is a primitive type name, 'array', a nested object shape, or [shape] for an array of such objects. */
export type Shape = { [key: string]: Primitive | 'array' | Shape | [Shape] }

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * True when value is an object whose listed fields have the listed types. Extra fields are ignored.
 * Used on data read back from browser storage, which can be stale or hand-edited.
 */
export function matches(value: unknown, shape: Shape): boolean {
  if (!isRecord(value)) return false
  return Object.entries(shape).every(([key, expected]) => {
    const field = value[key]
    if (expected === 'array') return Array.isArray(field)
    if (Array.isArray(expected)) return Array.isArray(field) && field.every((item) => matches(item, expected[0]))
    if (typeof expected === 'object') return matches(field, expected)
    return typeof field === expected && (expected !== 'number' || Number.isFinite(field))
  })
}

/** The items of a stored list that match the shape; anything else (including a non-list) is dropped. */
export const matching = <T>(value: unknown, shape: Shape): T[] =>
  Array.isArray(value) ? (value.filter((item) => matches(item, shape)) as T[]) : []
