/**
 * The demo runs against a fixed "now" so expiry badges, document states and
 * deal timelines stay coherent with the mock data regardless of the real date.
 */
export const DEMO_NOW = new Date('2026-10-16T09:00:00Z')

export function now(): Date {
  return DEMO_NOW
}

const BOOTED_AT = Date.now()

export function liveNow(): Date {
  return new Date(DEMO_NOW.getTime() + (Date.now() - BOOTED_AT))
}

const DAY_MS = 86_400_000

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

export function daysFromNow(iso: string): number {
  return daysBetween(now(), new Date(iso))
}

export function isoDate(date: Date): string {
  return date.toISOString()
}

export function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}
