import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Heart, History, X } from 'lucide-react'
import type { Deal } from '@/types/models'
import { usePartners } from '@/features/chat/usePartner'
import { useCurrency } from '@/features/currency/useCurrency'
import { DealStatusBadge } from '@/features/deals/DealStatusBadge'
import { useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { ProductPrice } from '@/features/product/ProductPrice'
import { useSaved } from '@/features/saved/savedStore'
import { useSearchHistory } from '@/features/search/searchHistoryStore'
import { useMyThreads, useProducers, useProducts } from '@/services/queries'
import { Skeleton } from '@/shared/ui/states'

export function Widget({ title, action, children, className = '' }: { title: string; action?: { to: string; label: string }; children: ReactNode; className?: string }) {
  const id = `w-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {action && (
          <Link to={action.to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {action.label}
            <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-center text-sm text-ink-muted">{children}</p>
}

export function StatTiles({ stats }: { stats: { label: string; value: string; to: string }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <li key={s.label}>
          <Link to={s.to} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:border-ink">
            <span className="text-xs text-ink-muted">{s.label}</span>
            <span className="text-3xl font-semibold tabular">{s.value}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function DealRows({ deals, empty }: { deals: Deal[]; empty: string }) {
  const fmt = useFormat()
  const role = useDevStore((s) => s.role)
  const partners = usePartners(role)
  const { format } = useCurrency()
  if (!deals.length) return <Empty>{empty}</Empty>
  return (
    <ul className="flex flex-col divide-y divide-line">
      {deals.map((d) => {
        const partner = partners.resolve(d)
        return (
          <li key={d.id} className="relative flex items-center gap-3 py-2.5">
            {partner && <ProducerAvatar producer={partner} size="sm" />}
            <div className="flex min-w-0 flex-1 flex-col">
              <Link to={`/deals/${d.id}`} className="truncate text-sm font-medium after:absolute after:inset-0 hover:text-primary">
                {partner?.name ?? d.id}
              </Link>
              <span className="truncate text-xs text-ink-muted">
                <span className="font-mono">{d.id}</span> · {d.lineItems[0]?.productName}
                {d.lineItems.length > 1 ? ` +${d.lineItems.length - 1}` : ''}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <DealStatusBadge status={d.status} />
              <span className="text-xs text-ink-muted tabular">
                {format(d.total, d.currency, { compact: true })} · {fmt.relative(d.updatedAt)}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ConversationsWidget() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const role = useDevStore((s) => s.role)
  const threads = useMyThreads()
  const partners = usePartners(role)
  const unreadOf = (x: { unreadForBuyer: number; unreadForProducer: number }) => (role === 'buyer' ? x.unreadForBuyer : x.unreadForProducer)
  const list = [...(threads.data ?? [])].sort((a, b) => unreadOf(b) - unreadOf(a) || b.lastMessageAt.localeCompare(a.lastMessageAt)).slice(0, 5)
  return (
    <Widget title={t('dashboard.conversations')} action={{ to: '/messages', label: t('common.viewAll') }}>
      {threads.isPending ? (
        <Skeleton className="h-40" />
      ) : !list.length ? (
        <Empty>{t('chat.noThreadsBody')}</Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {list.map((x) => {
            const partner = partners.resolve(x)
            const unread = unreadOf(x)
            return (
              <li key={x.id} className="relative flex items-center gap-3 py-2.5">
                {partner && <ProducerAvatar producer={partner} size="sm" />}
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/messages/${x.id}`} className={`truncate text-sm after:absolute after:inset-0 hover:text-primary ${unread ? 'font-semibold' : 'font-medium'}`}>
                    {partner?.name ?? x.id}
                  </Link>
                  <span className="truncate text-xs text-ink-muted">{x.lastMessage?.text ?? t('chat.newConversation')}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-ink-subtle">{fmt.relative(x.lastMessageAt)}</span>
                  {unread > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary tabular">
                      {unread}
                      <span className="sr-only">{t('chat.unreadCount', { count: unread })}</span>
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Widget>
  )
}

export function SavedWidget() {
  const { t } = useTranslation()
  const saved = useSaved()
  const products = useProducts()
  const producers = useProducers()
  const items = (products.data ?? []).filter((p) => saved.productIds.includes(p.id))
  const firms = (producers.data ?? []).filter((p) => saved.producerIds.includes(p.id))
  return (
    <Widget title={t('dashboard.saved')}>
      {products.isPending || producers.isPending ? (
        <Skeleton className="h-40" />
      ) : !items.length && !firms.length ? (
        <Empty>{t('dashboard.savedEmpty')}</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {items.length > 0 && (
            <ul className="flex flex-col divide-y divide-line" aria-label={t('dashboard.savedProducts')}>
              {items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${p.id}`} className="block truncate text-sm font-medium hover:text-primary" lang={p.contentLang}>
                      {p.name}
                    </Link>
                    <span className="text-xs text-ink-muted">{p.city}</span>
                  </div>
                  <div className="shrink-0 text-end text-sm">
                    <ProductPrice product={p} />
                  </div>
                  <button type="button" onClick={() => saved.toggleProduct(p.id)} aria-label={t('product.unsave')} title={t('product.unsave')} className="grid size-8 shrink-0 place-items-center rounded hover:bg-surface-2">
                    <Heart className="size-4 fill-primary text-primary" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {firms.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={t('dashboard.savedProducers')}>
              {firms.map((p) => (
                <li key={p.id} className="flex items-center gap-1 rounded-full border border-line-strong py-1 ps-1 pe-1">
                  <ProducerAvatar producer={p} size="sm" />
                  <Link to={`/producer/${p.id}`} className="px-1 text-sm font-medium hover:text-primary">
                    {p.name}
                  </Link>
                  <button type="button" onClick={() => saved.toggleProducer(p.id)} aria-label={t('map.unsave', { name: p.name })} className="grid size-7 place-items-center rounded-full hover:bg-surface-2">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Widget>
  )
}

export function RecentSearchesWidget() {
  const { t } = useTranslation()
  const { recent, remove, clear } = useSearchHistory()
  return (
    <Widget title={t('dashboard.recentSearches')}>
      {!recent.length ? (
        <Empty>{t('dashboard.noSearches')}</Empty>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <li key={q} className="flex items-center rounded-full border border-line-strong">
                <Link to={`/search?q=${encodeURIComponent(q)}`} className="flex items-center gap-1.5 py-1 ps-3 pe-1 text-sm hover:text-primary">
                  <History className="size-3.5 text-ink-subtle" aria-hidden />
                  {q}
                </Link>
                <button type="button" onClick={() => remove(q)} aria-label={t('search.removeRecent', { query: q })} className="grid size-7 place-items-center rounded-full hover:bg-surface-2">
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clear} className="self-start text-xs font-medium text-ink-muted hover:text-primary">
            {t('dashboard.clearSearches')}
          </button>
        </>
      )}
    </Widget>
  )
}
