import { useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'bottom'
  className?: string
}

/**
 * Tooltip rendered in a portal with fixed positioning, so cards with overflow-hidden never clip it.
 * Shows on hover and keyboard focus, dismisses on Esc, linked via aria-describedby.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; flip: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return
    const a = anchor.current.getBoundingClientRect()
    const t = tip.current.getBoundingClientRect()
    const margin = 8
    let flip = side === 'top' ? a.top - t.height - margin < 0 : a.bottom + t.height + margin > innerHeight
    const placeTop = side === 'top' ? !flip : flip
    const top = placeTop ? a.top - t.height - margin : a.bottom + margin
    const left = Math.min(Math.max(margin, a.left + a.width / 2 - t.width / 2), innerWidth - t.width - margin)
    if (side === 'bottom') flip = !placeTop
    setPos({ left, top, flip })
  }, [open, side])

  return (
    <span
      ref={anchor}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={tip}
            id={id}
            role="tooltip"
            style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
            className={cn('pointer-events-none fixed z-[3000] w-max max-w-64 rounded-md bg-ink px-2.5 py-1.5 text-xs font-normal leading-snug text-bg shadow-pop', className)}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  )
}
