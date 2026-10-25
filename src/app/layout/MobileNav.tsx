import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { CurrencySwitcher } from '@/features/currency/CurrencySwitcher'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { CategoryTree } from '@/features/categories/CategoryTree'
import { Drawer } from '@/shared/ui/Drawer'
import { cn } from '@/shared/lib/cn'
import { navItemsFor } from './navItems'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn('flex h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium', isActive ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2')

export function MobileNav({ open, onClose, unread }: { open: boolean; onClose: () => void; unread: number }) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onClose={onClose} title={t('nav.menu')} closeLabel={t('nav.closeMenu')}>
      <nav aria-label={t('nav.primary')} className="flex flex-col gap-0.5 p-3">
        {navItemsFor().map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            <item.icon className="size-[1.125rem]" aria-hidden />
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.badge === 'unread' && unread > 0 && (
              <span className="rounded-full bg-accent px-2 text-xs font-semibold text-on-accent tabular">
                <span className="sr-only">{t('header.unreadMessages', { count: unread })}</span>
                <span aria-hidden>{unread}</span>
              </span>
            )}
          </NavLink>
        ))}
        <NavLink to="/settings" className={linkClass} onClick={onClose}>
          <Settings className="size-[1.125rem]" aria-hidden />
          {t('nav.settings')}
        </NavLink>
      </nav>
      <div className="border-t border-line p-3">
        <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('nav.categories')}</p>
        <CategoryTree onNavigate={onClose} />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
        <LanguageSwitcher compact={false} showLabel />
        <CurrencySwitcher compact={false} showLabel />
      </div>
    </Drawer>
  )
}
