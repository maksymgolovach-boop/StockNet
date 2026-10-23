import type { LanguageCode, PartyRole } from '@/types/models'

type L10n = Record<LanguageCode, string>
export type ReplyIntent = 'price' | 'delivery' | 'datasheet' | 'thanks' | 'generic'

const INTENT_WORDS: [ReplyIntent, RegExp][] = [
  ['datasheet', /datasheet|data sheet|datenblatt|fișa|fisa|certificat|zertifikat|certificate|sds|tds/i],
  ['delivery', /deliver|liefer|livr|transport|dap|exw|termin|deadline/i],
  ['price', /price|preis|preț|pret|offer|angebot|ofert|quote|cost/i],
  ['thanks', /thank|danke|mulțum|multum|perfect|great|super/i],
]

export function detectIntent(text: string): ReplyIntent {
  return INTENT_WORDS.find(([, re]) => re.test(text))?.[0] ?? 'generic'
}

const PRODUCER: Record<ReplyIntent, L10n> = {
  price: {
    en: 'Thanks for asking. I have attached our current price list for {product}. Volume tiers apply automatically from the second tier.',
    de: 'Danke für Ihre Anfrage. Anbei unsere aktuelle Preisliste für {product}. Die Mengenstaffeln gelten automatisch ab der zweiten Stufe.',
    ro: 'Mulțumim pentru întrebare. Atașat găsiți lista de prețuri actuală pentru {product}. Treptele de volum se aplică automat începând cu a doua treaptă.',
  },
  delivery: {
    en: 'For {product} we can usually dispatch within 3–5 working days of order confirmation. Tell me the delivery address and preferred date and I will confirm the slot.',
    de: 'Für {product} können wir in der Regel innerhalb von 3–5 Arbeitstagen nach Auftragsbestätigung versenden. Nennen Sie mir Lieferadresse und Wunschtermin, dann bestätige ich das Zeitfenster.',
    ro: 'Pentru {product} putem expedia de obicei în 3–5 zile lucrătoare de la confirmarea comenzii. Spuneți-mi adresa de livrare și data dorită și vă confirm intervalul.',
  },
  datasheet: {
    en: 'Of course. The technical datasheet and the current certificates for {product} are attached.',
    de: 'Selbstverständlich. Das technische Datenblatt und die aktuellen Zertifikate für {product} finden Sie im Anhang.',
    ro: 'Desigur. Fișa tehnică și certificatele actuale pentru {product} sunt atașate.',
  },
  thanks: {
    en: 'You are welcome. Let me know if you need anything else.',
    de: 'Gern geschehen. Melden Sie sich, wenn Sie noch etwas brauchen.',
    ro: 'Cu plăcere. Anunțați-mă dacă mai aveți nevoie de ceva.',
  },
  generic: {
    en: 'Thank you for your message. I will check with our production team and get back to you shortly.',
    de: 'Vielen Dank für Ihre Nachricht. Ich kläre das mit unserer Produktion und melde mich in Kürze.',
    ro: 'Vă mulțumim pentru mesaj. Verific cu echipa de producție și revin în scurt timp.',
  },
}

const BUYER: Record<ReplyIntent, L10n> = {
  price: {
    en: 'Thank you, the prices look fine. We will discuss internally and confirm the quantity tomorrow.',
    de: 'Danke, die Preise passen. Wir stimmen uns intern ab und bestätigen die Menge morgen.',
    ro: 'Mulțumim, prețurile sunt în regulă. Discutăm intern și confirmăm cantitatea mâine.',
  },
  delivery: {
    en: 'That timing works for us. Please deliver to our main warehouse, unloading is possible 7:00–15:00.',
    de: 'Der Termin passt uns. Bitte an unser Hauptlager liefern, Entladung ist 7:00–15:00 möglich.',
    ro: 'Termenul ne convine. Vă rugăm să livrați la depozitul principal, descărcarea este posibilă între 7:00 și 15:00.',
  },
  datasheet: {
    en: 'Received, thank you. I have forwarded the documents to our quality manager.',
    de: 'Erhalten, danke. Ich habe die Unterlagen an unsere Qualitätsmanagerin weitergeleitet.',
    ro: 'Am primit, mulțumim. Am trimis documentele responsabilului nostru de calitate.',
  },
  thanks: {
    en: 'Thank you as well, talk soon.',
    de: 'Ebenfalls danke, bis bald.',
    ro: 'Mulțumim și noi, vorbim curând.',
  },
  generic: {
    en: 'Noted, thank you. We will come back to you after our planning meeting.',
    de: 'Notiert, danke. Wir melden uns nach unserer Planungsbesprechung.',
    ro: 'Am notat, mulțumim. Revenim după ședința de planificare.',
  },
}

const ATTACHMENTS: Partial<Record<ReplyIntent, { fileName: string; kind: 'pdf'; sizeKb: number }>> = {
  price: { fileName: 'price-list-2026-Q4.pdf', kind: 'pdf', sizeKb: 284 },
  datasheet: { fileName: 'technical-datasheet.pdf', kind: 'pdf', sizeKb: 612 },
}

export function buildReply(intent: ReplyIntent, from: PartyRole, product: string) {
  const source = from === 'producer' ? PRODUCER[intent] : BUYER[intent]
  const text = Object.fromEntries(Object.entries(source).map(([k, v]) => [k, v.replace('{product}', product)])) as L10n
  return { text, attachment: from === 'producer' ? ATTACHMENTS[intent] : undefined }
}
