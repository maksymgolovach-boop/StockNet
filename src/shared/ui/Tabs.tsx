import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  label: string
  children: ReactNode
}

/** WAI-ARIA tabs: arrow keys / Home / End move between tabs, panel is labelled by the active tab. */
export function Tabs<T extends string>({ tabs, active, onChange, label, children }: TabsProps<T>) {
  const base = useId()
  const refs = useRef(new Map<T, HTMLButtonElement>())
  const onKey = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next = e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next === null) return
    e.preventDefault()
    const tab = tabs[next]
    if (!tab) return
    onChange(tab.id)
    refs.current.get(tab.id)?.focus()
  }
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b-2 border-line">
        {tabs.map((tab, i) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) refs.current.set(tab.id, el)
              }}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                '-mb-0.5 flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors',
                selected ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {tab.label}
              {tab.badge}
            </button>
          )
        })}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} tabIndex={0} className="pt-5 outline-none">
        {children}
      </div>
    </div>
  )
}
