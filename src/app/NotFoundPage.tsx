import { useTranslation } from 'react-i18next'
import { SearchX } from 'lucide-react'
import { ButtonLink } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/states'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<SearchX className="size-5" aria-hidden />}
        title={t('errors.notFoundTitle')}
        body={t('errors.notFoundBody')}
        action={<ButtonLink to="/" variant="secondary" size="sm">{t('errors.goHome')}</ButtonLink>}
      />
    </div>
  )
}
