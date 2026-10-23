import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('nav.breadcrumb')} className="text-[0.8125rem] text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {item.to && !last ? (
                  <Link to={item.to} className="rounded hover:text-ink hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-ink' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden>
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
