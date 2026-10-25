import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, FilePlus2, PackageX, PauseCircle } from 'lucide-react'
import { useUnreadCount } from '@/app/layout/useUnreadCount'
import { sideForDeal } from '@/features/company/company'
import { ACTIVE_STATUSES, OPEN_QUOTE_STATUSES, transitionsFor } from '@/features/deals/dealRules'
import { useCompany, useCompanyIds } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { availableLots, lotStatus } from '@/features/lots/lotMath'
import { useProducerLots } from '@/features/lots/stock/useLotMutations'
import { ReasonChip } from '@/features/recommendations/ReasonChip'
import { useRecommendations } from '@/features/recommendations/useRecommendations'
import { useSaved } from '@/features/saved/savedStore'
import { useMyDeals } from '@/services/queries'
import { daysFromNow } from '@/shared/lib/dates'
import { ButtonLink } from '@/shared/ui/Button'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { ConversationsWidget, DealRows, Empty, RecentSearchesWidget, SavedWidget, StatTiles, Widget } from './widgets'

function RecoWidget() {
  const { t } = useTranslation()
  const { data, isPending } = useRecommendations(4)
  return (
    <Widget title={t('reco.title')} action={{ to: '/', label: t('common.viewAll') }}>
      {isPending ? (
        <Skeleton className="h-40" />
      ) : !data?.items.length ? (
        <Empty>{t('reco.empty')}</Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {data.items.map((i) => (
            <li key={i.product.id} className="flex flex-col gap-0.5 py-2">
              <Link to={`/product/${i.product.id}`} className="truncate text-sm font-medium hover:text-primary" lang={i.product.contentLang}>
                {i.product.name}
              </Link>
              <span className="truncate text-xs text-ink-muted">{i.producer.name}</span>
              {i.recommendation.reasons[0] && <ReasonChip reason={i.recommendation.reasons[0]} />}
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

function StockAlerts() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const lots = useProducerLots()
  const alerts = (lots.data ?? []).flatMap(({ product, lot }) => {
    const status = lotStatus(lot)
    const out: { key: string; icon: typeof PackageX; text: string; to: string }[] = []
    if (status === 'available' && availableLots(lot) <= 2) out.push({ key: `${lot.id}-low`, icon: PackageX, text: t('dashboard.alerts.low', { number: lot.lotNumber, count: availableLots(lot) }), to: '/stock' })
    if (lot.expiryDate && status !== 'archived' && daysFromNow(lot.expiryDate) <= 7)
      out.push({ key: `${lot.id}-exp`, icon: CalendarClock, text: t('dashboard.alerts.expiry', { number: lot.lotNumber, date: fmt.date(lot.expiryDate) }), to: `/product/${product.id}?lot=${lot.id}` })
    if (status === 'paused') out.push({ key: `${lot.id}-paused`, icon: PauseCircle, text: t('dashboard.alerts.paused', { number: lot.lotNumber }), to: '/stock' })
    if (status === 'sold') out.push({ key: `${lot.id}-sold`, icon: PackageX, text: t('dashboard.alerts.sold', { number: lot.lotNumber }), to: '/stock' })
    return out
  })
  return (
    <Widget title={t('dashboard.stockAlerts')} action={{ to: '/stock', label: t('nav.stock') }}>
      {lots.isPending ? (
        <Skeleton className="h-32" />
      ) : !alerts.length ? (
        <Empty>{t('dashboard.noAlerts')}</Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {alerts.map((a) => (
            <li key={a.key}>
              <Link to={a.to} className="flex items-center gap-2 py-2 text-sm hover:text-primary">
                <a.icon className="size-4 shrink-0 text-accent" aria-hidden />
                {a.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { buyerId, producerId } = useCompanyIds()
  const company = useCompany()
  const deals = useMyDeals()
  const unread = useUnreadCount()
  const saved = useSaved()
  const name = company.name

  useEffect(() => {
    document.title = `${t('pages.dashboard')} · Stocknet`
  }, [t])

  const list = [...(deals.data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const buyQuotes = list.filter((d) => d.buyerId === buyerId && OPEN_QUOTE_STATUSES.has(d.status))
  const sellQuotes = list.filter((d) => d.producerId === producerId && OPEN_QUOTE_STATUSES.has(d.status))
  const active = list.filter((d) => ACTIVE_STATUSES.has(d.status) && !OPEN_QUOTE_STATUSES.has(d.status))
  const needsMe = list.filter((d) => {
    const side = sideForDeal(d, { buyerId, producerId })
    return side && transitionsFor(d, side).some((tr) => tr.tone === 'primary')
  })

  const stats = [
    { label: t('dashboard.stats.quotes'), value: String(buyQuotes.length), to: '/deals?status=quote_request,quote_received,negotiation' },
    { label: t('dashboard.stats.requests'), value: String(sellQuotes.length), to: '/deals?status=quote_request,quote_received,negotiation' },
    { label: t('dashboard.stats.active'), value: String(active.length), to: '/deals?status=order_confirmed,in_delivery,delivered,disputed' },
    { label: t('dashboard.stats.toShip'), value: String(list.filter((d) => d.producerId === producerId && d.status === 'order_confirmed').length), to: '/deals?status=order_confirmed' },
    { label: t('dashboard.stats.unread'), value: String(unread), to: '/messages' },
    { label: t('dashboard.stats.saved'), value: String(saved.productIds.length + saved.producerIds.length), to: '#saved' },
  ]

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t('pages.dashboard')}</h1>
          <p className="text-sm text-ink-muted">{name ? t('dashboard.subtitle', { name }) : ' '}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/deals/new" icon={<FilePlus2 className="size-4" aria-hidden />}>
            {t('rfq.new')}
          </ButtonLink>
          <ButtonLink to="/stock?new=" variant="secondary">
            {t('lots.stock.newLot')}
          </ButtonLink>
        </div>
      </div>
      {deals.isPending ? (
        <LoadingRegion>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </LoadingRegion>
      ) : deals.error ? (
        <ErrorState error={deals.error} onRetry={() => void deals.refetch()} />
      ) : (
        <StatTiles stats={stats} />
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {needsMe.length > 0 && (
            <Widget title={t('dashboard.needsAction')} className="border-2 border-ink">
              <DealRows deals={needsMe.slice(0, 5)} empty="" />
            </Widget>
          )}
          <Widget title={t('dashboard.openQuotes')} action={{ to: '/deals?status=quote_request,quote_received,negotiation', label: t('common.viewAll') }}>
            {deals.isPending ? <Skeleton className="h-32" /> : <DealRows deals={buyQuotes.slice(0, 5)} empty={t('dashboard.noQuotes')} />}
          </Widget>
          <Widget title={t('dashboard.incomingRequests')} action={{ to: '/deals?status=quote_request,quote_received,negotiation', label: t('common.viewAll') }}>
            {deals.isPending ? <Skeleton className="h-32" /> : <DealRows deals={sellQuotes.slice(0, 5)} empty={t('dashboard.noQuotes')} />}
          </Widget>
          <Widget title={t('dashboard.activeDeals')} action={{ to: '/deals?status=order_confirmed,in_delivery,delivered,disputed', label: t('common.viewAll') }}>
            {deals.isPending ? <Skeleton className="h-32" /> : <DealRows deals={active.slice(0, 5)} empty={t('dashboard.noActive')} />}
          </Widget>
          <div id="saved" className="scroll-mt-[calc(var(--chrome-h,8rem)+1rem)]">
            <SavedWidget />
          </div>
          <StockAlerts />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <ConversationsWidget />
          <RecoWidget />
          <RecentSearchesWidget />
        </div>
      </div>
    </div>
  )
}
