import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type BadgeTone = 'ink' | 'neutral' | 'primary' | 'accent' | 'verified' | 'expiring' | 'expired' | 'disputed' | 'unverified'

const tones: Record<BadgeTone, string> = {
  ink: 'bg-ink text-bg border-ink',
  neutral: 'bg-surface-2 text-ink-muted border-line',
  primary: 'bg-primary-soft text-primary border-primary/25',
  accent: 'bg-accent-soft text-accent border-accent/25',
  verified: 'bg-verified-soft text-verified border-verified/25',
  expiring: 'bg-expiring-soft text-expiring border-expiring/30',
  expired: 'bg-expired-soft text-expired border-expired/25',
  disputed: 'bg-disputed-soft text-disputed border-disputed/25',
  unverified: 'bg-unverified-soft text-unverified border-unverified/25',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export function Badge({ tone = 'neutral', icon, size = 'sm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-hidden rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-5 px-2 text-[0.6875rem]' : 'h-6 px-2.5 text-xs',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}
