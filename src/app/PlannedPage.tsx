import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Construction } from 'lucide-react'
import { useCategoryConfig } from '@/features/categories/useCategoryConfig'
import { Breadcrumbs, type Crumb } from '@/shared/ui/Breadcrumbs'
import { EmptyState } from '@/shared/ui/states'
import { NotFoundPage } from './NotFoundPage'

interface PlannedPageProps {
  titleKey: string
  phase: number
}

/** Route target for views delivered in later build phases; keeps routing and breadcrumbs testable now. */
export function PlannedPage({ titleKey, phase }: PlannedPageProps) {
  const { t } = useTranslation()
  const { slug } = useParams()
  const category = useCategoryConfig(slug)
  if (slug && !category.category) return <NotFoundPage />

  const title = slug ? category.name : t(titleKey)
  const crumbs: Crumb[] = [
    { label: t('nav.home'), to: '/' },
    ...(slug ? category.path.map((p) => ({ label: p.name, to: `/category/${p.slug}` })) : [{ label: title }]),
  ]
  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-8 lg:px-6">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-semibold">{title}</h1>
      <EmptyState
        icon={<Construction className="size-5" aria-hidden />}
        title={t('pages.plannedTitle')}
        body={t('pages.plannedBody', { page: title, phase })}
      />
    </div>
  )
}
