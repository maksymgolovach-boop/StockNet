import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, SendHorizontal } from 'lucide-react'
import type { Attachment, PartyRole } from '@/types/models'
import { Button, IconButton } from '@/shared/ui/Button'
import { AttachmentChip } from './AttachmentChip'

type Draft = Omit<Attachment, 'id'>

const TEMPLATES: Record<PartyRole, string[]> = {
  buyer: ['priceList', 'delivery', 'datasheet'],
  producer: ['sendPriceList', 'confirmDelivery', 'shareDatasheet'],
}

function kindOf(file: File): Draft['kind'] {
  if (file.type.startsWith('image/')) return 'image'
  if (/\.(dwg|dxf|step|stp|igs)$/i.test(file.name)) return 'drawing'
  if (/\.(xlsx?|csv|ods)$/i.test(file.name)) return 'spreadsheet'
  return 'pdf'
}

const MAX_FILES = 5
const MAX_MB = 25

export function Composer({ role, productName, onSend, disabled }: { role: PartyRole; productName: string; onSend: (text: string, attachments: Draft[]) => Promise<unknown>; disabled?: boolean }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<Draft[]>([])
  const [error, setError] = useState<string | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  const canSend = (text.trim().length > 0 || files.length > 0) && !disabled

  const submit = async () => {
    if (!canSend) return
    const body = text.trim()
    const attachments = files
    setText('')
    setFiles([])
    setError(null)
    try {
      await onSend(body, attachments)
    } catch {
      setText(body)
      setFiles(attachments)
      setError(t('chat.sendFailed'))
    }
    area.current?.focus()
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const next: Draft[] = []
    for (const f of Array.from(list)) {
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(t('chat.fileTooLarge', { name: f.name, max: MAX_MB }))
        continue
      }
      next.push({ fileName: f.name, kind: kindOf(f), sizeKb: f.size / 1024, previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined })
    }
    setFiles((prev) => [...prev, ...next].slice(0, MAX_FILES))
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line bg-surface p-3">
      <div role="group" aria-label={t('chat.quickReplies')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {TEMPLATES[role].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setText(t(`chat.templates.${key}.text`, { product: productName }))
              area.current?.focus()
            }}
            className="h-8 shrink-0 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] font-medium whitespace-nowrap hover:border-primary hover:text-primary"
          >
            {t(`chat.templates.${key}.label`)}
          </button>
        ))}
      </div>
      {files.length > 0 && (
        <ul className="grid gap-1.5 sm:grid-cols-2" aria-label={t('chat.attachments')}>
          {files.map((f, i) => (
            <li key={`${f.fileName}-${i}`} className="min-w-0">
              <AttachmentChip attachment={f} onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))} />
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-expired">
          {error}
        </p>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          accept="image/*,.pdf,.dwg,.dxf,.step,.stp,.xlsx,.xls,.csv"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <IconButton label={t('chat.attach')} onClick={() => picker.current?.click()} disabled={files.length >= MAX_FILES}>
          <Paperclip className="size-5" aria-hidden />
        </IconButton>
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t('chat.messageLabel')}</span>
          <textarea
            ref={area}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void submit()
              }
            }}
            placeholder={t('chat.placeholder')}
            className="block max-h-40 min-h-10 w-full resize-none rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 py-2 text-[0.9375rem] leading-6"
          />
        </label>
        <Button type="submit" disabled={!canSend} aria-label={t('chat.send')} icon={<SendHorizontal className="size-4 rtl:rotate-180" aria-hidden />}>
          <span className="hidden sm:inline">{t('chat.send')}</span>
        </Button>
      </form>
      <p className="hidden text-[0.6875rem] text-ink-subtle md:block">{t('chat.hint', { max: MAX_FILES, mb: MAX_MB })}</p>
    </div>
  )
}
