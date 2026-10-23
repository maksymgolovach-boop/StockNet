import { useTranslation } from 'react-i18next'
import type { AttributeDefinition } from '@/types/models'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { Checkbox, FilterSection, RangeInputs, Switch } from '@/shared/ui/form'
import type { FiltersApi } from '../useFilters'

function AttributeControl({ def, api }: { def: AttributeDefinition; api: FiltersApi }) {
  const { t } = useTranslation()
  const cat = useCategoryConfig(api.filters.category)
  const current = api.filters.attributes[def.key]
  switch (def.type) {
    case 'number': {
      const range = current?.kind === 'range' ? current : undefined
      return (
        <RangeInputs
          min={range?.min}
          max={range?.max}
          minLabel={t('filters.min')}
          maxLabel={t('filters.max')}
          suffix={def.unit}
          step={def.step}
          onCommit={(min, max) => api.setAttribute(def.key, min === undefined && max === undefined ? undefined : { kind: 'range', min, max })}
        />
      )
    }
    case 'enum': {
      const values = current?.kind === 'enum' ? current.values : []
      return (
        <div>
          {def.options.map((o) => (
            <Checkbox
              key={o}
              checked={values.includes(o)}
              label={<span className={def.display === 'verbatim' ? 'font-mono text-[0.8125rem]' : undefined}>{cat.optionLabel(def, o)}</span>}
              onChange={(on) => {
                const next = on ? [...values, o] : values.filter((v) => v !== o)
                api.setAttribute(def.key, next.length ? { kind: 'enum', values: next } : undefined)
              }}
            />
          ))}
        </div>
      )
    }
    case 'boolean':
      return (
        <Switch
          checked={current?.kind === 'boolean' && current.value}
          onChange={(on) => api.setAttribute(def.key, on ? { kind: 'boolean', value: true } : undefined)}
          label={t('filters.onlyWith', { attribute: cat.attributeLabel(def) })}
        />
      )
    case 'text':
      return null
  }
}

/** Spec filters rendered from the selected category's attribute schema. */
export function AttributeFilters({ api }: { api: FiltersApi }) {
  const cat = useCategoryConfig(api.filters.category)
  return (
    <>
      {cat.filterableAttributes
        .filter((d) => d.type !== 'text')
        .map((def) => (
          <FilterSection key={def.key} title={cat.attributeLabel(def)} defaultOpen={def.type !== 'number' || !!api.filters.attributes[def.key]} count={api.filters.attributes[def.key] ? 1 : undefined}>
            <AttributeControl def={def} api={api} />
          </FilterSection>
        ))}
    </>
  )
}
