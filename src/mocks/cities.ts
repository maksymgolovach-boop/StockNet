import type { CountryCode, GeoPoint } from '@/types/models'
import { REGIONAL_CITY_ROWS } from './regional'

export interface City {
  id: string
  name: string
  postcode: string
  region: string
  country: CountryCode
  point: GeoPoint
}

type Row = [name: string, postcode: string, region: string, country: CountryCode, lat: number, lng: number]

const ROWS: Row[] = [
  ['București', '010011', 'București', 'RO', 44.4268, 26.1025],
  ['Cluj-Napoca', '400001', 'Cluj', 'RO', 46.7712, 23.6236],
  ['Timișoara', '300001', 'Timiș', 'RO', 45.7489, 21.2087],
  ['Iași', '700001', 'Iași', 'RO', 47.1585, 27.6014],
  ['Constanța', '900001', 'Constanța', 'RO', 44.1598, 28.6348],
  ['Craiova', '200001', 'Dolj', 'RO', 44.3302, 23.7949],
  ['Brașov', '500001', 'Brașov', 'RO', 45.6427, 25.5887],
  ['Galați', '800001', 'Galați', 'RO', 45.4353, 28.008],
  ['Ploiești', '100001', 'Prahova', 'RO', 44.9419, 26.0225],
  ['Oradea', '410001', 'Bihor', 'RO', 47.0465, 21.9189],
  ['Brăila', '810001', 'Brăila', 'RO', 45.2692, 27.9575],
  ['Arad', '310001', 'Arad', 'RO', 46.1866, 21.3123],
  ['Pitești', '110001', 'Argeș', 'RO', 44.8565, 24.8692],
  ['Sibiu', '550001', 'Sibiu', 'RO', 45.7983, 24.1256],
  ['Bacău', '600001', 'Bacău', 'RO', 46.567, 26.9146],
  ['Târgu Mureș', '540001', 'Mureș', 'RO', 46.5425, 24.5575],
  ['Baia Mare', '430001', 'Maramureș', 'RO', 47.6567, 23.585],
  ['Buzău', '120001', 'Buzău', 'RO', 45.15, 26.8333],
  ['Botoșani', '710001', 'Botoșani', 'RO', 47.7487, 26.6694],
  ['Satu Mare', '440001', 'Satu Mare', 'RO', 47.79, 22.89],
  ['Râmnicu Vâlcea', '240001', 'Vâlcea', 'RO', 45.0997, 24.3693],
  ['Suceava', '720001', 'Suceava', 'RO', 47.6514, 26.2556],
  ['Piatra Neamț', '610001', 'Neamț', 'RO', 46.9275, 26.3708],
  ['Drobeta-Turnu Severin', '220001', 'Mehedinți', 'RO', 44.6369, 22.6597],
  ['Focșani', '620001', 'Vrancea', 'RO', 45.6967, 27.1863],
  ['Bistrița', '420001', 'Bistrița-Năsăud', 'RO', 47.1333, 24.5],
  ['Deva', '330001', 'Hunedoara', 'RO', 45.8833, 22.9],
  ['Alba Iulia', '510001', 'Alba', 'RO', 46.0667, 23.5833],
  ['Zalău', '450001', 'Sălaj', 'RO', 47.1911, 23.0572],
  ['Sfântu Gheorghe', '520001', 'Covasna', 'RO', 45.8636, 25.7875],
  ['Hunedoara', '331001', 'Hunedoara', 'RO', 45.75, 22.9],
  ['Vatra Dornei', '725700', 'Suceava', 'RO', 47.346, 25.358],
  ['Câmpulung Moldovenesc', '725100', 'Suceava', 'RO', 47.5308, 25.5514],
  ['Medgidia', '905600', 'Constanța', 'RO', 44.25, 28.27],
  ['Turda', '401001', 'Cluj', 'RO', 46.5667, 23.7833],
  ['Mediaș', '551001', 'Sibiu', 'RO', 46.1667, 24.35],
  ['Slatina', '230001', 'Olt', 'RO', 44.43, 24.3667],
  ['Reșița', '320001', 'Caraș-Severin', 'RO', 45.3008, 21.8892],
  ['Călărași', '910001', 'Călărași', 'RO', 44.2, 27.3333],
  ['Giurgiu', '080001', 'Giurgiu', 'RO', 43.9, 25.9667],
  ['Tulcea', '820001', 'Tulcea', 'RO', 45.1667, 28.8],
  ['Berlin', '10115', 'Berlin', 'DE', 52.52, 13.405],
  ['Hamburg', '20095', 'Hamburg', 'DE', 53.5511, 9.9937],
  ['München', '80331', 'Bayern', 'DE', 48.1351, 11.582],
  ['Köln', '50667', 'Nordrhein-Westfalen', 'DE', 50.9375, 6.9603],
  ['Frankfurt am Main', '60311', 'Hessen', 'DE', 50.1109, 8.6821],
  ['Stuttgart', '70173', 'Baden-Württemberg', 'DE', 48.7758, 9.1829],
  ['Düsseldorf', '40213', 'Nordrhein-Westfalen', 'DE', 51.2277, 6.7735],
  ['Leipzig', '04109', 'Sachsen', 'DE', 51.3397, 12.3731],
  ['Dortmund', '44135', 'Nordrhein-Westfalen', 'DE', 51.5136, 7.4653],
  ['Essen', '45127', 'Nordrhein-Westfalen', 'DE', 51.4556, 7.0116],
  ['Bremen', '28195', 'Bremen', 'DE', 53.0793, 8.8017],
  ['Dresden', '01067', 'Sachsen', 'DE', 51.0504, 13.7373],
  ['Hannover', '30159', 'Niedersachsen', 'DE', 52.3759, 9.732],
  ['Nürnberg', '90402', 'Bayern', 'DE', 49.4521, 11.0767],
  ['Duisburg', '47051', 'Nordrhein-Westfalen', 'DE', 51.4344, 6.7623],
  ['Chemnitz', '09111', 'Sachsen', 'DE', 50.8278, 12.9214],
  ['Kempten (Allgäu)', '87435', 'Bayern', 'DE', 47.7286, 10.3158],
  ['Freiburg im Breisgau', '79098', 'Baden-Württemberg', 'DE', 47.999, 7.8421],
  ['Straubing', '94315', 'Bayern', 'DE', 48.8777, 12.5734],
  ['Offenbach am Main', '63065', 'Hessen', 'DE', 50.0956, 8.7761],
  ['Regensburg', '93047', 'Bayern', 'DE', 49.0134, 12.1016],
  ['Augsburg', '86150', 'Bayern', 'DE', 48.3705, 10.8978],
  ['Mannheim', '68159', 'Baden-Württemberg', 'DE', 49.4875, 8.466],
  ['Karlsruhe', '76133', 'Baden-Württemberg', 'DE', 49.0069, 8.4037],
  ['Kassel', '34117', 'Hessen', 'DE', 51.3127, 9.4797],
  ['Magdeburg', '39104', 'Sachsen-Anhalt', 'DE', 52.1205, 11.6276],
  ['Erfurt', '99084', 'Thüringen', 'DE', 50.9848, 11.0299],
  ['Rostock', '18055', 'Mecklenburg-Vorpommern', 'DE', 54.0924, 12.0991],
  ['Saarbrücken', '66111', 'Saarland', 'DE', 49.2402, 6.9969],
  ['Passau', '94032', 'Bayern', 'DE', 48.5665, 13.4312],
  ['Würzburg', '97070', 'Bayern', 'DE', 49.7913, 9.9534],
  ['Ulm', '89073', 'Baden-Württemberg', 'DE', 48.4011, 9.9876],
  ['Wien', '1010', 'Wien', 'AT', 48.2082, 16.3738],
  ['Linz', '4020', 'Oberösterreich', 'AT', 48.3069, 14.2858],
  ['Graz', '8010', 'Steiermark', 'AT', 47.0707, 15.4395],
  ['Braunau am Inn', '5280', 'Oberösterreich', 'AT', 48.2287, 13.042],
  ['Budapest', '1051', 'Budapest', 'HU', 47.4979, 19.0402],
  ['Szeged', '6720', 'Csongrád-Csanád', 'HU', 46.253, 20.1414],
  ['Debrecen', '4024', 'Hajdú-Bihar', 'HU', 47.5316, 21.6273],
  ['Győr', '9021', 'Győr-Moson-Sopron', 'HU', 47.6875, 17.6504],
  ['Warszawa', '00-001', 'Mazowieckie', 'PL', 52.2297, 21.0122],
  ['Katowice', '40-001', 'Śląskie', 'PL', 50.2649, 19.0238],
  ['Kraków', '31-001', 'Małopolskie', 'PL', 50.0647, 19.945],
  ['Wrocław', '50-001', 'Dolnośląskie', 'PL', 51.1079, 17.0385],
  ['Milano', '20121', 'Lombardia', 'IT', 45.4642, 9.19],
  ['Cremona', '26100', 'Lombardia', 'IT', 45.1333, 10.0227],
  ['Verona', '37121', 'Veneto', 'IT', 45.4384, 10.9916],
  ['Rotterdam', '3011', 'Zuid-Holland', 'NL', 51.9244, 4.4777],
  ['Naaldwijk', '2671', 'Zuid-Holland', 'NL', 51.9936, 4.2094],
  ['Amsterdam', '1012', 'Noord-Holland', 'NL', 52.3676, 4.9041],
  ['Sofia', '1000', 'Sofia', 'BG', 42.6977, 23.3219],
  ['Ruse', '7000', 'Ruse', 'BG', 43.8356, 25.9657],
  ['Plovdiv', '4000', 'Plovdiv', 'BG', 42.1354, 24.7453],
  ['Praha', '110 00', 'Praha', 'CZ', 50.0755, 14.4378],
  ['Brno', '602 00', 'Jihomoravský kraj', 'CZ', 49.1951, 16.6068],
  ['Ostrava', '702 00', 'Moravskoslezský kraj', 'CZ', 49.8209, 18.2625],
  ['Lyon', '69001', 'Auvergne-Rhône-Alpes', 'FR', 45.764, 4.8357],
  ['Paris', '75001', 'Île-de-France', 'FR', 48.8566, 2.3522],
  ['Strasbourg', '67000', 'Grand Est', 'FR', 48.5734, 7.7521],
  ...REGIONAL_CITY_ROWS,
]

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const CITIES: City[] = ROWS.map(([name, postcode, region, country, lat, lng]) => ({
  id: `${country.toLowerCase()}-${slugify(name)}`,
  name,
  postcode,
  region,
  country,
  point: { lat, lng },
}))

export function cityById(id: string): City {
  const c = CITIES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown city ${id}`)
  return c
}

export const DEFAULT_CITY_ID = 'ro-iasi'
