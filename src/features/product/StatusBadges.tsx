import { useTranslation } from 'react-i18next'
import { CalendarClock, Clock, Factory, PackageCheck, PackageMinus } from 'lucide-react'
import type { Product } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { daysFromNow } from '@/shared/lib/dates'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'

/** Perishables: green > 30 days, amber 7–30, red < 7. */
export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const days = daysFromNow(expiryDate)
  const tone: BadgeTone = days < 0 ? 'expired' : days < 7 ? 'expired' : days <= 30 ? 'expiring' : 'verified'
  return (
    <Badge tone={tone} icon={<CalendarClock className="size-3" aria-hidden />} title={fmt.date(expiryDate)}>
      {days < 0 ? t('availability.expired') : t('availability.expiresIn', { count: days })}
    </Badge>
  )
}

/** Non-perishables: stock level and lead time / made-to-order / available-from. */
export function AvailabilityBadge({ product }: { product: Pick<Product, 'availability' | 'stock'> }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { availability: a, stock } = product
  if (a.status === 'in_stock') {
    const low = stock.quantity > 0 && stock.quantity < stock.lowThreshold
    return low ? (
      <Badge tone="accent" icon={<PackageMinus className="size-3" aria-hidden />}>
        {t('availability.lowStock')}
      </Badge>
    ) : (
      <Badge tone="verified" icon={<PackageCheck className="size-3" aria-hidden />}>
        {t('availability.in_stock')}
      </Badge>
    )
  }
  if (a.status === 'made_to_order')
    return (
      <Badge tone="neutral" icon={<Factory className="size-3" aria-hidden />}>
        {t('availability.made_to_order', { count: a.leadTimeDays })}
      </Badge>
    )
  if (a.status === 'pre_order' && a.availableFrom)
    return (
      <Badge tone="neutral" icon={<CalendarClock className="size-3" aria-hidden />}>
        {t('availability.availableFrom', { date: fmt.date(a.availableFrom, { day: 'numeric', month: 'short' }) })}
      </Badge>
    )
  return (
    <Badge tone="neutral" icon={<Clock className="size-3" aria-hidden />}>
      {t('availability.ships_in', { count: a.leadTimeDays })}
    </Badge>
  )
}
