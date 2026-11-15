import type { TrustFactor, TrustFactorScore, TrustInputs, TrustScore, VerificationLevel } from '@/types/models'

/** Public, documented weights — shown verbatim in the score explanation popover. */
export const TRUST_WEIGHTS: Record<TrustFactor, number> = {
  verification: 0.2,
  onTimeDelivery: 0.2,
  disputeRate: 0.15,
  reviewRating: 0.15,
  responseTime: 0.1,
  repeatCustomers: 0.1,
  accountAge: 0.1,
}

export const VERIFICATION_POINTS: Record<VerificationLevel, number> = {
  unverified: 10,
  identity: 45,
  verified: 80,
  audited: 100,
}

export const VERIFICATION_ORDER: VerificationLevel[] = ['unverified', 'identity', 'verified', 'audited']

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/** Each normaliser maps a raw value to 0–100; the rules are mirrored in the UI explanation. */
const NORMALISERS: Record<Exclude<TrustFactor, 'verification'>, (i: TrustInputs) => [number, number]> = {
  onTimeDelivery: (i) => [i.onTimeDeliveryRate, clamp(((i.onTimeDeliveryRate - 0.7) / 0.3) * 100)],
  responseTime: (i) => [i.avgResponseHours, clamp(100 - ((i.avgResponseHours - 2) / 46) * 100)],
  disputeRate: (i) => [i.disputeRate, clamp(100 - i.disputeRate * 1000)],
  repeatCustomers: (i) => [i.repeatCustomerRate, clamp((i.repeatCustomerRate / 0.8) * 100)],
  reviewRating: (i) => [i.avgRating, clamp(((i.avgRating - 1) / 4) * 100)],
  accountAge: (i) => [i.accountAgeMonths, clamp((i.accountAgeMonths / 60) * 100)],
}

function factor(f: TrustFactor, raw: number | VerificationLevel, score: number): TrustFactorScore {
  const rounded = Math.round(score)
  const weight = TRUST_WEIGHTS[f]
  return { factor: f, raw, score: rounded, weight, points: Number((rounded * weight).toFixed(1)) }
}

export function computeTrustScore(inputs: TrustInputs, computedAt: string): TrustScore {
  const breakdown = {
    verification: factor('verification', inputs.verificationLevel, VERIFICATION_POINTS[inputs.verificationLevel]),
  } as Record<TrustFactor, TrustFactorScore>
  for (const key of Object.keys(NORMALISERS) as Array<keyof typeof NORMALISERS>) {
    const [raw, score] = NORMALISERS[key](inputs)
    breakdown[key] = factor(key, raw, score)
  }
  const score = Math.round(Object.values(breakdown).reduce((sum, f) => sum + f.score * f.weight, 0))
  const band: TrustScore['band'] = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'low'
  return { score, band, breakdown, computedAt }
}

export function meetsVerification(level: VerificationLevel, min: VerificationLevel): boolean {
  return VERIFICATION_ORDER.indexOf(level) >= VERIFICATION_ORDER.indexOf(min)
}
