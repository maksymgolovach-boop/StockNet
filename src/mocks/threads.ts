import type { Attachment, Deal, LanguageCode, Message, PartyRole, Product, Thread } from '@/types/models'
import { addDays, now } from '@/shared/lib/dates'
import type { L10n } from './catalog/types'

interface Line {
  from: PartyRole
  text: L10n
  attachment?: Omit<Attachment, 'id'>
}

const UNIT_LABEL: Record<string, string> = { t: 't', m: 'm', m3: 'm³', m2: 'm²', kg: 'kg', l: 'l', bag: 'bags', piece: 'pcs' }

const SCRIPTS: Record<string, Line[]> = {
  price: [
    {
      from: 'buyer',
      text: {
        en: 'Hello, could you send us your current price list for {product}? We need around {qty} {unit} for a site in Cluj-Napoca.',
        de: 'Guten Tag, könnten Sie uns Ihre aktuelle Preisliste für {product} schicken? Wir benötigen etwa {qty} {unit} für eine Baustelle in Cluj-Napoca.',
        ro: 'Bună ziua, ne puteți trimite lista de prețuri actuală pentru {product}? Avem nevoie de aproximativ {qty} {unit} pentru un șantier din Cluj-Napoca.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Thank you for your enquiry. Our price list is attached; for {qty} {unit} we can offer the second-tier price.',
        de: 'Vielen Dank für Ihre Anfrage. Anbei unsere Preisliste – für {qty} {unit} können wir Ihnen den Preis der zweiten Staffel anbieten.',
        ro: 'Mulțumim pentru solicitare. Atașat găsiți lista de prețuri; pentru {qty} {unit} vă putem oferi prețul din a doua treaptă.',
      },
      attachment: { fileName: 'price-list-Q4-2026.pdf', kind: 'pdf', sizeKb: 312 },
    },
    {
      from: 'buyer',
      text: {
        en: 'Thanks. What is the earliest delivery date, DAP Cluj-Napoca?',
        de: 'Danke. Was ist der früheste Liefertermin, DAP Cluj-Napoca?',
        ro: 'Mulțumim. Care este cea mai apropiată dată de livrare, DAP Cluj-Napoca?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'We can deliver within {days} working days after order confirmation.',
        de: 'Wir können innerhalb von {days} Arbeitstagen nach Auftragsbestätigung liefern.',
        ro: 'Putem livra în {days} zile lucrătoare de la confirmarea comenzii.',
      },
    },
  ],
  cert: [
    {
      from: 'buyer',
      text: {
        en: 'Could you share the certificates and latest test reports for {product}? Our site engineer needs them before approving the material.',
        de: 'Könnten Sie uns die Zertifikate und aktuellen Prüfberichte für {product} senden? Unser Bauleiter benötigt sie vor der Materialfreigabe.',
        ro: 'Ne puteți trimite certificatele și ultimele rapoarte de încercare pentru {product}? Dirigintele de șantier are nevoie de ele înainte de aprobarea materialului.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Of course — attached are the certificate and the latest test report. All documents are also in our document center on the platform.',
        de: 'Selbstverständlich – anbei das Zertifikat und der aktuelle Prüfbericht. Alle Unterlagen finden Sie auch in unserem Dokumentencenter auf der Plattform.',
        ro: 'Desigur — atașat găsiți certificatul și cel mai recent raport de încercare. Toate documentele sunt și în centrul nostru de documente de pe platformă.',
      },
      attachment: { fileName: 'certificates-and-test-report.pdf', kind: 'pdf', sizeKb: 1480 },
    },
    {
      from: 'buyer',
      text: {
        en: 'Received, thank you. We will confirm the order by Friday.',
        de: 'Erhalten, vielen Dank. Wir bestätigen die Bestellung bis Freitag.',
        ro: 'Am primit, mulțumim. Confirmăm comanda până vineri.',
      },
    },
  ],
  delivery: [
    {
      from: 'buyer',
      text: {
        en: 'Hi, any update on delivery for order {deal}? The site crew is planning for tomorrow morning.',
        de: 'Hallo, gibt es ein Update zur Lieferung für Auftrag {deal}? Die Baustelle plant für morgen früh.',
        ro: 'Bună, aveți vreo noutate despre livrarea pentru comanda {deal}? Echipa de pe șantier se pregătește pentru mâine dimineață.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'The truck was loaded this morning; expected arrival tomorrow between 8:00 and 10:00. The driver will call 30 minutes before.',
        de: 'Der Lkw wurde heute Morgen beladen; voraussichtliche Ankunft morgen zwischen 8:00 und 10:00 Uhr. Der Fahrer ruft 30 Minuten vorher an.',
        ro: 'Camionul a fost încărcat azi-dimineață; sosire estimată mâine între 8:00 și 10:00. Șoferul vă sună cu 30 de minute înainte.',
      },
      attachment: { fileName: 'loading-photo.jpg', kind: 'image', sizeKb: 2240 },
    },
    {
      from: 'buyer',
      text: {
        en: 'Perfect, we will have the crane ready.',
        de: 'Perfekt, wir halten den Kran bereit.',
        ro: 'Perfect, vom avea macaraua pregătită.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Inspection certificate 3.1 for this heat is attached as well.',
        de: 'Das Abnahmeprüfzeugnis 3.1 für diese Schmelze hängt ebenfalls an.',
        ro: 'Atașat este și certificatul de inspecție 3.1 pentru această șarjă.',
      },
      attachment: { fileName: 'EN10204-3.1_heat-48213.pdf', kind: 'pdf', sizeKb: 640 },
    },
  ],
  negotiation: [
    {
      from: 'buyer',
      text: {
        en: 'We received your quote for {product}. If we commit to {qty} {unit} per month for the next quarter, can you improve the price by 3%?',
        de: 'Wir haben Ihr Angebot für {product} erhalten. Wenn wir uns für das nächste Quartal auf {qty} {unit} pro Monat festlegen, können Sie den Preis um 3 % verbessern?',
        ro: 'Am primit oferta pentru {product}. Dacă ne angajăm la {qty} {unit} pe lună pentru trimestrul următor, puteți îmbunătăți prețul cu 3%?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'We can offer 2% for a quarterly frame agreement, with the price fixed for 90 days. Would that work for you?',
        de: 'Für einen Quartalsrahmenvertrag können wir 2 % anbieten, mit Preisbindung für 90 Tage. Passt das für Sie?',
        ro: 'Putem oferi 2% pentru un contract-cadru trimestrial, cu preț fix 90 de zile. Ar fi în regulă pentru dumneavoastră?',
      },
    },
    {
      from: 'buyer',
      text: {
        en: 'Let me check with our purchasing director and come back to you tomorrow.',
        de: 'Ich kläre das mit unserem Einkaufsleiter und melde mich morgen.',
        ro: 'Verific cu directorul de achiziții și revin mâine.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Sounds good. I have attached the draft frame agreement for your review.',
        de: 'Gerne. Den Entwurf des Rahmenvertrags habe ich zur Prüfung angehängt.',
        ro: 'În regulă. Am atașat proiectul de contract-cadru pentru analiză.',
      },
      attachment: { fileName: 'frame-agreement-draft.pdf', kind: 'pdf', sizeKb: 210 },
    },
  ],
  intro: [
    {
      from: 'buyer',
      text: {
        en: 'Good afternoon, we are a construction contractor based in Cluj-Napoca. Do you deliver {product} to Romania, and what would transport cost for a full truck?',
        de: 'Guten Tag, wir sind ein Bauunternehmen aus Cluj-Napoca. Liefern Sie {product} nach Rumänien, und was würde der Transport für einen vollen Lkw kosten?',
        ro: 'Bună ziua, suntem o firmă de construcții din Cluj-Napoca. Livrați {product} în România și cât ar costa transportul pentru un camion complet?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Hello and thanks for reaching out. Yes, we deliver to Romania regularly. A full truck to Cluj-Napoca is currently around {freight} EUR; we can quote DAP or FCA.',
        de: 'Guten Tag und danke für Ihre Nachricht. Ja, wir liefern regelmäßig nach Rumänien. Ein voller Lkw nach Cluj-Napoca kostet derzeit etwa {freight} EUR; wir können DAP oder FCA anbieten.',
        ro: 'Bună ziua și mulțumim pentru mesaj. Da, livrăm regulat în România. Un camion complet până la Cluj-Napoca costă în prezent aproximativ {freight} EUR; putem oferta DAP sau FCA.',
      },
    },
  ],
  tooFar: [
    {
      from: 'buyer',
      text: {
        en: 'Hello, could you supply {product} for a project in Cluj-Napoca next month?',
        de: 'Guten Tag, könnten Sie {product} für ein Projekt in Cluj-Napoca im nächsten Monat liefern?',
        ro: 'Bună ziua, ați putea livra {product} pentru un proiect în Cluj-Napoca luna viitoare?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Unfortunately ready-mix concrete must be placed within 90 minutes, so we only deliver within about 50 km of our plants. We recommend a local plant near Cluj.',
        de: 'Leider muss Transportbeton innerhalb von 90 Minuten eingebaut werden, daher liefern wir nur im Umkreis von etwa 50 km um unsere Werke. Wir empfehlen ein Werk in der Nähe von Cluj.',
        ro: 'Din păcate, betonul marfă trebuie pus în operă în maximum 90 de minute, așa că livrăm doar pe o rază de circa 50 km de stațiile noastre. Vă recomandăm o stație din zona Clujului.',
      },
    },
  ],
  dispute: [
    {
      from: 'buyer',
      text: {
        en: 'The cathodes delivered under {deal} weigh 1.8 t less than stated on the delivery note. We have opened a dispute on the platform with the weighbridge tickets.',
        de: 'Die unter {deal} gelieferten Kathoden wiegen 1,8 t weniger als auf dem Lieferschein angegeben. Wir haben auf der Plattform einen Streitfall mit den Wiegescheinen eröffnet.',
        ro: 'Catozii livrați pentru {deal} cântăresc cu 1,8 t mai puțin decât scrie pe avizul de însoțire. Am deschis o dispută pe platformă, cu tichetele de cântar atașate.',
      },
      attachment: { fileName: 'weighbridge-tickets.pdf', kind: 'pdf', sizeKb: 920 },
    },
    {
      from: 'producer',
      text: {
        en: 'We are sorry to hear that. Our logistics team is checking the loading weights in Ruse and will reply within 48 hours.',
        de: 'Das tut uns leid. Unser Logistikteam prüft die Verladegewichte in Ruse und meldet sich innerhalb von 48 Stunden.',
        ro: 'Ne pare rău să aflăm asta. Echipa noastră de logistică verifică greutățile la încărcare în Ruse și revine în 48 de ore.',
      },
    },
  ],
  agriPrice: [
    {
      from: 'buyer',
      text: {
        en: 'Hello, could you send us your current offer for {product}? We need around {qty} {unit}, delivered to our warehouse in Iași.',
        de: 'Guten Tag, könnten Sie uns Ihr aktuelles Angebot für {product} schicken? Wir benötigen etwa {qty} {unit}, Lieferung an unser Lager in Iași.',
        ro: 'Bună ziua, ne puteți trimite oferta actuală pentru {product}? Avem nevoie de aproximativ {qty} {unit}, livrare la depozitul nostru din Iași.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Thank you for your enquiry. Our price list is attached; for {qty} {unit} the second volume tier applies.',
        de: 'Vielen Dank für Ihre Anfrage. Anbei unsere Preisliste – für {qty} {unit} gilt die zweite Mengenstaffel.',
        ro: 'Mulțumim pentru solicitare. Atașat găsiți lista de prețuri; pentru {qty} {unit} se aplică a doua treaptă de volum.',
      },
      attachment: { fileName: 'offer-autumn-2026.pdf', kind: 'pdf', sizeKb: 284 },
    },
    {
      from: 'buyer',
      text: {
        en: 'Thanks. What is the earliest delivery date, DAP Iași?',
        de: 'Danke. Was ist der früheste Liefertermin, DAP Iași?',
        ro: 'Mulțumim. Care este cea mai apropiată dată de livrare, DAP Iași?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'We can deliver within {days} working days after order confirmation.',
        de: 'Wir können innerhalb von {days} Arbeitstagen nach Auftragsbestätigung liefern.',
        ro: 'Putem livra în {days} zile lucrătoare de la confirmarea comenzii.',
      },
    },
  ],
  agriCert: [
    {
      from: 'buyer',
      text: {
        en: 'Could you share the certificates and the latest analysis report for {product}? Our quality manager needs them before the next delivery.',
        de: 'Könnten Sie uns die Zertifikate und den aktuellen Analysebericht für {product} senden? Unsere Qualitätsmanagerin benötigt sie vor der nächsten Lieferung.',
        ro: 'Ne puteți trimite certificatele și ultimul buletin de analiză pentru {product}? Responsabilul nostru de calitate are nevoie de ele înainte de următoarea livrare.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Of course — the certificates and the latest analysis report are attached. All documents are also in our document center on the platform.',
        de: 'Selbstverständlich – anbei die Zertifikate und der aktuelle Analysebericht. Alle Dokumente finden Sie auch in unserem Dokumentenbereich auf der Plattform.',
        ro: 'Desigur — atașat găsiți certificatele și ultimul buletin de analiză. Toate documentele sunt și în centrul nostru de documente de pe platformă.',
      },
      attachment: { fileName: 'certificates-and-analysis.pdf', kind: 'pdf', sizeKb: 460 },
    },
    {
      from: 'buyer',
      text: {
        en: 'Received, thank you. We will confirm the next order by Friday.',
        de: 'Erhalten, vielen Dank. Wir bestätigen die nächste Bestellung bis Freitag.',
        ro: 'Am primit, mulțumim. Confirmăm următoarea comandă până vineri.',
      },
    },
  ],
  agriDelivery: [
    {
      from: 'buyer',
      text: {
        en: 'Hi, any update on delivery for order {deal}? Our team wants to start field application on Thursday.',
        de: 'Hallo, gibt es ein Update zur Lieferung von Auftrag {deal}? Unser Team möchte am Donnerstag mit der Ausbringung beginnen.',
        ro: 'Bună, aveți vreo noutate despre livrarea comenzii {deal}? Echipa noastră vrea să înceapă aplicarea în câmp joi.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'The trucks were loaded this morning; expected arrival tomorrow between 8:00 and 11:00. The driver will call 30 minutes before.',
        de: 'Die Lkw wurden heute Morgen beladen; voraussichtliche Ankunft morgen zwischen 8:00 und 11:00 Uhr. Der Fahrer ruft 30 Minuten vorher an.',
        ro: 'Camioanele au fost încărcate azi-dimineață; sosire estimată mâine între 8:00 și 11:00. Șoferul vă sună cu 30 de minute înainte.',
      },
    },
    {
      from: 'buyer',
      text: {
        en: 'Perfect, the forklift and the warehouse team will be ready.',
        de: 'Perfekt, Stapler und Lagerteam stehen bereit.',
        ro: 'Perfect, stivuitorul și echipa de depozit vor fi pregătite.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'The batch certificate for this delivery is attached as well.',
        de: 'Das Chargenzertifikat für diese Lieferung ist ebenfalls beigefügt.',
        ro: 'Atașat găsiți și certificatul de lot pentru această livrare.',
      },
      attachment: { fileName: 'batch-certificate.pdf', kind: 'pdf', sizeKb: 196 },
    },
  ],
  agriNegotiation: [
    {
      from: 'buyer',
      text: {
        en: 'We received your quote for {product}. If we commit to {qty} {unit} for the spring campaign, can you improve the price by 3%?',
        de: 'Wir haben Ihr Angebot für {product} erhalten. Wenn wir {qty} {unit} für die Frühjahrskampagne fest zusagen, können Sie den Preis um 3 % verbessern?',
        ro: 'Am primit oferta pentru {product}. Dacă ne angajăm la {qty} {unit} pentru campania de primăvară, puteți îmbunătăți prețul cu 3%?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'We can offer 2% for a seasonal agreement with 30% prepayment, price fixed until 31 March. Would that work for you?',
        de: 'Wir können 2 % für eine Saisonvereinbarung mit 30 % Vorauszahlung anbieten, Preis fest bis 31. März. Passt das für Sie?',
        ro: 'Putem oferi 2% pentru un contract de sezon cu avans de 30%, preț fix până la 31 martie. V-ar conveni?',
      },
    },
    {
      from: 'buyer',
      text: {
        en: 'Let me check with our agronomist and come back to you tomorrow.',
        de: 'Ich stimme mich mit unserem Agronomen ab und melde mich morgen.',
        ro: 'Verific cu agronomul nostru și revin mâine.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Sounds good. I have attached the draft seasonal agreement for your review.',
        de: 'Klingt gut. Anbei der Entwurf der Saisonvereinbarung zur Durchsicht.',
        ro: 'Sună bine. Atașat găsiți proiectul contractului de sezon.',
      },
      attachment: { fileName: 'seasonal-agreement-draft.pdf', kind: 'pdf', sizeKb: 88 },
    },
  ],
  agriIntro: [
    {
      from: 'buyer',
      text: {
        en: 'Good afternoon, we are an agricultural distributor based in Iași. Do you deliver {product} to north-east Romania, and what would transport cost for a full truck?',
        de: 'Guten Tag, wir sind ein Agrarhändler aus Iași. Liefern Sie {product} in den Nordosten Rumäniens, und was würde der Transport für einen vollen Lkw kosten?',
        ro: 'Bună ziua, suntem un distribuitor agricol din Iași. Livrați {product} în nord-estul României și cât ar costa transportul pentru un camion complet?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'Hello and thanks for reaching out. Yes, we deliver to Romania regularly. A full truck to Iași is currently around {freight} EUR; we can quote DAP or FCA.',
        de: 'Hallo und danke für Ihre Nachricht. Ja, wir liefern regelmäßig nach Rumänien. Ein voller Lkw nach Iași kostet derzeit etwa {freight} EUR; wir können DAP oder FCA anbieten.',
        ro: 'Bună ziua și mulțumim pentru mesaj. Da, livrăm regulat în România. Un camion complet până la Iași costă în prezent aproximativ {freight} EUR; putem oferta DAP sau FCA.',
      },
    },
  ],
  agriDispute: [
    {
      from: 'buyer',
      text: {
        en: 'Part of the goods delivered under {deal} arrived soft, and the temperature logger shows 14 °C during transit. We have opened a dispute on the platform with photos and the logger export.',
        de: 'Ein Teil der unter {deal} gelieferten Ware kam weich an, und der Temperaturlogger zeigt 14 °C während des Transports. Wir haben auf der Plattform eine Reklamation mit Fotos und Logger-Export eröffnet.',
        ro: 'O parte din marfa livrată în comanda {deal} a sosit moale, iar loggerul de temperatură arată 14 °C pe durata transportului. Am deschis o dispută pe platformă cu fotografii și exportul din logger.',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'We are sorry to hear that. Our logistics team is checking the cold-chain records with the carrier and will reply within 48 hours.',
        de: 'Das tut uns leid. Unsere Logistik prüft die Kühlkettendaten mit dem Spediteur und meldet sich innerhalb von 48 Stunden.',
        ro: 'Ne pare rău. Echipa noastră de logistică verifică datele lanțului de frig cu transportatorul și revine în 48 de ore.',
      },
    },
  ],
  machineHandover: [
    {
      from: 'buyer',
      text: {
        en: 'Hello, when can you schedule commissioning and operator training for the {product} from order {deal}?',
        de: 'Hallo, wann können Sie die Inbetriebnahme und die Fahrerschulung für {product} aus Auftrag {deal} einplanen?',
        ro: 'Bună ziua, când puteți programa punerea în funcțiune și instruirea operatorului pentru {product} din comanda {deal}?',
      },
    },
    {
      from: 'producer',
      text: {
        en: 'The machine leaves our yard on Monday on a low-loader. Our technician can be at your farm on Tuesday at 9:00 for commissioning and a half-day training.',
        de: 'Die Maschine verlässt unseren Hof am Montag auf einem Tieflader. Unser Techniker kann am Dienstag um 9:00 Uhr zur Inbetriebnahme und einer halbtägigen Schulung bei Ihnen sein.',
        ro: 'Utilajul pleacă luni de la noi pe un trailer agabaritic. Tehnicianul nostru poate fi la ferma dumneavoastră marți la 9:00 pentru punere în funcțiune și o instruire de o jumătate de zi.',
      },
    },
    {
      from: 'buyer',
      text: {
        en: 'Great, our two operators will be there. Please bring the warranty booklet and the spare-parts list.',
        de: 'Sehr gut, unsere beiden Fahrer sind vor Ort. Bitte bringen Sie das Garantieheft und die Ersatzteilliste mit.',
        ro: 'Perfect, cei doi operatori ai noștri vor fi acolo. Vă rugăm să aduceți carnetul de garanție și lista de piese de schimb.',
      },
    },
  ],
}

