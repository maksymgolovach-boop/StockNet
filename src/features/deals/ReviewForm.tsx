import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import type { ReviewCriterion } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import type { ReviewInput } from '@/services/dealService'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const CRITERIA: ReviewCriterion[] = ['quality', 'conformity', 'delivery', 'communication', 'value']

function StarInput({ name, value, onChange, label }: { name: string; value: number; onChange: (v: number) => void; label: string }) {
  const { t } = useTranslation()
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-2">
      <legend className="float-left text-sm">{label}</legend>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-0.5">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <Star className={cn('size-6 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)]', n <= value ? 'fill-accent text-accent' : 'text-line-strong')} aria-hidden />
            <span className="sr-only">{t('reviewForm.stars', { count: n })}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ReviewForm({ onSubmit, submitting, error }: { onSubmit: (input: ReviewInput) => void; submitting: boolean; error?: string }) {
  const { t } = useTranslation()
  const { lang } = useFormat()
  const [ratings, setRatings] = useState<Record<ReviewCriterion, number>>({ quality: 0, conformity: 0, delivery: 0, communication: 0, value: 0 })
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState(0)
  const [touched, setTouched] = useState(false)
  const missing = CRITERIA.filter((c) => ratings[c] === 0)
  const textError = text.trim().length < 10
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        if (missing.length || textError) return
        onSubmit({ ratings, text, lang, photoCount: photos })
      }}
    >
      <div className="flex flex-col gap-1.5">
        {CRITERIA.map((c) => (
          <StarInput key={c} name={`rating-${c}`} value={ratings[c]} label={t(`reviews.criteriaNames.${c}`)} onChange={(v) => setRatings((r) => ({ ...r, [c]: v }))} />
        ))}
        {touched && missing.length > 0 && <p className="text-xs text-expired">{t('reviewForm.rateAll')}</p>}
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
        {t('reviewForm.text')}
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={touched && textError} className="rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 py-2 text-sm text-ink aria-[invalid=true]:border-expired" />
      </label>
      {touched && textError && <p className="text-xs text-expired">{t('reviewForm.textShort')}</p>}
      <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
        {t('reviewForm.photos')}
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files?.length ?? 0)} className="text-sm file:me-3 file:h-9 file:rounded-[var(--radius-control)] file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-expired">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="self-start">
        {t('reviewForm.submit')}
      </Button>
    </form>
  )
}
