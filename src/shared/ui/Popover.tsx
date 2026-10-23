import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string; ref: (el: HTMLButtonElement | null) => void }) => ReactNode
  children: ReactNode
  label: string
  width?: number
  className?: string
}

/** Click-to-open dialog popover: Esc and outside click close it, focus moves in and returns to the trigger. */
export function Popover({ trigger, children, label, width = 360, className }: PopoverProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current || !panel.current) return
    const place = () => {
      if (!anchor.current || !panel.current) return
      const a = anchor.current.getBoundingClientRect()
      const h = panel.current.offsetHeight
      const w = Math.min(width, innerWidth - 16)
      const below = a.bottom + 8 + h <= innerHeight || a.top - 8 - h < 0
      setPos({ left: Math.min(Math.max(8, a.left), innerWidth - w - 8), top: below ? a.bottom + 8 : a.top - 8 - h })
    }
    place()
    addEventListener('resize', place)
    addEventListener('scroll', place, true)
    return () => {
      removeEventListener('resize', place)
      removeEventListener('scroll', place, true)
    }
  }, [open, width])

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      anchor.current?.focus()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <>
      {trigger({ open, toggle: () => setOpen((o) => !o), id, ref: (el) => (anchor.current = el) })}
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: Math.min(width, innerWidth - 16) }}
            className={cn('fixed z-[2500] max-h-[80vh] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface p-4 text-ink shadow-overlay outline-none', className)}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
