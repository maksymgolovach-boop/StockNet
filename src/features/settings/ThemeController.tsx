import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemePreference } from '@/types/models'
import { safeStorage } from '@/shared/lib/storage'
import { IconButton } from '@/shared/ui/Button'
import { usePreferences } from './preferencesStore'

function useSystemDark() {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return dark
}

/** Applies the resolved theme to <html data-theme> (the inline script in index.html prevents a flash). */
export function ThemeController() {
  const theme = usePreferences((s) => s.theme)
  const systemDark = useSystemDark()
  useEffect(() => {
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
    document.documentElement.dataset.theme = resolved
    if (theme === 'system') safeStorage.removeItem('sy-theme')
    else safeStorage.setItem('sy-theme', resolved)
  }, [theme, systemDark])
  return null
}

const NEXT: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' }
const ICON: Record<ThemePreference, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = usePreferences((s) => s.theme)
  const setTheme = usePreferences((s) => s.setTheme)
  const Icon = ICON[theme]
  const next = NEXT[theme]
  return (
    <IconButton label={`${t('header.theme')}: ${t(`theme.${theme}`)} — ${t('theme.toggle', { mode: t(`theme.${next}`) })}`} onClick={() => setTheme(next)}>
      <Icon className="size-[1.125rem]" aria-hidden />
    </IconButton>
  )
}
