import { useTranslation } from 'react-i18next'
import { BadgeCheck, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { VerificationLevel } from '@/types/models'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { Tooltip } from '@/shared/ui/Tooltip'

const TONE: Record<VerificationLevel, BadgeTone> = { unverified: 'unverified', identity: 'neutral', verified: 'verified', audited: 'verified' }
const ICON: Record<VerificationLevel, typeof BadgeCheck> = { unverified: ShieldQuestion, identity: ShieldAlert, verified: ShieldCheck, audited: BadgeCheck }

/** Verification level with a tooltip explaining what was checked. */
export function VerificationBadge({ level, compact = false }: { level: VerificationLevel; compact?: boolean }) {
  const { t } = useTranslation()
  const Icon = ICON[level]
  const label = t(`verification.levels.${level}`)
  return (
    <Tooltip content={t(`verification.levelHelp.${level}`)}>
      <span tabIndex={0} className="relative z-10 inline-flex rounded-full">
        <Badge tone={TONE[level]} icon={<Icon className="size-3" aria-hidden />}>
          {compact ? <span className="sr-only">{label}</span> : label}
        </Badge>
      </span>
    </Tooltip>
  )
}
