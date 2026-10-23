import type { Deal, LanguageCode, Review, ReviewCriterion } from '@/types/models'
import { addDays } from '@/shared/lib/dates'
import { createRng } from '@/shared/lib/random'
import { PRODUCER_SEEDS } from './producers'
import type { L10n } from './catalog/types'

const BUYER_LANG: Record<string, LanguageCode> = { b01: 'ro', b02: 'ro', b03: 'de', b04: 'de', b05: 'en', b06: 'ro' }

const POSITIVE: L10n[] = [
  {
    en: 'Material arrived exactly as specified, documents complete with the delivery. Smooth communication throughout.',
    de: 'Ware exakt wie spezifiziert, Unterlagen vollständig mit der Lieferung. Durchweg reibungslose Kommunikation.',
    ro: 'Marfa a sosit exact conform specificației, cu documentele complete la livrare. Comunicare fără probleme.',
  },
  {
    en: 'Reliable partner. Delivered a day early and the driver coordinated unloading with our site team.',
    de: 'Zuverlässiger Partner. Einen Tag früher geliefert, der Fahrer hat das Abladen mit unserer Baustelle abgestimmt.',
    ro: 'Partener de încredere. Au livrat cu o zi mai devreme, iar șoferul a coordonat descărcarea cu echipa de pe șantier.',
  },
  {
    en: 'Consistent quality across several orders now. Price was fair for the volume.',
    de: 'Gleichbleibende Qualität über mehrere Bestellungen. Preis für die Menge fair.',
    ro: 'Calitate constantă de la o comandă la alta. Preț corect pentru volumul comandat.',
  },
  {
    en: 'Quick quote, clear price tiers and no surprises on the invoice.',
    de: 'Schnelles Angebot, klare Preisstaffeln und keine Überraschungen auf der Rechnung.',
    ro: 'Ofertă rapidă, trepte de preț clare și fără surprize pe factură.',
  },
  {
    en: 'Excellent packaging and labelling, every batch traceable. Will order again.',
    de: 'Hervorragende Verpackung und Kennzeichnung, jede Charge rückverfolgbar. Wir bestellen wieder.',
    ro: 'Ambalare și etichetare excelente, fiecare lot trasabil. Vom comanda din nou.',
  },
]

const MIXED: L10n[] = [
  {
    en: 'Good product, but delivery slipped by two days and we had to reschedule the crew.',
    de: 'Gutes Produkt, aber die Lieferung verzögerte sich um zwei Tage und wir mussten umplanen.',
    ro: 'Produs bun, dar livrarea a întârziat două zile și a trebuit să reprogramăm echipa.',
  },
  {
    en: 'Quality fine overall; the test certificate only came after we asked twice.',
    de: 'Qualität insgesamt in Ordnung; das Prüfzeugnis kam erst nach zweimaliger Nachfrage.',
    ro: 'Calitate în general bună; certificatul de calitate a venit abia după ce l-am cerut de două ori.',
  },
  {
    en: 'Competitive price, communication a bit slow during the negotiation phase.',
    de: 'Wettbewerbsfähiger Preis, Kommunikation in der Verhandlungsphase etwas langsam.',
    ro: 'Preț competitiv, comunicarea a fost puțin lentă în faza de negociere.',
  },
]

const NEGATIVE: L10n[] = [
  {
    en: 'Part of the load did not match the ordered specification. Resolved eventually, but it cost us a week.',
    de: 'Ein Teil der Ladung entsprach nicht der bestellten Spezifikation. Schließlich gelöst, hat uns aber eine Woche gekostet.',
    ro: 'O parte din încărcătură nu corespundea specificației comandate. S-a rezolvat până la urmă, dar am pierdut o săptămână.',
  },
  {
    en: 'Late delivery without notice and missing delivery note. Expected better.',
    de: 'Verspätete Lieferung ohne Vorankündigung, Lieferschein fehlte. Wir hatten mehr erwartet.',
    ro: 'Livrare întârziată fără anunț și fără aviz de însoțire. Ne așteptam la mai mult.',
  },
]

const REPLIES: L10n[] = [
  {
    en: 'Thank you for the feedback — we look forward to the next project together.',
    de: 'Vielen Dank für Ihr Feedback – wir freuen uns auf das nächste gemeinsame Projekt.',
    ro: 'Vă mulțumim pentru feedback — așteptăm cu drag următorul proiect împreună.',
  },
  {
    en: 'We apologise for the delay. We have added a second dispatch slot to prevent this in future.',
    de: 'Wir entschuldigen uns für die Verzögerung. Ein zusätzlicher Versandslot soll das künftig verhindern.',
    ro: 'Ne cerem scuze pentru întârziere. Am adăugat un al doilea interval de expediere pentru a preveni situația pe viitor.',
  },
]

const clampStar = (n: number) => Math.max(1, Math.min(5, Math.round(n)))

export function buildReviews(deals: Deal[]): Review[] {
  const rng = createRng(4242)
  const producers = new Map(PRODUCER_SEEDS.map((p) => [p.id, p]))
  const reviews: Review[] = []
  const completed = deals.filter((d) => d.status === 'completed').sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  for (const deal of completed) {
    if (!rng.chance(0.82)) continue
    const producer = producers.get(deal.producerId)
    if (!producer) continue
    const base = 2.6 + producer.onTime * 2.4
    const noise = () => rng.float(-1.1, 0.6, 2)
    const ratings: Record<ReviewCriterion, number> = {
      quality: clampStar(base + noise()),
      conformity: clampStar(base + noise()),
      delivery: clampStar(base + noise() - (deal.onTime === false ? 1.6 : 0)),
      communication: clampStar(base + noise() + (producer.responseHours < 6 ? 0.4 : -0.3)),
      value: clampStar(base + noise()),
    }
    const overall = Math.round((Object.values(ratings).reduce((a, b) => a + b, 0) / 5) * 10) / 10
    const pool = overall >= 4.2 ? POSITIVE : overall >= 3 ? MIXED : NEGATIVE
    const lang = BUYER_LANG[deal.buyerId] ?? 'en'
    const createdAt = addDays(new Date(deal.updatedAt), rng.int(0, 6)).toISOString()
    const replyPick = overall < 4 ? REPLIES[1] : REPLIES[0]
    const review: Review = {
      id: `rv-${reviews.length + 1}`,
      dealId: deal.id,
      producerId: deal.producerId,
      buyerId: deal.buyerId,
      productIds: deal.lineItems.map((li) => li.productId),
      verifiedDeal: true,
      createdAt,
      ratings,
      overall,
      text: rng.pick(pool)[lang],
      contentLang: lang,
      photoCount: rng.chance(0.25) ? rng.int(1, 4) : 0,
      reply:
        rng.chance(0.45) && replyPick
          ? { text: replyPick[producer.contentLang], createdAt: addDays(new Date(createdAt), rng.int(1, 4)).toISOString() }
          : undefined,
      helpfulVotes: rng.int(0, 14),
    }
    reviews.push(review)
    deal.reviewId = review.id
  }
  return reviews
}
