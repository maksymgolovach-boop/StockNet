import type { LanguageCode, Producer, ProducerType, VerificationCheck, VerificationLevel } from '@/types/models'
import type { CertificationCode } from '@/config/certifications'
import { cityById } from './cities'
import { REGIONAL_PRODUCERS } from './regional'

export interface ProducerSeed {
  id: string
  name: string
  legalName: string
  type: ProducerType
  cityId: string
  street: string
  offset: [number, number]
  deliveryRadiusKm: number
  foundedYear: number
  memberSince: string
  employees: Producer['employees']
  spokenLanguages: LanguageCode[]
  contentLang: LanguageCode
  description: string
  rootCategories: string[]
  level: VerificationLevel
  verifiedAt: string
  onTime: number
  responseHours: number
  disputeRate: number
  repeatRate: number
  historicDeals: number
  certs: CertificationCode[]
  /** cert codes whose document is expired / expiring, to exercise the warnings */
  expiredCerts?: CertificationCode[]
  expiringCerts?: CertificationCode[]
  brandHue: number
}

export const PRODUCER_SEEDS: ProducerSeed[] = [
  {
    id: 'p01', name: 'Cooperativa Agricolă Țara Bârsei', legalName: 'Cooperativa Agricolă Țara Bârsei', type: 'cooperative',
    cityId: 'ro-brasov', street: 'Str. Hărmanului 112', offset: [0.04, 0.06], deliveryRadiusKm: 350, foundedYear: 2009,
    memberSince: '2022-04-11T00:00:00Z', employees: '51-200', spokenLanguages: ['ro', 'en', 'de'], contentLang: 'ro',
    description: 'Cooperativă de 46 de ferme din Țara Bârsei. Cultivăm cartofi, ceapă și morcovi în câmp deschis și roșii în sere încălzite cu biomasă. Livrăm zilnic către retaileri și distribuitori din centrul țării.',
    rootCategories: ['fresh-produce', 'agro-inputs'], level: 'verified', verifiedAt: '2025-02-14T00:00:00Z',
    onTime: 0.93, responseHours: 5, disputeRate: 0.02, repeatRate: 0.61, historicDeals: 212,
    certs: ['globalgap', 'haccp', 'pgi'], expiringCerts: ['globalgap'], brandHue: 112,
  },
  {
    id: 'p02', name: 'Ferma Dobrogea Verde', legalName: 'Dobrogea Verde Agro SRL', type: 'farm',
    cityId: 'ro-medgidia', street: 'DN22C km 14', offset: [0.03, -0.05], deliveryRadiusKm: 450, foundedYear: 2014,
    memberSince: '2023-03-02T00:00:00Z', employees: '11-50', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Fermă bio certificată de 640 ha în Dobrogea: ardei, roșii de câmp și pepeni. Depozit frigorific propriu de 1.800 t și sortare optică.',
    rootCategories: ['fresh-produce'], level: 'identity', verifiedAt: '2023-03-05T00:00:00Z',
    onTime: 0.86, responseHours: 14, disputeRate: 0.04, repeatRate: 0.38, historicDeals: 64,
    certs: ['organic', 'globalgap'], expiredCerts: ['globalgap'], brandHue: 88,
  },
  {
    id: 'p03', name: 'Alföldi Zöldség Szövetkezet', legalName: 'Alföldi Zöldség Termelői Szövetkezet', type: 'cooperative',
    cityId: 'hu-szeged', street: 'Dorozsmai út 210', offset: [0.02, -0.04], deliveryRadiusKm: 600, foundedYear: 1996,
    memberSince: '2022-09-20T00:00:00Z', employees: '201-1000', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Producer organisation of 120 growers in the Southern Great Plain. Paprika, tomatoes and root vegetables, hydro-cooled and packed to order in our Szeged hub.',
    rootCategories: ['fresh-produce'], level: 'audited', verifiedAt: '2025-11-03T00:00:00Z',
    onTime: 0.95, responseHours: 4, disputeRate: 0.01, repeatRate: 0.72, historicDeals: 488,
    certs: ['globalgap', 'ifs', 'haccp', 'pgi'], brandHue: 24,
  },
  {
    id: 'p04', name: 'Westland Fresh', legalName: 'Westland Fresh B.V.', type: 'farm',
    cityId: 'nl-naaldwijk', street: 'Middel Broekweg 31', offset: [0.01, 0.01], deliveryRadiusKm: 1400, foundedYear: 1988,
    memberSince: '2022-02-01T00:00:00Z', employees: '201-1000', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Year-round greenhouse vegetables and soft fruit from 85 ha of glass in the Westland. Daily cold-chain trucking to Germany, Austria and Central Europe.',
    rootCategories: ['fresh-produce'], level: 'audited', verifiedAt: '2026-01-15T00:00:00Z',
    onTime: 0.97, responseHours: 3, disputeRate: 0.01, repeatRate: 0.78, historicDeals: 905,
    certs: ['globalgap', 'ifs', 'haccp'], brandHue: 140,
  },
  {
    id: 'p05', name: 'Lactate Bucovina', legalName: 'Lactate Bucovina SRL', type: 'dairy',
    cityId: 'ro-campulung-moldovenesc', street: 'Calea Transilvaniei 41', offset: [0.01, 0.02], deliveryRadiusKm: 550, foundedYear: 2003,
    memberSince: '2022-06-15T00:00:00Z', employees: '51-200', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Fabrică de lactate din Bucovina care procesează zilnic 60.000 l de lapte colectat de la 900 de fermieri. Telemea de oaie, cașcaval și unt cu 82% grăsime.',
    rootCategories: ['dairy'], level: 'verified', verifiedAt: '2024-10-01T00:00:00Z',
    onTime: 0.9, responseHours: 7, disputeRate: 0.02, repeatRate: 0.55, historicDeals: 187,
    certs: ['haccp', 'ifs', 'pgi'], expiringCerts: ['ifs'], brandHue: 205,
  },
  {
    id: 'p06', name: 'Molkerei Allgäuer Land', legalName: 'Molkerei Allgäuer Land eG', type: 'cooperative',
    cityId: 'de-kempten-allgau', street: 'Ursulasrieder Straße 18', offset: [0.02, 0.03], deliveryRadiusKm: 900, foundedYear: 1952,
    memberSince: '2022-01-10T00:00:00Z', employees: '201-1000', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Genossenschaftliche Molkerei mit 640 Milchbauern aus dem Allgäu. Heumilch, Bergkäse und Emmentaler aus eigener Reifung, Butter in Gastro- und Industriegebinden.',
    rootCategories: ['dairy'], level: 'audited', verifiedAt: '2026-03-20T00:00:00Z',
    onTime: 0.98, responseHours: 3, disputeRate: 0.005, repeatRate: 0.81, historicDeals: 1340,
    certs: ['organic', 'haccp', 'ifs', 'pdo'], brandHue: 196,
  },
  {
    id: 'p07', name: 'Caseificio Val Padana', legalName: 'Caseificio Val Padana S.r.l.', type: 'dairy',
    cityId: 'it-cremona', street: 'Via Castelleone 88', offset: [0.03, 0.02], deliveryRadiusKm: 1300, foundedYear: 1971,
    memberSince: '2023-05-22T00:00:00Z', employees: '51-200', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Family dairy producing Grana Padano PDO, provolone and mascarpone. Wheels aged 10 to 24 months; export pallets with full lot traceability.',
    rootCategories: ['dairy'], level: 'verified', verifiedAt: '2024-06-12T00:00:00Z',
    onTime: 0.91, responseHours: 9, disputeRate: 0.02, repeatRate: 0.6, historicDeals: 233,
    certs: ['pdo', 'haccp', 'ifs', 'halal'], brandHue: 42,
  },
  {
    id: 'p08', name: 'Carmangeria Transilvania', legalName: 'Carmangeria Transilvania SA', type: 'meat_processor',
    cityId: 'ro-sibiu', street: 'Str. Șoseaua Alba Iulia 79', offset: [0.02, -0.04], deliveryRadiusKm: 450, foundedYear: 1998,
    memberSince: '2022-08-08T00:00:00Z', employees: '201-1000', spokenLanguages: ['ro', 'en', 'de'], contentLang: 'ro',
    description: 'Abator și unitate de procesare autorizată ANSVSA. Carcase și piese tranșate de porc și vită, refrigerate sau congelate, livrate în lanț frigorific propriu.',
    rootCategories: ['meat'], level: 'verified', verifiedAt: '2025-05-09T00:00:00Z',
    onTime: 0.88, responseHours: 6, disputeRate: 0.03, repeatRate: 0.49, historicDeals: 301,
    certs: ['haccp', 'ifs', 'halal'], expiredCerts: ['halal'], brandHue: 4,
  },
  {
    id: 'p09', name: 'Bayerwald Fleischwerk', legalName: 'Bayerwald Fleischwerk GmbH', type: 'meat_processor',
    cityId: 'de-straubing', street: 'Äußere Passauer Straße 54', offset: [0.01, 0.03], deliveryRadiusKm: 700, foundedYear: 1965,
    memberSince: '2022-03-30T00:00:00Z', employees: '201-1000', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Schlachtung und Zerlegung für Schwein, Rind und Geflügel aus Bayern. QS-zertifiziert, Kühlkette lückenlos dokumentiert, Belieferung von Gastronomie und Handel.',
    rootCategories: ['meat'], level: 'audited', verifiedAt: '2026-02-11T00:00:00Z',
    onTime: 0.96, responseHours: 4, disputeRate: 0.01, repeatRate: 0.74, historicDeals: 812,
    certs: ['haccp', 'ifs', 'organic'], brandHue: 356,
  },
  {
    id: 'p10', name: 'Oțelăria Dunării', legalName: 'Oțelăria Dunării SA', type: 'steel_mill',
    cityId: 'ro-galati', street: 'Calea Smârdan 1', offset: [0.03, 0.05], deliveryRadiusKm: 900, foundedYear: 1966,
    memberSince: '2022-01-24T00:00:00Z', employees: '1000+', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Laminor de oțel-beton și profile. Bare nervurate B500C conform SR 438 și EN 10080, plase sudate și tablă laminată la cald. Certificat de inspecție 3.1 pentru fiecare lot.',
    rootCategories: ['metals'], level: 'audited', verifiedAt: '2025-09-30T00:00:00Z',
    onTime: 0.92, responseHours: 6, disputeRate: 0.02, repeatRate: 0.69, historicDeals: 1102,
    certs: ['en10080', 'sr438', 'en10025', 'en10204', 'iso9001', 'iso14001'], brandHue: 220,
  },
  {
    id: 'p11', name: 'Stahlwerk Ruhrtal', legalName: 'Stahlwerk Ruhrtal GmbH', type: 'steel_mill',
    cityId: 'de-duisburg', street: 'Friedrich-Ebert-Straße 300', offset: [0.04, 0.02], deliveryRadiusKm: 1600, foundedYear: 1911,
    memberSince: '2022-01-05T00:00:00Z', employees: '1000+', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Warmgewalzte Träger HEA/HEB/IPE und Feinbleche in S235 bis S355. Zuschnitt nach Maß, Abnahmeprüfzeugnis 3.1 nach EN 10204 mit jeder Lieferung.',
    rootCategories: ['metals'], level: 'audited', verifiedAt: '2026-04-02T00:00:00Z',
    onTime: 0.97, responseHours: 5, disputeRate: 0.005, repeatRate: 0.83, historicDeals: 2430,
    certs: ['en10025', 'en10204', 'iso9001', 'iso14001'], brandHue: 210,
  },
  {
    id: 'p12', name: 'Alpen Aluminium', legalName: 'Alpen Aluminium GmbH', type: 'metal_works',
    cityId: 'at-braunau-am-inn', street: 'Lamprechtshausener Straße 61', offset: [0.0, 0.03], deliveryRadiusKm: 1500, foundedYear: 1939,
    memberSince: '2023-01-16T00:00:00Z', employees: '1000+', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Walz- und Strangpresswerk für Aluminium. Bleche EN AW-5754 und Profile EN AW-6060 nach EN 485/EN 755, eloxiert oder pressblank.',
    rootCategories: ['metals'], level: 'verified', verifiedAt: '2025-01-20T00:00:00Z',
    onTime: 0.94, responseHours: 8, disputeRate: 0.01, repeatRate: 0.66, historicDeals: 540,
    certs: ['en485', 'en755', 'en10204', 'iso9001'], expiringCerts: ['iso9001'], brandHue: 190,
  },
  {
    id: 'p13', name: 'Danube Copper Works', legalName: 'Danube Copper Works AD', type: 'metal_works',
    cityId: 'bg-ruse', street: 'Bulevard Tutrakan 100', offset: [0.02, 0.04], deliveryRadiusKm: 1800, foundedYear: 1984,
    memberSince: '2023-09-04T00:00:00Z', employees: '201-1000', spokenLanguages: ['en'], contentLang: 'en',
    description: 'Copper cathode refining and continuous-cast wire rod. Priced on the LME cash settlement plus a monthly premium; USD contracts by default.',
    rootCategories: ['metals'], level: 'identity', verifiedAt: '2023-09-10T00:00:00Z',
    onTime: 0.84, responseHours: 18, disputeRate: 0.05, repeatRate: 0.35, historicDeals: 71,
    certs: ['astmB115', 'en1977', 'iso9001'], expiredCerts: ['iso9001'], brandHue: 22,
  },
  {
    id: 'p14', name: 'Cabluri Ardeal', legalName: 'Cabluri Ardeal SRL', type: 'cable_maker',
    cityId: 'ro-bistrita', street: 'Str. Industriilor 9', offset: [0.02, -0.03], deliveryRadiusKm: 700, foundedYear: 2001,
    memberSince: '2022-05-03T00:00:00Z', employees: '201-1000', spokenLanguages: ['ro', 'en', 'de'], contentLang: 'ro',
    description: 'Fabricăm cabluri de energie și conductori de instalații: CYY-F, CYKY, NYM-J și H07V-K. Clasă de reacție la foc conform CPR, livrare pe tambur sau colac.',
    rootCategories: ['cables'], level: 'verified', verifiedAt: '2025-03-18T00:00:00Z',
    onTime: 0.95, responseHours: 4, disputeRate: 0.01, repeatRate: 0.71, historicDeals: 640,
    certs: ['ce', 'iec60228', 'iec60502', 'rohs', 'en50575'], brandHue: 260,
  },
  {
    id: 'p15', name: 'Kabelwerk Sachsen', legalName: 'Kabelwerk Sachsen GmbH', type: 'cable_maker',
    cityId: 'de-chemnitz', street: 'Annaberger Straße 240', offset: [-0.03, 0.02], deliveryRadiusKm: 1500, foundedYear: 1990,
    memberSince: '2022-07-19T00:00:00Z', employees: '201-1000', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'VDE-geprüfte Installations- und Energiekabel: NYM-J, NYY-J, N2XH (halogenfrei) sowie Mittelspannungskabel NA2XS(F)2Y. Ablängen auf Kundenwunsch.',
    rootCategories: ['cables'], level: 'audited', verifiedAt: '2026-05-06T00:00:00Z',
    onTime: 0.98, responseHours: 3, disputeRate: 0.005, repeatRate: 0.8, historicDeals: 1210,
    certs: ['ce', 'vde', 'iec60228', 'iec60502', 'rohs', 'en50575'], brandHue: 250,
  },
  {
    id: 'p16', name: 'Kable Śląskie', legalName: 'Kable Śląskie Sp. z o.o.', type: 'cable_maker',
    cityId: 'pl-katowice', street: 'ul. Bocheńskiego 38', offset: [0.03, -0.02], deliveryRadiusKm: 1200, foundedYear: 2006,
    memberSince: '2024-02-12T00:00:00Z', employees: '51-200', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Installation and data cables at competitive prices. Copper and aluminium conductors, LSZH variants, Cat6 U/UTP. CPR-classified, stock in Katowice.',
    rootCategories: ['cables'], level: 'identity', verifiedAt: '2024-02-15T00:00:00Z',
    onTime: 0.87, responseHours: 11, disputeRate: 0.03, repeatRate: 0.42, historicDeals: 96,
    certs: ['ce', 'rohs', 'en50575'], brandHue: 280,
  },
  {
    id: 'p17', name: 'Beton Someș Mix', legalName: 'Beton Someș Mix SRL', type: 'concrete_plant',
    cityId: 'ro-turda', street: 'Str. Fabricii 4', offset: [0.03, 0.02], deliveryRadiusKm: 45, foundedYear: 2008,
    memberSince: '2022-10-10T00:00:00Z', employees: '51-200', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Stații de betoane la Turda și Florești, 14 autobetoniere și 3 pompe. Betoane C8/10 până la C40/50, agregate sortate din balastiera proprie de pe Arieș.',
    rootCategories: ['concrete', 'aggregates'], level: 'verified', verifiedAt: '2025-07-01T00:00:00Z',
    onTime: 0.91, responseHours: 2, disputeRate: 0.03, repeatRate: 0.76, historicDeals: 1630,
    certs: ['en206', 'en12620', 'ce', 'iso9001'], brandHue: 30,
  },
  {
    id: 'p18', name: 'Transportbeton Rhein-Main', legalName: 'Transportbeton Rhein-Main GmbH & Co. KG', type: 'concrete_plant',
    cityId: 'de-offenbach-am-main', street: 'Strahlenbergerstraße 112', offset: [0.0, 0.04], deliveryRadiusKm: 50, foundedYear: 1974,
    memberSince: '2022-11-28T00:00:00Z', employees: '51-200', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Fünf Mischwerke im Rhein-Main-Gebiet. Transportbeton nach EN 206 mit Lieferfenstern im 30-Minuten-Takt, dazu Kies und Sand aus eigenen Gruben.',
    rootCategories: ['concrete', 'aggregates'], level: 'audited', verifiedAt: '2026-06-18T00:00:00Z',
    onTime: 0.96, responseHours: 2, disputeRate: 0.01, repeatRate: 0.82, historicDeals: 2890,
    certs: ['en206', 'en12620', 'ce', 'iso9001', 'iso14001'], brandHue: 36,
  },
  {
    id: 'p19', name: 'Ciments du Rhône', legalName: 'Ciments du Rhône SAS', type: 'concrete_plant',
    cityId: 'fr-lyon', street: '14 Rue du Port Édouard Herriot', offset: [-0.03, 0.02], deliveryRadiusKm: 1200, foundedYear: 1928,
    memberSince: '2024-04-01T00:00:00Z', employees: '201-1000', spokenLanguages: ['en'], contentLang: 'en',
    description: 'Cement grinding plant and dry-mortar line on the Rhône. CEM I and CEM II in bulk tankers or 25/35 kg bags on shrink-wrapped pallets.',
    rootCategories: ['concrete'], level: 'verified', verifiedAt: '2024-11-12T00:00:00Z',
    onTime: 0.9, responseHours: 10, disputeRate: 0.02, repeatRate: 0.58, historicDeals: 402,
    certs: ['en1971', 'ce', 'iso9001', 'iso14001'], brandHue: 48,
  },
  {
    id: 'p20', name: 'Balastiera Oltului', legalName: 'Balastiera Oltului SRL', type: 'quarry',
    cityId: 'ro-ramnicu-valcea', street: 'Str. Stolniceni 27', offset: [-0.06, 0.02], deliveryRadiusKm: 160, foundedYear: 2005,
    memberSince: '2023-02-27T00:00:00Z', employees: '11-50', spokenLanguages: ['ro'], contentLang: 'ro',
    description: 'Balastieră pe râul Olt cu stație de sortare și spălare. Nisip 0-4, pietriș 4-8, 8-16, 16-32 și balast 0-63. Încărcare cu încărcător frontal, transport cu basculante de 26 t.',
    rootCategories: ['aggregates'], level: 'identity', verifiedAt: '2023-03-01T00:00:00Z',
    onTime: 0.82, responseHours: 20, disputeRate: 0.06, repeatRate: 0.44, historicDeals: 158,
    certs: ['en12620', 'en13242'], expiringCerts: ['en12620'], brandHue: 60,
  },
  {
    id: 'p21', name: 'Morava Aggregates', legalName: 'Morava Aggregates a.s.', type: 'quarry',
    cityId: 'cz-brno', street: 'Hradecká 40', offset: [0.06, -0.05], deliveryRadiusKm: 200, foundedYear: 1993,
    memberSince: '2024-06-03T00:00:00Z', employees: '51-200', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Granite and basalt quarry north of Brno. Crushed stone 0/31.5 to 16/32 for road base and concrete, plus recycled aggregate from C&D waste.',
    rootCategories: ['aggregates'], level: 'unverified', verifiedAt: '2024-06-03T00:00:00Z',
    onTime: 0.8, responseHours: 26, disputeRate: 0.04, repeatRate: 0.3, historicDeals: 22,
    certs: ['en12620', 'en13242', 'ce'], brandHue: 70,
  },
  {
    id: 'p22', name: 'Lemn Carpați', legalName: 'Lemn Carpați SRL', type: 'sawmill',
    cityId: 'ro-vatra-dornei', street: 'Str. Mihai Eminescu 155', offset: [0.02, 0.03], deliveryRadiusKm: 800, foundedYear: 1999,
    memberSince: '2022-12-05T00:00:00Z', employees: '51-200', spokenLanguages: ['ro', 'de', 'en'], contentLang: 'ro',
    description: 'Gater și uscătorie pentru rășinoase din Bucovina. Cherestea de molid și brad, KVH C24, lemn lamelar GL24h. Lemn provenit din păduri certificate FSC.',
    rootCategories: ['timber'], level: 'verified', verifiedAt: '2025-04-22T00:00:00Z',
    onTime: 0.89, responseHours: 9, disputeRate: 0.02, repeatRate: 0.57, historicDeals: 245,
    certs: ['fsc', 'en14081', 'ce'], brandHue: 100,
  },
  {
    id: 'p23', name: 'Schwarzwald Holzwerke', legalName: 'Schwarzwald Holzwerke GmbH', type: 'sawmill',
    cityId: 'de-freiburg-im-breisgau', street: 'Tullastraße 72', offset: [0.03, 0.04], deliveryRadiusKm: 1000, foundedYear: 1948,
    memberSince: '2022-04-04T00:00:00Z', employees: '201-1000', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Säge- und Hobelwerk für Fichte, Tanne und Lärche aus PEFC-zertifizierten Wäldern. Konstruktionsvollholz, Brettschichtholz, OSB/3 und Terrassendielen.',
    rootCategories: ['timber'], level: 'audited', verifiedAt: '2026-01-29T00:00:00Z',
    onTime: 0.95, responseHours: 5, disputeRate: 0.01, repeatRate: 0.75, historicDeals: 980,
    certs: ['pefc', 'fsc', 'en14081', 'en13986', 'ce'], brandHue: 120,
  },
  {
    id: 'p24', name: 'Kunststoffwerk Weser', legalName: 'Kunststoffwerk Weser GmbH', type: 'chemical_plant',
    cityId: 'de-bremen', street: 'Ludwig-Roselius-Allee 9', offset: [0.04, -0.03], deliveryRadiusKm: 1500, foundedYear: 1977,
    memberSince: '2023-04-17T00:00:00Z', employees: '201-1000', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Compoundierung und Recycling von Polyolefinen. HDPE und PP als Neuware und Rezyklat mit bis zu 100 % Post-Consumer-Anteil, Sicherheitsdatenblätter nach REACH.',
    rootCategories: ['plastics'], level: 'verified', verifiedAt: '2025-08-14T00:00:00Z',
    onTime: 0.93, responseHours: 6, disputeRate: 0.01, repeatRate: 0.64, historicDeals: 377,
    certs: ['reach', 'rohs', 'iso9001', 'eu10_2011'], brandHue: 170,
  },
  {
    id: 'p25', name: 'Polimer Prahova', legalName: 'Polimer Prahova SA', type: 'chemical_plant',
    cityId: 'ro-ploiesti', street: 'Str. Mihai Bravu 235', offset: [0.03, 0.04], deliveryRadiusKm: 900, foundedYear: 1972,
    memberSince: '2023-06-26T00:00:00Z', employees: '201-1000', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Producător de PVC suspensie, polipropilenă și soluție de hidroxid de sodiu. Livrare în saci de 25 kg, big-bag sau cisternă. Fișe tehnice de securitate disponibile.',
    rootCategories: ['plastics'], level: 'verified', verifiedAt: '2025-06-30T00:00:00Z',
    onTime: 0.88, responseHours: 12, disputeRate: 0.03, repeatRate: 0.5, historicDeals: 143,
    certs: ['reach', 'iso9001', 'iso14001'], brandHue: 160,
  },
  {
    id: 'p26', name: 'Agromec Bărăgan', legalName: 'Agromec Bărăgan SA', type: 'machinery_maker',
    cityId: 'ro-buzau', street: 'Șoseaua Spătaru 14', offset: [0.03, -0.05], deliveryRadiusKm: 900, foundedYear: 1994,
    memberSince: '2023-02-06T00:00:00Z', employees: '201-1000', spokenLanguages: ['ro', 'en'], contentLang: 'ro',
    description: 'Producem tractoare de 80–140 CP, semănători și grape cu discuri, plus remorci basculante. Service mobil în 24 de ore în Muntenia și Moldova, piese de schimb din stoc.',
    rootCategories: ['agri-machinery'], level: 'verified', verifiedAt: '2025-03-11T00:00:00Z',
    onTime: 0.9, responseHours: 6, disputeRate: 0.02, repeatRate: 0.58, historicDeals: 214,
    certs: ['ce', 'iso9001'], brandHue: 12,
  },
  {
    id: 'p27', name: 'Landtechnik Leinetal', legalName: 'Landtechnik Leinetal GmbH', type: 'machinery_maker',
    cityId: 'de-hannover', street: 'Vahrenwalder Straße 255', offset: [0.04, 0.06], deliveryRadiusKm: 1800, foundedYear: 1958,
    memberSince: '2022-06-20T00:00:00Z', employees: '1000+', spokenLanguages: ['de', 'en'], contentLang: 'de',
    description: 'Hersteller von Großtraktoren, Mähdreschern und ISOBUS-fähigen Anbaugeräten. Vorführmaschinen und geprüfte Gebrauchtmaschinen mit Garantie, europaweiter Transport auf Tieflader.',
    rootCategories: ['agri-machinery'], level: 'audited', verifiedAt: '2026-02-24T00:00:00Z',
    onTime: 0.95, responseHours: 5, disputeRate: 0.01, repeatRate: 0.7, historicDeals: 860,
    certs: ['ce', 'iso9001', 'iso14001', 'isobus'], brandHue: 135,
  },
  {
    id: 'p28', name: 'Fertil Mureș', legalName: 'Fertil Mureș SA', type: 'agrochemical_plant',
    cityId: 'ro-arad', street: 'Bd. Revoluției 300', offset: [0.02, 0.05], deliveryRadiusKm: 1000, foundedYear: 1962,
    memberSince: '2022-09-05T00:00:00Z', employees: '1000+', spokenLanguages: ['ro', 'en', 'de'], contentLang: 'ro',
    description: 'Combinat de îngrășăminte cu azot: azotat de amoniu 34,4% N, uree 46% N, UAN 32 și NPK complexe. Livrare vrac în camion sau vagon, saci de 50 kg și big-bag de 500 kg.',
    rootCategories: ['agro-inputs'], level: 'audited', verifiedAt: '2025-12-02T00:00:00Z',
    onTime: 0.91, responseHours: 7, disputeRate: 0.02, repeatRate: 0.73, historicDeals: 1450,
    certs: ['reach', 'iso9001', 'iso14001', 'euFertilizer'], expiringCerts: ['iso9001'], brandHue: 200,
  },
  {
    id: 'p29', name: 'Tisza AgroProtect', legalName: 'Tisza AgroProtect Zrt.', type: 'seed_company',
    cityId: 'hu-debrecen', street: 'Mikepércsi út 132', offset: [-0.04, 0.03], deliveryRadiusKm: 900, foundedYear: 2001,
    memberSince: '2023-07-10T00:00:00Z', employees: '51-200', spokenLanguages: ['en', 'de'], contentLang: 'en',
    description: 'Crop protection formulator and seed company. Registered herbicides, fungicides and insecticides plus certified maize, sunflower and wheat seed for Central and Eastern Europe.',
    rootCategories: ['agro-inputs'], level: 'verified', verifiedAt: '2025-05-19T00:00:00Z',
    onTime: 0.89, responseHours: 9, disputeRate: 0.02, repeatRate: 0.55, historicDeals: 310,
    certs: ['pppAuthorised', 'certifiedSeed', 'organic', 'reach', 'iso9001'], expiredCerts: ['organic'], brandHue: 95,
  },
  ...REGIONAL_PRODUCERS,
]

const CHECK_SEQUENCE: Record<VerificationLevel, VerificationCheck['kind'][]> = {
  unverified: [],
  identity: ['company_registry', 'vat'],
  verified: ['company_registry', 'vat', 'documents', 'site_information'],
  audited: ['company_registry', 'vat', 'documents', 'site_information', 'third_party_audit'],
}

const CHECKERS: Record<VerificationCheck['kind'], string> = {
  company_registry: 'Stocknet Compliance',
  vat: 'EU VIES',
  documents: 'Stocknet Compliance',
  site_information: 'Stocknet Field Team',
  third_party_audit: 'SGS',
}

export function verificationChecks(seed: ProducerSeed): VerificationCheck[] {
  const base = new Date(seed.verifiedAt).getTime()
  return CHECK_SEQUENCE[seed.level].map((kind, i) => ({
    kind,
    checkedAt: new Date(base - (CHECK_SEQUENCE[seed.level].length - 1 - i) * 9 * 86_400_000).toISOString(),
    by: kind === 'third_party_audit' && cityById(seed.cityId).country === 'DE' ? 'TÜV SÜD' : CHECKERS[kind],
  }))
}
