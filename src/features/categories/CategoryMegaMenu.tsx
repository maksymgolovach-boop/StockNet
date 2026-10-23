import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import { CATEGORY_CONFIGS, getCategoryChildren } from '@/config/categories'
import { useCategoryStats } from '@/services/queries'
import { cn } from '@/shared/lib/cn'
import { CategoryIcon } from './CategoryIcon'

/** Desktop mega-menu: roots on the left, levels 2 and 3 of the focused root on the right. */
export function CategoryMegaMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [rootSlug, setRootSlug] = useState(CATEGORY_CONFIGS[0]?.slug ?? '')
  const [top, setTop] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const { pathname, search } = useLocation()
  const { data: stats } = useCategoryStats()
  const counts = new Map(stats?.map((s) => [s.slug, s.productCount]))

  useEffect(() => setOpen(false), [pathname, search])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => setTop((triggerRef.current?.closest('nav')?.getBoundingClientRect().bottom ?? 0))
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('[data-root]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const children = getCategoryChildren(rootSlug)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 font-medium whitespace-nowrap', open ? 'bg-primary text-on-primary' : 'text-ink hover:bg-surface-2')}
      >
        <LayoutGrid className="size-3.5" aria-hidden />
        {t('nav.allCategories')}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="region"
            aria-label={t('nav.allCategories')}
            style={{ top }}
            className="fixed inset-x-0 z-[550] border-b border-line bg-surface shadow-overlay"
          >
            <div className="mx-auto grid max-w-[90rem] grid-cols-[17rem_1fr] gap-6 px-6 py-5">
              <ul className="flex flex-col gap-0.5 border-e border-line pe-4">
                {CATEGORY_CONFIGS.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/category/${c.slug}`}
                      data-root
                      onMouseEnter={() => setRootSlug(c.slug)}
                      onFocus={() => setRootSlug(c.slug)}
                      className={cn('flex h-10 items-center gap-3 rounded-md px-3 text-sm', rootSlug === c.slug ? 'bg-primary-soft font-medium text-primary' : 'hover:bg-surface-2')}
                    >
                      <CategoryIcon name={c.icon} className="size-4" />
                      <span className="flex-1">{t(`categories.${c.slug}`)}</span>
                      <ChevronRight className="size-3.5 opacity-60 rtl:rotate-180" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <div>
                <Link to={`/category/${rootSlug}`} className="font-display text-xl font-semibold hover:text-primary">
                  {t(`categories.${rootSlug}`)}
                </Link>
                <p className="mb-4 text-sm text-ink-muted">{t(`categoryBlurb.${rootSlug}`)}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-3">
                  {children.map((child) => (
                    <div key={child.slug}>
                      <Link to={`/category/${child.slug}`} className="flex items-baseline justify-between gap-2 border-b border-line pb-1.5 text-sm font-semibold hover:text-primary">
                        {t(`categories.${child.slug}`)}
                        <span className="text-xs font-normal text-ink-subtle tabular">{counts.get(child.slug) ?? ''}</span>
                      </Link>
                      {child.childSlugs.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {child.childSlugs.map((s) => (
                            <li key={s}>
                              <Link to={`/category/${s}`} className="flex justify-between gap-2 text-[0.8125rem] text-ink-muted hover:text-primary">
                                {t(`categories.${s}`)}
                                <span className="text-xs text-ink-subtle tabular">{counts.get(s) ?? ''}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
