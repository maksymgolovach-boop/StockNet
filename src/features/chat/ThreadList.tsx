import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Paperclip, Search } from 'lucide-react'
import type { PartyRole } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import type { ThreadSummary } from '@/services/dealService'
import { useProducts } from '@/services/queries'
import { normalize } from '@/features/search/normalize'
import { cn } from '@/shared/lib/cn'
import { liveNow } from '@/shared/lib/dates'
import { EmptyState } from '@/shared/ui/states'
import { useChatUi } from './chatStore'
import type { Partner } from './usePartner'

function useShortTime() {
  const fmt = useFormat()
  return (iso: string) => {
    const d = new Date(iso)
    const today = liveNow()
    if (d.toDateString() === today.toDateString()) return fmt.date(iso, { hour: '2-digit', minute: '2-digit' })
    if (today.getTime() - d.getTime() < 6 * 86_400_000) return fmt.date(iso, { weekday: 'short' })
    return fmt.date(iso, { day: 'numeric', month: 'short' })
  }
}

interface Props {
  threads: ThreadSummary[]
  role: PartyRole
  activeId?: string
  resolve: (t: ThreadSummary) => Partner | undefined
}

export function ThreadList({ threads, role, activeId, resolve }: Props) {
  const { t } = useTranslation()
  const shortTime = useShortTime()
  const typing = useChatUi((s) => s.typing)
  const { data: products } = useProducts()
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const unreadOf = (x: ThreadSummary) => (role === 'buyer' ? x.unreadForBuyer : x.unreadForProducer)
  const productName = (id?: string) => products?.find((p) => p.id === id)?.name

  const q = normalize(query)
  const visible = threads.filter((x) => {
    if (unreadOnly && unreadOf(x) === 0) return false
    if (!q) return true
    return normalize(`${resolve(x)?.name ?? ''} ${productName(x.productId) ?? ''}`).includes(q)
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <label className="relative block">
          <span className="sr-only">{t('chat.searchThreads')}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('chat.searchThreads')}
            className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface ps-9 pe-3 text-sm"
          />
        </label>
        <div role="group" aria-label={t('chat.filterLabel')} className="flex gap-1 text-sm">
          {[false, true].map((u) => (
            <button
              key={String(u)}
              type="button"
              aria-pressed={unreadOnly === u}
              onClick={() => setUnreadOnly(u)}
              className={cn('h-8 rounded-full px-3 font-medium', unreadOnly === u ? 'bg-ink text-bg' : 'text-ink-muted hover:bg-surface-2')}
            >
              {u ? t('chat.unread') : t('chat.all')}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="p-3">
          <EmptyState compact title={t('chat.noThreads')} body={query || unreadOnly ? t('chat.noThreadsFiltered') : t('chat.noThreadsBody')} />
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label={t('chat.threads')}>
          {visible.map((x) => {
            const partner = resolve(x)
            const unread = unreadOf(x)
            const last = x.lastMessage
            const mine = last?.senderRole === role
            return (
              <li key={x.id}>
                <Link
                  to={`/messages/${x.id}`}
                  aria-current={x.id === activeId ? 'page' : undefined}
                  className={cn(
                    'flex gap-3 border-b border-line border-s-4 px-3 py-3 hover:bg-surface-2',
                    x.id === activeId ? 'border-s-primary bg-surface-2' : 'border-s-transparent',
                  )}
                >
                  {partner && <ProducerAvatar producer={partner} size="sm" />}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('min-w-0 flex-1 truncate', unread ? 'font-semibold' : 'font-medium')}>{partner?.name ?? '…'}</span>
                      <time dateTime={x.lastMessageAt} className={cn('shrink-0 text-xs tabular', unread ? 'font-semibold text-primary' : 'text-ink-subtle')}>
                        {shortTime(x.lastMessageAt)}
                      </time>
                    </div>
                    {productName(x.productId) && <span className="truncate text-xs text-ink-subtle">{productName(x.productId)}</span>}
                    <div className="flex items-center gap-2">
                      <span className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'text-ink' : 'text-ink-muted')}>
                        {typing[x.id] ? (
                          <span className="text-primary italic">{t('chat.typingShort')}</span>
                        ) : last ? (
                          <>
                            {mine && <span className="text-ink-subtle">{t('chat.you')}: </span>}
                            {last.attachments.length > 0 && <Paperclip className="me-1 inline size-3.5 align-[-2px]" aria-hidden />}
                            {last.text}
                          </>
                        ) : (
                          <span className="text-ink-subtle italic">{t('chat.newConversation')}</span>
                        )}
                      </span>
                      {unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary tabular">
                          {unread}
                          <span className="sr-only">{t('chat.unreadCount', { count: unread })}</span>
                        </span>
                      )}
                    </div>
                    {partner?.kind === 'producer' && partner.producer.verification.level === 'unverified' && (
                      <span className="mt-0.5">
                        <VerificationBadge level="unverified" />
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
