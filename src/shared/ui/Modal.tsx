import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { IconButton } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

export function Modal({ open, onClose, title, closeLabel, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[2000] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`relative flex max-h-[90dvh] w-full ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'} flex-col rounded-[var(--radius-card)] bg-surface shadow-overlay`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
