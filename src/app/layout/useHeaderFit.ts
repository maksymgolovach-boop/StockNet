import { useLayoutEffect, useState, type RefObject } from 'react'

/** The search box keeps at least this much room before the header drops the account name, then the menu labels. */
const SEARCH_TARGET = 288
/** gap-2 between avatar and name, plus the chip's end padding (pe-3 instead of pe-1) */
const NAME_EXTRA = 16

export interface HeaderFit {
  /** show the text labels of the main menu (otherwise icons with tooltips; the label stays for screen readers) */
  labels: boolean
  /** show the company name next to the avatar (otherwise the avatar alone, the name is in its tooltip) */
  name: boolean
}

interface HeaderFitRefs {
  row: RefObject<HTMLElement | null>
  nav: RefObject<HTMLElement | null>
  right: RefObject<HTMLElement | null>
  ghost: RefObject<HTMLElement | null>
}

const shown = (el: Element) => getComputedStyle(el).display !== 'none'

/**
 * Decides what fits in the header's top row. Labels and the company name differ in length per language, so a fixed
 * breakpoint is either too early for English or too late for German. Instead, an invisible copy of the menu (the
 * "ghost": full and icon-only versions, plus the name) gives their natural widths, and the row's other items are
 * measured as they are. None of the measured widths depend on the result, so the decision cannot flip back and forth.
 */
export function useHeaderFit({ row, nav, right, ghost }: HeaderFitRefs): HeaderFit {
  const [fit, setFit] = useState<HeaderFit>({ labels: true, name: true })

  useLayoutEffect(() => {
    const rowEl = row.current
    const ghostEl = ghost.current
    if (!rowEl || !ghostEl) return
    const measure = () => {
      const style = getComputedStyle(rowEl)
      const inner = rowEl.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd)
      const gap = parseFloat(style.columnGap) || 0
      const items = [...rowEl.children].filter(shown) as HTMLElement[]
      let fixed = gap * Math.max(0, items.length - 1)
      let hasNav = false
      let hasSearch = false
      for (const el of items) {
        if (el === nav.current) hasNav = true
        else if (el.matches('form[role="search"]')) hasSearch = true
        else fixed += el.offsetWidth
      }
      const nameEl = right.current?.querySelector<HTMLElement>('[data-account-name]')
      if (nameEl && nameEl.offsetWidth > 0) fixed -= nameEl.offsetWidth + NAME_EXTRA
      const chip = right.current?.querySelector('[data-account-chip]')
      const ghostWidth = (part: string) =>
        ghostEl.querySelector<HTMLElement>(`[data-ghost="${part}"]`)?.offsetWidth ?? 0
      const nameWidth = chip && shown(chip) ? ghostWidth('name') + NAME_EXTRA : 0
      const full = hasNav ? ghostWidth('full') : 0
      const compact = hasNav ? ghostWidth('compact') : 0
      const free = inner - fixed - (hasSearch ? SEARCH_TARGET : 0)
      const next: HeaderFit =
        free >= full + nameWidth
          ? { labels: true, name: true }
          : free >= full
            ? { labels: true, name: false }
            : free >= compact + nameWidth
              ? { labels: false, name: true }
              : { labels: false, name: false }
      setFit((prev) => (prev.labels === next.labels && prev.name === next.name ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(rowEl)
    ghostEl.querySelectorAll('[data-ghost]').forEach((el) => ro.observe(el))
    if (right.current) ro.observe(right.current)
    return () => ro.disconnect()
  }, [row, nav, right, ghost])

  return fit
}
