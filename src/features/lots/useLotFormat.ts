import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lot, LotCondition, LotType, UnitCode } from '@/types/models'
import { UNITS } from '@/config/units'
import { useFormat } from '@/features/i18n/useFormat'

export function useLotFormat() {
  const { t } = useTranslation()
  const fmt = useFormat()
  return useMemo(() => {
    const amount = (qty: number, unit: UnitCode) =>
      UNITS[unit].dimension === 'count' ? t(`lots.items.${unit}`, { count: qty, value: fmt.number(qty) }) : fmt.quantity(qty, unit, { withImperial: false })
    const content = (c: Lot['content']) =>
      c.itemSize ? t('lots.contentOf', { items: amount(c.quantity, c.unit), size: fmt.quantity(c.itemSize.quantity, c.itemSize.unit, { withImperial: false }) }) : amount(c.quantity, c.unit)
    return {
      amount,
      content,
      type: (type: LotType) => t(`lots.types.${type}`),
      condition: (c: LotCondition) => t(`lots.conditions.${c}`),
      lots: (n: number) => t('lots.count', { count: n, value: fmt.number(n, { maximumFractionDigits: 2 }) }),
      available: (n: number) => t('lots.available', { count: n, value: fmt.number(n, { maximumFractionDigits: 2 }) }),
      unit: t('lots.unit'),
    }
  }, [t, fmt])
}
