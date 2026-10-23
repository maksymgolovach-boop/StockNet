import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '@/types/models'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { chatTransport } from '@/services/chatTransport'
import { queryKeys } from '@/services/queries'
import { useChatUi } from './chatStore'

/** One app-wide connection: keeps thread lists, open conversations and unread badges live. */
export function useChatConnection() {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  const qc = useQueryClient()
  const setTyping = useChatUi((s) => s.setTyping)

  useEffect(
    () =>
      chatTransport.connect(role, actorId, (event) => {
        if (event.type === 'typing') {
          if (event.role !== role) setTyping(event.threadId, event.typing)
          return
        }
        if (event.type === 'deal') {
          for (const key of ['deal', 'deals', 'partnerships', 'producerLots', 'search', 'products']) void qc.invalidateQueries({ queryKey: [key] })
          return
        }
        if (event.type === 'thread') {
          void qc.invalidateQueries({ queryKey: queryKeys.threads(role, actorId) })
          return
        }
        const key = queryKeys.messages(role, actorId, event.type === 'message' ? event.message.threadId : event.threadId)
        qc.setQueryData<Message[]>(key, (prev) => {
          if (!prev) return prev
          if (event.type === 'message') return prev.some((m) => m.id === event.message.id) ? prev : [...prev, event.message]
          return prev.map((m) => (m.senderRole !== event.readerRole && !m.readAt ? { ...m, readAt: event.readAt } : m))
        })
      }),
    [role, actorId, qc, setTyping],
  )
}
