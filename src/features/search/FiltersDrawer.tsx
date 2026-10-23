import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { FilterPanel } from './filters/FilterPanel'
import type { SearchResponse } from './types'
import type { FiltersApi } from './useFilters'

interface FiltersDrawerProps {
  api: FiltersApi
  data: SearchResponse | undefined
  open: boolean
  onClose: () => void
  side: 'start' | 'bottom'
}

export function FiltersDrawer({ api, data, open, onClose, side }: FiltersDrawerProps) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onClose={onClose} title={t('filters.title')} closeLabel={t('common.close')} side={side}>
      <div className="px-4">
        <FilterPanel api={api} facets={data?.facets} />
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-line bg-surface p-3">
        <Button variant="secondary" className="flex-1" onClick={api.clearAll}>
          {t('common.clearAll')}
        </Button>
        <Button className="flex-[2]" onClick={onClose}>
          {t('filters.showResults', { count: data?.total ?? 0 })}
        </Button>
      </div>
    </Drawer>
  )
}
