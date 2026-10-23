import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hideLabel?: boolean
  options: { value: string; label: string }[]
  compact?: boolean
}

export function Select({ label, hideLabel, options, compact, className, id, ...rest }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={selectId} className={cn('text-xs font-medium text-ink-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none rounded-[var(--radius-control)] border border-line-strong bg-surface pe-8 ps-3 text-ink hover:border-ink-subtle',
            compact ? 'h-8 text-[0.8125rem]' : 'h-10 text-sm',
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      </div>
    </div>
  )
}
