import { useTranslation } from 'react-i18next'
import { FxNotice } from '@/features/currency/FxNotice'
import { useFormat } from '@/features/i18n/useFormat'
import { DEMO_NOW } from '@/shared/lib/dates'

export function Footer() {
  const { t } = useTranslation()
  const fmt = useFormat()
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-6 text-xs text-ink-muted lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <FxNotice />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>{t('footer.demoDate', { date: fmt.date(DEMO_NOW.toISOString(), { dateStyle: 'long' }) })}</span>
          <span>{t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
