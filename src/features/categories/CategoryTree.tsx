import { useId, useState } from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { CATEGORY_CONFIGS, getCategory, getCategoryChildren } from '@/config/categories'
import { cn } from '@/shared/lib/cn'
import { CategoryIcon } from './CategoryIcon'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('flex min-h-10 flex-1 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm', isActive ? 'bg-primary-soft font-medium text-primary' : 'hover:bg-surface-2')

function Branch({ slug, depth, activePath, onNavigate }: { slug: string; depth: number; activePath: string[]; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(activePath.includes(slug))
  const listId = useId()
  const children = getCategoryChildren(slug)
  const icon = depth === 0 ? CATEGORY_CONFIGS.find((c) => c.slug === slug)?.icon : undefined
  const name = t(`categories.${slug}`)
  return (
    <li style={{ paddingInlineStart: depth * 14 }}>
      <div className="flex items-center">
        <NavLink to={`/category/${slug}`} className={linkClass} onClick={onNavigate} end>
          {icon && <CategoryIcon name={icon} className="size-4 text-ink-muted" />}
          {name}
        </NavLink>
        {children.length > 0 && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={name}
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-ink-subtle hover:bg-surface-2"
          >
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>
      {children.length > 0 && open && (
        <ul id={listId} className="flex flex-col gap-0.5">
          {children.map((c) => (
            <Branch key={c.slug} slug={c.slug} depth={depth + 1} activePath={activePath} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Expandable 3-level category tree for the mobile drawer; the current branch starts open. */
export function CategoryTree({ onNavigate }: { onNavigate?: () => void }) {
  const match = useMatch('/category/:slug')
  const activePath = (match?.params.slug && getCategory(match.params.slug)?.path) || []
  return (
    <ul className="flex flex-col gap-0.5">
      {CATEGORY_CONFIGS.map((c) => (
        <Branch key={c.slug} slug={c.slug} depth={0} activePath={activePath} onNavigate={onNavigate} />
      ))}
    </ul>
  )
}
