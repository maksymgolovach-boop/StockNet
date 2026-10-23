import { useTranslation } from 'react-i18next'
import { FileText, MapPin } from 'lucide-react'
import type { Lot, Product } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { ExpiryBadge } from '@/features/product/StatusBadges'
import { usePreferences } from '@/features/settings/preferencesStore'
import { cn } from '@/shared/lib/cn'
import { distanceKm } from '@/shared/lib/geo'
import { LotConditionBadge } from './LotBadge'
import { availableLots, normalizedLotPrice } from './lotMath'
import { useLotFormat } from './useLotFormat'

export function LotTable({ product, lots, selectedId, onSelect }: { product: Product; lots: Lot[]; selectedId?: string; onSelect: (id: string) => void }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lf = useLotFormat()
  const me = usePreferences((s) => s.location.point)
  const th = 'px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-muted'
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
      <table className="w-full min-w-[52rem] text-sm">
        <caption className="sr-only">{t('lots.tableCaption', { name: product.name })}</caption>
        <thead className="bg-surface-2">
          <tr>
            <th scope="col" className={`${th} text-start`}>
              <span className="sr-only">{t('lots.select')}</span>
            </th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.lot')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.content')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.dates')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.location')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.documents')}</th>
            <th scope="col" className={cn(th, 'text-end')}>{t('lots.cols.price')}</th>
            <th scope="col" className={cn(th, 'text-end')}>{t('lots.cols.available')}</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => {
            const norm = normalizedLotPrice(lot, product.unit)
            const selected = lot.id === selectedId
            const radioId = `lot-radio-${lot.id}`
            return (
              <tr key={lot.id} onClick={() => onSelect(lot.id)} className={cn('cursor-pointer border-t border-line align-top', selected ? 'bg-surface-2 outline-2 -outline-offset-2 outline-ink' : 'hover:bg-surface-2')}>
                <td className="px-3 py-3">
                  <input id={radioId} type="radio" name="lot" checked={selected} onChange={() => onSelect(lot.id)} className="size-4 accent-[var(--primary)]" aria-label={t('lots.selectLot', { number: lot.lotNumber })} />
                </td>
                <td className="px-3 py-3">
                  <label htmlFor={radioId} className="flex cursor-pointer flex-col gap-1">
                    <span className="font-mono text-[0.8125rem] font-semibold">{lot.lotNumber}</span>
                    <span className="text-xs text-ink-muted">{lf.type(lot.type)}</span>
                    <LotConditionBadge condition={lot.condition} />
                  </label>
                </td>
                <td className="px-3 py-3">
                  <span className="block">{lf.content(lot.content)}</span>
                  <span className="block text-xs text-ink-subtle">
                    {[lot.totalWeightKg ? fmt.quantity(lot.totalWeightKg >= 1000 ? lot.totalWeightKg / 1000 : lot.totalWeightKg, lot.totalWeightKg >= 1000 ? 't' : 'kg', { withImperial: false }) : null, lot.totalVolumeM3 ? fmt.quantity(lot.totalVolumeM3, 'm3', { withImperial: false }) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">{lot.divisibility.kind === 'indivisible' ? t('lots.indivisibleShort') : t('lots.divisibleShort', { step: fmt.number(lot.divisibility.step) })}</span>
                </td>
                <td className="px-3 py-3 text-xs">
                  {lot.productionDate && <span className="block whitespace-nowrap">{t('lots.produced', { date: fmt.date(lot.productionDate) })}</span>}
                  {lot.expiryDate && (
                    <span className="mt-1 block">
                      <ExpiryBadge expiryDate={lot.expiryDate} />
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs">
                  <span className="flex items-start gap-1">
                    <MapPin className="mt-px size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    <span>
                      <span className="block">{lot.location.label}</span>
                      <span className="block text-ink-subtle">
                        {lot.location.city}, {fmt.region(lot.location.country)} · {fmt.distance(Math.round(distanceKm(me, lot.location.point)))}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">
                  {lot.documents.length === 0 ? (
                    <span className="text-ink-subtle">—</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {lot.documents.map((d) => (
                        <li key={d.id} className="flex items-start gap-1" title={t('docs.demoOnly')}>
                          <FileText className="mt-px size-3.5 shrink-0 text-ink-muted" aria-hidden />
                          <span className="max-w-44">{d.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-3 text-end whitespace-nowrap">
                  <span className="block font-semibold">
                    <Price amount={lot.pricePerLot} currency={product.pricing.currency} unitLabel={lf.unit} />
                  </span>
                  {norm && (
                    <span className="block text-xs text-ink-muted">
                      {t('lots.approx')} <Price amount={norm.amount} currency={product.pricing.currency} unit={norm.unit} />
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-end whitespace-nowrap tabular">
                  <span className="block font-semibold">{fmt.number(availableLots(lot))}</span>
                  {lot.reservedCount > 0 && <span className="block text-xs text-ink-subtle">{t('lots.reservedCount', { count: lot.reservedCount })}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
