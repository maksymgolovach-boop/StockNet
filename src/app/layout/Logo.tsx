import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Logo() {
  const { t } = useTranslation()
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md" aria-label={`${t('app.name')} — ${t('nav.home')}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="7" className="fill-primary" />
        <path d="M7 21.5 13 11l4.2 6.3 2.3-3.4L25 21.5" fill="none" className="stroke-on-primary" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">{t('app.name')}</span>
    </Link>
  )
}
