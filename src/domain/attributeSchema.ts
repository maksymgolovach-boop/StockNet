import { z } from 'zod'
import type { AttributeDefinition, AttributeValue, CategoryConfig } from '@/types/models'

function schemaFor(def: AttributeDefinition): z.ZodType<AttributeValue> {
  switch (def.type) {
    case 'number':
      return z.number().min(def.min).max(def.max)
    case 'enum':
      return z.enum(def.options as [string, ...string[]])
    case 'boolean':
      return z.boolean()
    case 'text':
      return z.string().min(1)
  }
}

/** Builds a strict zod schema for a product's `attributes` from its category config. */
export function buildAttributeSchema(config: CategoryConfig) {
  const shape: Record<string, z.ZodType<AttributeValue | undefined>> = {}
  for (const def of config.attributes) {
    const s = schemaFor(def)
    shape[def.key] = def.required ? s : s.optional()
  }
  return z.object(shape).strict()
}

export function validateAttributes(attributes: Record<string, AttributeValue>, config: CategoryConfig): string[] {
  const result = buildAttributeSchema(config).safeParse(attributes)
  if (result.success) return []
  return result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
}
