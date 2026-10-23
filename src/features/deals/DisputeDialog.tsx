import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { Deal, DisputeReason, DisputeResolution } from '@/types/models'
import type { DisputeInput } from '@/services/dealService'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { LotRef } from './LineItemQuantity'

const REASONS: DisputeReason[] = ['quality', 'quantity', 'late', 'damaged', 'wrong_product', 'documents']
const RESOLUTIONS: DisputeResolution[] = ['refund', 'replacement', 'discount', 'return']

const schema = z.object({
  reason: z.enum(['quality', 'quantity', 'late', 'damaged', 'wrong_product', 'documents'], { message: 'dispute.errors.reason' }),
  resolution: z.enum(['refund', 'replacement', 'discount', 'return'], { message: 'dispute.errors.resolution' }),
  productIds: z.array(z.string()).min(1, 'dispute.errors.items'),
  description: z.string().trim().min(20, 'dispute.errors.description').max(2000, 'dispute.errors.tooLong'),
  attachments: z.array(z.string()),
})

type Values = z.infer<typeof schema>

export function DisputeDialog({ deal, open, onClose, onSubmit, submitting, error }: { deal: Deal; open: boolean; onClose: () => void; onSubmit: (input: DisputeInput) => void; submitting: boolean; error?: string }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState, setValue, control } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: undefined, resolution: undefined, productIds: deal.lineItems.map((li) => li.productId), description: '', attachments: [] },
  })
  const attachments = useWatch({ control, name: 'attachments' })
  const err = (k: keyof Values) => formState.errors[k]?.message
  const input = 'w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm aria-[invalid=true]:border-expired'
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('dispute.title', { id: deal.id })}
      closeLabel={t('common.close')}
      footer={
        <>
          {error && (
            <p role="alert" className="me-auto self-center text-sm text-expired">
              {error}
            </p>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="dispute-form" variant="danger" disabled={submitting}>
            {t('dispute.submit')}
          </Button>
        </>
      }
    >
      <form id="dispute-form" noValidate onSubmit={handleSubmit((v) => onSubmit(v))} className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{t('dispute.intro')}</p>
        <div className="flex flex-col gap-1">
          <label htmlFor="dispute-reason" className="text-xs font-medium text-ink-muted">
            {t('dispute.reason')} <span className="text-primary">*</span>
          </label>
          <select id="dispute-reason" {...register('reason')} aria-invalid={!!err('reason')} className={`${input} h-10`} defaultValue="">
            <option value="" disabled>
              {t('lots.form.choose')}
            </option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`dispute.reasons.${r}`)}
              </option>
            ))}
          </select>
          {err('reason') && <p className="text-xs text-expired">{t(err('reason') as string)}</p>}
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-medium text-ink-muted">
            {t('dispute.items')} <span className="text-primary">*</span>
          </legend>
          {deal.lineItems.map((li) => (
            <label key={li.productId} className="flex items-start gap-2 text-sm">
              <input type="checkbox" value={li.productId} {...register('productIds')} className="mt-1 size-4 accent-[var(--primary)]" />
              <span>
                {li.productName}
                <span className="ms-2">
                  <LotRef item={li} />
                </span>
              </span>
            </label>
          ))}
          {err('productIds') && <p className="text-xs text-expired">{t(err('productIds') as string)}</p>}
        </fieldset>
        <div className="flex flex-col gap-1">
          <label htmlFor="dispute-description" className="text-xs font-medium text-ink-muted">
            {t('dispute.description')} <span className="text-primary">*</span>
          </label>
          <textarea id="dispute-description" rows={5} {...register('description')} aria-invalid={!!err('description')} className={`${input} py-2`} placeholder={t('dispute.descriptionPlaceholder')} />
          {err('description') && <p className="text-xs text-expired">{t(err('description') as string)}</p>}
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-medium text-ink-muted">
            {t('dispute.resolution')} <span className="text-primary">*</span>
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {RESOLUTIONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
                <input type="radio" value={r} {...register('resolution')} className="accent-[var(--primary)]" />
                {t(`dispute.resolutions.${r}`)}
              </label>
            ))}
          </div>
          {err('resolution') && <p className="text-xs text-expired">{t(err('resolution') as string)}</p>}
        </fieldset>
        <div className="flex flex-col gap-1">
          <label htmlFor="dispute-files" className="text-xs font-medium text-ink-muted">
            {t('dispute.evidence')}
          </label>
          <input
            id="dispute-files"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => setValue('attachments', Array.from(e.target.files ?? []).map((f) => f.name))}
            className="text-sm file:me-3 file:h-9 file:rounded-[var(--radius-control)] file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm"
          />
          <p className="text-xs text-ink-subtle">{attachments.length ? attachments.join(', ') : t('dispute.evidenceHint')}</p>
        </div>
      </form>
    </Modal>
  )
}
