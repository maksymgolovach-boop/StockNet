import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import type { TrustFactor, TrustFactorScore, TrustScore as TrustScoreModel } from '@/types/models'
import { useFormat } from '@/features/i18n/useFormat'
import { Popover } from '@/shared/ui/Popover'
import { cn } from '@/shared/lib/cn'

const ORDER: TrustFactor[] = ['verification', 'onTimeDelivery', 'disputeRate', 'reviewRating', 'responseTime', 'repeatCustomers', 'accountAge']

const BAND_CLASS: Record<TrustScoreModel['band'], string> = {
  excellent: 'bg-verified text-surface',
  good: 'bg-verified-soft text-verified',
  fair: 'bg-expiring-soft text-expiring',
  low: 'bg-expired-soft text-expired',
}

function useRawLabel() {
  const { t } = useTranslation()
  const fmt = useFormat()
  return (f: TrustFactorScore) => {
    const raw = f.raw
    if (typeof raw === 'string') return t(`verification.levels.${raw}`)
    switch (f.factor) {
      case 'onTimeDelivery':
      case 'disputeRate':
      case 'repeatCustomers':
        return fmt.percent(raw, f.factor === 'disputeRate' ? 1 : 0)
      case 'responseTime':
        return t('trust.raw.hours', { count: Math.round(raw) })
      case 'reviewRating':
        return t('trust.raw.stars', { rating: fmt.number(raw, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })
      case 'accountAge':
        return raw >= 12 ? t('trust.raw.years', { count: Math.floor(raw / 12) }) : t('trust.raw.months', { count: raw })
      default:
        return String(raw)
    }
  }
}

export function TrustBreakdown({ trust }: { trust: TrustScoreModel }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const rawLabel = useRawLabel()
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">{t('trust.explainIntro')}</p>
      <table className="w-full text-sm">
        <caption className="sr-only">{t('trust.score')}</caption>
        <thead>
          <tr className="text-start text-xs text-ink-subtle">
            <th scope="col" className="pb-1 text-start font-medium">{t('trust.factor')}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t('trust.value')}</th>
            <th scope="col" className="pb-1 text-end font-medium">{t('trust.contribution')}</th>
          </tr>
        </thead>
        <tbody>
          {ORDER.map((key) => {
            const f = trust.breakdown[key]
            return (
              <tr key={key} className="border-t border-line align-top">
                <th scope="row" className="py-2 pe-2 text-start font-normal">
                  <span className="block font-medium">{t(`trust.factors.${key}`)}</span>
                  <span className="block text-xs text-ink-subtle">
                    {t(`trust.rules.${key}`)} · {t('trust.weight', { weight: Math.round(f.weight * 100) })}
                  </span>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden>
                    <span className={cn('block h-full rounded-full', f.score >= 70 ? 'bg-verified' : f.score >= 45 ? 'bg-expiring' : 'bg-expired')} style={{ width: `${f.score}%` }} />
                  </span>
                </th>
                <td className="py-2 text-end whitespace-nowrap tabular">
                  <span className="block">{rawLabel(f)}</span>
                  <span className="block text-xs text-ink-subtle">{t('trust.subScore', { score: f.score })}</span>
                </td>
                <td className="py-2 ps-2 text-end font-semibold whitespace-nowrap tabular">{t('trust.points', { points: fmt.number(f.points, { maximumFractionDigits: 1 }) })}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink">
            <th scope="row" colSpan={2} className="pt-2 text-start">{t('trust.total')}</th>
            <td className="pt-2 text-end text-base font-bold whitespace-nowrap tabular">{trust.score} / 100</td>
          </tr>
        </tfoot>
      </table>
      <p className="text-xs text-ink-subtle">{t('trust.computedAt', { date: fmt.date(trust.computedAt) })}</p>
    </div>
  )
}

/** Score pill that opens the transparent breakdown. */
export function TrustScoreButton({ trust, size = 'md' }: { trust: TrustScoreModel; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useTranslation()
  return (
    <Popover
      label={t('trust.explain')}
      width={420}
      trigger={({ open, toggle, id, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label={`${t('trust.score')}: ${trust.score} / 100, ${t(`trust.bands.${trust.band}`)}. ${t('trust.explain')}`}
          className={cn(
            'relative z-10 inline-flex items-center gap-1.5 rounded-full font-semibold tabular hover:opacity-90',
            BAND_CLASS[trust.band],
            size === 'lg' ? 'h-9 px-3.5 text-base' : size === 'md' ? 'h-7 px-2.5 text-sm' : 'h-5 px-2 text-[0.6875rem]',
          )}
        >
          {t('trust.scoreShort', { score: trust.score })}
          <Info className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden />
        </button>
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{t('trust.score')}</h3>
        <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', BAND_CLASS[trust.band])}>
          {trust.score} · {t(`trust.bands.${trust.band}`)}
        </span>
      </div>
      <TrustBreakdown trust={trust} />
    </Popover>
  )
}
