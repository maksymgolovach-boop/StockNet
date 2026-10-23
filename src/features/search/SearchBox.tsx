import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useSearchHistory } from './searchHistoryStore'
import { useSuggestionOptions, type SuggestionOption } from './useSuggestionOptions'
import { SuggestionList } from './SuggestionList'

interface SearchBoxProps {
  size?: 'md' | 'lg'
  className?: string
  /** registers the global "/" shortcut (only one instance should) */
  shortcut?: boolean
}

export function SearchBox({ size = 'md', className, shortcut = false }: SearchBoxProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [value, setValue] = useState(urlQuery)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const addRecent = useSearchHistory((s) => s.add)
  const { options, loading } = useSuggestionOptions(value)

  useEffect(() => setValue(urlQuery), [urlQuery, pathname])
  useEffect(() => setActive(-1), [options])

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== '/' || e.ctrlKey || e.metaKey || target.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      inputRef.current?.focus()
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  const go = (option: SuggestionOption) => {
    if (option.query) {
      addRecent(option.query)
      setValue(option.query)
    }
    setOpen(false)
    inputRef.current?.blur()
    navigate(option.to)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const chosen = options[active]
    if (open && chosen) return go(chosen)
    const q = value.trim()
    if (q) addRecent(q)
    setOpen(false)
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      if (!options.length) return
      const last = options.length - 1
      setActive((i) => (e.key === 'ArrowDown' ? (i >= last ? -1 : i + 1) : i <= -1 ? last : i - 1))
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      } else if (value) setValue('')
    }
  }

  const expanded = open && options.length > 0
  const activeId = expanded && options[active] ? `${listId}-${options[active].id}` : undefined

  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t('header.searchLabel')}
      </label>
      <Search aria-hidden className={cn('pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-subtle', size === 'lg' ? 'size-5' : 'size-4')} />
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={activeId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={t('header.searchPlaceholderShort')}
        title={t('header.searchPlaceholder')}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'w-full rounded-[var(--radius-control)] border border-line-strong bg-surface text-ink placeholder:text-ink-subtle hover:border-ink-subtle',
          size === 'lg' ? 'h-13 ps-11 pe-28 text-base shadow-pop' : 'h-10 ps-9 pe-9 text-sm',
        )}
      />
      {size === 'md' && (
        <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2" aria-hidden>
          {loading ? <Loader2 className="size-4 animate-spin text-ink-subtle" /> : shortcut && !value && <kbd className="rounded border border-line px-1.5 text-[0.6875rem] text-ink-subtle">/</kbd>}
        </span>
      )}
      {size === 'lg' && (
        <button type="submit" className="absolute end-1.5 top-1/2 h-10 -translate-y-1/2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover">
          {t('header.searchSubmit')}
        </button>
      )}
      {expanded && <SuggestionList id={listId} options={options} active={active} query={value} onPick={go} onHover={setActive} />}
    </form>
  )
}
