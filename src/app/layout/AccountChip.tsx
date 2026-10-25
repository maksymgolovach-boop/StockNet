import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCompany } from '@/features/dev/devStore'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

/** Shows the logged-in company. */
export function AccountChip() {
  const { t } = useTranslation()
  const company = useCompany()
  const name = company.name
  const label = t('header.signedInAs', { name })
  return (
    <Link to="/dashboard" aria-label={label} title={label} className="hidden items-center gap-2 rounded-full border border-line py-1 pe-3 ps-1 hover:bg-surface-2 md:flex">
      <span className="grid size-7 place-items-center rounded-full bg-ink text-[0.6875rem] font-semibold text-bg" aria-hidden>
        {name ? initials(name) : '·'}
      </span>
      <span className="max-w-32 truncate text-[0.8125rem] font-medium">{name ?? '…'}</span>
    </Link>
  )
}
