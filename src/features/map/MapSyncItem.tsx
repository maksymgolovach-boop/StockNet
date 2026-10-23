import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { useMapUi } from './mapUiStore'

/**
 * Wraps a result so hovering/focusing it highlights its map pin, and a pin selected on the
 * map scrolls the first matching result into view.
 */
export function MapSyncItem({ producerId, first, children, className }: { producerId: string; first: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const selectedFromMap = useMapUi((s) => s.selectedProducerId === producerId && s.selectionSource === 'map')
  const setHovered = useMapUi((s) => s.setHovered)

  useEffect(() => {
    if (first && selectedFromMap) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [first, selectedFromMap])

  return (
    <div
      ref={ref}
      data-producer={producerId}
      onMouseEnter={() => setHovered(producerId)}
      onMouseLeave={() => setHovered(null)}
      onFocusCapture={() => setHovered(producerId)}
      onBlurCapture={() => setHovered(null)}
      className={cn('min-w-0 rounded-[var(--radius-card)]', className)}
    >
      {children}
    </div>
  )
}
