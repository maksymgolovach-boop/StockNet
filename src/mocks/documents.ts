import type { Document, DocumentType } from '@/types/models'
import { CERTIFICATIONS, type CertificationCode } from '@/config/certifications'
import { addDays, now } from '@/shared/lib/dates'
import type { Rng } from '@/shared/lib/random'
import type { ProducerSeed } from './producers'

const ISSUERS: Partial<Record<CertificationCode, string[]>> = {
  organic: ['Ecocert', 'Control Union', 'ABCG Bio'],
  pdo: ['European Commission (eAmbrosia)'],
  pgi: ['European Commission (eAmbrosia)'],
  halal: ['Halal Quality Control', 'Islamic Halal Council'],
  haccp: ['SGS', 'Bureau Veritas', 'TÜV SÜD'],
  ifs: ['DQS', 'TÜV SÜD', 'SGS'],
  globalgap: ['Control Union', 'SGS', 'Kiwa'],
  iso9001: ['TÜV Rheinland', 'SRAC', 'Bureau Veritas', 'DEKRA'],
  iso14001: ['TÜV Rheinland', 'SRAC', 'DNV'],
  ce: ['Notified Body 1020', 'Notified Body 0432', 'Notified Body 1488'],
  vde: ['VDE Prüf- und Zertifizierungsinstitut'],
  fsc: ['Preferred by Nature', 'SGS'],
  pefc: ['DIN CERTCO', 'Bureau Veritas'],
  reach: ['ECHA registration'],
  rohs: ['Intertek', 'SGS'],
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function producerDocuments(seed: ProducerSeed, rng: Rng): Document[] {
  const docs: Document[] = []
  const certs = seed.certs.filter((c) => CERTIFICATIONS[c].kind === 'certification')
  for (const code of certs) {
    const issued = addDays(now(), -rng.int(120, 900))
    let expires = addDays(issued, 365 * 3)
    if (seed.expiredCerts?.includes(code)) expires = addDays(now(), -rng.int(8, 70))
    else if (seed.expiringCerts?.includes(code)) expires = addDays(now(), rng.int(12, 55))
    else if (expires < addDays(now(), 90)) expires = addDays(now(), rng.int(200, 700))
    const label = CERTIFICATIONS[code].label
    docs.push({
      id: `doc-${seed.id}-${code}`,
      ownerType: 'producer',
      ownerId: seed.id,
      type: 'certificate',
      title: `${label} certificate`,
      certification: code,
      issuer: rng.pick(ISSUERS[code] ?? ['Accredited certification body']),
      issuedAt: issued.toISOString(),
      expiresAt: expires.toISOString(),
      verifiedByPlatform: seed.level !== 'unverified' && seed.level !== 'identity',
      fileName: `${slug(seed.name)}_${slug(label)}.pdf`,
      sizeKb: rng.int(180, 2400),
    })
  }
  const licenseIssued = addDays(now(), -rng.int(400, 2200))
  docs.push({
    id: `doc-${seed.id}-license`,
    ownerType: 'producer',
    ownerId: seed.id,
    type: 'license',
    title: 'Operating permit',
    issuer: 'Competent national authority',
    issuedAt: licenseIssued.toISOString(),
    expiresAt: addDays(licenseIssued, 365 * 10).toISOString(),
    verifiedByPlatform: seed.level !== 'unverified',
    fileName: `${slug(seed.name)}_operating-permit.pdf`,
    sizeKb: rng.int(120, 900),
  })
  if (seed.level === 'audited') {
    const auditAt = new Date(seed.verifiedAt)
    docs.push({
      id: `doc-${seed.id}-audit`,
      ownerType: 'producer',
      ownerId: seed.id,
      type: 'audit_report',
      title: 'Third-party supplier audit (summary)',
      issuer: seed.cityId.startsWith('de-') ? 'TÜV SÜD' : 'SGS',
      issuedAt: auditAt.toISOString(),
      expiresAt: addDays(auditAt, 365 * 2).toISOString(),
      verifiedByPlatform: true,
      fileName: `${slug(seed.name)}_audit-summary.pdf`,
      sizeKb: rng.int(600, 3200),
    })
  }
  return docs
}

const PRODUCT_DOCS: Record<string, { type: DocumentType; title: string; validityDays?: number }[]> = {
  'fresh-produce': [{ type: 'test_report', title: 'Pesticide residue analysis', validityDays: 120 }],
  dairy: [{ type: 'test_report', title: 'Microbiological analysis', validityDays: 90 }],
  meat: [{ type: 'test_report', title: 'Microbiological analysis', validityDays: 90 }],
  metals: [
    { type: 'datasheet', title: 'Technical datasheet' },
    { type: 'mill_test_certificate', title: 'Inspection certificate 3.1 (EN 10204) — current heat' },
  ],
  cables: [
    { type: 'datasheet', title: 'Technical datasheet' },
    { type: 'declaration_of_performance', title: 'Declaration of Performance (CPR)' },
  ],
  concrete: [
    { type: 'datasheet', title: 'Mix design / product datasheet' },
    { type: 'declaration_of_performance', title: 'Declaration of Performance' },
  ],
  aggregates: [
    { type: 'declaration_of_performance', title: 'Declaration of Performance' },
    { type: 'test_report', title: 'Grading curve and fines content', validityDays: 365 },
  ],
  timber: [
    { type: 'datasheet', title: 'Technical datasheet' },
    { type: 'declaration_of_performance', title: 'Declaration of Performance' },
  ],
  'agri-machinery': [
    { type: 'datasheet', title: 'Technical specification sheet' },
    { type: 'certificate', title: 'EC declaration of conformity (Machinery Directive)' },
  ],
  'agro-inputs': [
    { type: 'datasheet', title: 'Product label and technical datasheet' },
    { type: 'safety_data_sheet', title: 'Safety Data Sheet', validityDays: 1095 },
    { type: 'test_report', title: 'Batch analysis certificate', validityDays: 365 },
  ],
  plastics: [
    { type: 'datasheet', title: 'Technical datasheet' },
    { type: 'safety_data_sheet', title: 'Safety Data Sheet (REACH)', validityDays: 1095 },
  ],
}

export function productDocuments(productId: string, rootSlug: string, productName: string, verified: boolean, rng: Rng): Document[] {
  return (PRODUCT_DOCS[rootSlug] ?? []).map((spec, i) => {
    const issued = addDays(now(), -rng.int(10, 600))
    let expires = spec.validityDays ? addDays(issued, spec.validityDays) : undefined
    if (expires && expires < now() && rng.chance(0.6)) expires = addDays(now(), rng.int(70, 300))
    return {
      id: `doc-${productId}-${i}`,
      ownerType: 'product' as const,
      ownerId: productId,
      type: spec.type,
      title: spec.title,
      issuer: spec.type === 'test_report' ? rng.pick(['SGS', 'Eurofins', 'Intertek', 'Synevo Lab']) : 'Producer',
      issuedAt: issued.toISOString(),
      expiresAt: expires?.toISOString(),
      verifiedByPlatform: verified && spec.type !== 'datasheet',
      fileName: `${slug(productName).slice(0, 40)}_${slug(spec.title).slice(0, 30)}.pdf`,
      sizeKb: rng.int(90, 1800),
    }
  })
}
