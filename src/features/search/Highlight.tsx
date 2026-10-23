import { Fragment } from 'react'
import { matchRanges } from './normalize'

/** Highlights query matches inside `text`, diacritic- and case-insensitively. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query)
  if (!ranges.length) return <>{text}</>
  const parts: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(<Fragment key={`t${i}`}>{text.slice(cursor, start)}</Fragment>)
    parts.push(
      <mark key={`m${i}`} className="rounded-sm bg-primary-soft px-px font-semibold text-primary">
        {text.slice(start, end)}
      </mark>,
    )
    cursor = end
  })
  if (cursor < text.length) parts.push(<Fragment key="end">{text.slice(cursor)}</Fragment>)
  return <>{parts}</>
}
