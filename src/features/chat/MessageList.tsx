import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ShieldCheck } from 'lucide-react'
import type { Message, PartyRole } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { liveNow } from '@/shared/lib/dates'
import { MessageBubble } from './MessageBubble'

function SafetyNotice() {
  const { t } = useTranslation()
  return (
    <div role="note" className="mx-auto flex max-w-xl items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink-muted">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
      <p>{t('chat.safety')}</p>
    </div>
  )
}

function TypingIndicator({ name }: { name: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2" role="status">
      <span className="flex gap-1 rounded-2xl rounded-es-md border border-line bg-surface px-3.5 py-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-ink-subtle" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </span>
      <span className="text-xs text-ink-subtle">{t('chat.typing', { name })}</span>
    </div>
  )
}

export function MessageList({ messages, role, partnerName, typing, empty }: { messages: Message[]; role: PartyRole; partnerName: string; typing: boolean; empty: React.ReactNode }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const scroller = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const lastId = messages[messages.length - 1]?.id
  const lastMine = messages[messages.length - 1]?.senderRole === role

  const scrollToEnd = (behavior: ScrollBehavior = 'auto') => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }

  useLayoutEffect(() => {
    if (atBottom.current || lastMine) scrollToEnd()
    else setShowJump(true)
  }, [lastId, lastMine])

  useEffect(() => {
    if (typing && atBottom.current) scrollToEnd('smooth')
  }, [typing])

  const dayLabel = (iso: string) => {
    const d = new Date(iso)
    const today = liveNow()
    const yesterday = new Date(today.getTime() - 86_400_000)
    if (d.toDateString() === today.toDateString()) return t('chat.today')
    if (d.toDateString() === yesterday.toDateString()) return t('chat.yesterday')
    return fmt.date(iso, { dateStyle: 'long' })
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          if (atBottom.current) setShowJump(false)
        }}
        role="log"
        aria-live="polite"
        aria-label={t('chat.conversationWith', { name: partnerName })}
        className="flex h-full flex-col gap-3 overflow-y-auto px-3 py-4 md:px-5"
      >
        <SafetyNotice />
        {messages.length === 0 && empty}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || new Date(prev.sentAt).toDateString() !== new Date(m.sentAt).toDateString()
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="flex items-center gap-3 py-1 text-xs text-ink-subtle" role="separator">
                  <span className="h-px flex-1 bg-line" />
                  {dayLabel(m.sentAt)}
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              <MessageBubble message={m} mine={m.senderRole === role} senderName={partnerName} />
            </Fragment>
          )
        })}
        {typing && <TypingIndicator name={partnerName} />}
      </div>
      {showJump && (
        <button
          type="button"
          onClick={() => {
            scrollToEnd('smooth')
            setShowJump(false)
          }}
          className="absolute end-4 bottom-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-on-primary shadow-card"
        >
          <ArrowDown className="size-4" aria-hidden />
          {t('chat.newMessages')}
        </button>
      )}
    </div>
  )
}
