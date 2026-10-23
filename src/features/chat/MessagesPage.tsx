import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessagesSquare } from 'lucide-react'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { chatTransport } from '@/services/chatTransport'
import { useMyThreads } from '@/services/queries'
import { cn } from '@/shared/lib/cn'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { Conversation } from './Conversation'
import { ThreadList } from './ThreadList'
import { usePartners } from './usePartner'

function useOpenFromQuery() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  const started = useRef(false)
  const producer = params.get('producer')
  const buyer = params.get('buyer')
  const product = params.get('product') ?? undefined
  const target = role === 'buyer' ? producer : buyer
  useEffect(() => {
    if (!target || started.current) return
    started.current = true
    const input = role === 'buyer' ? { buyerId: actorId, producerId: target, productId: product } : { buyerId: target, producerId: actorId, productId: product }
    chatTransport
      .openThread(input)
      .then((thread) => navigate(`/messages/${thread.id}`, { replace: true }))
      .catch(() => navigate('/messages', { replace: true }))
  }, [target, role, actorId, product, navigate])
  return !!target
}

export function MessagesPage() {
  const { t } = useTranslation()
  const { threadId } = useParams()
  const role = useDevStore((s) => s.role)
  const threads = useMyThreads()
  const partners = usePartners(role)
  const opening = useOpenFromQuery()
  const thread = threads.data?.find((x) => x.id === threadId)

  useEffect(() => {
    document.title = `${t('pages.messages')} · Stocknet`
  }, [t])

  const loading = threads.isPending || partners.isPending || opening
  return (
    <div className="mx-auto flex h-[calc(100dvh-var(--chrome-h,8rem))] min-h-[30rem] max-w-[100rem] border-line 2xl:border-x">
      <h1 className="sr-only">{t('pages.messages')}</h1>
      <aside className={cn('min-h-0 w-full shrink-0 border-e border-line bg-surface lg:block lg:w-[22rem]', threadId ? 'hidden' : 'block')}>
        {loading ? (
          <LoadingRegion>
            <div className="flex flex-col gap-3 p-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </LoadingRegion>
        ) : threads.error ? (
          <div className="p-3">
            <ErrorState compact error={threads.error} onRetry={() => void threads.refetch()} />
          </div>
        ) : (
          <ThreadList threads={threads.data ?? []} role={role} activeId={threadId} resolve={partners.resolve} />
        )}
      </aside>
      <div className={cn('min-h-0 min-w-0 flex-1 lg:flex', threadId ? 'flex' : 'hidden')}>
        {thread ? (
          <Conversation key={thread.id} thread={thread} partner={partners.resolve(thread)} />
        ) : threadId && !loading && !threads.isFetching ? (
          <div className="m-auto p-6">
            <EmptyState title={t('chat.notFound')} body={t('chat.notFoundBody')} />
          </div>
        ) : (
          <div className="m-auto p-6">
            <EmptyState icon={<MessagesSquare className="size-5" aria-hidden />} title={t('chat.selectTitle')} body={t('chat.selectBody')} />
          </div>
        )}
      </div>
    </div>
  )
}
