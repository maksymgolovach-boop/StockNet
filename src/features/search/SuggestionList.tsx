import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Clock, FolderTree, Package, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Highlight } from './Highlight'
import { useSearchHistory } from './searchHistoryStore'
import type { SuggestionGroup, SuggestionOption } from './useSuggestionOptions'

const ICON: Record<SuggestionGroup, typeof Package> = { recent: Clock, products: Package, categories: FolderTree, producers: Building2, all: ArrowRight }

interface SuggestionListProps {
  id: string
  options: SuggestionOption[]
  active: number
  query: string
  onPick: (option: SuggestionOption) => void
  onHover: (index: number) => void
}

export function SuggestionList({ id, options, active, query, onPick, onHover }: SuggestionListProps) {
  const { t } = useTranslation()
  const clearRecent = useSearchHistory((s) => s.clear)
  const groups = [...new Set(options.map((o) => o.group))]

  return (
    <div
      className="absolute inset-x-0 top-full z-[600] mt-1.5 max-h-[min(70vh,32rem)] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface py-1.5 shadow-overlay"
      onMouseDown={(e) => e.preventDefault()}
    >
      <ul id={id} role="listbox" aria-label={t('header.searchLabel')}>
        {groups.map((group) => (
          <li key={group} role="presentation">
            {group !== 'all' && (
              <div id={`${id}-${group}`} className="flex items-center justify-between px-3 pb-1 pt-2 text-[0.6875rem] font-semibold tracking-wide text-ink-subtle uppercase">
                {t(`search.groups.${group}`)}
                {group === 'recent' && (
                  <button type="button" onClick={clearRecent} className="normal-case tracking-normal font-medium text-ink-muted hover:text-primary">
                    {t('common.clear')}
                  </button>
                )}
              </div>
            )}
            <ul role="group" aria-labelledby={group !== 'all' ? `${id}-${group}` : undefined} aria-label={group === 'all' ? t('search.groups.all') : undefined}>
              {options.map((option, index) => {
                if (option.group !== group) return null
                const Icon = ICON[group]
                return (
                  <li
                    key={option.id}
                    id={`${id}-${option.id}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => onHover(index)}
                    onClick={() => onPick(option)}
                    className={cn(
                      'mx-1.5 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm',
                      index === active ? 'bg-surface-2' : '',
                      group === 'all' && 'mt-1 border-t border-line pt-2.5',
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {group === 'all' ? t('search.searchFor', { query: option.label }) : <Highlight text={option.label} query={query} />}
                      </span>
                      {option.meta && <span className="block truncate text-xs text-ink-subtle">{option.meta}</span>}
                    </span>
                    {group === 'recent' && <RemoveRecent query={option.label} />}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RemoveRecent({ query }: { query: string }) {
  const { t } = useTranslation()
  const remove = useSearchHistory((s) => s.remove)
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={t('search.removeRecent', { query })}
      onClick={(e) => {
        e.stopPropagation()
        remove(query)
      }}
      className="grid size-6 place-items-center rounded text-ink-subtle hover:bg-surface-3 hover:text-ink"
    >
      <X className="size-3.5" aria-hidden />
    </button>
  )
}
