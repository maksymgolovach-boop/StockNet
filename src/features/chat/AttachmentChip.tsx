import { useTranslation } from 'react-i18next'
import { Download, FileImage, FileSpreadsheet, FileText, PencilRuler, X } from 'lucide-react'
import type { Attachment } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { cn } from '@/shared/lib/cn'

const ICON = { image: FileImage, pdf: FileText, drawing: PencilRuler, spreadsheet: FileSpreadsheet }

export function formatSize(kb: number, fmt: ReturnType<typeof useFormat>) {
  return kb >= 1024 ? `${fmt.number(kb / 1024, { maximumFractionDigits: 1 })} MB` : `${fmt.number(Math.max(1, Math.round(kb)))} KB`
}

export function AttachmentChip({ attachment, onRemove, tone = 'light' }: { attachment: Omit<Attachment, 'id'>; onRemove?: () => void; tone?: 'light' | 'dark' }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const Icon = ICON[attachment.kind]
  return (
    <div className={cn('flex max-w-full min-w-0 items-center gap-2 rounded-lg border p-1.5 pe-2 text-start', tone === 'dark' ? 'border-white/25 bg-white/10' : 'border-line bg-surface')}>
      {attachment.kind === 'image' && attachment.previewUrl ? (
        <img src={attachment.previewUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
      ) : (
        <span className={cn('grid size-10 shrink-0 place-items-center rounded', tone === 'dark' ? 'bg-white/15' : 'bg-surface-2 text-ink-muted')}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{attachment.fileName}</span>
        <span className={cn('text-xs', tone === 'dark' ? 'opacity-75' : 'text-ink-subtle')}>
          {t(`chat.fileKinds.${attachment.kind}`)} · {formatSize(attachment.sizeKb, fmt)}
        </span>
      </span>
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={t('chat.removeAttachment', { name: attachment.fileName })} className="grid size-7 shrink-0 place-items-center rounded hover:bg-surface-2">
          <X className="size-4" aria-hidden />
        </button>
      ) : (
        <span title={t('docs.demoOnly')} className="grid size-7 shrink-0 place-items-center opacity-60">
          <Download className="size-4" aria-hidden />
          <span className="sr-only">{t('docs.demoOnly')}</span>
        </span>
      )}
    </div>
  )
}
