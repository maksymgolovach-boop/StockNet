import { useTranslation } from 'react-i18next'
import { LoadingRegion, Skeleton } from '@/shared/ui/states'

export function RouteFallback() {
  const { t } = useTranslation()
  return (
    <LoadingRegion label={t('common.loading')}>
      <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    </LoadingRegion>
  )
}
