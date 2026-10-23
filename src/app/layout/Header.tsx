import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, MessageSquare, Settings } from 'lucide-react'
import { CATEGORY_CONFIGS, getCategory } from '@/config/categories'
import { CurrencySwitcher } from '@/features/currency/CurrencySwitcher'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/features/settings/ThemeController'
import { CategoryIcon } from '@/features/categories/CategoryIcon'
import { IconButton } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { SearchBox } from '@/features/search/SearchBox'
import { CategoryMegaMenu } from '@/features/categories/CategoryMegaMenu'
import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { useDevStore } from '@/features/dev/devStore'
import { navItemsFor } from './navItems'
import { useUnreadCount } from './useUnreadCount'
import { AccountChip } from './AccountChip'

function UnreadDot({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold text-on-accent tabular" aria-hidden>
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function Header() {
  const { t } = useTranslation()
  const role = useDevStore((s) => s.role)
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = useUnreadCount()
  const headerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const publish = () => {
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
      document.documentElement.style.setProperty('--chrome-h', `${el.offsetTop + el.offsetHeight}px`)
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const categoryMatch = useMatch('/category/:slug')
  const activeRoot = categoryMatch?.params.slug ? getCategory(categoryMatch.params.slug)?.rootSlug : undefined

  return (
    <header ref={headerRef} className="sticky top-0 z-[500] border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 lg:gap-5 lg:px-6">
        <IconButton label={t('nav.openMenu')} className="lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
          <Menu className="size-5" aria-hidden />
        </IconButton>
        <Logo />
        <SearchBox className="hidden max-w-xl flex-1 md:block" shortcut />
        <nav aria-label={t('nav.primary')} className="ms-auto hidden items-center gap-1 lg:flex">
          {navItemsFor(role).map((item) => {
            const label = t(item.labelKey)
            const showBadge = item.badge === 'unread' && unread > 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={showBadge ? `${label}, ${t('header.unreadMessages', { count: unread })}` : undefined}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-10 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                <span className="relative">
                  <item.icon className="size-[1.125rem]" aria-hidden />
                  {item.badge === 'unread' && <UnreadDot count={unread} />}
                </span>
                <span className="hidden xl:inline">{label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="ms-auto flex items-center gap-1.5 lg:ms-0">
          <div className="hidden items-center gap-1.5 sm:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <NavLink
            to="/messages"
            className="relative grid size-10 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-2 lg:hidden"
            aria-label={unread > 0 ? `${t('nav.messages')}, ${t('header.unreadMessages', { count: unread })}` : t('nav.messages')}
          >
            <span className="relative">
              <MessageSquare className="size-[1.125rem]" aria-hidden />
              <UnreadDot count={unread} />
            </span>
          </NavLink>
          <ThemeToggle />
          <NavLink to="/settings" className="hidden lg:block" aria-label={t('nav.settings')}>
            {({ isActive }) => (
              <span className={cn('grid size-10 place-items-center rounded-[var(--radius-control)] hover:bg-surface-2', isActive ? 'text-primary' : 'text-ink-muted')}>
                <Settings className="size-[1.125rem]" aria-hidden />
              </span>
            )}
          </NavLink>
          <AccountChip />
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>
      <nav aria-label={t('nav.categories')} className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-[90rem] items-center gap-1 overflow-x-auto px-6 py-1.5 text-[0.8125rem]">
          <li className="me-1 border-e border-line pe-2">
            <CategoryMegaMenu />
          </li>
          {CATEGORY_CONFIGS.map((c) => (
            <li key={c.slug}>
              <NavLink
                to={`/category/${c.slug}`}
                aria-current={activeRoot === c.slug ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full px-3 whitespace-nowrap transition-colors',
                  activeRoot === c.slug ? 'bg-ink text-bg' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <CategoryIcon name={c.icon} className="size-3.5" />
                {t(`categories.${c.slug}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} unread={unread} />
    </header>
  )
}
