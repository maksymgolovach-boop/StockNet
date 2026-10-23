import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCheck, Languages } from 'lucide-react'
import type { Message } from '@/types/models'
import { LANGUAGES } from '@/config/languages'
import { useFormat } from '@/features/i18n/useFormat'
import { cn } from '@/shared/lib/cn'
import { AttachmentChip } from './AttachmentChip'

export function MessageBubble({ message, mine, senderName }: { message: Message; mine: boolean; senderName: string }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const [translated, setTranslated] = useState(false)
  const translation = message.contentLang !== fmt.lang ? message.mockTranslations[fmt.lang] : undefined
  const showTranslation = translated && translation !== undefined
  const time = fmt.date(message.sentAt, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'flex max-w-[min(36rem,85%)] flex-col gap-2 rounded-2xl px-3.5 py-2.5 shadow-card',
          mine ? 'rounded-ee-md bg-ink text-bg' : 'rounded-es-md border border-line bg-surface text-ink',
        )}
      >
        <span className="sr-only">{mine ? t('chat.you') : senderName}:</span>
        {message.text && (
          <p className="text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap" lang={showTranslation ? fmt.lang : message.contentLang}>
            {showTranslation ? translation : message.text}
          </p>
        )}
        {message.attachments.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {message.attachments.map((a) => (
              <li key={a.id}>
                <AttachmentChip attachment={a} tone={mine ? 'dark' : 'light'} />
              </li>
            ))}
          </ul>
        )}
        <div className={cn('flex items-center justify-end gap-1 text-[0.6875rem] tabular', mine ? 'text-bg/70' : 'text-ink-subtle')}>
          {showTranslation && <span className="me-auto pe-2">{t('translate.machineLabel')}</span>}
          <time dateTime={message.sentAt}>{time}</time>
          {mine &&
            (message.readAt ? (
              <CheckCheck className="size-3.5 text-[#7cc4ff]" aria-label={t('chat.read')} />
            ) : (
              <Check className="size-3.5" aria-label={t('chat.sent')} />
            ))}
        </div>
      </div>
      {translation !== undefined && (
        <button type="button" onClick={() => setTranslated((v) => !v)} className="inline-flex items-center gap-1 px-1 text-xs font-medium text-primary hover:underline">
          <Languages className="size-3.5" aria-hidden />
          {showTranslation ? t('translate.showOriginal', { language: LANGUAGES[message.contentLang].nativeName }) : t('translate.translateTo', { language: LANGUAGES[fmt.lang].nativeName })}
        </button>
      )}
    </div>
  )
}
