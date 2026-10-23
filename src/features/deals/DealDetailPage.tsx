import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, MessageSquare, OctagonAlert, Repeat2 } from 'lucide-react'
import { NotFoundPage } from '@/app/NotFoundPage'
import { usePartners } from '@/features/chat/usePartner'
import { useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { NotFoundError } from '@/services/client'
import { useProducerReviews } from '@/services/queries'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { Button, ButtonLink } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { canDispute, transitionsFor, type DealTransition } from './dealRules'
import { DealStatusBadge } from './DealStatusBadge'
import { DealDetails, DealDocuments, DealThreadCard } from './DealSidePanels'
import { DealTimeline } from './DealTimeline'
import { DisputeDialog } from './DisputeDialog'
import { DisputePanel } from './DisputePanel'
import { LineItemsTable } from './LineItemsTable'
import { ReviewForm } from './ReviewForm'
import { useDeal, useDealMutations } from './useDeals'

export function DealDetailPage() {
  const { dealId = '' } = useParams()
  const { t } = useTranslation()
  const fmt = useFormat()
  const navigate = useNavigate()
  const role = useDevStore((s) => s.role)
  const deal = useDeal(dealId)
  const partners = usePartners(role)
  const m = useDealMutations()
  const reviews = useProducerReviews(deal.data?.producerId)
  const [confirm, setConfirm] = useState<DealTransition | null>(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const location = useLocation()
  const [notice, setNotice] = useState(() => (location.state as { notice?: string } | null)?.notice ?? '')

  useEffect(() => {
    document.title = `${dealId} · Stocknet`
  }, [dealId])

  if (deal.error instanceof NotFoundError) return <NotFoundPage />
  if (deal.isPending)
    return (
      <LoadingRegion>
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-6 lg:px-6">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-96" />
        </div>
      </LoadingRegion>
    )
  const d = deal.data
  if (deal.error || !d)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={deal.error} onRetry={() => void deal.refetch()} />
      </div>
    )

  const partner = partners.resolve(d)
  const partnerName = partner?.name ?? ''
  const messageLink = d.threadId ? `/messages/${d.threadId}` : role === 'buyer' ? `/messages?producer=${d.producerId}` : `/messages?buyer=${d.buyerId}`
  const actions = transitionsFor(d, role)
  const review = reviews.data?.find((r) => r.id === d.reviewId)

  const run = (tr: DealTransition) =>
    m.transition.mutate(
      { dealId: d.id, action: tr.action },
      {
        onSuccess: () => {
          setConfirm(null)
          setNotice(t(`dealDetail.done.${tr.action}`))
          if (tr.action === 'negotiate') navigate(messageLink)
        },
      },
    )

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 lg:px-6">
      <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('pages.deals'), to: '/deals' }, { label: d.id }]} />
      <header className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{d.id}</h1>
            <DealStatusBadge status={d.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {partner && <ProducerAvatar producer={partner} size="sm" />}
            {partner?.kind === 'producer' ? (
              <Link to={`/producer/${partner.id}`} className="font-semibold hover:text-primary hover:underline">
                {partnerName}
              </Link>
            ) : (
              <span className="font-semibold">{partnerName}</span>
            )}
            {partner?.kind === 'producer' && <TrustScoreButton trust={partner.producer.trust} size="sm" />}
            <span className="text-ink-muted">
              · {t('dealDetail.created', { date: fmt.date(d.createdAt, { dateStyle: 'medium' }) })} · {t('dealDetail.updated', { when: fmt.relative(d.updatedAt) })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {actions.map((tr) => (
            <Button key={tr.action} variant={tr.tone} disabled={m.transition.isPending} onClick={() => (tr.tone === 'danger' ? setConfirm(tr) : run(tr))}>
              {t(`dealDetail.actions.${tr.action}`)}
            </Button>
          ))}
          <ButtonLink to={messageLink} variant="secondary" icon={<MessageSquare className="size-4" aria-hidden />}>
            {t('dealDetail.messagePartner')}
          </ButtonLink>
          {role === 'buyer' && (
            <ButtonLink to={`/deals/new?reorder=${d.id}`} variant="secondary" icon={<Repeat2 className="size-4" aria-hidden />}>
              {t('dealDetail.reorder')}
            </ButtonLink>
          )}
          {canDispute(d, role) && (
            <Button variant="danger" icon={<OctagonAlert className="size-4" aria-hidden />} onClick={() => setDisputeOpen(true)}>
              {t('dealDetail.openDispute')}
            </Button>
          )}
        </div>
      </header>
      <p role="status" aria-live="polite" className={notice ? 'flex items-center gap-2 rounded-md bg-verified-soft px-3 py-2 text-sm text-verified' : 'sr-only'}>
        {notice && <CheckCircle2 className="size-4" aria-hidden />}
        {notice}
      </p>
      {m.transition.error && (
        <p role="alert" className="rounded-md bg-expired-soft px-3 py-2 text-sm text-expired">
          {m.transition.error.message}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <DisputePanel deal={d} role={role} resolving={m.resolveDispute.isPending} onResolve={(note) => m.resolveDispute.mutate({ dealId: d.id, note }, { onSuccess: () => setNotice(t('dispute.resolvedNotice')) })} />
          <section aria-labelledby="deal-items" className="flex flex-col gap-3">
            <h2 id="deal-items" className="text-lg font-semibold">
              {t('dealDetail.lineItems')}
            </h2>
            <LineItemsTable deal={d} />
          </section>
          {d.status === 'completed' && role === 'buyer' && (
            <section aria-labelledby="deal-review" className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-ink bg-surface p-4">
              <h2 id="deal-review" className="text-lg font-semibold">
                {d.reviewId ? t('reviewForm.doneTitle') : t('reviewForm.title', { name: partnerName })}
              </h2>
              {d.reviewId ? (
                <p className="text-sm text-ink-muted">
                  {review ? t('reviewForm.doneBody', { rating: fmt.number(review.overall, { minimumFractionDigits: 1 }) }) : t('reviewForm.doneShort')}{' '}
                  <Link to={`/producer/${d.producerId}?tab=reviews`} className="text-primary hover:underline">
                    {t('reviewForm.seeReviews')}
                  </Link>
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-muted">{t('reviewForm.intro')}</p>
                  <ReviewForm submitting={m.addReview.isPending} error={m.addReview.error?.message} onSubmit={(input) => m.addReview.mutate({ dealId: d.id, input }, { onSuccess: () => setNotice(t('reviewForm.thanks')) })} />
                </>
              )}
            </section>
          )}
          <DealDocuments deal={d} />
        </div>
        <aside className="flex flex-col gap-6">
          <section aria-labelledby="deal-timeline" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <h2 id="deal-timeline" className="text-lg font-semibold">
              {t('dealDetail.timeline')}
            </h2>
            <DealTimeline deal={d} />
          </section>
          <DealDetails deal={d} />
          <DealThreadCard deal={d} partnerName={partnerName} messageLink={messageLink} />
        </aside>
      </div>
      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm ? t(`dealDetail.confirm.${confirm.action}.title`, { id: d.id }) : ''}
        closeLabel={t('common.close')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              {t('dealDetail.confirm.keep')}
            </Button>
            <Button variant="danger" disabled={m.transition.isPending} onClick={() => confirm && run(confirm)}>
              {confirm ? t(`dealDetail.actions.${confirm.action}`) : ''}
            </Button>
          </>
        }
      >
        <p className="text-sm">{confirm ? t(`dealDetail.confirm.${confirm.action}.body`) : ''}</p>
      </Modal>
      {disputeOpen && (
        <DisputeDialog
          deal={d}
          open
          onClose={() => setDisputeOpen(false)}
          submitting={m.openDispute.isPending}
          error={m.openDispute.error?.message}
          onSubmit={(input) =>
            m.openDispute.mutate(
              { dealId: d.id, input },
              {
                onSuccess: () => {
                  setDisputeOpen(false)
                  setNotice(t('dispute.openedNotice'))
                },
              },
            )
          }
        />
      )}
    </div>
  )
}
