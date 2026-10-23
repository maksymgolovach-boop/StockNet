export interface CurrencyConfig {
  code: string
  decimals: number
  compactDecimals: number
  mockRateFromEUR: number
  /** short local symbol for space-constrained labels (map pins), e.g. "lei" */
  localSymbol?: string
}

export const CURRENCIES = {
  EUR: { code: 'EUR', decimals: 2, compactDecimals: 0, mockRateFromEUR: 1 },
  USD: { code: 'USD', decimals: 2, compactDecimals: 0, mockRateFromEUR: 1.085 },
  RON: { code: 'RON', decimals: 2, compactDecimals: 0, mockRateFromEUR: 4.975, localSymbol: 'lei' },
} as const satisfies Record<string, CurrencyConfig>

export type CurrencyCode = keyof typeof CURRENCIES

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]
export const BASE_CURRENCY: CurrencyCode = 'EUR'

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in CURRENCIES
}
