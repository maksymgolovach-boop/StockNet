import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useChatConnection } from '@/features/chat/useChatConnection'
import { DevMenu } from '@/features/dev/DevMenu'
import { Footer } from './Footer'
import { Header } from './Header'

export function AppShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  useChatConnection()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="sr-only z-[2000] rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t('nav.skipToContent')}
      </a>
      <div className="bg-ink px-4 py-1.5 text-center text-xs text-bg">{t('app.demoBanner')}</div>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <DevMenu />
    </div>
  )
}