interface ThreadSpec {
  id: string
  buyerId: string
  producerId: string
  script: keyof typeof SCRIPTS
  buyerLang: LanguageCode
  producerLang: LanguageCode
  /** hours ago of the last message */
  lastHoursAgo: number
  unread: number
  linkLatestDeal?: boolean
  vars?: { qty?: number; days?: number; freight?: number }
}

const SPECS: ThreadSpec[] = [
  { id: 't01', buyerId: 'b01', producerId: 'p10', script: 'delivery', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 0.6, unread: 1, linkLatestDeal: true },
  { id: 't02', buyerId: 'b01', producerId: 'p17', script: 'price', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 5, unread: 0, linkLatestDeal: true, vars: { qty: 120, days: 2 } },
  { id: 't03', buyerId: 'b01', producerId: 'p14', script: 'negotiation', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 2, unread: 2, linkLatestDeal: true, vars: { qty: 8000 } },
  { id: 't04', buyerId: 'b01', producerId: 'p22', script: 'cert', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 30, unread: 0, linkLatestDeal: true },
  { id: 't05', buyerId: 'b01', producerId: 'p11', script: 'negotiation', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 3.5, unread: 1, linkLatestDeal: true, vars: { qty: 40 } },
  { id: 't06', buyerId: 'b01', producerId: 'p13', script: 'dispute', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 52, unread: 0, linkLatestDeal: true },
  { id: 't07', buyerId: 'b01', producerId: 'p20', script: 'price', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 220, unread: 0, vars: { qty: 520, days: 3 } },
  { id: 't08', buyerId: 'b01', producerId: 'p15', script: 'price', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 1.2, unread: 2, linkLatestDeal: true, vars: { qty: 6000, days: 6 } },
  { id: 't09', buyerId: 'b01', producerId: 'p25', script: 'cert', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 400, unread: 0 },
  { id: 't10', buyerId: 'b01', producerId: 'p12', script: 'intro', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 8, unread: 1, vars: { freight: 2350 } },
  { id: 't11', buyerId: 'b01', producerId: 'p16', script: 'intro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 75, unread: 0, vars: { freight: 1480 } },
  { id: 't12', buyerId: 'b01', producerId: 'p21', script: 'intro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 140, unread: 0, vars: { freight: 1650 } },
  { id: 't13', buyerId: 'b01', producerId: 'p23', script: 'price', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 20, unread: 1, vars: { qty: 30, days: 8 } },
  { id: 't14', buyerId: 'b01', producerId: 'p19', script: 'cert', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 96, unread: 0 },
  { id: 't15', buyerId: 'b01', producerId: 'p24', script: 'intro', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 260, unread: 0, vars: { freight: 2900 } },
  { id: 't16', buyerId: 'b01', producerId: 'p18', script: 'tooFar', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 330, unread: 0 },
  { id: 't17', buyerId: 'b06', producerId: 'p10', script: 'price', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 26, unread: 0, vars: { qty: 25, days: 5 } },
  { id: 't18', buyerId: 'b04', producerId: 'p10', script: 'intro', buyerLang: 'de', producerLang: 'en', lastHoursAgo: 49, unread: 0, vars: { freight: 2600 } },
  { id: 't19', buyerId: 'b07', producerId: 'p28', script: 'agriDelivery', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 0.6, unread: 1, linkLatestDeal: true },
  { id: 't20', buyerId: 'b07', producerId: 'p26', script: 'machineHandover', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 5, unread: 0, linkLatestDeal: true },
  { id: 't21', buyerId: 'b07', producerId: 'p29', script: 'agriNegotiation', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 2, unread: 2, linkLatestDeal: true },
  { id: 't22', buyerId: 'b07', producerId: 'p01', script: 'agriCert', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 30, unread: 0, linkLatestDeal: true },
  { id: 't23', buyerId: 'b07', producerId: 'p27', script: 'agriPrice', buyerLang: 'en', producerLang: 'de', lastHoursAgo: 3.5, unread: 1, linkLatestDeal: true, vars: { qty: 1, days: 30 } },
  { id: 't24', buyerId: 'b07', producerId: 'p03', script: 'agriDispute', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 52, unread: 0, linkLatestDeal: true },
  { id: 't25', buyerId: 'b07', producerId: 'p02', script: 'agriPrice', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 220, unread: 0, vars: { days: 2 } },
  { id: 't26', buyerId: 'b07', producerId: 'p04', script: 'agriPrice', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 1.2, unread: 2, linkLatestDeal: true, vars: { days: 3 } },
  { id: 't27', buyerId: 'b07', producerId: 'p75', script: 'agriIntro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 8, unread: 1, vars: { freight: 1350 } },
  { id: 't28', buyerId: 'b07', producerId: 'p105', script: 'agriIntro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 75, unread: 0, vars: { freight: 1150 } },
  { id: 't29', buyerId: 'b07', producerId: 'p56', script: 'agriPrice', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 20, unread: 1, vars: { qty: 1, days: 10 } },
  { id: 't30', buyerId: 'b07', producerId: 'p117', script: 'agriIntro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 140, unread: 0, vars: { freight: 1600 } },
  { id: 't31', buyerId: 'b07', producerId: 'p53', script: 'agriCert', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 96, unread: 0 },
  { id: 't32', buyerId: 'b07', producerId: 'p76', script: 'agriIntro', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 260, unread: 0, vars: { freight: 1250 } },
  { id: 't33', buyerId: 'b02', producerId: 'p01', script: 'agriDelivery', buyerLang: 'ro', producerLang: 'ro', lastHoursAgo: 26, unread: 0, linkLatestDeal: true },
  { id: 't34', buyerId: 'b05', producerId: 'p28', script: 'agriPrice', buyerLang: 'en', producerLang: 'en', lastHoursAgo: 49, unread: 0, vars: { days: 5 } },
]

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`)
}

export function buildThreads(products: Product[], deals: Deal[]): { threads: Thread[]; messages: Message[] } {
  const threads: Thread[] = []
  const messages: Message[] = []
  for (const spec of SPECS) {
    const latest = deals
      .filter((d) => d.buyerId === spec.buyerId && d.producerId === spec.producerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    const product =
      products.find((p) => p.id === latest?.lineItems[0]?.productId) ??
      products.find((p) => p.producerId === spec.producerId && p.pricing.mode !== 'on_request') ??
      products.find((p) => p.producerId === spec.producerId)
    if (!product) throw new Error(`No product for thread ${spec.id}`)
    const deal = spec.linkLatestDeal ? latest : undefined
    const lines = SCRIPTS[spec.script] ?? []
    const vars = {
      product: product.name,
      qty: String(spec.vars?.qty ?? product.moq * 4),
      unit: UNIT_LABEL[product.unit] ?? product.unit,
      days: String(spec.vars?.days ?? 5),
      freight: String(spec.vars?.freight ?? 1800),
      deal: deal?.id ?? latest?.id ?? '',
    }
    const lastAt = now().getTime() - spec.lastHoursAgo * 3_600_000
    const stepMs = (spec.lastHoursAgo > 48 ? 9 : 1.6) * 3_600_000
    const firstAt = lastAt - (lines.length - 1) * stepMs
    lines.forEach((line, i) => {
      const lang = line.from === 'buyer' ? spec.buyerLang : spec.producerLang
      const sentAt = new Date(firstAt + i * stepMs)
      const unreadForBuyer = line.from === 'producer' && i >= lines.length - spec.unread
      const mockTranslations: Message['mockTranslations'] = {}
      for (const l of ['en', 'de', 'ro'] as const) if (l !== lang) mockTranslations[l] = fill(line.text[l], vars)
      messages.push({
        id: `${spec.id}-m${i + 1}`,
        threadId: spec.id,
        senderId: line.from === 'buyer' ? spec.buyerId : spec.producerId,
        senderRole: line.from,
        kind: 'text',
        text: fill(line.text[lang], vars),
        contentLang: lang,
        mockTranslations,
        sentAt: sentAt.toISOString(),
        readAt: unreadForBuyer || i === lines.length - 1 ? undefined : new Date(sentAt.getTime() + 20 * 60_000).toISOString(),
        attachments: line.attachment ? [{ id: `${spec.id}-a${i + 1}`, ...line.attachment }] : [],
      })
    })
    threads.push({
      id: spec.id,
      buyerId: spec.buyerId,
      producerId: spec.producerId,
      productId: product.id,
      dealId: deal?.id,
      createdAt: new Date(firstAt).toISOString(),
      lastMessageAt: new Date(lastAt).toISOString(),
      unreadForBuyer: spec.unread,
      unreadForProducer: 0,
    })
    if (deal) deal.threadId = spec.id
  }
  return { threads, messages: messages.filter((m) => new Date(m.sentAt) <= addDays(now(), 1)) }
}
