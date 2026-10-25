import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '@/types/models'
import { useCompanyIds } from '@/features/dev/devStore'
import { chatTransport } from '@/services/chatTransport'
import { queryKeys } from '@/services/queries'
import { useChatUi } from './chatStore'

/** Opens one connection per company side: keeps thread lists, open conversations and unread badges live. */
export function useChatConnection() {
  const { buyerId, producerId } = useCompanyIds()
  const qc = useQueryClient()
  const setTyping = useChatUi((s) => s.setTyping)

  useEffect(() => {
    const sides = [['buyer', buyerId], ['producer', producerId]] as const
    const offs = sides.map(([side, actorId]) =>
      chatTransport.connect(side, actorId, (event) => {
        if (event.type === 'typing') {
          if (event.role !== side) setTyping(event.threadId, event.typing)
          return
        }
        if (event.type === 'deal') {
          for (const key of ['deal', 'deals', 'partnerships', 'producerLots', 'search', 'products']) void qc.invalidateQueries({ queryKey: [key] })
          return
        }
        if (event.type === 'thread') {
          void qc.invalidateQueries({ queryKey: ['threads'] })
          return
        }
        const key = queryKeys.messages(side, actorId, event.type === 'message' ? event.message.threadId : event.threadId)
        qc.setQueryData<Message[]>(key, (prev) => {
          if (!prev) return prev
          if (event.type === 'message') return prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
          return prev.map((m) => (m.senderRole !== event.readerRole && !m.readAt ? { ...m, readAt: event.readAt } : m))
        })
        void qc.invalidateQueries({ queryKey: ['threads'] })
      }),
    )
    return () => offs.forEach((off) => off())
  }, [buyerId, producerId, qc, setTyping])
}
