import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Attachment, Message, PartyRole } from '@/types/models'
import { useCompanyIds } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { chatTransport } from '@/services/chatTransport'
import { queryKeys, useThreadMessages } from '@/services/queries'
import { useChatUi } from './chatStore'

/** Messages, sending, typing state and read receipts for one open thread. */
export function useChat(threadId: string | undefined, side: PartyRole) {
  const { buyerId, producerId } = useCompanyIds()
  const actorId = side === 'buyer' ? buyerId : producerId
  const { lang } = useFormat()
  const qc = useQueryClient()
  const messages = useThreadMessages(threadId, side, actorId)
  const typing = useChatUi((s) => (threadId ? (s.typing[threadId] ?? false) : false))
  const incomingUnread = (messages.data ?? []).some((m) => m.senderRole !== side && !m.readAt)
  const marking = useRef(false)

  useEffect(() => {
    if (!threadId || !incomingUnread || marking.current) return
    marking.current = true
    void chatTransport.markRead(threadId, side, actorId).finally(() => {
      marking.current = false
    })
  }, [threadId, incomingUnread, side, actorId])

  const mutation = useMutation({
    mutationFn: (input: { text: string; attachments: Omit<Attachment, 'id'>[] }) =>
      chatTransport.send({ threadId: threadId ?? '', role: side, partyId: actorId, lang, ...input }),
    onSuccess: (message) => {
      qc.setQueryData<Message[]>(queryKeys.messages(side, actorId, message.threadId), (prev) =>
        prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev,
      )
    },
  })

  const send = useCallback((text: string, attachments: Omit<Attachment, 'id'>[]) => mutation.mutateAsync({ text, attachments }), [mutation])

  return { messages, typing, send, sending: mutation.isPending, sendError: mutation.error, role: side, actorId }
}
