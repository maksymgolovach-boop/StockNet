import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Archive, ArchiveRestore, Copy, Minus, Pause, Pencil, Play, Plus } from 'lucide-react'
import type { LotStatus } from '@/types/models'
import { Price } from '@/features/currency/Price'
import { useFormat } from '@/features/i18n/useFormat'
import { ExpiryBadge } from '@/features/product/StatusBadges'
import type { ProducerLotRow } from '@/services/lotService'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { IconButton } from '@/shared/ui/Button'
import { LotConditionBadge } from '../LotBadge'
import { availableLots, lotStatus } from '../lotMath'
import { useLotFormat } from '../useLotFormat'

export const STATUS_TONE: Record<LotStatus, BadgeTone> = { available: 'verified', reserved: 'expiring', sold: 'neutral', expired: 'expired', paused: 'unverified', archived: 'neutral' }

interface Props {
  rows: ProducerLotRow[]
  busyId?: string
  onEdit: (row: ProducerLotRow) => void
  onDuplicate: (lotId: string) => void
  onStock: (lotId: string, stock: number) => void
  onStatus: (lotId: string, status: 'active' | 'paused' | 'archived') => void
}

export function StockTable({ rows, busyId, onEdit, onDuplicate, onStock, onStatus }: Props) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lf = useLotFormat()
  const th = 'px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-muted'
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
      <table className="w-full min-w-[64rem] text-sm">
        <caption className="sr-only">{t('lots.stock.tableCaption')}</caption>
        <thead className="bg-surface-2">
          <tr>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.lot')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.content')}</th>
            <th scope="col" className={`${th} text-end`}>{t('lots.cols.price')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.stock.inStock')}</th>
            <th scope="col" className={`${th} text-end`}>{t('lots.stock.reserved')}</th>
            <th scope="col" className={`${th} text-end`}>{t('lots.cols.available')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.stock.status')}</th>
            <th scope="col" className={`${th} text-start`}>{t('lots.cols.dates')}</th>
            <th scope="col" className={`${th} text-start`}>
              <span className="sr-only">{t('lots.stock.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ product, lot }) => {
            const status = lotStatus(lot)
            const busy = busyId === lot.id
            return (
              <tr key={lot.id} className="border-t border-line align-top" aria-busy={busy}>
                <td className="px-3 py-3">
                  <span className="block font-mono text-[0.8125rem] font-semibold">{lot.lotNumber}</span>
                  <Link to={`/product/${product.id}?lot=${lot.id}`} className="block max-w-56 truncate text-xs text-ink-muted hover:text-primary hover:underline" lang={product.contentLang}>
                    {product.name}
                  </Link>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <Badge>{lf.type(lot.type)}</Badge>
                    <LotConditionBadge condition={lot.condition} />
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">
                  <span className="block text-sm">{lf.content(lot.content)}</span>
                  <span className="text-ink-subtle">{lot.divisibility.kind === 'indivisible' ? t('lots.indivisibleShort') : t('lots.divisibleShort', { step: fmt.number(lot.divisibility.step) })}</span>
                </td>
                <td className="px-3 py-3 text-end whitespace-nowrap">
                  <Price amount={lot.pricePerLot} currency={product.pricing.currency} unitLabel={lf.unit} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <IconButton size="sm" label={t('lots.stock.decrease', { number: lot.lotNumber })} disabled={busy || lot.stockCount <= lot.reservedCount} onClick={() => onStock(lot.id, lot.stockCount - 1)}>
                      <Minus className="size-4" aria-hidden />
                    </IconButton>
                    <span className="w-8 text-center font-semibold tabular" aria-live="polite">
                      {lot.stockCount}
                    </span>
                    <IconButton size="sm" label={t('lots.stock.increase', { number: lot.lotNumber })} disabled={busy} onClick={() => onStock(lot.id, lot.stockCount + 1)}>
                      <Plus className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                </td>
                <td className="px-3 py-3 text-end tabular">{lot.reservedCount || '—'}</td>
                <td className="px-3 py-3 text-end font-semibold tabular">{fmt.number(availableLots(lot))}</td>
                <td className="px-3 py-3">
                  <Badge tone={STATUS_TONE[status]}>{t(`lots.status.${status}`)}</Badge>
                </td>
                <td className="px-3 py-3 text-xs">
                  {lot.productionDate && <span className="block whitespace-nowrap">{t('lots.produced', { date: fmt.date(lot.productionDate) })}</span>}
                  {lot.expiryDate && (
                    <span className="mt-1 block">
                      <ExpiryBadge expiryDate={lot.expiryDate} />
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <IconButton size="sm" label={t('lots.stock.edit', { number: lot.lotNumber })} onClick={() => onEdit({ product, lot })}>
                      <Pencil className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton size="sm" label={t('lots.stock.duplicate', { number: lot.lotNumber })} disabled={busy} onClick={() => onDuplicate(lot.id)}>
                      <Copy className="size-4" aria-hidden />
                    </IconButton>
                    {lot.status !== 'archived' &&
                      (lot.status === 'paused' ? (
                        <IconButton size="sm" label={t('lots.stock.resume', { number: lot.lotNumber })} disabled={busy} onClick={() => onStatus(lot.id, 'active')}>
                          <Play className="size-4" aria-hidden />
                        </IconButton>
                      ) : (
                        <IconButton size="sm" label={t('lots.stock.pause', { number: lot.lotNumber })} disabled={busy} onClick={() => onStatus(lot.id, 'paused')}>
                          <Pause className="size-4" aria-hidden />
                        </IconButton>
                      ))}
                    {lot.status === 'archived' ? (
                      <IconButton size="sm" label={t('lots.stock.restore', { number: lot.lotNumber })} disabled={busy} onClick={() => onStatus(lot.id, 'paused')}>
                        <ArchiveRestore className="size-4" aria-hidden />
                      </IconButton>
                    ) : (
                      <IconButton size="sm" label={t('lots.stock.archive', { number: lot.lotNumber })} disabled={busy || lot.reservedCount > 0} onClick={() => onStatus(lot.id, 'archived')}>
                        <Archive className="size-4" aria-hidden />
                      </IconButton>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
