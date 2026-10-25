import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageSquareDashed, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { ProducerAvatar } from '@/features/producer/ProducerAvatar'
import { TrustScoreButton } from '@/features/trust/TrustScoreDisplay'
import { VerificationBadge } from '@/features/trust/VerificationBadge'
import { NotFoundError } from '@/services/client'
import { type CompanyThread, useProduct } from '@/services/queries'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Drawer } from '@/shared/ui/Drawer'
import { IconButton } from '@/shared/ui/Button'
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '@/shared/ui/states'
import { useChatUi } from './chatStore'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import { PartnerPanel } from './PartnerPanel'
import { PinnedContext } from './PinnedContext'
import { useChat } from './useChat'
import type { Partner } from './usePartner'

export function Conversation({ thread, partner }: { thread: CompanyThread; partner: Partner | undefined }) {
  const { t } = useTranslation()
  const chat = useChat(thread.id, thread.mySide)
  const product = useProduct(thread.productId ?? '')
  const wide = useMediaQuery('(min-width: 1280px)')
  const panelOpen = useChatUi((s) => s.panelOpen)
  const togglePanel = useChatUi((s) => s.togglePanel)
  const [drawer, setDrawer] = useState(false)
  const name = partner?.name ?? ''
  const showPanel = wide && panelOpen && partner

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <section aria-label={t('chat.conversationWith', { name })} className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg">
        <header className="flex items-center gap-2 border-b border-line bg-surface px-2 py-2 md:px-4">
          <Link to="/messages" className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:bg-surface-2 lg:hidden" aria-label={t('chat.back')}>
            <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
          </Link>
          {partner && <ProducerAvatar producer={partner} size="sm" />}
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="truncate font-semibold">{name}</h2>
            <div className="flex min-w-0 items-center gap-1.5">
              {partner && <VerificationBadge level={partner.kind === 'producer' ? partner.producer.verification.level : partner.buyer.verification.level} compact />}
              {partner?.kind === 'producer' && <TrustScoreButton trust={partner.producer.trust} size="sm" />}
              {chat.typing && <span className="truncate text-xs text-primary">{t('chat.typingShort')}</span>}
            </div>
          </div>
          {partner && (
            <IconButton
              label={t(wide && panelOpen ? 'chat.hidePanel' : 'chat.showPanel')}
              aria-expanded={wide ? panelOpen : drawer}
              aria-controls="partner-panel"
              onClick={() => (wide ? togglePanel() : setDrawer(true))}
            >
              {wide && panelOpen ? <PanelRightClose className="size-5" aria-hidden /> : <PanelRightOpen className="size-5" aria-hidden />}
            </IconButton>
          )}
        </header>
        <PinnedContext thread={thread} />
        {chat.messages.isPending ? (
          <LoadingRegion>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="ms-auto h-14 w-1/2" />
              <Skeleton className="h-20 w-3/5" />
            </div>
          </LoadingRegion>
        ) : chat.messages.error ? (
          <div className="flex-1 p-5">
            {chat.messages.error instanceof NotFoundError ? (
              <EmptyState title={t('chat.notFound')} body={t('chat.notFoundBody')} />
            ) : (
              <ErrorState error={chat.messages.error} onRetry={() => void chat.messages.refetch()} />
            )}
          </div>
        ) : (
          <MessageList
            messages={chat.messages.data ?? []}
            role={chat.role}
            partnerName={name}
            typing={chat.typing}
            empty={
              <div className="m-auto flex max-w-sm flex-col items-center gap-2 py-8 text-center">
                <MessageSquareDashed className="size-8 text-ink-subtle" aria-hidden />
                <p className="font-semibold">{t('chat.startTitle', { name })}</p>
                <p className="text-sm text-ink-muted">{t('chat.startBody')}</p>
              </div>
            }
          />
        )}
        <Composer role={chat.role} productName={product.data?.name ?? ''} onSend={chat.send} disabled={!chat.messages.data} />
      </section>
      {showPanel && (
        <aside id="partner-panel" aria-label={t('chat.aboutPartner')} className="w-80 shrink-0 overflow-y-auto border-s border-line bg-surface">
          <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">{t('chat.aboutPartner')}</h2>
          <PartnerPanel partner={partner} thread={thread} />
        </aside>
      )}
      {partner && !wide && (
        <Drawer open={drawer} onClose={() => setDrawer(false)} title={t('chat.aboutPartner')} closeLabel={t('common.close')} side="end">
          <div id="partner-panel">
            <PartnerPanel partner={partner} thread={thread} />
          </div>
        </Drawer>
      )}
    </div>
  )
}
