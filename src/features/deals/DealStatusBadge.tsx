import { useTranslation } from 'react-i18next'
import type { DealStatus } from '@/types/models'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'

const TONE: Record<DealStatus, BadgeTone> = {
  quote_request: 'neutral',
  quote_received: 'neutral',
  negotiation: 'expiring',
  order_confirmed: 'primary',
  in_delivery: 'primary',
  delivered: 'verified',
  completed: 'verified',
  cancelled: 'unverified',
  disputed: 'disputed',
}

export function DealStatusBadge({ status }: { status: DealStatus }) {
  const { t } = useTranslation()
  return <Badge tone={TONE[status]}>{t(`deals.status.${status}`)}</Badge>
}
