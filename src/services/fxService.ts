import type { ExchangeRates } from '@/types/models'
import { BASE_CURRENCY, CURRENCIES, CURRENCY_CODES, type CurrencyCode } from '@/config/currencies'
import { addDays, now } from '@/shared/lib/dates'
import { mockRequest } from './client'

/** Swap this implementation for an ECB / BNR / commercial FX feed. */
export interface FxProvider {
  getRates(): Promise<ExchangeRates>
}

export const mockFxProvider: FxProvider = {
  getRates: () =>
    mockRequest(
      () => ({
        base: BASE_CURRENCY,
        rates: Object.fromEntries(CURRENCY_CODES.map((c) => [c, CURRENCIES[c].mockRateFromEUR])) as Record<CurrencyCode, number>,
        updatedAt: addDays(now(), -0.125).toISOString(),
        indicative: true as const,
      }),
      { latencyFactor: 0.4 },
    ),
}

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rates: ExchangeRates): number {
  if (from === to) return amount
  const fromRate = rates.rates[from]
  const toRate = rates.rates[to]
  return (amount / fromRate) * toRate
}
