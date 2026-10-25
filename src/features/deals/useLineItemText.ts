import type { DealLineItem } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { useLotFormat } from '@/features/lots/useLotFormat'

export function useLineItemText() {
  const fmt = useFormat()
  const lf = useLotFormat()
  return (li: DealLineItem) =>
    li.lot ? lf.lots(li.quantity) : fmt.quantity(li.quantity, li.unit, { withImperial: false })
}
