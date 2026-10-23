import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/currency/useCurrency'
import { cn } from '@/shared/lib/cn'

/** Quarterly volume as thin bars: one hue, hover/focus readout, table for screen readers. */
export function VolumeChart({ data, label }: { data: { quarter: string; volumeEUR: number }[]; label: string }) {
  const { t } = useTranslation()
  const { convert, format, display } = useCurrency()
  const [active, setActive] = useState<number | null>(null)
  const values = data.map((d) => convert(d.volumeEUR, 'EUR') ?? 0)
  const max = Math.max(...values, 1)
  const quarter = (q: string) => q.replace('-', ' ')
  const shown = active !== null ? data[active] : undefined
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-xs text-ink-muted">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-medium text-ink tabular" aria-live="polite">
          {shown ? `${quarter(shown.quarter)}: ${format(values[active as number] ?? 0, display, { compact: true })}` : <span className="font-normal text-ink-muted">{t('partners.chartHint')}</span>}
        </span>
      </figcaption>
      <div className="flex h-16 items-end gap-0.5 border-b border-line-strong" aria-hidden onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => {
          const v = values[i] ?? 0
          return (
            <div key={d.quarter} className="flex h-full flex-1 items-end" onMouseEnter={() => setActive(i)}>
              <div
                style={{ height: v > 0 ? `${Math.max(5, (v / max) * 100)}%` : '0' }}
                className={cn('w-full rounded-t-[4px] transition-colors', active === i ? 'bg-primary' : 'bg-ink/70')}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[0.625rem] text-ink-subtle" aria-hidden>
        <span>{data[0] ? quarter(data[0].quarter) : ''}</span>
        <span>{data.length ? quarter((data[data.length - 1] as { quarter: string }).quarter) : ''}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.quarter}>
              <th scope="row">{quarter(d.quarter)}</th>
              <td>{format(values[i] ?? 0, display)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
