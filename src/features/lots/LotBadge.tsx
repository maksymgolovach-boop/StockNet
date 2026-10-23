import { useTranslation } from 'react-i18next'
import { Boxes } from 'lucide-react'
import type { LotCondition } from '@/types/models'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'

const CONDITION_TONE: Record<LotCondition, BadgeTone> = { new: 'neutral', surplus: 'accent', clearance: 'accent', b_grade: 'expiring', returned: 'expiring' }

export function LotBadge() {
  const { t } = useTranslation()
  return (
    <Badge tone="ink" icon={<Boxes className="size-3" aria-hidden />}>
      {t('lots.badge')}
    </Badge>
  )
}

export function LotConditionBadge({ condition }: { condition: LotCondition }) {
  const { t } = useTranslation()
  if (condition === 'new') return null
  return <Badge tone={CONDITION_TONE[condition]}>{t(`lots.conditions.${condition}`)}</Badge>
}
