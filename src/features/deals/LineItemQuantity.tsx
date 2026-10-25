import { useTranslation } from 'react-i18next'
import type { DealLineItem } from '@/types/models'
import { useLotFormat } from '@/features/lots/useLotFormat'

export function LotRef({ item }: { item: DealLineItem }) {
  const { t } = useTranslation()
  const lf = useLotFormat()
  if (!item.lot) return null
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-muted">
      {t('lots.reviewLot', { number: item.lot.lotNumber })} · {lf.type(item.lot.type)}
    </span>
  )
}
