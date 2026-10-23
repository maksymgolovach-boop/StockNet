import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Attachment, Message } from '@/types/models'
import { useActorId, useDevStore } from '@/features/dev/devStore'
import { useFormat } from '@/features/i18n/useFormat'
import { chatTransport } from '@/services/chatTransport'
import { queryKeys, useThreadMessages } from '@/services/queries'
import { useChatUi } from './chatStore'

/** Messages, sending, typing state and read receipts for one open thread. */
export function useChat(threadId: string | undefined) {
  const role = useDevStore((s) => s.role)
  const actorId = useActorId()
  const { lang } = useFormat()
  const qc = useQueryClient()
  const messages = useThreadMessages(threadId)
  const typing = useChatUi((s) => (threadId ? (s.typing[threadId] ?? false) : false))
  const incomingUnread = (messages.data ?? []).some((m) => m.senderRole !== role && !m.readAt)
  const marking = useRef(false)

  useEffect(() => {
    if (!threadId || !incomingUnread || marking.current) return
    marking.current = true
    void chatTransport.markRead(threadId, role, actorId).finally(() => {
      marking.current = false
    })
  }, [threadId, incomingUnread, role, actorId])

  const mutation = useMutation({
    mutationFn: (input: { text: string; attachments: Omit<Attachment, 'id'>[] }) =>
      chatTransport.send({ threadId: threadId ?? '', role, partyId: actorId, lang, ...input }),
    onSuccess: (message) => {
      qc.setQueryData<Message[]>(queryKeys.messages(role, actorId, message.threadId), (prev) =>
        prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev,
      )
    },
  })

  const send = useCallback((text: string, attachments: Omit<Attachment, 'id'>[]) => mutation.mutateAsync({ text, attachments }), [mutation])

  return { messages, typing, send, sending: mutation.isPending, sendError: mutation.error, role, actorId }
}
