import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Wrench } from 'lucide-react'
import { db } from '@/mocks'
import { clearStoredDeals } from '@/mocks/dealStorage'
import { clearStoredLots } from '@/mocks/lotStorage'
import { usePreferences } from '@/features/settings/preferencesStore'
import { safeStorage } from '@/shared/lib/storage'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { Select } from '@/shared/ui/Select'
import { useCompany, useCompanyIds, useDevStore } from './devStore'

const LATENCIES = [0, 150, 350, 800, 1500]

export function DevMenu() {
  const inChat = useLocation().pathname.startsWith('/messages')
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { simulateErrors, latencyMs, setSimulateErrors, setLatency } = useDevStore()
  const company = useCompany()
  const { buyerId, producerId } = useCompanyIds()
  const resetPrefs = usePreferences((s) => s.reset)
  const buyerName = db.buyers.find((b) => b.id === buyerId)?.name ?? buyerId
  const producerName = db.producers.find((p) => p.id === producerId)?.name ?? producerId

  const refresh = () => void qc.invalidateQueries()
  const counts: [string, number][] = [
    ['products', db.products.length],
    ['producers', db.producers.length],
    ['buyers', db.buyers.length],
    ['deals', db.deals.length],
    ['reviews', db.reviews.length],
    ['threads', db.threads.length],
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('fixed start-4 z-[900] flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink-muted shadow-pop hover:text-ink', inChat ? 'bottom-44 lg:bottom-4' : 'bottom-4')}
        aria-haspopup="dialog"
        aria-label={t('dev.menu')}
        title={t('dev.menu')}
      >
        <Wrench className="size-3.5" aria-hidden />
        
        {simulateErrors && <span className="size-2 rounded-full bg-accent" aria-hidden />}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t('dev.menu')} closeLabel={t('common.close')} side="end">
        <div className="flex flex-col gap-6 p-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('dev.company')}</p>
            <p className="font-medium">{company.name}</p>
            <dl className="mt-2 grid gap-1 rounded-md border border-line p-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{t('dev.buyerIdentity')}</dt>
                <dd className="text-end">
                  {buyerName} <span className="text-ink-subtle">({buyerId})</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{t('dev.producerIdentity')}</dt>
                <dd className="text-end">
                  {producerName} <span className="text-ink-subtle">({producerId})</span>
                </dd>
              </div>
            </dl>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span>{t('dev.simulateErrors')}</span>
            <input
              type="checkbox"
              role="switch"
              checked={simulateErrors}
              onChange={(e) => {
                setSimulateErrors(e.target.checked)
                refresh()
              }}
              className="size-4 accent-[var(--primary)]"
            />
          </label>
          <Select
            label={t('dev.latency')}
            value={String(latencyMs)}
            onChange={(e) => setLatency(Number(e.target.value))}
            options={LATENCIES.map((ms) => ({ value: String(ms), label: t('dev.latencyValue', { ms }) }))}
          />
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t('dev.dataset')}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 tabular">
              {counts.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line py-1">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-xs text-ink-muted">
            {t('dev.storage')}: {safeStorage.persistent ? t('dev.storagePersistent') : t('dev.storageMemory')}
          </p>
          <Button variant="secondary" onClick={resetPrefs}>
            {t('dev.resetPrefs')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearStoredLots()
              clearStoredDeals()
              window.location.reload()
            }}
          >
            {t('dev.resetLots')}
          </Button>
        </div>
      </Drawer>
    </>
  )
}
