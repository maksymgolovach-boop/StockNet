import { useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function Checkbox({ checked, onChange, label, meta, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; meta?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn('flex min-h-8 cursor-pointer items-center gap-2.5 rounded px-1 text-sm hover:bg-surface-2', disabled && 'cursor-not-allowed opacity-50')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4 shrink-0 accent-[var(--primary)]" />
      <span className="flex-1">{label}</span>
      {meta !== undefined && <span className="text-xs text-ink-subtle tabular">{meta}</span>}
    </label>
  )
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-start justify-between gap-3 py-1 text-sm">
      <span className="flex flex-col">
        <span>{label}</span>
        {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] after:absolute after:start-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4"
      />
    </label>
  )
}

export function RadioChips<T extends string>({ name, value, options, onChange, legend }: { name: string; value: T | undefined; options: { value: T | ''; label: string }[]; onChange: (v: T | undefined) => void; legend: string }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label key={o.value || 'any'} className="cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={(value ?? '') === o.value} onChange={() => onChange(o.value === '' ? undefined : (o.value as T))} />
            <span className="flex h-8 items-center rounded-full border border-line-strong px-3 text-[0.8125rem] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] hover:bg-surface-2 peer-checked:hover:bg-primary">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface RangeInputsProps {
  min?: number
  max?: number
  onCommit: (min: number | undefined, max: number | undefined) => void
  minLabel: string
  maxLabel: string
  suffix?: string
  step?: number
}

/** Two number inputs that commit on blur or Enter (not on every keystroke). */
export function RangeInputs({ min, max, onCommit, minLabel, maxLabel, suffix, step }: RangeInputsProps) {
  const id = useId()
  const [lo, setLo] = useState(min?.toString() ?? '')
  const [hi, setHi] = useState(max?.toString() ?? '')
  useEffect(() => setLo(min?.toString() ?? ''), [min])
  useEffect(() => setHi(max?.toString() ?? ''), [max])
  const parse = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s.replace(',', '.'))) ? undefined : Number(s.replace(',', '.')))
  const commit = () => {
    const a = parse(lo)
    const b = parse(hi)
    if (a !== min || b !== max) onCommit(a, b)
  }
  const field = (fid: string, label: string, value: string, set: (v: string) => void) => (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={fid} className="text-xs text-ink-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={fid}
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => set(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className={cn('h-9 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-2.5 text-sm tabular', suffix ? 'pe-12' : 'pe-2')}
        />
        {suffix && <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">{suffix}</span>}
      </div>
    </div>
  )
  return (
    <div className="flex gap-2">
      {field(`${id}-min`, minLabel, lo, setLo)}
      {field(`${id}-max`, maxLabel, hi, setHi)}
    </div>
  )
}

export function FilterSection({ title, children, defaultOpen = true, count }: { title: string; children: ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="border-b-2 border-primary py-3 last:border-b-0">
      <h3 className="font-sans">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 py-1 text-[0.8125rem] font-semibold">
          <span className="flex items-center gap-2">
            {title}
            {!!count && <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[0.625rem] text-on-primary">{count}</span>}
          </span>
          <ChevronDown className={cn('size-4 text-ink-subtle transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </h3>
      <div id={id} hidden={!open} className="pt-2">
        {children}
      </div>
    </section>
  )
}

/** Single number input that commits on blur or Enter. */
export function NumberField({ value, onCommit, label, suffix }: { value?: number; onCommit: (v: number | undefined) => void; label: string; suffix?: string }) {
  const id = useId()
  const [text, setText] = useState(value?.toString() ?? '')
  useEffect(() => setText(value?.toString() ?? ''), [value])
  const commit = () => {
    const n = text.trim() === '' ? undefined : Number(text.replace(',', '.'))
    const next = n !== undefined && Number.isFinite(n) ? n : undefined
    if (next !== value) onCommit(next)
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className={cn('h-9 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-2.5 text-sm tabular', suffix ? 'pe-12' : 'pe-2')}
        />
        {suffix && <span className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">{suffix}</span>}
      </div>
    </div>
  )
}
