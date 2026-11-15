import type { Document, DocumentStatus } from '@/types/models'
import { daysFromNow } from '@/shared/lib/dates'

export const EXPIRING_SOON_DAYS = 60

export function documentStatus(doc: Pick<Document, 'expiresAt'>): DocumentStatus {
  if (!doc.expiresAt) return 'valid'
  const days = daysFromNow(doc.expiresAt)
  if (days < 0) return 'expired'
  if (days <= EXPIRING_SOON_DAYS) return 'expiring_soon'
  return 'valid'
}

export function hasValidCertificates(docs: Document[]): boolean {
  const certs = docs.filter((d) => d.type === 'certificate' || d.type === 'mill_test_certificate')
  return certs.length > 0 && certs.every((d) => documentStatus(d) !== 'expired')
}
