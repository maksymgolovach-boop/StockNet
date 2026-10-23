export type CertificationKind = 'certification' | 'standard'

export interface CertificationConfig {
  label: string
  kind: CertificationKind
  /** true when the label is a generic concept that should be translated (e.g. "Organic") */
  translatable?: boolean
}

export const CERTIFICATIONS = {
  organic: { label: 'Organic (EU)', kind: 'certification', translatable: true },
  pdo: { label: 'PDO', kind: 'certification', translatable: true },
  pgi: { label: 'PGI', kind: 'certification', translatable: true },
  halal: { label: 'Halal', kind: 'certification' },
  haccp: { label: 'HACCP', kind: 'certification' },
  ifs: { label: 'IFS Food', kind: 'certification' },
  globalgap: { label: 'GLOBALG.A.P.', kind: 'certification' },
  iso9001: { label: 'ISO 9001', kind: 'certification' },
  iso14001: { label: 'ISO 14001', kind: 'certification' },
  en10025: { label: 'EN 10025', kind: 'standard' },
  en10080: { label: 'EN 10080', kind: 'standard' },
  sr438: { label: 'SR 438', kind: 'standard' },
  astmA615: { label: 'ASTM A615', kind: 'standard' },
  en10204: { label: 'EN 10204 3.1', kind: 'standard' },
  en485: { label: 'EN 485', kind: 'standard' },
  en755: { label: 'EN 755', kind: 'standard' },
  astmB115: { label: 'ASTM B115', kind: 'standard' },
  en1977: { label: 'EN 1977', kind: 'standard' },
  ce: { label: 'CE', kind: 'certification' },
  iec60228: { label: 'IEC 60228', kind: 'standard' },
  iec60502: { label: 'IEC 60502-1', kind: 'standard' },
  rohs: { label: 'RoHS', kind: 'certification' },
  vde: { label: 'VDE', kind: 'certification' },
  en50575: { label: 'EN 50575 (CPR)', kind: 'standard' },
  en206: { label: 'EN 206', kind: 'standard' },
  en1971: { label: 'EN 197-1', kind: 'standard' },
  en12620: { label: 'EN 12620', kind: 'standard' },
  en13242: { label: 'EN 13242', kind: 'standard' },
  fsc: { label: 'FSC', kind: 'certification' },
  pefc: { label: 'PEFC', kind: 'certification' },
  en14081: { label: 'EN 14081', kind: 'standard' },
  en13986: { label: 'EN 13986', kind: 'standard' },
  reach: { label: 'REACH', kind: 'certification' },
  eu10_2011: { label: 'EU 10/2011', kind: 'standard' },
  euStageV: { label: 'EU Stage V', kind: 'standard' },
  isobus: { label: 'AEF ISOBUS', kind: 'certification' },
  oecdTractor: { label: 'OECD Tractor Code', kind: 'standard' },
  euFertilizer: { label: 'EU 2019/1009 (CE fertiliser)', kind: 'standard' },
  pppAuthorised: { label: 'Authorised PPP (EC 1107/2009)', kind: 'certification', translatable: true },
  certifiedSeed: { label: 'Certified seed (C1)', kind: 'certification', translatable: true },
} as const satisfies Record<string, CertificationConfig>

export type CertificationCode = keyof typeof CERTIFICATIONS

export function isCertificationCode(value: string): value is CertificationCode {
  return value in CERTIFICATIONS
}
