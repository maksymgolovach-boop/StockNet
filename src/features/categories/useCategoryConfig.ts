import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AttributeDefinition, AttributeValue } from '@/types/models'
import { getCategory, getCategoryConfig, getLogisticsFor } from '@/config/categories'
import { useFormat } from '@/features/i18n/useFormat'

/** Translated, schema-driven helpers for a category (any level of the tree). */
export function useCategoryConfig(slug: string | undefined) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const category = slug ? getCategory(slug) : undefined
  const config = slug ? getCategoryConfig(slug) : undefined
  const logistics = slug ? getLogisticsFor(slug) : undefined

  const attributeLabel = useCallback((def: AttributeDefinition) => t(`attributes.${def.key}`), [t])

  const optionLabel = useCallback(
    (def: AttributeDefinition, option: string) => {
      if (def.type !== 'enum') return option
      if (def.display === 'region') return fmt.region(option)
      if (def.display === 'verbatim') return option
      return t(`enums.${def.key}.${option}`)
    },
    [t, fmt],
  )

  const formatValue = useCallback(
    (def: AttributeDefinition, value: AttributeValue | undefined): string | null => {
      if (value === undefined) return null
      switch (def.type) {
        case 'boolean':
          return t(value ? 'common.yes' : 'common.no')
        case 'enum':
          return optionLabel(def, String(value))
        case 'number': {
          const n = fmt.number(Number(value), { maximumFractionDigits: 2 })
          if (!def.unit) return n
          if (def.unit === 'd') return t('common.days', { count: Number(value) })
          return `${n} ${def.unit}`
        }
        case 'text':
          return String(value)
      }
    },
    [t, fmt, optionLabel],
  )

  return useMemo(
    () => ({
      category,
      config,
      logistics,
      name: slug ? t(`categories.${slug}`) : '',
      path: category?.path.map((s) => ({ slug: s, name: t(`categories.${s}`) })) ?? [],
      attributeLabel,
      optionLabel,
      formatValue,
      filterableAttributes: config?.attributes.filter((a) => a.filterable) ?? [],
      cardAttributes: config?.attributes.filter((a) => a.showOnCard) ?? [],
    }),
    [category, config, logistics, slug, t, attributeLabel, optionLabel, formatValue],
  )
}
