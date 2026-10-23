import { useTranslation } from 'react-i18next'
import type { Product } from '@/types/models'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { useFormat } from '@/features/i18n/useFormat'

/** Specification table generated from the category's attribute schema. */
export function SpecTable({ product }: { product: Product }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const cat = useCategoryConfig(product.categorySlug)
  const rows = (cat.config?.attributes ?? [])
    .map((def) => ({ key: def.key, label: cat.attributeLabel(def), value: cat.formatValue(def, product.attributes[def.key]), verbatim: def.type === 'text' || (def.type === 'enum' && def.display === 'verbatim') }))
    .filter((r) => r.value !== null)
  return (
    <section aria-labelledby="specs-title" className="flex flex-col gap-3">
      <h2 id="specs-title" className="text-xl font-semibold">
        {t('product.specs')}
      </h2>
      <table className="w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface text-sm">
        <tbody>
          <tr className="border-b border-line">
            <th scope="row" className="w-2/5 bg-surface-2 px-3 py-2 text-start font-medium text-ink-muted">{t('nav.categories')}</th>
            <td className="px-3 py-2">{cat.path.map((p) => p.name).join(' › ')}</td>
          </tr>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-b-0">
              <th scope="row" className="bg-surface-2 px-3 py-2 text-start font-medium text-ink-muted">{r.label}</th>
              <td className={r.verbatim ? 'px-3 py-2 font-mono text-[0.8125rem]' : 'px-3 py-2'}>{r.value}</td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <th scope="row" className="bg-surface-2 px-3 py-2 text-start font-medium text-ink-muted">{t('product.soldPer')}</th>
            <td className="px-3 py-2">{fmt.unitLabel(product.unit)}</td>
          </tr>
          <tr className="border-t border-line">
            <th scope="row" className="bg-surface-2 px-3 py-2 text-start font-medium text-ink-muted">{t('product.dispatchFrom')}</th>
            <td className="px-3 py-2">
              {product.city}, {fmt.region(product.country)}
            </td>
          </tr>
          {product.productionDate && (
            <tr className="border-t border-line">
              <th scope="row" className="bg-surface-2 px-3 py-2 text-start font-medium text-ink-muted">{t('product.productionDate')}</th>
              <td className="px-3 py-2">{fmt.date(product.productionDate)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
