import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  side?: 'start' | 'end' | 'bottom'
  children: ReactNode
}

/** Modal side/bottom sheet with focus trap, Esc to close and focus restoration. */
export function Drawer({ open, onClose, title, closeLabel, side = 'start', children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/45" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-surface shadow-overlay',
          side === 'bottom'
            ? 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl'
            : cn('inset-y-0 w-[min(22rem,88vw)]', side === 'start' ? 'start-0' : 'end-0'),
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
