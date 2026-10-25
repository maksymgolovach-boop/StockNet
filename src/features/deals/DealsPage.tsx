import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, FilePlus2, SearchX } from 'lucide-react'
import { useCurrency } from '@/features/currency/useCurrency'
import { useFormat } from '@/features/i18n/useFormat'
import { Button, ButtonLink } from '@/shared/ui/Button'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { liveNow } from '@/shared/lib/dates'
import { downloadText, toCsv } from './csv'
import { parseDealFilters, serializeDealFilters, type DealFilters } from './dealFilters'
import { DealsFilterBar } from './DealsFilterBar'
import { DealsSummary } from './DealsSummary'
import { DealsTable } from './DealsTable'
import { useDealRows, type DealRow } from './useDealRows'

export function DealsPage() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const { display } = useCurrency()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseDealFilters(params), [params])
  const { all, rows, isPending, error, refetch } = useDealRows(filters)

  useEffect(() => {
    document.title = `${t('pages.deals')} · Stocknet`
  }, [t])

  const update = (patch: Partial<DealFilters>) => setParams(serializeDealFilters({ ...filters, ...patch }), { replace: true })

  const exportCsv = (list: DealRow[]) => {
    const separator = fmt.lang === 'en' ? ',' : ';'
    const n = (v: number) => (separator === ';' ? String(v).replace('.', ',') : String(v))
    const header = [
      t('csv.dealId'),
      t('csv.status'),
      t('csv.counterparty'),
      t('csv.products'),
      t('csv.lots'),
      t('csv.currency'),
      t('csv.total'),
      t('csv.totalDisplay', { currency: display }),
      t('csv.incoterm'),
      t('csv.created'),
      t('csv.updated'),
      t('csv.requestedDelivery'),
      t('csv.deliveredAt'),
    ]
    const body = list.map(({ deal, partner, displayTotal }) => [
      deal.id,
      t(`deals.status.${deal.status}`),
      partner?.name ?? '',
      deal.lineItems.map((li) => `${li.productName} (${n(li.quantity)} ${li.lot ? t('lots.unit') : li.unit})`).join(' | '),
      deal.lineItems.flatMap((li) => (li.lot ? [li.lot.lotNumber] : [])).join(' | '),
      deal.currency,
      n(deal.total),
      displayTotal === null ? '' : n(Math.round(displayTotal * 100) / 100),
      deal.incoterm,
      deal.createdAt.slice(0, 10),
      deal.updatedAt.slice(0, 10),
      deal.requestedDeliveryDate.slice(0, 10),
      deal.deliveredAt?.slice(0, 10) ?? '',
    ])
    downloadText(`stocknet-deals-${liveNow().toISOString().slice(0, 10)}.csv`, toCsv([header, ...body], separator))
  }

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t('pages.deals')}</h1>
          <p className="text-sm text-ink-muted">{t('dealsPage.subtitleCompany')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download className="size-4" aria-hidden />} onClick={() => exportCsv(rows)} disabled={!rows.length}>
            {t('dealsPage.export', { count: rows.length })}
          </Button>
          <ButtonLink to="/deals/new" icon={<FilePlus2 className="size-4" aria-hidden />}>
            {t('rfq.new')}
          </ButtonLink>
        </div>
      </div>
      {isPending ? (
        <LoadingRegion>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="mt-4 h-96" />
        </LoadingRegion>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <DealsSummary rows={rows} />
          <DealsFilterBar filters={filters} onChange={update} onReset={() => setParams(new URLSearchParams(), { replace: true })} all={all} />
          <p className="text-sm text-ink-muted" aria-live="polite">
            {t('dealsPage.showing', { count: rows.length, total: all.length })}
          </p>
          {rows.length ? (
            <DealsTable rows={rows} />
          ) : (
            <EmptyState
              icon={<SearchX className="size-5" aria-hidden />}
              title={all.length ? t('dealsPage.noMatch') : t('dealsPage.none')}
              body={all.length ? t('dealsPage.noMatchBody') : t('dealsPage.noneBody')}
              action={
                all.length ? (
                  <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    {t('common.clearAll')}
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}
    </div>
  )
}
